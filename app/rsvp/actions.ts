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

export interface PartySearchResult {
  partyId: string;
  label: string;
  firstNames: string[];
}

// Step 1 of "Lookup": a fuzzy name search that can match several
// parties at once (e.g. searching "Smith" might hit two unrelated
// families). Deliberately returns only first names and never whether
// the party has responded — a search result is not proof the searcher
// actually belongs to that party, so nothing sensitive is shown yet.
export async function searchParties(
  query: string
): Promise<{ matches: PartySearchResult[] }> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { matches: [] };
  }

  const supabase = createServiceClient();

  const { data: matchingGuests, error } = await supabase
    .from("guests")
    .select("party_id")
    .ilike("full_name", `%${trimmed}%`);

  if (error || !matchingGuests || matchingGuests.length === 0) {
    return { matches: [] };
  }

  const partyIds = Array.from(
    new Set(matchingGuests.map((g) => g.party_id))
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
