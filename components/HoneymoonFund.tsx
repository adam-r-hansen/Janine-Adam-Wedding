"use client";

import { useMemo, useState, useTransition } from "react";
import { formatCurrencyFromCents, parseDollarsToCents } from "@/lib/format";
import { recordContribution } from "@/app/honeymoon/actions";

export interface HoneymoonItem {
  id: string;
  title: string;
  blurb: string | null;
  photo_url: string | null;
  suggested_cents: number;
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

// "$210.00" -> "$210", "$210.50" -> "$210.50". A display trim of
// formatCurrencyFromCents for the suggested-amount labels only; the
// running total keeps its cents.
function suggestedLabel(cents: number): string {
  return `${formatCurrencyFromCents(cents).replace(/\.00$/, "")} suggested`;
}

// Builds the whole-dollars.cents string Venmo wants in its amount param
// (two decimals, no "$", no thousands separator) straight from the
// integer cents, so it can't disagree with the total shown on screen.
function dollarsForVenmo(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export default function HoneymoonFund({
  items,
  venmoUsername,
  paymentNote,
}: {
  items: HoneymoonItem[];
  venmoUsername: string;
  paymentNote: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    claimCode: string;
    totalCents: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Parse the custom amount for the on-screen total. An empty box counts
  // as nothing; a half-typed value ("21.") shows an inline hint but still
  // counts as nothing until it's valid.
  const customParsed = customAmount.trim()
    ? parseDollarsToCents(customAmount)
    : null;
  const customCents =
    customParsed && "cents" in customParsed ? customParsed.cents : 0;
  const customError =
    customParsed && "error" in customParsed ? customParsed.error : null;

  const itemsTotalCents = useMemo(
    () =>
      items
        .filter((item) => selected.has(item.id))
        .reduce((sum, item) => sum + item.suggested_cents, 0),
    [items, selected]
  );

  const totalCents = itemsTotalCents + customCents;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("guest_name", name);
    formData.set("message", note);
    formData.set("custom_amount", customAmount);
    selected.forEach((id) => formData.append("item_ids", id));

    startTransition(async () => {
      const response = await recordContribution(formData);
      if ("claimCode" in response) {
        setResult({
          claimCode: response.claimCode,
          totalCents: response.totalCents,
        });
      } else {
        setError(response.error);
      }
    });
  }

  const noteText = result
    ? `Janine & Adam honeymoon - ${result.claimCode}`
    : "";
  const venmoHref = result
    ? `https://venmo.com/${venmoUsername || "Janine-Deegan"}?txn=pay&amount=${dollarsForVenmo(
        result.totalCents
      )}&note=${encodeURIComponent(noteText)}`
    : "";

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl tracking-wide text-accent">
          Pieces of the trip
        </h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-dahlia/15 hover:bg-accent/5 dark:border-cream/15"
                  }`}
                >
                  {item.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-heading text-lg text-accent">
                      {item.title}
                    </span>
                    {item.blurb && (
                      <span className="text-sm text-foreground/80">
                        {item.blurb}
                      </span>
                    )}
                    <span className="text-sm font-medium text-foreground/70">
                      {suggestedLabel(item.suggested_cents)}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                      isSelected
                        ? "border-accent bg-accent text-cream dark:text-night"
                        : "border-dahlia/30 text-transparent dark:border-cream/30"
                    }`}
                  >
                    &#10003;
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {items.length === 0 && (
          <p className="text-sm italic text-foreground/70">
            We haven&apos;t added the pieces of the trip yet &mdash; check
            back soon, or use the amount box below.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-dahlia/20 bg-cream/60 p-5 dark:border-cream/20 dark:bg-night/50">
        <h2 className="font-heading text-lg tracking-wide text-accent">
          Or send whatever amount feels right
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Amount in dollars
          </span>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-foreground/70">
              $
            </span>
            <input
              inputMode="decimal"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              placeholder="e.g. 75"
              className={`${inputClasses} flex-1`}
            />
          </div>
        </label>
        {customError && (
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {customError}
          </p>
        )}
      </section>

      <div className="flex items-center justify-between rounded-2xl bg-accent/10 px-5 py-4">
        <span className="font-heading text-lg tracking-wide text-accent">
          Your gift
        </span>
        <span className="font-heading text-lg text-accent">
          {formatCurrencyFromCents(totalCents)}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Your name{" "}
            <span className="font-normal text-foreground/60">
              (so we know who to thank)
            </span>
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            autoComplete="name"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            A short message
            <span className="ml-1 font-normal text-foreground/60">
              (optional)
            </span>
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={1000}
            className={inputClasses}
          />
        </label>
      </div>

      {result ? (
        <div className="flex flex-col gap-4">
          {/* A real link the guest taps themselves. Never window.open or a
              programmatic redirect — iOS Safari blocks those after an await. */}
          <a
            href={venmoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-center text-sm font-medium text-night transition-opacity hover:opacity-90"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[0.9em] w-[0.9em] shrink-0"
              fill="currentColor"
            >
              <path d="M19.5 3.5c.68 1.12 1 2.28 1 3.74 0 4.66-3.98 10.72-7.2 14.98H5.9L3 4.66l6.4-.6 1.55 12.4c1.43-2.33 3.2-5.99 3.2-8.49 0-1.37-.24-2.3-.61-3.07L19.5 3.5z" />
            </svg>
            Send with Venmo
          </a>

          <p className="text-sm leading-relaxed text-foreground/90">
            Thank you &mdash; that&apos;s so kind of you. We&apos;ll be
            thinking of you somewhere cold and beautiful.
          </p>

          <div className="rounded-lg border border-dahlia/15 p-4 text-sm text-foreground/80 dark:border-cream/15">
            <p className="text-foreground/70">
              If that button doesn&apos;t open, send it by hand in the Venmo
              app:
            </p>
            <p className="mt-2">
              Handle:{" "}
              <span className="font-medium text-foreground/90">
                @Janine-Deegan
              </span>
            </p>
            <p>
              Amount:{" "}
              <span className="font-medium text-foreground/90">
                {formatCurrencyFromCents(result.totalCents)}
              </span>
            </p>
            <p>
              Note:{" "}
              <span className="font-medium text-foreground/90">{noteText}</span>
            </p>
          </div>

          <p className="text-sm text-foreground/70">
            That&apos;s Janine &mdash; you&apos;re in the right place.
          </p>

          {paymentNote && (
            <p className="text-xs leading-relaxed text-foreground/60">
              {paymentNote}
            </p>
          )}
        </div>
      ) : (
        <>
          {error && (
            <p className="text-sm font-medium text-dahlia dark:text-ember">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
          >
            {isPending ? "One moment…" : "Continue"}
          </button>

          <p className="text-sm italic leading-relaxed text-foreground/70">
            And if you&apos;d rather skip all this &mdash; genuinely, please
            do. We just want you there.
          </p>
        </>
      )}
    </form>
  );
}
