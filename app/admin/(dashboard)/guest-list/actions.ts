"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { normalizeKey, parseGuestListCsv } from "@/lib/csv";

function refreshGuestListPage() {
  revalidatePath("/admin/guest-list");
}

export async function addParty(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Please enter a party name." };

  const supabase = await createClient();
  const { error } = await supabase.from("parties").insert({ label });
  if (error) return { error: "Could not add that party. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

export async function updateParty(id: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Please enter a party name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("parties")
    .update({ label })
    .eq("id", id);
  if (error) return { error: "Could not save that change. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

export async function deleteParty(id: string) {
  const supabase = await createClient();

  const { error: guestsError } = await supabase
    .from("guests")
    .delete()
    .eq("party_id", id);
  if (guestsError) {
    return { error: "Could not delete that party's guests. Please try again." };
  }

  const { error } = await supabase.from("parties").delete().eq("id", id);
  if (error) return { error: "Could not delete that party. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

export async function addGuest(partyId: string, formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Please enter a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .insert({ party_id: partyId, full_name: fullName });
  if (error) return { error: "Could not add that guest. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

export async function updateGuest(id: string, formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Please enter a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ full_name: fullName })
    .eq("id", id);
  if (error) return { error: "Could not save that change. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

export async function deleteGuest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return { error: "Could not delete that guest. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

export async function moveGuest(id: string, newPartyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ party_id: newPartyId })
    .eq("id", id);
  if (error) return { error: "Could not move that guest. Please try again." };

  refreshGuestListPage();
  return { error: null };
}

// --- CSV import -------------------------------------------------------

export interface ImportPartyPreview {
  label: string;
  isNewParty: boolean;
  guests: { fullName: string; isDuplicate: boolean }[];
}

export interface ImportPreview {
  problems: { line: number; reason: string }[];
  parties: ImportPartyPreview[];
  totals: {
    parties: number;
    newParties: number;
    guests: number;
    newGuests: number;
    duplicates: number;
  };
}

async function classifyCsv(
  csvText: string
): Promise<
  | { error: string }
  | { preview: ImportPreview; partyIdByKey: Map<string, string> }
> {
  const { rows, problems } = parseGuestListCsv(csvText);

  if (rows.length === 0) {
    return { error: "No valid rows found in that CSV." };
  }

  const supabase = await createClient();
  const [partiesResult, guestsResult] = await Promise.all([
    supabase.from("parties").select("id, label"),
    supabase.from("guests").select("party_id, full_name"),
  ]);

  if (partiesResult.error || guestsResult.error) {
    return { error: "Could not read the current guest list. Please try again." };
  }

  const existingParties = partiesResult.data ?? [];
  const existingGuests = guestsResult.data ?? [];

  const partyIdByKey = new Map<string, string>();
  const partyLabelByKey = new Map<string, string>();
  for (const party of existingParties) {
    const key = normalizeKey(party.label);
    partyIdByKey.set(key, party.id);
    partyLabelByKey.set(key, party.label);
  }

  const existingGuestKeysByPartyId = new Map<string, Set<string>>();
  for (const guest of existingGuests) {
    const set = existingGuestKeysByPartyId.get(guest.party_id) ?? new Set();
    set.add(normalizeKey(guest.full_name));
    existingGuestKeysByPartyId.set(guest.party_id, set);
  }

  const groups = new Map<string, ImportPartyPreview>();

  for (const row of rows) {
    const partyKey = normalizeKey(row.party);
    const nameKey = normalizeKey(row.fullName);

    if (!groups.has(partyKey)) {
      groups.set(partyKey, {
        label: partyLabelByKey.get(partyKey) ?? row.party,
        isNewParty: !partyIdByKey.has(partyKey),
        guests: [],
      });
    }
    const group = groups.get(partyKey)!;

    const existingPartyId = partyIdByKey.get(partyKey);
    const existingNamesForParty = existingPartyId
      ? existingGuestKeysByPartyId.get(existingPartyId) ?? new Set()
      : new Set<string>();
    const alreadyStagedInThisImport = group.guests.some(
      (g) => normalizeKey(g.fullName) === nameKey
    );

    group.guests.push({
      fullName: row.fullName,
      isDuplicate: existingNamesForParty.has(nameKey) || alreadyStagedInThisImport,
    });
  }

  const parties = Array.from(groups.values());
  const totals = {
    parties: parties.length,
    newParties: parties.filter((p) => p.isNewParty).length,
    guests: parties.reduce((sum, p) => sum + p.guests.length, 0),
    newGuests: parties.reduce(
      (sum, p) => sum + p.guests.filter((g) => !g.isDuplicate).length,
      0
    ),
    duplicates: parties.reduce(
      (sum, p) => sum + p.guests.filter((g) => g.isDuplicate).length,
      0
    ),
  };

  return { preview: { problems, parties, totals }, partyIdByKey };
}

export async function previewCsvImport(csvText: string) {
  const result = await classifyCsv(csvText);
  if ("error" in result) return result;
  return { preview: result.preview, error: null };
}

export async function confirmCsvImport(csvText: string) {
  const result = await classifyCsv(csvText);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { preview, partyIdByKey } = result;

  let partiesCreated = 0;

  for (const group of preview.parties) {
    const key = normalizeKey(group.label);
    if (partyIdByKey.has(key)) continue;

    const { data: newParty, error } = await supabase
      .from("parties")
      .insert({ label: group.label })
      .select("id")
      .single();

    if (error || !newParty) {
      return { error: "Could not create a new party. Please try again." };
    }

    partyIdByKey.set(key, newParty.id);
    partiesCreated++;
  }

  const guestRowsToInsert: { party_id: string; full_name: string }[] = [];
  let duplicatesSkipped = 0;

  for (const group of preview.parties) {
    const partyId = partyIdByKey.get(normalizeKey(group.label));
    if (!partyId) continue;

    for (const guest of group.guests) {
      if (guest.isDuplicate) {
        duplicatesSkipped++;
        continue;
      }
      guestRowsToInsert.push({ party_id: partyId, full_name: guest.fullName });
    }
  }

  if (guestRowsToInsert.length > 0) {
    const { error } = await supabase.from("guests").insert(guestRowsToInsert);
    if (error) {
      return { error: "Could not add the new guests. Please try again." };
    }
  }

  refreshGuestListPage();

  return {
    error: null,
    results: {
      partiesCreated,
      guestsAdded: guestRowsToInsert.length,
      duplicatesSkipped,
    },
  };
}
