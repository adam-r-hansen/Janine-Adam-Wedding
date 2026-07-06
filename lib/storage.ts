import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const PHOTOS_BUCKET = "photos";

interface ResizeOptions {
  maxDimension?: number;
  quality?: number;
}

// Downscales to a ~2000px long edge and re-encodes as JPEG, so phone
// photos (often 5-10MB) don't ship to guests at full size. Uses
// createImageBitmap's imageOrientation option so photos taken in
// portrait on a phone don't come out sideways — a common iPhone/Android
// gotcha when drawing straight to a canvas.
export async function resizeImage(
  file: File,
  { maxDimension = 2000, quality = 0.82 }: ResizeOptions = {}
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "We couldn't read that photo. Please try a different one, or save it as a JPEG first."
    );
  }

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    bitmap.close();
    throw new Error(
      "Your browser can't process images here. Please try a different device."
    );
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );

  if (!blob) {
    throw new Error("We couldn't process that photo. Please try again.");
  }

  return blob;
}

export async function uploadPhoto(
  client: SupabaseClient,
  folder: "ours" | "guests" | "content",
  blob: Blob
): Promise<{ path: string; publicUrl: string }> {
  const path = `${folder}/${crypto.randomUUID()}.jpg`;

  const { error } = await client.storage
    .from(PHOTOS_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });

  if (error) {
    throw new Error("Could not upload that photo. Please try again.");
  }

  const {
    data: { publicUrl },
  } = client.storage.from(PHOTOS_BUCKET).getPublicUrl(path);

  return { path, publicUrl };
}

export async function deletePhotoFile(
  client: SupabaseClient,
  path: string
): Promise<void> {
  const { error } = await client.storage.from(PHOTOS_BUCKET).remove([path]);
  if (error) {
    throw new Error("Could not delete that file from storage.");
  }
}

// Building a public URL is just string construction against the
// project's known storage host — no network call, so this is safe to
// call from Server Components with the plain anon client.
export function getPhotoPublicUrl(path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return publicUrl;
}
