"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { links } from "@/components/NavBar";

const TRANSITION_MS = 420;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

// Wraps the whole page so it can act like a card that slides away on
// mobile, revealing a menu layer that was sitting underneath the whole
// time. Desktop (`md` and up) is untouched: both wrapper divs collapse to
// `display: contents`, meaning they generate no box at all and `children`
// renders exactly as if DrawerShell didn't exist.
export default function DrawerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  // True only while the open/close transition is actually running — NOT
  // the same window as isFrozen, which stays true for as long as the
  // drawer is left open. will-change should only cost anything during the
  // brief animation, not for the whole time the drawer sits open.
  const [isAnimating, setIsAnimating] = useState(false);
  // The scroll position captured at the moment the drawer opened. This
  // feeds directly into the card's inline style below, so it lives in
  // state (not a ref) — a ref's value shouldn't be read during render.
  const [frozenScrollY, setFrozenScrollY] = useState(0);
  // Subscribes directly to the browser's media query (the React-recommended
  // way to read external/browser state) instead of setState-in-an-effect.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animatingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // 0ms when the user has asked for reduced motion — every timer below
  // that exists only to "wait out the animation" collapses to instant.
  const transitionMs = prefersReducedMotion ? 0 : TRANSITION_MS;

  function clearAnimatingTimeout() {
    if (animatingTimeoutRef.current) {
      clearTimeout(animatingTimeoutRef.current);
      animatingTimeoutRef.current = null;
    }
  }

  // Fallback for isAnimating: normally handleCardTransitionEnd clears it
  // the instant the real CSS transition finishes, but transitionend never
  // fires when there's no transition to finish (prefers-reduced-motion),
  // so this guarantees it always gets cleared regardless.
  function scheduleAnimatingClear(duration: number) {
    clearAnimatingTimeout();
    animatingTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      animatingTimeoutRef.current = null;
    }, duration);
  }

  function openDrawer() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Capture scroll position before the card leaves normal document flow,
    // so we can pin it at the same visual spot and restore it on close.
    setFrozenScrollY(window.scrollY);
    setIsFrozen(true);
    setIsAnimating(true);
    scheduleAnimatingClear(transitionMs);
    setIsOpen(true);
  }

  function closeDrawer() {
    setIsOpen(false);
    setIsAnimating(true);
    scheduleAnimatingClear(transitionMs);
    // Stay "frozen" (fixed, pinned) for the close animation, then drop
    // back to normal document flow and land exactly where the user was —
    // this is the step most likely to visually jump if rushed. This path
    // is only for closing on the SAME page (X button, tapping the card,
    // Escape) — see the pathname effect below for closing via navigation,
    // which must never restore this scroll position.
    closeTimeoutRef.current = setTimeout(() => {
      setIsFrozen(false);
      window.scrollTo(0, frozenScrollY);
      closeTimeoutRef.current = null;
    }, transitionMs);
  }

  function handleCardTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && e.propertyName === "transform") {
      clearAnimatingTimeout();
      setIsAnimating(false);
    }
  }

  function toggleDrawer() {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  useEffect(() => {
    document.body.style.overflow = isFrozen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFrozen]);

  // A navigation (tapping a drawer link, browser back/forward, etc.) must
  // never let the OLD page's frozen scroll position leak onto the NEW
  // page. Skipped on first mount (pathname "changing" from its own
  // starting value isn't a real navigation) — only fires on genuine
  // route changes, and always wins over whatever closeDrawer's own timer
  // was about to do.
  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }
    previousPathnameRef.current = pathname;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    clearAnimatingTimeout();

    // Snap everything closed with no transition — the new page is
    // already rendering underneath, so animating the old one away would
    // just fight it — and start the new page at the top, never at the
    // old scroll position.
    setIsOpen(false);
    setIsFrozen(false);
    setIsAnimating(false);
    setFrozenScrollY(0);
    document.body.style.overflow = "";
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
      }
    }
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      clearAnimatingTimeout();
    };
  }, []);

  const cardStyle: CSSProperties = isFrozen
    ? {
        position: "fixed",
        inset: 0,
        top: -frozenScrollY,
        // Only needed to clip the rounded corners while open — kept for
        // the whole isFrozen window, not just the animation.
        overflow: "hidden",
        transformOrigin: "center",
        transform: isOpen
          ? "translateX(-58%) scale(0.86)"
          : "translateX(0) scale(1)",
        borderRadius: isOpen ? "24px" : "0px",
        boxShadow: isOpen ? "-8px 0 40px rgba(0, 0, 0, 0.45)" : "none",
        transition: prefersReducedMotion
          ? "none"
          : "transform 420ms cubic-bezier(0.32, 0.72, 0, 1), border-radius 420ms cubic-bezier(0.32, 0.72, 0, 1)",
        // Only while the transition is actually running — see isAnimating.
        ...(isAnimating && !prefersReducedMotion
          ? { willChange: "transform" }
          : {}),
      }
    : {
        transform: "none",
      };

  return (
    <>
      {/* The drawer layer: fixed, full-screen, sits behind the card at
          all times and contributes zero height to the document. On
          mobile it's always technically "there," just completely hidden
          behind the opaque card until the card slides away. bg-night is
          the fallback color underneath the image, so there's never a
          flash of white while the artwork loads. */}
      <div
        className="fixed inset-0 z-0 overflow-hidden bg-night md:hidden"
        role="navigation"
        aria-label="Menu"
        aria-hidden={!isOpen}
      >
        <Image
          src="/backgrounds/drawer-mobile.webp"
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className="object-cover object-right"
        />

        {/* Darkens the right-hand edge (the only part of the artwork a
            guest ever actually sees) so the pill text stays readable no
            matter how light that patch of the artwork is. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, transparent, rgba(49, 44, 44, 0.45))",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-center pt-24 pb-12">
          <div className="flex w-full flex-col items-end gap-2.5 pr-6">
            {links.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeDrawer}
                  aria-current={isActive ? "page" : undefined}
                  tabIndex={isOpen ? 0 : -1}
                  style={{
                    transitionDelay: isOpen ? `${index * 30}ms` : "0ms",
                  }}
                  className={`drawer-pill ${
                    isOpen ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
                  } ${isActive ? "is-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Small, quiet — the same fox/owl line art as the footer, just
              recolored for the artwork's dark background at all times
              (not only in the site's own dark mode, like the footer).
              Fixed to the same 240px column as the pills, and offset by
              the same 24px right gutter, so it lines up beneath them. */}
          <div
            style={{ width: 240, marginLeft: "auto", marginRight: 24 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Image src="/owl.png" alt="Owl" width={28} height={28} className="drawer-animal" />
            <Image src="/fox.png" alt="Fox" width={28} height={28} className="drawer-animal" />
          </div>
        </div>
      </div>

      {/* The "card": the whole page (Background, NavBar, main, footer),
          wrapped so it can slide/scale away as one unit on mobile. Two
          nested divs on purpose — the outer one catches the "tap the
          sliver to close" click, while the inner one goes pointer-events:
          none while open so none of the page's own links/buttons can be
          triggered by accident through the sliver. Both collapse to
          `display: contents` at `md` and up, so desktop gets no wrapper
          at all. `.drawer-card` is the one and only place a full-screen
          minimum height is set — see globals.css. */}
      <div
        className="drawer-card relative z-10 flex flex-col bg-cream dark:bg-night md:contents"
        style={cardStyle}
        onClick={isOpen ? closeDrawer : undefined}
        onTransitionEnd={handleCardTransitionEnd}
      >
        <div
          className={`flex flex-1 flex-col md:contents ${
            isOpen ? "pointer-events-none" : ""
          }`}
        >
          {children}
        </div>
      </div>

      {/* The hamburger lives outside the card on purpose: a transformed
          parent breaks `position: fixed` for anything inside it, and this
          button must stay pinned to the viewport no matter what the card
          is doing. It sits directly over NavBar's now-empty mobile bar,
          matching its height (h-14) so it lines up exactly. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-end px-4 md:hidden">
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isOpen ? "text-cream" : "text-night dark:text-cream"
          }`}
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-200 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            >
              <span className="h-0.5 w-full bg-current" />
              <span className="h-0.5 w-full bg-current" />
              <span className="h-0.5 w-full bg-current" />
            </span>
            <span
              className={`absolute inset-0 transition-opacity duration-200 ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-current" />
            </span>
          </span>
        </button>
      </div>
    </>
  );
}
