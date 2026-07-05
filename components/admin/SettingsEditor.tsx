"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import { updateSettings } from "@/app/admin/(dashboard)/settings/actions";

export interface AdminSettings {
  welcome_message: string;
  venue_line: string;
  travel_intro: string;
  wedding_datetime: string;
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

export default function SettingsEditor({
  settings,
}: {
  settings: AdminSettings;
}) {
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setError(null);
    setSavedAt(null);
    startTransition(async () => {
      const result = await updateSettings(formData);
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <Panel className="p-5 sm:p-6">
      {error && (
        <p className="mb-4 text-sm font-medium text-dahlia dark:text-ember">
          {error}
        </p>
      )}
      {savedAt && !error && (
        <p className="mb-4 text-sm font-medium text-pine">
          Saved! The public pages now show these changes.
        </p>
      )}

      <form action={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Welcome message
            <span className="ml-1 font-normal text-foreground/60">
              (shown on the Home page)
            </span>
          </span>
          <textarea
            name="welcome_message"
            defaultValue={settings.welcome_message}
            required
            rows={3}
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Wedding date &amp; time
            <span className="ml-1 font-normal text-foreground/60">
              (Pacific time — drives the Home page countdown)
            </span>
          </span>
          <input
            type="datetime-local"
            name="wedding_datetime"
            defaultValue={settings.wedding_datetime.slice(0, 16)}
            required
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Venue line
            <span className="ml-1 font-normal text-foreground/60">
              (shown on the Home page, e.g. &quot;City, State&quot;)
            </span>
          </span>
          <input
            name="venue_line"
            defaultValue={settings.venue_line}
            required
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Travel intro
            <span className="ml-1 font-normal text-foreground/60">
              (shown at the top of the Travel page)
            </span>
          </span>
          <textarea
            name="travel_intro"
            defaultValue={settings.travel_intro}
            required
            rows={4}
            className={inputClasses}
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </Panel>
  );
}
