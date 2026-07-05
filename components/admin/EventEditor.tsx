"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import { formatEventDate, formatTime } from "@/lib/format";
import {
  addEvent,
  deleteEvent,
  moveEvent,
  updateEvent,
} from "@/app/admin/(dashboard)/events/actions";

export interface AdminEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  address: string;
  description: string;
  dress_code: string;
  sort_order: number;
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

function EventFields({ event }: { event?: AdminEvent }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Event name</span>
        <input
          name="title"
          defaultValue={event?.title}
          required
          className={inputClasses}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={event?.date}
            required
            className={inputClasses}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">Start time</span>
          <input
            type="time"
            name="start_time"
            defaultValue={event?.start_time.slice(0, 5)}
            required
            className={inputClasses}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">End time</span>
          <input
            type="time"
            name="end_time"
            defaultValue={event?.end_time.slice(0, 5)}
            required
            className={inputClasses}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Venue name</span>
        <input
          name="venue_name"
          defaultValue={event?.venue_name}
          required
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Address</span>
        <input
          name="address"
          defaultValue={event?.address}
          required
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Description</span>
        <textarea
          name="description"
          defaultValue={event?.description}
          required
          rows={3}
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Dress code</span>
        <input
          name="dress_code"
          defaultValue={event?.dress_code}
          required
          className={inputClasses}
        />
      </label>
    </>
  );
}

export default function EventEditor({ events }: { events: AdminEvent[] }) {
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
      const result = await addEvent(formData);
      if (result.error) setError(result.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateEvent(id, formData);
      if (result.error) setError(result.error);
      else setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(id);
      if (result.error) setError(result.error);
      setConfirmingDeleteId(null);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const result = await moveEvent(id, direction);
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

      {events.map((event, i) => {
        const isEditing = editingId === event.id;
        const isConfirmingDelete = confirmingDeleteId === event.id;

        return (
          <Panel key={event.id} className="p-5 sm:p-6">
            {isEditing ? (
              <form
                action={(formData) => handleUpdate(event.id, formData)}
                className="flex flex-col gap-3"
              >
                <EventFields event={event} />
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
                  {event.title}
                </h3>
                <p className="text-xs font-medium uppercase tracking-widest text-foreground/70">
                  {formatEventDate(event.date)} &middot;{" "}
                  {formatTime(event.start_time)}&ndash;
                  {formatTime(event.end_time)}
                </p>
                <p className="text-sm text-foreground/90">
                  {event.venue_name} — {event.address}
                </p>
                <p className="text-sm text-foreground/90">
                  {event.description}
                </p>
                <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-night">
                  {event.dress_code}
                </span>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(event.id, "up")}
                    disabled={isPending || i === 0}
                    aria-label="Move up"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(event.id, "down")}
                    disabled={isPending || i === events.length - 1}
                    aria-label="Move down"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(event.id)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Edit
                  </button>

                  {isConfirmingDelete ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-foreground/80">Delete this?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
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
                      onClick={() => setConfirmingDeleteId(event.id)}
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
            <EventFields />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
              >
                Add Event
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
            + Add a new event
          </button>
        )}
      </Panel>
    </div>
  );
}
