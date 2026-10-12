"use client";

import { useOptimistic, useState, useTransition } from "react";
import Panel from "@/components/Panel";
import {
  setPartyTable,
  setSeatingPublished,
  updateSeatsPerTable,
} from "@/app/admin/(dashboard)/seating/actions";
import { MAX_SEATS_PER_TABLE, MIN_SEATS_PER_TABLE } from "@/lib/seating";

export interface SeatingParty {
  id: string;
  label: string;
  tableNumber: number | null;
  attendingNames: string[];
}

const selectClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-sm text-foreground dark:border-cream/20 dark:bg-night";

const seatOptions = Array.from(
  { length: MAX_SEATS_PER_TABLE - MIN_SEATS_PER_TABLE + 1 },
  (_, i) => MIN_SEATS_PER_TABLE + i
);

function headcount(parties: SeatingParty[]) {
  return parties.reduce((sum, p) => sum + p.attendingNames.length, 0);
}

function guestLabel(count: number) {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

function partyLabel(count: number) {
  return `${count} confirmed ${count === 1 ? "party" : "parties"}`;
}

export default function SeatingManager({
  parties,
  tableCount,
  seatsPerTable,
  published,
}: {
  parties: SeatingParty[];
  tableCount: number;
  seatsPerTable: number;
  published: boolean;
}) {
  // "Optimistic" state: the screen updates the moment a dropdown changes,
  // then the save happens in the background. If the save fails, React
  // automatically snaps back to the last saved value.
  const [optimisticParties, moveParty] = useOptimistic(
    parties,
    (current, change: { partyId: string; tableNumber: number | null }) =>
      current.map((party) =>
        party.id === change.partyId
          ? { ...party, tableNumber: change.tableNumber }
          : party
      )
  );
  const [optimisticSeats, setOptimisticSeats] = useOptimistic(seatsPerTable);
  const [optimisticPublished, setOptimisticPublished] =
    useOptimistic(published);

  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const tableNumbers = Array.from({ length: tableCount }, (_, i) => i + 1);

  // A party pointing at a table that no longer exists (e.g. the table
  // count was lowered) is treated as unassigned so it never goes missing.
  const isSeated = (party: SeatingParty) =>
    party.tableNumber !== null &&
    party.tableNumber >= 1 &&
    party.tableNumber <= tableCount;

  const unassigned = optimisticParties.filter((party) => !isSeated(party));
  const totalGuests = headcount(optimisticParties);
  const seatedGuests = totalGuests - headcount(unassigned);

  function handleTableChange(partyId: string, value: string) {
    const tableNumber = value === "" ? null : Number(value);
    setError(null);
    startTransition(async () => {
      moveParty({ partyId, tableNumber });
      const result = await setPartyTable(partyId, tableNumber);
      if (result.error) setError(result.error);
    });
  }

  function handleSeatsChange(value: string) {
    const seats = Number(value);
    setError(null);
    startTransition(async () => {
      setOptimisticSeats(seats);
      const result = await updateSeatsPerTable(seats);
      if (result.error) setError(result.error);
    });
  }

  function handlePublishedToggle() {
    const next = !optimisticPublished;
    setError(null);
    startTransition(async () => {
      setOptimisticPublished(next);
      const result = await setSeatingPublished(next);
      if (result.error) setError(result.error);
    });
  }

  function renderTablePicker(party: SeatingParty) {
    const id = `table-for-${party.id}`;
    return (
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Table for {party.label}
        </label>
        <select
          id={id}
          value={isSeated(party) ? String(party.tableNumber) : ""}
          onChange={(e) => handleTableChange(party.id, e.target.value)}
          className={selectClasses}
        >
          <option value="">Unassigned</option>
          {tableNumbers.map((n) => (
            <option key={n} value={n}>
              Table {n}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderPartyRow(party: SeatingParty) {
    const staleTable =
      party.tableNumber !== null && !isSeated(party) ? party.tableNumber : null;

    return (
      <div
        key={party.id}
        className="flex flex-col gap-2 border-t border-dahlia/10 pt-3 first:border-t-0 first:pt-0 dark:border-cream/10"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground/90">
              {party.label}
            </span>
            <span className="text-xs text-foreground/70">
              {party.attendingNames.join(", ")}
            </span>
            {staleTable !== null && (
              <span className="text-xs italic text-foreground/60">
                Was at Table {staleTable}, which no longer exists.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-medium text-night">
              {guestLabel(party.attendingNames.length)}
            </span>
            {renderTablePicker(party)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Publish switch. role="switch" + aria-checked tells screen
          readers this is an on/off control, not an ordinary button. */}
      <Panel className="flex flex-col items-center gap-3 p-5 text-center sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={optimisticPublished}
              aria-labelledby="publish-seating-label"
              onClick={handlePublishedToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                optimisticPublished ? "bg-accent" : "bg-foreground/25"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 rounded-full bg-cream shadow transition-transform ${
                  optimisticPublished ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              id="publish-seating-label"
              className="text-sm font-medium text-foreground/90"
            >
              Publish seating chart
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              unassigned.length === 0
                ? "bg-pine text-cream"
                : "bg-gold text-night"
            }`}
          >
            {unassigned.length === 0
              ? "All confirmed parties seated"
              : `${partyLabel(unassigned.length)} unassigned`}
          </span>
        </div>
        <p className="text-xs text-foreground/70">
          {optimisticPublished
            ? "Guests can look up their table, and “Seating” shows in the site menu."
            : "Hidden — guests see “Seating will be posted soon” and there’s no menu link."}
        </p>
      </Panel>

      <Panel className="flex flex-col items-center gap-3 p-5 text-center sm:p-6">
        <p className="text-sm font-medium text-foreground/90">
          {seatedGuests} of {guestLabel(totalGuests)} seated &middot;{" "}
          {tableCount} {tableCount === 1 ? "table" : "tables"}
        </p>
        <div className="flex items-center gap-2">
          <label
            htmlFor="seats-per-table"
            className="text-sm text-foreground/90"
          >
            Seats per table
          </label>
          <select
            id="seats-per-table"
            value={optimisticSeats}
            onChange={(e) => handleSeatsChange(e.target.value)}
            className={selectClasses}
          >
            {seatOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {error && (
        <Panel className="p-4">
          <p
            role="alert"
            className="text-sm font-medium text-dahlia dark:text-ember"
          >
            {error}
          </p>
        </Panel>
      )}

      {tableCount === 0 && (
        <Panel className="p-4 text-center">
          <p className="text-sm text-foreground/90">
            No tables are set up yet — the <code>seating_table_count</code>{" "}
            setting is missing or zero.
          </p>
        </Panel>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-xl text-accent">
          Unassigned ({unassigned.length})
        </h3>
        {unassigned.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            {optimisticParties.length === 0
              ? "No confirmed parties yet — they'll appear here once guests RSVP yes."
              : "Everyone has a seat!"}
          </p>
        ) : (
          <Panel className="flex flex-col gap-3 p-5 sm:p-6">
            {unassigned.map((party) => renderPartyRow(party))}
          </Panel>
        )}
      </section>

      {tableNumbers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-xl text-accent">Tables</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {tableNumbers.map((tableNumber) => {
              const atTable = optimisticParties.filter(
                (party) => isSeated(party) && party.tableNumber === tableNumber
              );
              const seated = headcount(atTable);
              const overBy = seated - optimisticSeats;

              return (
                <Panel
                  key={tableNumber}
                  className="flex flex-col gap-3 p-5 sm:p-6"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-heading text-lg tracking-wide text-accent">
                      Table {tableNumber}
                    </h4>
                    <span className="text-sm text-foreground/70">
                      {seated} of {optimisticSeats} seats
                    </span>
                  </div>

                  {overBy > 0 && (
                    <p
                      role="status"
                      className="rounded-lg border border-ember bg-ember/15 px-3 py-2 text-sm font-medium text-foreground dark:text-ember"
                    >
                      Over by {overBy} — this table has more guests than seats.
                    </p>
                  )}

                  {atTable.length === 0 ? (
                    <p className="text-sm italic text-foreground/60">
                      No one here yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {atTable.map((party) => renderPartyRow(party))}
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
