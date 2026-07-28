import { ReactNode } from "react";

// The shared centered column every inner page's content sits in, so
// spacing and max width stay consistent site-wide. Three widths: `narrow`
// (max-w-lg) for text-only pages like FAQ, the default (max-w-2xl) for
// most pages, and `wide` (max-w-5xl) for pages like Things to Do whose
// content is laid out in multiple columns and needs more room.
export default function PageContainer({
  children,
  narrow = false,
  wide = false,
}: {
  children: ReactNode;
  narrow?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 pb-24 pt-10 sm:pt-16 ${
        narrow ? "max-w-lg" : wide ? "max-w-5xl" : "max-w-2xl"
      }`}
    >
      {children}
    </div>
  );
}
