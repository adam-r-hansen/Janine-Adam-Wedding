"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function refreshFaqPages() {
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

export async function addFaq(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();

  if (!question || !answer) {
    return { error: "Please fill in both the question and the answer." };
  }

  const supabase = await createClient();

  const { data: lastFaq } = await supabase
    .from("faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastFaq?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("faqs")
    .insert({ question, answer, sort_order: nextSortOrder });

  if (error) {
    return { error: "Could not add the FAQ. Please try again." };
  }

  refreshFaqPages();
  return { error: null };
}

export async function updateFaq(id: string, formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();

  if (!question || !answer) {
    return { error: "Please fill in both the question and the answer." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("faqs")
    .update({ question, answer })
    .eq("id", id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  refreshFaqPages();
  return { error: null };
}

export async function deleteFaq(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) {
    return { error: "Could not delete that FAQ. Please try again." };
  }

  refreshFaqPages();
  return { error: null };
}

export async function moveFaq(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: faqs, error: fetchError } = await supabase
    .from("faqs")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !faqs) {
    return { error: "Could not reorder the FAQs. Please try again." };
  }

  const index = faqs.findIndex((faq) => faq.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= faqs.length) {
    return { error: null };
  }

  const current = faqs[index];
  const swap = faqs[swapIndex];

  const [a, b] = await Promise.all([
    supabase
      .from("faqs")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("faqs")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  if (a.error || b.error) {
    return { error: "Could not reorder the FAQs. Please try again." };
  }

  refreshFaqPages();
  return { error: null };
}
