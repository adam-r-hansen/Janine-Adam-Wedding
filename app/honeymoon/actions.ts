"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { parseDollarsToCents } from "@/lib/format";

// No ambiguous characters (0/O, 1/I/L) so a code read off a phone screen
// and typed elsewhere can't be misheard.
const CLAIM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeClaimCode(): string {
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code +=
      CLAIM_CODE_ALPHABET[
        Math.floor(Math.random() * CLAIM_CODE_ALPHABET.length)
      ];
  }
  return code;
}

type ContributionSuccess = {
  claimCode: string;
  totalCents: number;
  error: null;
};

export async function recordContribution(
  formData: FormData
): Promise<ContributionSuccess | { error: string }> {
  const guestNameRaw = String(formData.get("guest_name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const customAmountRaw = String(formData.get("custom_amount") ?? "").trim();
  const itemIds = formData.getAll("item_ids").map((value) => String(value));

  if (guestNameRaw.length > 120) {
    return { error: "Please use a shorter name (120 characters or fewer)." };
  }
  if (message.length > 1000) {
    return { error: "Please keep your message under 1000 characters." };
  }

  // guest_name is NOT NULL in the database and the field is optional in
  // the form, so a blank name is recorded as "Anonymous".
  const guestName = guestNameRaw || "Anonymous";

  // The custom amount is optional — only parse it when something was typed.
  let customCents = 0;
  if (customAmountRaw) {
    const parsed = parseDollarsToCents(customAmountRaw);
    if ("error" in parsed) {
      return { error: parsed.error };
    }
    customCents = parsed.cents;
  }

  // Never trust an amount posted from the browser. Re-fetch the ticked
  // items server-side and use the suggested_cents stored on each one. Any
  // id that isn't a live, active item is silently dropped.
  let tickedItems: {
    id: string;
    title: string;
    suggested_cents: number;
  }[] = [];

  if (itemIds.length > 0) {
    const { data, error } = await supabase
      .from("honeymoon_items")
      .select("id, title, suggested_cents")
      .in("id", itemIds)
      .eq("is_active", true);

    if (error) {
      console.error("[/honeymoon] Could not load the ticked items:", error);
      return {
        error: "Something went wrong on our end. Please try again in a bit.",
      };
    }
    tickedItems = data ?? [];
  }

  const itemsTotalCents = tickedItems.reduce(
    (sum, item) => sum + item.suggested_cents,
    0
  );
  const totalCents = itemsTotalCents + customCents;

  if (totalCents <= 0) {
    return {
      error:
        "Pick at least one piece of the trip, or fill in an amount that feels right.",
    };
  }

  // Anon can INSERT into honeymoon_contributions but CANNOT SELECT from
  // it, so .insert().select() would fail. Generate the id here and reuse
  // it for the line rows.
  const contributionId = crypto.randomUUID();

  let claimCode = makeClaimCode();
  let saved = false;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from("honeymoon_contributions").insert({
      id: contributionId,
      guest_name: guestName,
      message: message || null,
      claim_code: claimCode,
      amount_cents: totalCents,
      // The anon INSERT RLS policy requires exactly these three.
      status: "pending",
      received_at: null,
      thanked_at: null,
    });

    if (!error) {
      saved = true;
      break;
    }

    lastError = error;
    // 23505 = unique_violation — a claim-code collision. Try a fresh code.
    // Anything else isn't worth retrying.
    if (error.code === "23505") {
      claimCode = makeClaimCode();
      continue;
    }
    break;
  }

  if (!saved) {
    console.error("[/honeymoon] Could not record the contribution:", lastError);
    return {
      error: "Something went wrong saving that. Please try again in a bit.",
    };
  }

  // One line row per ticked item (title snapshotted so a later edit to the
  // item doesn't rewrite history), plus one for the custom amount. If
  // these fail the headline total is already recorded — that's what
  // matters — so we log and still return success.
  const lineRows: {
    contribution_id: string;
    item_id: string | null;
    item_title: string;
    amount_cents: number;
  }[] = tickedItems.map((item) => ({
    contribution_id: contributionId,
    item_id: item.id,
    item_title: item.title,
    amount_cents: item.suggested_cents,
  }));

  if (customCents > 0) {
    lineRows.push({
      contribution_id: contributionId,
      item_id: null,
      item_title: "Their own amount",
      amount_cents: customCents,
    });
  }

  if (lineRows.length > 0) {
    const { error } = await supabase
      .from("honeymoon_contribution_lines")
      .insert(lineRows);
    if (error) {
      console.error(
        "[/honeymoon] Could not record the contribution lines:",
        error
      );
    }
  }

  revalidatePath("/admin/honeymoon");

  return { claimCode, totalCents, error: null };
}
