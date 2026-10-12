"use server";

import { createServiceClient } from "@/lib/supabase-service";
import { findMatchingParties, MAX_RESULTS } from "@/lib/guest-search";
import { supabase as anonClient } from "@/lib/supabase";

// The "Find Your Table" concierge — same idea as app/rsvp/actions.ts:
// `parties` and `guests` are admin-only, so this goes through the
// service-role client and is scoped as narrowly as possible. It answers
// exactly one question ("which table is this name at?") and hands back
// only attending guests' names and the party's table number — never
// dietary notes, messages, party labels, ids, or anyone who isn't coming.

export interface TableMatch {
  names: string[];
  tableNumber: number | null;
}

export async function findTable(
  query: string
): Promise<{ matches: TableMatch[] }> {
  // Re-check the "published" switch here, not just on the page — this
  // function can be called directly, so it mustn't leak tables early.
  const { data: setting } = await anonClient
    .from("site_settings")
    .select("value")
    .eq("key", "seating_published")
    .maybeSingle();
  if (setting?.value !== "true") {
    return { matches: [] };
  }

  const supabase = createServiceClient();

  const distanceByParty = await findMatchingParties(supabase, query, {
    attendingOnly: true,
  });
  if (distanceByParty.size === 0) {
    return { matches: [] };
  }

  const partyIds = Array.from(distanceByParty.keys());

  const [{ data: parties }, { data: attendingGuests }] = await Promise.all([
    supabase.from("parties").select("id, table_number").in("id", partyIds),
    supabase
      .from("guests")
      .select("party_id, full_name")
      .in("party_id", partyIds)
      .eq("attending", true),
  ]);

  const matches: TableMatch[] = (parties ?? [])
    .map((party) => ({
      id: party.id as string,
      tableNumber: (party.table_number as number | null) ?? null,
      distance: distanceByParty.get(party.id) ?? Infinity,
      names: (attendingGuests ?? [])
        .filter((g) => g.party_id === party.id)
        .map((g) => g.full_name as string)
        .sort((a, b) => a.localeCompare(b)),
    }))
    .filter((party) => party.names.length > 0)
    .sort(
      (a, b) =>
        a.distance - b.distance || a.names[0].localeCompare(b.names[0])
    )
    .slice(0, MAX_RESULTS)
    // Strip everything but the two fields guests are allowed to see.
    .map((party) => ({ names: party.names, tableNumber: party.tableNumber }));

  return { matches };
}
