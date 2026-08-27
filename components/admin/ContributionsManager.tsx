"use client";

import { useMemo, useState, useTransition } from "react";
import Panel from "@/components/Panel";
import { formatCurrencyFromCents, formatDateTime } from "@/lib/format";
import {
  deleteContribution,
  markCancelled,
  markPending,
  markReceived,
  toggleThanked,
} from "@/app/admin/(dashboard)/contributions/actions";

export interface AdminContributionLine {
  item_title: string;
  amount_cents: number;
}

export interface AdminContribution {
  id: string;
  claim_code: string;
  guest_name: string;
  guest_email: string | null;
  message: string | null;
  amount_cents: number;
  status: "pending" | "received" | "cancelled";
  received_at: string | null;
  thanked_at: string | null;
  created_at: string;
  lines: AdminContributionLine[];
}

type Confirming = { id: string; action: "cancel" | "delete" } | null;

export default function ContributionsManager({
  contributions,
}: {
  contributions: AdminContribution[];
}) {
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const q = query.trim().toLowerCase();

  const { pending, received, cancelled } = useMemo(() => {
    const matches = (c: AdminContribution) =>
      !q ||
      c.claim_code.toLowerCase().includes(q) ||
      c.guest_name.toLowerCase().includes(q);
    return {
      pending: contributions.filter(
        (c) => c.status === "pending" && matches(c)
      ),
      received: contributions.filter(
        (c) => c.status === "received" && matches(c)
      ),
      cancelled: contributions.filter(
        (c) => c.status === "cancelled" && matches(c)
      ),
    };
  }, [contributions, q]);

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      setConfirming(null);
    });
  }

  const cancelledOpen = showCancelled || (q !== "" && cancelled.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        </Panel>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Search by claim code or name
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. K4P7Q or Sarah"
          className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night"
        />
      </label>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">
          Awaiting confirmation ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            {q
              ? "No pending gifts match your search."
              : "Nothing waiting on you right now."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                isPending={isPending}
                confirming={confirming}
                onRequestConfirm={setConfirming}
                onDismissConfirm={() => setConfirming(null)}
                onMarkReceived={() => run(() => markReceived(contribution.id))}
                onMarkPending={() => run(() => markPending(contribution.id))}
                onConfirmCancel={() =>
                  run(() => markCancelled(contribution.id))
                }
                onConfirmDelete={() =>
                  run(() => deleteContribution(contribution.id))
                }
                onToggleThanked={(thanked) =>
                  run(() => toggleThanked(contribution.id, thanked))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">
          Confirmed ({received.length})
        </h3>
        {received.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            {q
              ? "No confirmed gifts match your search."
              : "None confirmed yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {received.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                isPending={isPending}
                confirming={confirming}
                onRequestConfirm={setConfirming}
                onDismissConfirm={() => setConfirming(null)}
                onMarkReceived={() => run(() => markReceived(contribution.id))}
                onMarkPending={() => run(() => markPending(contribution.id))}
                onConfirmCancel={() =>
                  run(() => markCancelled(contribution.id))
                }
                onConfirmDelete={() =>
                  run(() => deleteContribution(contribution.id))
                }
                onToggleThanked={(thanked) =>
                  run(() => toggleThanked(contribution.id, thanked))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setShowCancelled((open) => !open)}
          aria-expanded={cancelledOpen}
          className="w-fit rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
        >
          {cancelledOpen ? "Hide" : "Show"} cancelled ({cancelled.length})
        </button>
        {cancelledOpen && (
          <div className="flex flex-col gap-4">
            {cancelled.length === 0 ? (
              <p className="text-center text-sm italic text-foreground/60">
                Nothing cancelled.
              </p>
            ) : (
              cancelled.map((contribution) => (
                <ContributionCard
                  key={contribution.id}
                  contribution={contribution}
                  isPending={isPending}
                  confirming={confirming}
                  onRequestConfirm={setConfirming}
                  onDismissConfirm={() => setConfirming(null)}
                  onMarkReceived={() =>
                    run(() => markReceived(contribution.id))
                  }
                  onMarkPending={() =>
                    run(() => markPending(contribution.id))
                  }
                  onConfirmCancel={() =>
                    run(() => markCancelled(contribution.id))
                  }
                  onConfirmDelete={() =>
                    run(() => deleteContribution(contribution.id))
                  }
                  onToggleThanked={(thanked) =>
                    run(() => toggleThanked(contribution.id, thanked))
                  }
                />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ContributionCard({
  contribution,
  isPending,
  confirming,
  onRequestConfirm,
  onDismissConfirm,
  onMarkReceived,
  onMarkPending,
  onConfirmCancel,
  onConfirmDelete,
  onToggleThanked,
}: {
  contribution: AdminContribution;
  isPending: boolean;
  confirming: Confirming;
  onRequestConfirm: (value: Confirming) => void;
  onDismissConfirm: () => void;
  onMarkReceived: () => void;
  onMarkPending: () => void;
  onConfirmCancel: () => void;
  onConfirmDelete: () => void;
  onToggleThanked: (thanked: boolean) => void;
}) {
  const c = contribution;
  const isConfirmingCancel =
    confirming?.id === c.id && confirming.action === "cancel";
  const isConfirmingDelete =
    confirming?.id === c.id && confirming.action === "delete";

  return (
    <Panel className="flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-lg font-semibold tracking-[0.25em] text-accent">
            {c.claim_code}
          </span>
          <span className="text-sm text-foreground/90">
            <span className="font-medium">{c.guest_name}</span>
            {" — "}
            {formatCurrencyFromCents(c.amount_cents)}
          </span>
        </div>
        {c.status === "received" && (
          <span className="rounded-full bg-pine/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-pine">
            Received
          </span>
        )}
        {c.status === "cancelled" && (
          <span className="rounded-full border border-dahlia/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-dahlia dark:border-ember/30 dark:text-ember">
            Cancelled
          </span>
        )}
      </div>

      {c.lines.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-dahlia/10 pt-2 text-sm text-foreground/80 dark:border-cream/10">
          {c.lines.map((line, index) => (
            <li
              key={`${line.item_title}-${index}`}
              className="flex justify-between gap-4"
            >
              <span>{line.item_title}</span>
              <span className="shrink-0 tabular-nums">
                {formatCurrencyFromCents(line.amount_cents)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {c.message && (
        <p className="rounded-lg bg-cream/60 p-3 text-sm leading-relaxed text-foreground/90 dark:bg-night/50">
          {c.message}
        </p>
      )}

      <p className="text-xs uppercase tracking-wide text-foreground/50">
        Submitted {formatDateTime(c.created_at)}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {c.status === "pending" && (
          <button
            type="button"
            onClick={onMarkReceived}
            disabled={isPending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
          >
            Mark received
          </button>
        )}

        {c.status === "received" && (
          <>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={c.thanked_at !== null}
                onChange={(event) => onToggleThanked(event.target.checked)}
                disabled={isPending}
                className="h-4 w-4 accent-dahlia dark:accent-ember"
              />
              Thank-you sent
              {c.thanked_at && (
                <span className="text-xs text-foreground/50">
                  ({formatDateTime(c.thanked_at)})
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={onMarkPending}
              disabled={isPending}
              className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
            >
              Move back to pending
            </button>
          </>
        )}

        {c.status === "cancelled" && (
          <button
            type="button"
            onClick={onMarkPending}
            disabled={isPending}
            className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
          >
            Move back to pending
          </button>
        )}

        {c.status === "pending" &&
          (isConfirmingCancel ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-foreground/80">Cancel this gift?</span>
              <button
                type="button"
                onClick={onConfirmCancel}
                disabled={isPending}
                className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
              >
                Yes, cancel
              </button>
              <button
                type="button"
                onClick={onDismissConfirm}
                className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() =>
                onRequestConfirm({ id: c.id, action: "cancel" })
              }
              className="rounded-full px-3 py-1 text-sm font-medium text-foreground/60 hover:bg-foreground/5"
            >
              Cancel this one
            </button>
          ))}

        {isConfirmingDelete ? (
          <span className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-foreground/80">Delete permanently?</span>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isPending}
              className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={onDismissConfirm}
              className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onRequestConfirm({ id: c.id, action: "delete" })}
            className="ml-auto rounded-full border border-dahlia/40 px-3 py-1 text-sm font-medium text-dahlia hover:bg-dahlia/10 dark:border-ember/40 dark:text-ember"
          >
            Delete
          </button>
        )}
      </div>
    </Panel>
  );
}
