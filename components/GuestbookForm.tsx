"use client";

import { useState, type FormEvent } from "react";
import Panel from "@/components/Panel";
import { supabase } from "@/lib/supabase";

export default function GuestbookForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const authorName = name.trim();
    const trimmedMessage = message.trim();

    if (!authorName || !trimmedMessage) {
      setError("Please fill in both your name and a note.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("guestbook_entries").insert({
      author_name: authorName,
      message: trimmedMessage,
      approved: false,
    });

    setIsSubmitting(false);

    if (insertError) {
      setError("Something went wrong saving your note. Please try again.");
      return;
    }

    setSucceeded(true);
    setName("");
    setMessage("");
  }

  if (succeeded) {
    return (
      <Panel className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
          Thank you! Your note will appear once we&apos;ve had a chance to
          read it.
        </p>
        <button
          type="button"
          onClick={() => setSucceeded(false)}
          className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Leave another note
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-4 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">Your note</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            required
            className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night"
          />
        </label>

        {error && (
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
        >
          {isSubmitting ? "Sending…" : "Sign the Guestbook"}
        </button>
      </form>
    </Panel>
  );
}
