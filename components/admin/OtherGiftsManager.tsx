"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Panel from "@/components/Panel";
import {
  formatCurrencyFromCents,
  formatDateOnly,
  formatDateTime,
  parseDollarsToCents,
  todayDateOnly,
} from "@/lib/format";
import {
  OTHER_GIFT_TYPES,
  otherGiftTypeLabel,
  type OtherGiftType,
} from "@/lib/other-gifts";
import {
  addOtherGift,
  deleteOtherGift,
  toggleOtherGiftThanked,
  updateOtherGift,
} from "@/app/admin/(dashboard)/contributions/actions";

export interface AdminOtherGift {
  id: string;
  giver_name: string;
  description: string;
  gift_type: OtherGiftType;
  amount_cents: number | null;
  received_on: string | null;
  notes: string | null;
  thanked_at: string | null;
  created_at: string;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "needs", label: "Needs thank-you" },
  { id: "thanked", label: "Thanked" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

// What to say when a filter leaves nothing to show (but there are gifts).
const EMPTY_FILTER_MESSAGES: Record<FilterId, string> = {
  all: "No other gifts logged yet.",
  needs: "Every gift here has been thanked.",
  thanked: "No gifts marked thanked yet.",
};

const inputClasses =
  "w-full rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

// The amount is stored as an integer number of cents but edited as
// dollars. Split it back into dollars and cents with integer math so the
// value shown in the field can't pick up a rounding error.
function centsToDollarsInput(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return remainder === 0
    ? String(dollars)
    : `${dollars}.${String(remainder).padStart(2, "0")}`;
}

// Not-yet-thanked first (that's the to-do list), then most recently
// received, with undated gifts after dated ones, then most recently logged.
function compareGifts(a: AdminOtherGift, b: AdminOtherGift): number {
  const aThanked = a.thanked_at !== null;
  const bThanked = b.thanked_at !== null;
  if (aThanked !== bThanked) return aThanked ? 1 : -1;

  if (a.received_on !== b.received_on) {
    if (a.received_on === null) return 1;
    if (b.received_on === null) return -1;
    // "YYYY-MM-DD" strings sort correctly as plain text.
    return b.received_on.localeCompare(a.received_on);
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export default function OtherGiftsManager({
  gifts,
}: {
  gifts: AdminOtherGift[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(() => [...gifts].sort(compareGifts), [gifts]);

  const visible =
    filter === "all"
      ? sorted
      : sorted.filter((gift) =>
          filter === "thanked"
            ? gift.thanked_at !== null
            : gift.thanked_at === null
        );

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      setConfirmingDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        </Panel>
      )}

      <Panel className="p-5 sm:p-6">
        {isAdding ? (
          <GiftForm
            heading="Add a gift"
            onSave={addOtherGift}
            onDone={() => setIsAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full rounded-full bg-accent px-4 py-3 text-sm font-medium text-cream dark:text-night"
          >
            + Add a gift
          </button>
        )}
      </Panel>

      {sorted.length > 0 && (
        <div
          role="group"
          aria-label="Show gifts"
          className="flex flex-wrap justify-center gap-2"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-accent text-cream dark:text-night"
                  : "text-accent hover:bg-accent/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-sm italic text-foreground/60">
          {sorted.length === 0
            ? EMPTY_FILTER_MESSAGES.all
            : EMPTY_FILTER_MESSAGES[filter]}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((gift) =>
            editingId === gift.id ? (
              <Panel key={gift.id} className="p-5 sm:p-6">
                <GiftForm
                  heading="Edit gift"
                  gift={gift}
                  onSave={(formData) => updateOtherGift(gift.id, formData)}
                  onDone={() => setEditingId(null)}
                />
              </Panel>
            ) : (
              <OtherGiftCard
                key={gift.id}
                gift={gift}
                isPending={isPending}
                isConfirmingDelete={confirmingDeleteId === gift.id}
                onEdit={() => setEditingId(gift.id)}
                onToggleThanked={(thanked) =>
                  run(() => toggleOtherGiftThanked(gift.id, thanked))
                }
                onDeleteClick={() => setConfirmingDeleteId(gift.id)}
                onCancelDelete={() => setConfirmingDeleteId(null)}
                onConfirmDelete={() => run(() => deleteOtherGift(gift.id))}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

// The add and edit forms are the same fields. Each form keeps its own
// "saving" and error state so a failed save shows its message right next
// to the Save button, and the fields keep what was typed.
function GiftForm({
  heading,
  gift,
  onSave,
  onDone,
}: {
  heading: string;
  gift?: AdminOtherGift;
  onSave: (formData: FormData) => Promise<{ error: string | null }>;
  onDone: () => void;
}) {
  // A new gift defaults to arriving today (Pacific time); an existing one
  // keeps whatever it had, including no date at all.
  const [receivedOn, setReceivedOn] = useState(
    gift ? (gift.received_on ?? "") : todayDateOnly()
  );
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  // A plain onSubmit (rather than <form action>) on purpose: React clears a
  // form's fields after an `action` runs, which would wipe everything typed
  // if the save failed.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFormError(null);
    const amount = String(formData.get("amount") ?? "").trim();
    if (amount) {
      const parsed = parseDollarsToCents(amount);
      if ("error" in parsed) {
        setAmountError(parsed.error);
        return;
      }
    }
    setAmountError(null);

    startSaving(async () => {
      const result = await onSave(formData);
      if (result.error) setFormError(result.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-heading text-lg text-accent">{heading}</h3>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">From</span>
        <input
          name="giver_name"
          defaultValue={gift?.giver_name}
          required
          maxLength={120}
          autoComplete="off"
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">What was it?</span>
        <input
          name="description"
          defaultValue={gift?.description}
          required
          maxLength={300}
          placeholder="e.g. KitchenAid mixer, card with check"
          autoComplete="off"
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Type</span>
        <select
          name="gift_type"
          defaultValue={gift?.gift_type ?? "item"}
          className={inputClasses}
        >
          {OTHER_GIFT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Amount
          <span className="ml-1 font-normal text-foreground/60">
            (optional &mdash; in dollars, e.g. 50 or 50.00)
          </span>
        </span>
        <input
          name="amount"
          inputMode="decimal"
          defaultValue={
            gift?.amount_cents != null
              ? centsToDollarsInput(gift.amount_cents)
              : ""
          }
          aria-invalid={amountError ? true : undefined}
          aria-describedby={amountError ? "other-gift-amount-error" : undefined}
          className={inputClasses}
        />
        {amountError && (
          <span
            id="other-gift-amount-error"
            className="text-sm font-medium text-dahlia dark:text-ember"
          >
            {amountError}
          </span>
        )}
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <label
          htmlFor={`received-on-${gift?.id ?? "new"}`}
          className="font-medium text-foreground/80"
        >
          Received on
          <span className="ml-1 font-normal text-foreground/60">
            (optional)
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`received-on-${gift?.id ?? "new"}`}
            type="date"
            name="received_on"
            value={receivedOn}
            onChange={(event) => setReceivedOn(event.target.value)}
            className={inputClasses}
          />
          {receivedOn && (
            <button
              type="button"
              onClick={() => setReceivedOn("")}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Notes
          <span className="ml-1 font-normal text-foreground/60">
            (optional)
          </span>
        </span>
        <textarea
          name="notes"
          defaultValue={gift?.notes ?? ""}
          rows={3}
          maxLength={1000}
          className={inputClasses}
        />
      </label>

      {formError && (
        <p className="text-sm font-medium text-dahlia dark:text-ember">
          {formError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isSaving}
          className="rounded-full px-5 py-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function OtherGiftCard({
  gift,
  isPending,
  isConfirmingDelete,
  onEdit,
  onToggleThanked,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
}: {
  gift: AdminOtherGift;
  isPending: boolean;
  isConfirmingDelete: boolean;
  onEdit: () => void;
  onToggleThanked: (thanked: boolean) => void;
  onDeleteClick: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const g = gift;

  return (
    <Panel className="flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-xl text-accent">
            {g.giver_name}
          </span>
          <span className="text-sm text-foreground/90">{g.description}</span>
        </div>
        <span className="rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-wide text-night">
          {otherGiftTypeLabel(g.gift_type)}
        </span>
      </div>

      {(g.amount_cents !== null || g.received_on) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-dahlia/10 pt-2 text-sm text-foreground/80 dark:border-cream/10">
          {g.amount_cents !== null && (
            <span className="tabular-nums">
              {formatCurrencyFromCents(g.amount_cents)}
            </span>
          )}
          {g.received_on && (
            <span>Received {formatDateOnly(g.received_on)}</span>
          )}
        </div>
      )}

      {g.notes && (
        <p className="whitespace-pre-line rounded-lg bg-cream/60 p-3 text-sm leading-relaxed text-foreground/90 dark:bg-night/50">
          {g.notes}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {g.thanked_at ? (
          <>
            <span className="rounded-full bg-pine/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-pine">
              Thanked {formatDateTime(g.thanked_at)}
            </span>
            <button
              type="button"
              onClick={() => onToggleThanked(false)}
              disabled={isPending}
              className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              Undo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onToggleThanked(true)}
            disabled={isPending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
          >
            Mark thanked
          </button>
        )}

        <button
          type="button"
          onClick={onEdit}
          disabled={isPending}
          className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Edit
        </button>

        {isConfirmingDelete ? (
          <span className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground/80">Delete permanently?</span>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isPending}
              className="rounded-full bg-dahlia px-4 py-2 font-medium text-cream disabled:opacity-60"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="rounded-full px-4 py-2 font-medium text-accent hover:bg-accent/10"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={onDeleteClick}
            className="ml-auto rounded-full border border-dahlia/40 px-4 py-2 text-sm font-medium text-dahlia hover:bg-dahlia/10 dark:border-ember/40 dark:text-ember"
          >
            Delete
          </button>
        )}
      </div>
    </Panel>
  );
}
