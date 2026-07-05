import { ReactNode } from "react";

// The reusable "floating card" every page's content sits on, so the
// mountain artwork behind it stays visible through a soft tint.
export default function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-dahlia/10 bg-cream/80 shadow-lg shadow-black/5 backdrop-blur-md dark:border-cream/10 dark:bg-night/80 ${className}`}
    >
      {children}
    </div>
  );
}
