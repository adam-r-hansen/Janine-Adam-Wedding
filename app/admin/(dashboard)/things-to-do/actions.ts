"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function refreshActivityPages() {
  revalidatePath("/admin/things-to-do");
  revalidatePath("/things-to-do");
}

interface ActivityFields {
  name: string;
  category: "activity" | "food_drink";
  photo_url: string | null;
  blurb: string;
  address: string | null;
  neighborhood: string;
  link_url: string;
}

function readFields(
  formData: FormData
): { error: string } | { fields: ActivityFields } {
  const name = String(formData.get("name") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const link_url = String(formData.get("link_url") ?? "").trim();

  if (!name || !blurb || !neighborhood || !link_url) {
    return { error: "Please fill in all the required fields." };
  }

  if (categoryRaw !== "activity" && categoryRaw !== "food_drink") {
    return { error: "Please choose a category." };
  }

  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  return {
    fields: {
      name,
      category: categoryRaw,
      photo_url,
      blurb,
      address,
      neighborhood,
      link_url,
    },
  };
}

export async function addActivity(formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();

  const { data: lastActivity } = await supabase
    .from("activities")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastActivity?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("activities")
    .insert({ ...result.fields, sort_order: nextSortOrder });

  if (error) {
    return { error: "Could not add that. Please try again." };
  }

  refreshActivityPages();
  return { error: null };
}

export async function updateActivity(id: string, formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update(result.fields)
    .eq("id", id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  refreshActivityPages();
  return { error: null };
}

export async function deleteActivity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);

  if (error) {
    return { error: "Could not delete that. Please try again." };
  }

  refreshActivityPages();
  return { error: null };
}

export async function moveActivity(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: activities, error: fetchError } = await supabase
    .from("activities")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !activities) {
    return { error: "Could not reorder the list. Please try again." };
  }

  const index = activities.findIndex((activity) => activity.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= activities.length) {
    return { error: null };
  }

  const current = activities[index];
  const swap = activities[swapIndex];

  const [a, b] = await Promise.all([
    supabase
      .from("activities")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("activities")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  if (a.error || b.error) {
    return { error: "Could not reorder the list. Please try again." };
  }

  refreshActivityPages();
  return { error: null };
}
