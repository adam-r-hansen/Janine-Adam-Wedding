"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/settings", label: "Settings", enabled: true },
  { href: "/admin/events", label: "Events", enabled: true },
  { href: "/admin/hotels", label: "Hotels", enabled: true },
  { href: "/admin/things-to-do", label: "Things to Do", enabled: true },
  { href: "/admin/faqs", label: "FAQs", enabled: true },
  { href: "/admin/guest-list", label: "Guest List", enabled: true },
  { href: "/admin/rsvps", label: "RSVPs", enabled: true },
  { href: "/admin/photos", label: "Photos", enabled: true },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        if (!tab.enabled) {
          return (
            <span
              key={tab.label}
              className="flex items-center gap-1.5 rounded-full border border-dahlia/10 px-3 py-1.5 text-sm text-foreground/40 dark:border-cream/10"
            >
              {tab.label}
              <span className="rounded-full bg-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-night/70">
                Soon
              </span>
            </span>
          );
        }

        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-cream dark:text-night"
                : "text-accent hover:bg-accent/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
