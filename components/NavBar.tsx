"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/travel", label: "Travel" },
  { href: "/things-to-do", label: "Things to Do" },
  { href: "/faq", label: "FAQ" },
  { href: "/rsvp", label: "RSVP" },
  { href: "/honeymoon", label: "Honeymoon" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guestbook", label: "Guestbook" },
];

// Simple top nav. On narrow phones the links scroll sideways instead of
// wrapping, so the bar always stays one line tall. The current page gets
// a solid pill so guests always know where they are.
export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-dahlia/10 bg-cream/80 backdrop-blur-md dark:border-cream/10 dark:bg-night/80">
      <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-4 py-3 text-sm sm:justify-center sm:gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition-colors ${
                isActive
                  ? "bg-accent text-cream dark:text-night"
                  : "text-accent hover:bg-accent/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
