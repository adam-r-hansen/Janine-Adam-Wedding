"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import {
  addGuest,
  addParty,
  deleteGuest,
  deleteParty,
  moveGuest,
  updateGuest,
  updateParty,
} from "@/app/admin/(dashboard)/guest-list/actions";

export interface AdminGuest {
  id: string;
  party_id: string;
  full_name: string;
}

export interface AdminParty {
  id: string;
  label: string;
  guests: AdminGuest[];
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

export default function GuestListManager({
  parties,
}: {
  parties: AdminParty[];
}) {
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [confirmingDeletePartyId, setConfirmingDeletePartyId] = useState<
    string | null
  >(null);
  const [isAddingParty, setIsAddingParty] = useState(false);

  const [addingGuestToPartyId, setAddingGuestToPartyId] = useState<
    string | null
  >(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [confirmingDeleteGuestId, setConfirmingDeleteGuestId] = useState<
    string | null
  >(null);
  const [movingGuestId, setMovingGuestId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalGuests = parties.reduce((sum, p) => sum + p.guests.length, 0);

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  function handleAddParty(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addParty(formData);
      if (result.error) setError(result.error);
      else setIsAddingParty(false);
    });
  }

  function handleUpdateParty(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateParty(id, formData);
      if (result.error) setError(result.error);
      else setEditingPartyId(null);
    });
  }

  function handleDeleteParty(id: string) {
    run(() => deleteParty(id));
    setConfirmingDeletePartyId(null);
  }

  function handleAddGuest(partyId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addGuest(partyId, formData);
      if (result.error) setError(result.error);
      else setAddingGuestToPartyId(null);
    });
  }

  function handleUpdateGuest(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateGuest(id, formData);
      if (result.error) setError(result.error);
      else setEditingGuestId(null);
    });
  }

  function handleDeleteGuest(id: string) {
    run(() => deleteGuest(id));
    setConfirmingDeleteGuestId(null);
  }

  function handleMoveGuest(id: string, newPartyId: string) {
    if (!newPartyId) {
      setMovingGuestId(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await moveGuest(id, newPartyId);
      if (result.error) setError(result.error);
      setMovingGuestId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 text-center">
        <p className="text-sm font-medium text-foreground/90">
          {parties.length} {parties.length === 1 ? "party" : "parties"} &middot;{" "}
          {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
        </p>
      </Panel>

      {error && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        </Panel>
      )}

      {parties.map((party) => {
        const isEditingParty = editingPartyId === party.id;
        const isConfirmingDeleteParty = confirmingDeletePartyId === party.id;
        const isAddingGuest = addingGuestToPartyId === party.id;

        return (
          <Panel key={party.id} className="flex flex-col gap-3 p-5 sm:p-6">
            {isEditingParty ? (
              <form
                action={(formData) => handleUpdateParty(party.id, formData)}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  name="label"
                  defaultValue={party.label}
                  required
                  className={`flex-1 ${inputClasses}`}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPartyId(null)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg text-accent">
                  {party.label}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPartyId(party.id)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Rename
                  </button>
                  {isConfirmingDeleteParty ? (
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-foreground/80">
                        Delete {party.label} and its {party.guests.length}{" "}
                        guest{party.guests.length === 1 ? "" : "s"}?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteParty(party.id)}
                        disabled={isPending}
                        className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeletePartyId(null)}
                        className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDeletePartyId(party.id)}
                      className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {party.guests.length === 0 && (
                <p className="text-sm italic text-foreground/60">
                  No guests yet.
                </p>
              )}
              {party.guests.map((guest) => {
                const isEditingGuest = editingGuestId === guest.id;
                const isConfirmingDeleteGuest =
                  confirmingDeleteGuestId === guest.id;
                const isMovingGuest = movingGuestId === guest.id;

                return (
                  <div
                    key={guest.id}
                    className="flex flex-wrap items-center gap-2 border-t border-dahlia/10 pt-2 first:border-t-0 first:pt-0 dark:border-cream/10"
                  >
                    {isEditingGuest ? (
                      <form
                        action={(formData) =>
                          handleUpdateGuest(guest.id, formData)
                        }
                        className="flex flex-1 flex-wrap items-center gap-2"
                      >
                        <input
                          name="full_name"
                          defaultValue={guest.full_name}
                          required
                          className={`flex-1 ${inputClasses}`}
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGuestId(null)}
                          className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-foreground/90">
                          {guest.full_name}
                        </span>

                        {isMovingGuest ? (
                          <select
                            autoFocus
                            defaultValue=""
                            onChange={(e) =>
                              handleMoveGuest(guest.id, e.target.value)
                            }
                            onBlur={() => setMovingGuestId(null)}
                            disabled={isPending}
                            className={inputClasses}
                          >
                            <option value="" disabled>
                              Move to…
                            </option>
                            {parties
                              .filter((p) => p.id !== party.id)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.label}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMovingGuestId(guest.id)}
                            disabled={parties.length < 2}
                            className="rounded-full px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-30"
                          >
                            Move
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingGuestId(guest.id)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                        >
                          Rename
                        </button>

                        {isConfirmingDeleteGuest ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() => handleDeleteGuest(guest.id)}
                              disabled={isPending}
                              className="rounded-full bg-dahlia px-2 py-1 font-medium text-cream disabled:opacity-60"
                            >
                              Yes, delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteGuestId(null)}
                              className="rounded-full px-2 py-1 font-medium text-accent hover:bg-accent/10"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmingDeleteGuestId(guest.id)
                            }
                            className="rounded-full px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {isAddingGuest ? (
              <form
                action={(formData) => handleAddGuest(party.id, formData)}
                className="flex flex-wrap items-center gap-2 border-t border-dahlia/10 pt-3 dark:border-cream/10"
              >
                <input
                  name="full_name"
                  placeholder="Guest name"
                  required
                  autoFocus
                  className={`flex-1 ${inputClasses}`}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAddingGuestToPartyId(null)}
                  className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingGuestToPartyId(party.id)}
                className="w-fit rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
              >
                + Add a guest
              </button>
            )}
          </Panel>
        );
      })}

      <Panel className="p-5 sm:p-6">
        {isAddingParty ? (
          <form action={handleAddParty} className="flex flex-wrap gap-2">
            <input
              name="label"
              placeholder="Party name (e.g. The Smith Family)"
              required
              autoFocus
              className={`flex-1 ${inputClasses}`}
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
            >
              Add Party
            </button>
            <button
              type="button"
              onClick={() => setIsAddingParty(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingParty(true)}
            className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream dark:text-night"
          >
            + Add a new party
          </button>
        )}
      </Panel>
    </div>
  );
}
