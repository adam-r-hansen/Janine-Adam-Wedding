// Shared between proxy.ts (Edge runtime) and the enter-password Server
// Action (Node runtime) — both environments expose Web Crypto globally,
// so this file avoids any runtime-specific import.

export const GUEST_COOKIE_NAME = "site_access";
export const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // one year

// The cookie stores a hash of the password rather than the password
// itself, so a copy of someone's cookie doesn't hand over the actual
// invitation password.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
