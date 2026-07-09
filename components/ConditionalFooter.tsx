"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";

// The root layout wraps every route, admin included, so this checks
// the current path to keep the footer off /admin/* and the password
// gate — everywhere else (Home, Schedule, Travel, Things to Do, FAQ,
// RSVP, Honeymoon, Gallery, Guestbook) gets it.
export default function ConditionalFooter() {
  const pathname = usePathname();
  const hideFooter =
    pathname.startsWith("/admin") || pathname === "/enter-password";

  if (hideFooter) return null;
  return <SiteFooter />;
}
