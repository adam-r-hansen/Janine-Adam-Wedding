"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

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
