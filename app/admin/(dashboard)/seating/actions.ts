"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { MAX_SEATS_PER_TABLE, MIN_SEATS_PER_TABLE } from "@/lib/seating";

function refreshSeatingPage() {
  revalidatePath("/admin/seating");
}

// tableNumber is null for "Unassigned", otherwise 1..seating_table_count.
export async function setPartyTable(
  partyId: string,
  tableNumber: number | null
) {
  const supabase = await createClient();

  if (tableNumber !== null) {
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      return { error: "That table number doesn't look right." };
    }

    // Re-check against the real table count rather than trusting the
    // browser's dropdown.
    const { data, error: settingError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "seating_table_count")
      .maybeSingle();
    if (settingError) {
      return { error: "Could not save that change. Please try again." };
    }
    const tableCount = Number.parseInt(data?.value ?? "", 10);
    if (!Number.isInteger(tableCount) || tableNumber > tableCount) {
      return { error: `There's no Table ${tableNumber}.` };
    }
  }

  const { error } = await supabase
    .from("parties")
    .update({ table_number: tableNumber })
    .eq("id", partyId);
  if (error) return { error: "Could not save that change. Please try again." };

  refreshSeatingPage();
  return { error: null };
}

export async function updateSeatsPerTable(seats: number) {
  if (
    !Number.isInteger(seats) ||
    seats < MIN_SEATS_PER_TABLE ||
    seats > MAX_SEATS_PER_TABLE
  ) {
    return {
      error: `Seats per table must be between ${MIN_SEATS_PER_TABLE} and ${MAX_SEATS_PER_TABLE}.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "seating_seats_per_table", value: String(seats) },
      { onConflict: "key" }
    );
  if (error) return { error: "Could not save that change. Please try again." };

  refreshSeatingPage();
  return { error: null };
}

// Flips the public "Find Your Table" page on or off. The same setting
// also decides whether "Seating" appears in the site's navigation.
export async function setSeatingPublished(published: boolean) {
  if (typeof published !== "boolean") {
    return { error: "Could not save that change. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "seating_published", value: published ? "true" : "false" },
      { onConflict: "key" }
    );
  if (error) return { error: "Could not save that change. Please try again." };

  refreshSeatingPage();
  // The nav lives in the root layout, which wraps every page — this
  // tells Next.js to throw away every cached page so the "Seating" link
  // appears (or disappears) everywhere on the next visit.
  revalidatePath("/", "layout");
  return { error: null };
}
