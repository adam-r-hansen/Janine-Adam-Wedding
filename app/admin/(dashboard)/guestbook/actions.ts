"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function refreshGuestbookPages() {
  revalidatePath("/admin/guestbook");
  revalidatePath("/guestbook");
}

export async function approveEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guestbook_entries")
    .update({ approved: true })
    .eq("id", id);

  if (error) {
    return { error: "Could not approve that note. Please try again." };
  }

  refreshGuestbookPages();
  return { error: null };
}

export async function deleteEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guestbook_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Could not delete that note. Please try again." };
  }

  refreshGuestbookPages();
  return { error: null };
}
