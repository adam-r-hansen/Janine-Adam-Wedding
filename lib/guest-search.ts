import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// The forgiving guest-name search shared by the public RSVP lookup
// (app/rsvp/actions.ts) and the public "Find Your Table" lookup
// (app/seating/actions.ts). It only ever answers "which parties match
// this name, and how closely" — each caller decides, narrowly, what to
// fetch and show about those parties afterwards.
//
// `import "server-only"` keeps this out of the browser: it's always
// handed the service-role client, which bypasses RLS.

export const MIN_QUERY_LENGTH = 3;
export const MAX_RESULTS = 8;

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

// Lowercases, strips accents (Unicode-decomposes then drops the combining
// marks, so "Renée" -> "renee"), drops apostrophes/hyphens ("O'Brien" ->
// "obrien", "Smith-Jones" -> "smithjones"), and collapses whitespace. Used
// to compare names in a way that ignores the kind of small differences
// that aren't really typos.
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Standard iterative Levenshtein distance (two-row rolling array, no
// dependency) — the minimum number of single-character insertions,
// deletions, or substitutions to turn `a` into `b`.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, i) => i);
  let currRow = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1, // insertion
        prevRow[j] + 1, // deletion
        prevRow[j - 1] + cost // substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[n];
}

// How many edits a query token is allowed to be off by, scaled by its
// length — short tokens have less room for a "typo" before they'd start
// matching the wrong name entirely.
function allowedEdits(tokenLength: number): number {
  if (tokenLength <= 3) return 0;
  if (tokenLength <= 6) return 1;
  return 2;
}

// Returns the edit distance between a query token and a name token if they
// count as a fuzzy match — either the name token starts with the query
// token (treated as a free, zero-cost match, so "Jan" still finds
// "Janine"), or the two are within the allowed edit distance for the
// query token's length. Returns null if they don't match at all.
function tokenMatchDistance(
  queryToken: string,
  nameToken: string
): number | null {
  if (nameToken.startsWith(queryToken)) {
    return 0;
  }
  const distance = levenshtein(queryToken, nameToken);
  return distance <= allowedEdits(queryToken.length) ? distance : null;
}

// Finds the parties whose guests match `query`, returned as a map of
// party id -> how close the best match was (0 = exact or prefix match;
// lower is better). Callers sort by distance, then by whatever else they
// like, and cap at MAX_RESULTS.
//
// Runs in two tiers. Tier 1 is a case-insensitive substring match — if it
// finds anything, those parties are returned (all at distance 0) and tier
// 2 never runs, so correctly-spelled names behave exactly as you'd expect.
// Only when tier 1 comes up empty does tier 2 kick in: every guest name is
// pulled into application code and scored against the query with
// normalized, token-by-token fuzzy matching (prefix matches, plus small
// typos within a length-scaled Levenshtein-distance budget), so a
// misspelling like "Janene" still finds "Janine". No Postgres extension or
// migration is involved — tier 2 is plain TypeScript.
//
// `attendingOnly` restricts both tiers to guests with attending = true, so
// a party only matches through someone who's actually coming.
export async function findMatchingParties(
  supabase: SupabaseClient,
  query: string,
  { attendingOnly = false }: { attendingOnly?: boolean } = {}
): Promise<Map<string, number>> {
  const trimmed = query.trim();
  const distanceByParty = new Map<string, number>();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return distanceByParty;
  }

  // Tier 1: substring match.
  let exactQuery = supabase
    .from("guests")
    .select("party_id")
    .ilike("full_name", `%${trimmed}%`);
  if (attendingOnly) exactQuery = exactQuery.eq("attending", true);

  const { data: exactGuests, error: exactError } = await exactQuery;
  if (exactError) {
    return distanceByParty;
  }

  if (exactGuests && exactGuests.length > 0) {
    const partyIds = Array.from(
      new Set(exactGuests.map((g) => g.party_id as string))
    ).slice(0, MAX_RESULTS);
    for (const id of partyIds) distanceByParty.set(id, 0);
    return distanceByParty;
  }

  // Tier 2: fuzzy fallback.
  let everyGuestQuery = supabase.from("guests").select("party_id, full_name");
  if (attendingOnly) everyGuestQuery = everyGuestQuery.eq("attending", true);

  const { data: everyGuest, error: everyGuestError } = await everyGuestQuery;
  if (everyGuestError || !everyGuest || everyGuest.length === 0) {
    return distanceByParty;
  }

  const queryTokens = normalize(trimmed).split(" ").filter(Boolean);

  for (const guest of everyGuest) {
    const nameTokens = normalize(guest.full_name as string)
      .split(" ")
      .filter(Boolean);

    let bestForGuest: number | null = null;
    for (const queryToken of queryTokens) {
      for (const nameToken of nameTokens) {
        const distance = tokenMatchDistance(queryToken, nameToken);
        if (
          distance !== null &&
          (bestForGuest === null || distance < bestForGuest)
        ) {
          bestForGuest = distance;
        }
      }
    }

    if (bestForGuest !== null) {
      const partyId = guest.party_id as string;
      const current = distanceByParty.get(partyId);
      if (current === undefined || bestForGuest < current) {
        distanceByParty.set(partyId, bestForGuest);
      }
    }
  }

  return distanceByParty;
}
