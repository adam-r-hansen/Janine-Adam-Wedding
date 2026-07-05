import { ReactNode } from "react";

// The shared centered column every inner page's content sits in, so
// spacing and max width stay consistent site-wide.
export default function PageContainer({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 pb-24 pt-10 sm:pt-16 ${
        narrow ? "max-w-lg" : "max-w-2xl"
      }`}
    >
      {children}
    </div>
  );
}
