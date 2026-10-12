"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { parseDollarsToCents } from "@/lib/format";
import { OTHER_GIFT_TYPES, type OtherGiftType } from "@/lib/other-gifts";

function refreshContributionsPage() {
  revalidatePath("/admin/contributions");
}

export async function markReceived(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_contributions")
    .update({ status: "received", received_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[/admin/contributions] markReceived failed:", error);
    return { error: "Could not mark that as received. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function markPending(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_contributions")
    .update({ status: "pending", received_at: null })
    .eq("id", id);

  if (error) {
    console.error("[/admin/contributions] markPending failed:", error);
    return { error: "Could not move that back to pending. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function markCancelled(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_contributions")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    console.error("[/admin/contributions] markCancelled failed:", error);
    return { error: "Could not cancel that one. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function toggleThanked(id: string, thanked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_contributions")
    .update({ thanked_at: thanked ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    console.error("[/admin/contributions] toggleThanked failed:", error);
    return { error: "Could not update the thank-you status. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function deleteContribution(id: string) {
  const supabase = await createClient();
  // honeymoon_contribution_lines has ON DELETE CASCADE, so the lines go
  // with the row.
  const { error } = await supabase
    .from("honeymoon_contributions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[/admin/contributions] deleteContribution failed:", error);
    return { error: "Could not delete that one. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Other gifts — presents logged by hand (boxes, cards, checks) that didn't
// come through the honeymoon fund. Plain admin-only table, so these are
// ordinary authenticated reads/writes.
// ---------------------------------------------------------------------------

interface OtherGiftFields {
  giver_name: string;
  description: string;
  gift_type: OtherGiftType;
  amount_cents: number | null;
  received_on: string | null;
  notes: string | null;
}

function readOtherGiftFields(
  formData: FormData
): { error: string } | { fields: OtherGiftFields } {
  const giver_name = String(formData.get("giver_name") ?? "").trim();
  if (!giver_name) {
    return { error: "Please say who the gift is from." };
  }
  if (giver_name.length > 120) {
    return { error: "Please keep the name to 120 characters or fewer." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) {
    return { error: "Please say what the gift was." };
  }
  if (description.length > 300) {
    return {
      error: "Please keep the description to 300 characters or fewer.",
    };
  }

  const giftTypeRaw = String(formData.get("gift_type") ?? "item");
  const gift_type = OTHER_GIFT_TYPES.find((t) => t.value === giftTypeRaw)
    ?.value;
  if (!gift_type) {
    return { error: "Please pick a type from the list." };
  }

  // Amount is optional: blank means "no amount", anything else must be a
  // real dollar amount greater than zero.
  const amountRaw = String(formData.get("amount") ?? "").trim();
  let amount_cents: number | null = null;
  if (amountRaw) {
    const parsed = parseDollarsToCents(amountRaw);
    if ("error" in parsed) return { error: parsed.error };
    amount_cents = parsed.cents;
  }

  const receivedRaw = String(formData.get("received_on") ?? "").trim();
  if (receivedRaw && !/^\d{4}-\d{2}-\d{2}$/.test(receivedRaw)) {
    return { error: "Please pick a valid date for when it arrived." };
  }
  const received_on = receivedRaw || null;

  const notesRaw = String(formData.get("notes") ?? "").trim();
  if (notesRaw.length > 1000) {
    return { error: "Please keep the notes to 1000 characters or fewer." };
  }
  const notes = notesRaw || null;

  return {
    fields: {
      giver_name,
      description,
      gift_type,
      amount_cents,
      received_on,
      notes,
    },
  };
}

export async function addOtherGift(formData: FormData) {
  const result = readOtherGiftFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase.from("other_gifts").insert(result.fields);

  if (error) {
    console.error("[/admin/contributions] addOtherGift failed:", error);
    return { error: "Could not save that gift. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function updateOtherGift(id: string, formData: FormData) {
  const result = readOtherGiftFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("other_gifts")
    .update(result.fields)
    .eq("id", id);

  if (error) {
    console.error("[/admin/contributions] updateOtherGift failed:", error);
    return { error: "Could not save your changes. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function toggleOtherGiftThanked(id: string, thanked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("other_gifts")
    .update({ thanked_at: thanked ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    console.error(
      "[/admin/contributions] toggleOtherGiftThanked failed:",
      error
    );
    return { error: "Could not update the thank-you status. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}

export async function deleteOtherGift(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("other_gifts").delete().eq("id", id);

  if (error) {
    console.error("[/admin/contributions] deleteOtherGift failed:", error);
    return { error: "Could not delete that one. Please try again." };
  }

  refreshContributionsPage();
  return { error: null };
}
