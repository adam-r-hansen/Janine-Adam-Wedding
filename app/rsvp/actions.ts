"use server";

import { createServiceClient } from "@/lib/supabase-service";

// A strict concierge over the admin-only `parties`/`guests` tables — the
// service-role client bypasses RLS, so every function here is scoped as
// tightly as possible on purpose. Two capabilities are exposed: looking
// a party up (in two steps, for privacy — see below), and submitting a
// response. Nothing here is a generic "run this query" passthrough.

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 8;

function firstName(fullName: string): string {
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
    .replace(/[\u0300-\u036f]/g, "")
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

export interface PartySearchResult {
  partyId: string;
  label: string;
  firstNames: string[];
}

// Step 1 of "Lookup": a name search that can match several parties at
// once (e.g. searching "Smith" might hit two unrelated families).
// Deliberately returns only first names and never whether the party has
// responded — a search result is not proof the searcher actually belongs
// to that party, so nothing sensitive is shown yet.
//
// Runs in two tiers. Tier 1 is a case-insensitive substring match — if it
// finds anything, those results are returned as-is and tier 2 never runs,
// so correctly-spelled names behave exactly as before. Only when tier 1
// comes up empty does tier 2 kick in: every guest name is pulled into
// application code and scored against the query with normalized,
// token-by-token fuzzy matching (prefix matches, plus small typos within
// a length-scaled Levenshtein-distance budget), so a misspelling like
// "Janene" still finds "Janine". No Postgres extension or migration is
// involved — tier 2 is plain TypeScript.
export async function searchParties(
  query: string
): Promise<{ matches: PartySearchResult[] }> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { matches: [] };
  }

  const supabase = createServiceClient();

  const { data: exactGuests, error: exactError } = await supabase
    .from("guests")
    .select("party_id")
    .ilike("full_name", `%${trimmed}%`);

  if (exactError) {
    return { matches: [] };
  }

  if (exactGuests && exactGuests.length > 0) {
    const partyIds = Array.from(
      new Set(exactGuests.map((g) => g.party_id))
    ).slice(0, MAX_RESULTS);

    const [{ data: parties }, { data: allGuests }] = await Promise.all([
      supabase.from("parties").select("id, label").in("id", partyIds),
      supabase
        .from("guests")
        .select("party_id, full_name")
        .in("party_id", partyIds),
    ]);

    const matches: PartySearchResult[] = (parties ?? [])
      .map((party) => ({
        partyId: party.id,
        label: party.label,
        firstNames: (allGuests ?? [])
          .filter((g) => g.party_id === party.id)
          .map((g) => firstName(g.full_name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return { matches };
  }

  // Tier 2: fuzzy fallback.
  const { data: everyGuest, error: everyGuestError } = await supabase
    .from("guests")
    .select("party_id, full_name");

  if (everyGuestError || !everyGuest || everyGuest.length === 0) {
    return { matches: [] };
  }

  const queryTokens = normalize(trimmed).split(" ").filter(Boolean);

  const bestDistanceByParty = new Map<string, number>();

  for (const guest of everyGuest) {
    const nameTokens = normalize(guest.full_name)
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
      const current = bestDistanceByParty.get(guest.party_id);
      if (current === undefined || bestForGuest < current) {
        bestDistanceByParty.set(guest.party_id, bestForGuest);
      }
    }
  }

  if (bestDistanceByParty.size === 0) {
    return { matches: [] };
  }

  const matchedPartyIds = Array.from(bestDistanceByParty.keys());

  const { data: parties } = await supabase
    .from("parties")
    .select("id, label")
    .in("id", matchedPartyIds);

  const ranked = (parties ?? [])
    .map((party) => ({
      partyId: party.id,
      label: party.label,
      distance: bestDistanceByParty.get(party.id) ?? Infinity,
    }))
    .sort((a, b) => a.distance - b.distance || a.label.localeCompare(b.label))
    .slice(0, MAX_RESULTS);

  const matches: PartySearchResult[] = ranked.map((party) => ({
    partyId: party.partyId,
    label: party.label,
    firstNames: everyGuest
      .filter((g) => g.party_id === party.partyId)
      .map((g) => firstName(g.full_name)),
  }));

  return { matches };
}

export interface PartyForResponse {
  partyId: string;
  label: string;
  alreadyResponded: boolean;
  dietaryNotes: string;
  message: string;
  guests: { id: string; firstName: string; attending: boolean | null }[];
}

// Step 2 of "Lookup": once a guest has affirmatively tapped a specific
// party from their search results, this returns that ONE party's full
// current state so the form can pre-fill it. This is the only point at
// which response status/dietary notes are ever exposed — never as part
// of the broader search above.
export async function getPartyForResponse(
  partyId: string
): Promise<{ party: PartyForResponse } | { error: string }> {
  const supabase = createServiceClient();

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("id, label, responded_at, message")
    .eq("id", partyId)
    .maybeSingle();

  if (partyError || !party) {
    return { error: "We couldn't find that party. Please search again." };
  }

  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("id, full_name, attending, dietary_notes")
    .eq("party_id", partyId);

  if (guestsError || !guests || guests.length === 0) {
    return { error: "We couldn't find that party. Please search again." };
  }

  return {
    party: {
      partyId: party.id,
      label: party.label,
      alreadyResponded: Boolean(party.responded_at),
      dietaryNotes: guests[0]?.dietary_notes ?? "",
      message: party.message ?? "",
      guests: guests.map((g) => ({
        id: g.id,
        firstName: firstName(g.full_name),
        attending: g.attending,
      })),
    },
  };
}

export interface SubmitRsvpInput {
  partyId: string;
  responses: { guestId: string; attending: boolean }[];
  dietaryNotes: string;
  message: string;
}

export async function submitRsvp(
  input: SubmitRsvpInput
): Promise<{ error: string | null; anyAttending?: boolean }> {
  const supabase = createServiceClient();

  // Guest ids come from the client, so re-verify server-side that they
  // actually belong to this party before writing anything.
  const { data: actualGuests, error: guestsError } = await supabase
    .from("guests")
    .select("id")
    .eq("party_id", input.partyId);

  if (guestsError || !actualGuests || actualGuests.length === 0) {
    return { error: "Something went wrong. Please try again." };
  }

  const actualIds = new Set(actualGuests.map((g) => g.id));
  const submittedIds = new Set(input.responses.map((r) => r.guestId));
  const idsMatch =
    actualIds.size === submittedIds.size &&
    [...actualIds].every((id) => submittedIds.has(id));

  if (!idsMatch) {
    return {
      error:
        "Something changed with your party. Please search again and try once more.",
    };
  }

  const dietaryNotes = input.dietaryNotes.trim() || null;

  const updates = await Promise.all(
    input.responses.map((r) =>
      supabase
        .from("guests")
        .update({ attending: r.attending, dietary_notes: dietaryNotes })
        .eq("id", r.guestId)
    )
  );
  if (updates.some((r) => r.error)) {
    return {
      error: "Something went wrong saving your response. Please try again.",
    };
  }

  const { error: partyError } = await supabase
    .from("parties")
    .update({
      responded_at: new Date().toISOString(),
      message: input.message.trim() || null,
    })
    .eq("id", input.partyId);

  if (partyError) {
    return {
      error: "Something went wrong saving your response. Please try again.",
    };
  }

  return {
    error: null,
    anyAttending: input.responses.some((r) => r.attending),
  };
}
