import Image from "next/image";

// Sits in the normal page flow after all page content — deliberately
// not fixed/sticky. Translucent + blurred in both modes now, matching
// Panel/NavBar's own bg-cream/80 + backdrop-blur-md pattern instead of
// a fully solid card. The blur also does real work in dark mode: the
// background artwork is fixed to the viewport bottom, so the footer
// always lands on the same busy patch of autumn foliage, and its
// golden/cream text and icons camouflaged against it without the
// blur. The owl/fox art is dark-brown line work, so it needs its own
// recolor filter in dark mode too (see `.footer-animal` in
// globals.css) or it would vanish entirely.
export default function SiteFooter() {
  return (
    <footer className="border-t border-dahlia/[0.18] bg-cream/80 py-3 backdrop-blur-md dark:border-gold/[0.18] dark:bg-transparent">
      <div className="mx-auto flex max-w-3xl items-end justify-center gap-3 px-4 sm:gap-5">
        <div className="flex flex-col items-center gap-0.5">
          <Image
            src="/owl.png"
            alt="Owl"
            width={32}
            height={32}
            className="footer-animal"
          />
          <span className="font-script text-[21px] leading-none text-dahlia dark:text-gold">
            Janine
          </span>
        </div>

        <span className="font-script text-[21px] leading-none text-dahlia dark:text-gold">
          &amp;
        </span>

        <div className="flex flex-col items-center gap-0.5">
          <Image
            src="/fox.png"
            alt="Fox"
            width={32}
            height={32}
            className="footer-animal"
          />
          <span className="font-script text-[21px] leading-none text-dahlia dark:text-gold">
            Adam
          </span>
        </div>
      </div>

      <p className="mt-1 text-center text-[11px] uppercase leading-none tracking-[0.3em] text-pine dark:text-cream/60">
        10 &middot; 17 &middot; 26
      </p>
    </footer>
  );
}
