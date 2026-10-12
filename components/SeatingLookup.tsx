"use client";

import { useState, useTransition, type FormEvent } from "react";
import Panel from "@/components/Panel";
import { findTable, type TableMatch } from "@/app/seating/actions";

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

export default function SeatingLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TableMatch[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await findTable(query);
      setResults(result.matches);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-6 sm:p-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground/80">Your name</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your name…"
              autoComplete="name"
              className={inputClasses}
            />
          </label>
          <button
            type="submit"
            disabled={isPending || query.trim().length < 3}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
          >
            {isPending ? "Searching…" : "Find my table"}
          </button>
        </form>
      </Panel>

      {results !== null && (
        <div className="flex flex-col gap-3" aria-live="polite">
          {results.length === 0 ? (
            <Panel className="p-6 text-center">
              <p className="text-sm leading-relaxed text-foreground/90">
                We couldn&apos;t find that name. Try it just as it appears on
                your invitation — or text us and we&apos;ll point you to your
                seat!
              </p>
            </Panel>
          ) : (
            results.map((match, index) => (
              <Panel
                key={`${index}-${match.names.join("|")}`}
                className="p-6 text-center sm:p-8"
              >
                <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                  {match.names.join(" · ")}
                </p>
                {match.tableNumber !== null ? (
                  <p className="mt-2 font-heading text-5xl tracking-[0.1em] text-accent lining-nums sm:text-6xl">
                    Table {match.tableNumber}
                  </p>
                ) : (
                  <p className="mt-3 font-heading text-xl text-accent sm:text-2xl">
                    Your table is still being finalized.
                  </p>
                )}
              </Panel>
            ))
          )}
        </div>
      )}
    </div>
  );
}
