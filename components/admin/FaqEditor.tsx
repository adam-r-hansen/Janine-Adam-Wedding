"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import {
  addFaq,
  deleteFaq,
  moveFaq,
  updateFaq,
} from "@/app/admin/(dashboard)/faqs/actions";

export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent dark:border-cream/20 dark:bg-night";

export default function FaqEditor({ faqs }: { faqs: AdminFaq[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addFaq(formData);
      if (result.error) setError(result.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateFaq(id, formData);
      if (result.error) setError(result.error);
      else setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteFaq(id);
      if (result.error) setError(result.error);
      setConfirmingDeleteId(null);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const result = await moveFaq(id, direction);
      if (result.error) setError(result.error);
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

      {faqs.map((faq, i) => {
        const isEditing = editingId === faq.id;
        const isConfirmingDelete = confirmingDeleteId === faq.id;

        return (
          <Panel key={faq.id} className="p-5 sm:p-6">
            {isEditing ? (
              <form
                action={(formData) => handleUpdate(faq.id, formData)}
                className="flex flex-col gap-3"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground/80">
                    Question
                  </span>
                  <input
                    name="question"
                    defaultValue={faq.question}
                    required
                    className={inputClasses}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground/80">
                    Answer
                  </span>
                  <textarea
                    name="answer"
                    defaultValue={faq.answer}
                    required
                    rows={3}
                    className={inputClasses}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-lg text-accent">
                  {faq.question}
                </h3>
                <p className="text-sm text-foreground/90">{faq.answer}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(faq.id, "up")}
                    disabled={isPending || i === 0}
                    aria-label="Move up"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(faq.id, "down")}
                    disabled={isPending || i === faqs.length - 1}
                    aria-label="Move down"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(faq.id)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Edit
                  </button>

                  {isConfirmingDelete ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-foreground/80">Delete this?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(faq.id)}
                        disabled={isPending}
                        className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(faq.id)}
                      className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </Panel>
        );
      })}

      <Panel className="p-5 sm:p-6">
        {isAdding ? (
          <form action={handleAdd} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Question</span>
              <input name="question" required className={inputClasses} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Answer</span>
              <textarea
                name="answer"
                required
                rows={3}
                className={inputClasses}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
              >
                Add FAQ
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream dark:text-night"
          >
            + Add a new FAQ
          </button>
        )}
      </Panel>
    </div>
  );
}
