"use client";

import { useState, useTransition, type FormEvent } from "react";
import Panel from "@/components/Panel";
import {
  getPartyForResponse,
  searchParties,
  submitRsvp,
  type PartyForResponse,
  type PartySearchResult,
} from "@/app/rsvp/actions";

type Stage =
  | { name: "search" }
  | { name: "form"; party: PartyForResponse }
  | { name: "confirmation"; anyAttending: boolean };

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

export default function RsvpFlow() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PartySearchResult[] | null>(null);
  const [stage, setStage] = useState<Stage>({ name: "search" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await searchParties(query);
      setResults(result.matches);
    });
  }

  function handleSelectParty(partyId: string) {
    setError(null);
    startTransition(async () => {
      const result = await getPartyForResponse(partyId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setStage({ name: "form", party: result.party });
    });
  }

  function handleBack() {
    setStage({ name: "search" });
    setError(null);
  }

  if (stage.name === "confirmation") {
    return (
      <RsvpConfirmation
        anyAttending={stage.anyAttending}
        onRespondAgain={handleBack}
      />
    );
  }

  if (stage.name === "form") {
    return (
      <RsvpForm
        party={stage.party}
        onBack={handleBack}
        onSubmitted={(anyAttending) =>
          setStage({ name: "confirmation", anyAttending })
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-6 sm:p-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground/80">
              Find your invitation
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your name…"
              className={inputClasses}
            />
          </label>
          <button
            type="submit"
            disabled={isPending || query.trim().length < 3}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
          >
            {isPending ? "Searching…" : "Search"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-foreground/70">
          Can&apos;t find your name? Text us and we&apos;ll sort it out!
        </p>
      </Panel>

      {error && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        </Panel>
      )}

      {results !== null && (
        <div className="flex flex-col gap-3">
          {results.length === 0 ? (
            <Panel className="p-6 text-center">
              <p className="text-sm text-foreground/90">
                We couldn&apos;t find anyone by that name. Try a different
                spelling, or text us!
              </p>
            </Panel>
          ) : (
            results.map((party) => (
              <Panel
                key={party.partyId}
                className="overflow-hidden p-0"
              >
                <button
                  type="button"
                  onClick={() => handleSelectParty(party.partyId)}
                  disabled={isPending}
                  className="w-full p-5 text-left transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <p className="font-heading text-lg text-accent">
                    {party.label}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {party.firstNames.join(", ")}
                  </p>
                </button>
              </Panel>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RsvpForm({
  party,
  onBack,
  onSubmitted,
}: {
  party: PartyForResponse;
  onBack: () => void;
  onSubmitted: (anyAttending: boolean) => void;
}) {
  const [attending, setAttending] = useState<Record<string, boolean | null>>(
    () => Object.fromEntries(party.guests.map((g) => [g.id, g.attending]))
  );
  const [dietaryNotes, setDietaryNotes] = useState(party.dietaryNotes);
  const [message, setMessage] = useState(party.message);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = party.guests.every(
    (g) => attending[g.id] === true || attending[g.id] === false
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allAnswered) {
      setError("Please answer for everyone in your party.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitRsvp({
        partyId: party.partyId,
        responses: party.guests.map((g) => ({
          guestId: g.id,
          attending: attending[g.id] as boolean,
        })),
        dietaryNotes,
        message,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onSubmitted(result.anyAttending ?? false);
      }
    });
  }

  return (
    <Panel className="p-6 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-accent hover:underline"
      >
        ← Back to search
      </button>

      <h2 className="font-heading text-2xl text-accent">{party.label}</h2>

      {party.alreadyResponded && (
        <p className="mt-2 text-sm italic text-foreground/70">
          Looks like you&apos;ve already responded — feel free to update.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {party.guests.map((guest) => (
            <div
              key={guest.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span className="font-medium text-foreground/90">
                {guest.firstName}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAttending((prev) => ({ ...prev, [guest.id]: true }))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    attending[guest.id] === true
                      ? "bg-accent text-cream dark:text-night"
                      : "border border-dahlia/20 text-accent hover:bg-accent/10 dark:border-cream/20"
                  }`}
                >
                  Attending
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAttending((prev) => ({ ...prev, [guest.id]: false }))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    attending[guest.id] === false
                      ? "bg-dahlia text-cream"
                      : "border border-dahlia/20 text-accent hover:bg-accent/10 dark:border-cream/20"
                  }`}
                >
                  Can&apos;t make it
                </button>
              </div>
            </div>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Dietary notes{" "}
            <span className="font-normal text-foreground/60">(optional)</span>
          </span>
          <textarea
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            rows={2}
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Message to the couple{" "}
            <span className="font-normal text-foreground/60">(optional)</span>
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className={inputClasses}
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
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
        >
          {isPending ? "Sending…" : "Send RSVP"}
        </button>
      </form>
    </Panel>
  );
}

function RsvpConfirmation({
  anyAttending,
  onRespondAgain,
}: {
  anyAttending: boolean;
  onRespondAgain: () => void;
}) {
  return (
    <Panel className="flex flex-col items-center gap-3 p-8 text-center">
      {anyAttending ? (
        <>
          <p className="font-heading text-2xl text-accent">
            We can&apos;t wait!
          </p>
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
            Thank you for letting us know. We&apos;ll see you in the
            mountains this October!
          </p>
        </>
      ) : (
        <>
          <p className="font-heading text-2xl text-accent">
            We&apos;ll miss you
          </p>
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
            Thank you for letting us know — you&apos;ll be in our thoughts on
            the big day.
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onRespondAgain}
        className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
      >
        Need to change something? Search again
      </button>
    </Panel>
  );
}
