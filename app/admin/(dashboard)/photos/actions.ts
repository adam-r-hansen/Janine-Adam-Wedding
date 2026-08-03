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

  const { data: lastPhoto } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("album", "ours")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastPhoto?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("photos").insert({
    storage_path: storagePath,
    caption: caption || null,
    album: "ours",
    approved: true,
    sort_order: nextSortOrder,
  });

  if (error) {
    return { error: "Could not save that photo. Please try again." };
  }

  refreshPhotoPages();
  return { error: null };
}

export async function updatePhotoCaption(id: string, caption: string) {
  const trimmed = caption.trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .update({ caption: trimmed || null })
    .eq("id", id);

  if (error) {
    return { error: "Could not save that caption. Please try again." };
  }

  refreshPhotoPages();
  return { error: null };
}

export async function reorderPhotos(
  album: "ours" | "guests",
  orderedIds: string[]
) {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("photos")
        .update({ sort_order: index + 1 })
        .eq("id", id)
        .eq("album", album)
    )
  );

  if (results.some((result) => result.error)) {
    return { error: "Could not save the new order. Please try again." };
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
