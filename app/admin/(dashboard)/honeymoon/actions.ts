"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { parseDollarsToCents } from "@/lib/format";

function refreshHoneymoonPages() {
  revalidatePath("/admin/honeymoon");
  revalidatePath("/honeymoon");
}

interface HoneymoonFields {
  title: string;
  blurb: string | null;
  photo_url: string | null;
  suggested_cents: number;
  goal_cents: null;
}

function readFields(
  formData: FormData
): { error: string } | { fields: HoneymoonFields } {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { error: "Please give this experience a title." };
  }
  if (title.length > 120) {
    return { error: "Please keep the title to 120 characters or fewer." };
  }

  const blurbRaw = String(formData.get("blurb") ?? "").trim();
  if (blurbRaw.length > 500) {
    return {
      error: "Please keep the description to 500 characters or fewer.",
    };
  }
  const blurb = blurbRaw || null;

  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;

  const suggested = parseDollarsToCents(
    String(formData.get("suggested_dollars") ?? "")
  );
  if ("error" in suggested) {
    return { error: suggested.error };
  }

  return {
    fields: {
      title,
      blurb,
      photo_url,
      suggested_cents: suggested.cents,
      // goal_cents is not part of this stage's UI — always left empty.
      goal_cents: null,
    },
  };
}

export async function addItem(formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();

  const { data: lastItem } = await supabase
    .from("honeymoon_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastItem?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("honeymoon_items")
    .insert({ ...result.fields, sort_order: nextSortOrder });

  if (error) {
    return { error: "Could not add that. Please try again." };
  }

  refreshHoneymoonPages();
  return { error: null };
}

export async function updateItem(id: string, formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_items")
    .update(result.fields)
    .eq("id", id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  refreshHoneymoonPages();
  return { error: null };
}

export async function toggleItemActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_items")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { error: "Could not update that. Please try again." };
  }

  refreshHoneymoonPages();
  return { error: null };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("honeymoon_items")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Could not delete that. Please try again." };
  }

  refreshHoneymoonPages();
  return { error: null };
}

export async function reorderItems(orderedIds: string[]) {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("honeymoon_items")
        .update({ sort_order: index + 1 })
        .eq("id", id)
    )
  );

  if (results.some((result) => result.error)) {
    return { error: "Could not save the new order. Please try again." };
  }

  refreshHoneymoonPages();
  return { error: null };
}
