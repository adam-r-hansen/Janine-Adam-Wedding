"use client";

import { useState, useTransition } from "react";
import { submitGuestPassword } from "@/app/enter-password/actions";

export default function EnterPasswordForm({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitGuestPassword(formData);
      // A result only comes back when the password was wrong — success
      // redirects away before this promise resolves.
      if (result?.error) {
        setError(result.error);
        setShakeKey((key) => key + 1);
      }
    });
  }

  return (
    <form
      key={shakeKey}
      action={handleSubmit}
      className={`mt-8 flex flex-col gap-4 text-left ${
        shakeKey > 0 ? "shake" : ""
      }`}
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
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
        disabled={isPending}
        className="mt-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-night"
      >
        {isPending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
