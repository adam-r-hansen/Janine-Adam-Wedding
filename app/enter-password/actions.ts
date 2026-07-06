"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GUEST_COOKIE_MAX_AGE_SECONDS,
  GUEST_COOKIE_NAME,
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
  cookieStore.set(GUEST_COOKIE_NAME, await hashPassword(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
  });

  redirect(destination);
}
