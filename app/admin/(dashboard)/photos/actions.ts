"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { deletePhotoFile } from "@/lib/storage";

function refreshPhotoPages() {
  revalidatePath("/admin/photos");
  revalidatePath("/gallery");
}

export async function addOurPhoto(formData: FormData) {
  const storagePath = String(formData.get("storage_path") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!storagePath) {
    return { error: "That photo didn't finish uploading. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("photos").insert({
    storage_path: storagePath,
    caption: caption || null,
    album: "ours",
    approved: true,
  });

  if (error) {
    return { error: "Could not save that photo. Please try again." };
  }

  refreshPhotoPages();
  return { error: null };
}

export async function approvePhoto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .update({ approved: true })
    .eq("id", id);

  if (error) {
    return { error: "Could not approve that photo. Please try again." };
  }

  refreshPhotoPages();
  return { error: null };
}

export async function deletePhoto(id: string, storagePath: string) {
  const supabase = await createClient();

  const { error: deleteRowError } = await supabase
    .from("photos")
    .delete()
    .eq("id", id);

  if (deleteRowError) {
    return { error: "Could not delete that photo. Please try again." };
  }

  try {
    await deletePhotoFile(supabase, storagePath);
  } catch {
    // The row is already gone from every page that shows it — the file
    // is now just unused storage, not a visible broken reference, so
    // there's nothing worth alarming the admin about here.
  }

  refreshPhotoPages();
  return { error: null };
}
