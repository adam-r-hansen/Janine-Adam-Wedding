"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function refreshEventPages() {
  revalidatePath("/admin/events");
  revalidatePath("/schedule");
}

interface EventFields {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  address: string;
  description: string;
  dress_code: string;
}

function readFields(formData: FormData): { error: string } | { fields: EventFields } {
  const fields: EventFields = {
    title: String(formData.get("title") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    start_time: String(formData.get("start_time") ?? "").trim(),
    end_time: String(formData.get("end_time") ?? "").trim(),
    venue_name: String(formData.get("venue_name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    dress_code: String(formData.get("dress_code") ?? "").trim(),
  };

  if (Object.values(fields).some((value) => !value)) {
    return { error: "Please fill in every field." };
  }

  return { fields };
}

export async function addEvent(formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();

  const { data: lastEvent } = await supabase
    .from("events")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastEvent?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("events")
    .insert({ ...result.fields, sort_order: nextSortOrder });

  if (error) {
    return { error: "Could not add the event. Please try again." };
  }

  refreshEventPages();
  return { error: null };
}

export async function updateEvent(id: string, formData: FormData) {
  const result = readFields(formData);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update(result.fields)
    .eq("id", id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  refreshEventPages();
  return { error: null };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return { error: "Could not delete that event. Please try again." };
  }

  refreshEventPages();
  return { error: null };
}

export async function moveEvent(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: events, error: fetchError } = await supabase
    .from("events")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !events) {
    return { error: "Could not reorder the events. Please try again." };
  }

  const index = events.findIndex((event) => event.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= events.length) {
    return { error: null };
  }

  const current = events[index];
  const swap = events[swapIndex];

  const [a, b] = await Promise.all([
    supabase
      .from("events")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("events")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  if (a.error || b.error) {
    return { error: "Could not reorder the events. Please try again." };
  }

  refreshEventPages();
  return { error: null };
}
