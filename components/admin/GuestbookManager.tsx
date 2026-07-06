"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import {
  approveEntry,
  deleteEntry,
} from "@/app/admin/(dashboard)/guestbook/actions";

export interface AdminGuestbookEntry {
  id: string;
  author_name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

function formatEntryDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function GuestbookManager({
  pending,
  approved,
}: {
  pending: AdminGuestbookEntry[];
  approved: AdminGuestbookEntry[];
}) {
  const [confirming, setConfirming] = useState<{
    id: string;
    action: "reject" | "delete";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await approveEntry(id);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteEntry(id);
      if (result.error) setError(result.error);
      setConfirming(null);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        </Panel>
      )}

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">
          Awaiting Approval ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            Nothing waiting on you right now.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((entry) => {
              const isConfirmingReject =
                confirming?.id === entry.id && confirming.action === "reject";
              return (
                <Panel
                  key={entry.id}
                  className="flex flex-col gap-2 p-5 sm:p-6"
                >
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {entry.message}
                  </p>
                  <p className="text-sm font-medium text-accent">
                    — {entry.author_name}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-foreground/50">
                    {formatEntryDate(entry.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(entry.id)}
                      disabled={isPending}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                    >
                      Approve
                    </button>
                    {isConfirmingReject ? (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-foreground/80">
                          Reject this?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={isPending}
                          className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
                        >
                          Yes, reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirming({ id: entry.id, action: "reject" })
                        }
                        className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">
          Approved ({approved.length})
        </h3>
        {approved.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            None approved yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {approved.map((entry) => {
              const isConfirmingDelete =
                confirming?.id === entry.id && confirming.action === "delete";
              return (
                <Panel
                  key={entry.id}
                  className="flex flex-col gap-2 p-5 sm:p-6"
                >
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {entry.message}
                  </p>
                  <p className="text-sm font-medium text-accent">
                    — {entry.author_name}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-foreground/50">
                    {formatEntryDate(entry.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isConfirmingDelete ? (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-foreground/80">
                          Delete this?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={isPending}
                          className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
                        >
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirming({ id: entry.id, action: "delete" })
                        }
                        className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
