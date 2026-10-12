"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GUEST_COOKIE_NAME,
  GUEST_COOKIE_OPTIONS,
  hashPassword,
} from "@/lib/guest-access";

function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export async function submitGuestPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  const destination = isSafeRedirect(redirectTo) ? redirectTo : "/";

  if (!process.env.SITE_PASSWORD || password !== process.env.SITE_PASSWORD) {
    return {
      error: "That doesn't match the password from your invitation. Please try again.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    GUEST_COOKIE_NAME,
    await hashPassword(password),
    GUEST_COOKIE_OPTIONS
  );

  redirect(destination);
}
