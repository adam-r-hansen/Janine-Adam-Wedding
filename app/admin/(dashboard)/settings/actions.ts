"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function refreshSettingsPages() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/travel");
  revalidatePath("/honeymoon");
}

export async function updateSettings(formData: FormData) {
  const welcomeMessage = String(formData.get("welcome_message") ?? "").trim();
  const venueLine = String(formData.get("venue_line") ?? "").trim();
  const travelIntro = String(formData.get("travel_intro") ?? "").trim();
  const weddingDateTime = String(formData.get("wedding_datetime") ?? "").trim();
  const registryIntro = String(formData.get("registry_intro") ?? "").trim();
  // Stored without a leading "@" so the Venmo link builds cleanly.
  const venmoUsername = String(formData.get("venmo_username") ?? "")
    .trim()
    .replace(/^@/, "");
  const honeymoonPaymentNote = String(
    formData.get("honeymoon_payment_note") ?? ""
  ).trim();

  if (
    !welcomeMessage ||
    !venueLine ||
    !travelIntro ||
    !weddingDateTime ||
    !registryIntro ||
    !venmoUsername
  ) {
    return { error: "Please fill in every field except the payment note." };
  }

  // The date picker gives a value like "2026-10-17T18:00" with no
  // timezone attached. The venue is in University Place, WA, which is
  // Pacific Daylight Time in October, so that offset is pinned here
  // rather than pulling in a timezone library for a date that's only
  // ever set once or twice.
  const weddingDatetimeIso = `${weddingDateTime}:00-07:00`;
  const parsedDate = new Date(weddingDatetimeIso);

  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "That wedding date and time doesn't look valid." };
  }

  const weddingDateLabel = parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "welcome_message", value: welcomeMessage },
      { key: "venue_line", value: venueLine },
      { key: "travel_intro", value: travelIntro },
      { key: "wedding_datetime", value: weddingDatetimeIso },
      { key: "wedding_date_label", value: weddingDateLabel },
      { key: "registry_intro", value: registryIntro },
      { key: "venmo_username", value: venmoUsername },
      { key: "honeymoon_payment_note", value: honeymoonPaymentNote },
    ],
    { onConflict: "key" }
  );

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  refreshSettingsPages();
  return { error: null };
}
