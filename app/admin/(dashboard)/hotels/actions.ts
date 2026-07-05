"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function refreshHotelPages() {
  revalidatePath("/admin/hotels");
  revalidatePath("/travel");
}

interface HotelFields {
  name: string;
  photo_url: string | null;
  description: string;
  distance: string;
  price_range: string;
  booking_url: string;
  room_block_code: string | null;
  book_by_date: string | null;
}

function readFields(formData: FormData): { error: string } | { fields: HotelFields } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const distance = String(formData.get("distance") ?? "").trim();
  const price_range = String(formData.get("price_range") ?? "").trim();
  const booking_url = String(formData.get("booking_url") ?? "").trim();

  if (!name || !description || !distance || !price_range || !booking_url) {
    return { error: "Please fill in all the required fields." };
  }

  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const room_block_code =
    String(formData.get("room_block_code") ?? "").trim() || null;
  const book_by_date = String(formData.get("book_by_date") ?? "").trim() || null;

  return {
    fields: {
      name,
      photo_url,
      description,
      distance,
      price_range,
      booking_url,
      room_block_code,
      book_by_date,
    },
  };
}

export async function addHotel(formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();

  const { data: lastHotel } = await supabase
    .from("hotels")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastHotel?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("hotels")
    .insert({ ...result.fields, sort_order: nextSortOrder });

  if (error) {
    return { error: "Could not add the hotel. Please try again." };
  }

  refreshHotelPages();
  return { error: null };
}

export async function updateHotel(id: string, formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("hotels")
    .update(result.fields)
    .eq("id", id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  refreshHotelPages();
  return { error: null };
}

export async function deleteHotel(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hotels").delete().eq("id", id);

  if (error) {
    return { error: "Could not delete that hotel. Please try again." };
  }

  refreshHotelPages();
  return { error: null };
}

export async function moveHotel(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: hotels, error: fetchError } = await supabase
    .from("hotels")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !hotels) {
    return { error: "Could not reorder the hotels. Please try again." };
  }

  const index = hotels.findIndex((hotel) => hotel.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= hotels.length) {
    return { error: null };
  }

  const current = hotels[index];
  const swap = hotels[swapIndex];

  const [a, b] = await Promise.all([
    supabase
      .from("hotels")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("hotels")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  if (a.error || b.error) {
    return { error: "Could not reorder the hotels. Please try again." };
  }

  refreshHotelPages();
  return { error: null };
}
