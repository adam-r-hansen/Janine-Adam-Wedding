"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Exported so DrawerShell's mobile menu can reuse the exact same list of
// pages instead of keeping a second copy that could drift out of sync.
export const links = [
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

// The bar's own height (h-14) always renders, at every screen size, so the
// page never jumps as its contents change. At `md` and up it shows the
// familiar horizontal link row. Below `md`, that row is still in the DOM
// but made invisible (not removed) so the bar keeps the exact same
// height — DrawerShell draws a fixed hamburger button over this same
// empty-looking bar instead, lined up to match its position.
//
// Below `md` the bar is fully opaque (bg-cream / dark:bg-night, no blur):
// it sits inside DrawerShell's sliding card, which itself now sits above
// the drawer's own dark artwork layer, so any translucency here would let
// that layer tint through. At `md` and up (outside the card entirely) the
// original translucent, blurred look over the mountain background returns.
export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-dahlia/10 bg-cream dark:border-cream/10 dark:bg-night md:bg-cream/80 md:backdrop-blur-md md:dark:bg-night/80">
      <div className="invisible mx-auto flex h-14 max-w-3xl items-center gap-1 overflow-x-auto px-4 text-sm sm:justify-center sm:gap-2 md:visible">
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
