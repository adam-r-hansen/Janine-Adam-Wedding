"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import {
  addActivity,
  deleteActivity,
  moveActivity,
  updateActivity,
} from "@/app/admin/(dashboard)/things-to-do/actions";

export interface AdminActivity {
  id: string;
  name: string;
  category: "activity" | "food_drink";
  photo_url: string | null;
  blurb: string;
  neighborhood: string;
  link_url: string;
  sort_order: number;
}

const CATEGORY_LABEL: Record<AdminActivity["category"], string> = {
  activity: "Activity",
  food_drink: "Food & Drink",
};

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

function ActivityFields({ activity }: { activity?: AdminActivity }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Name</span>
        <input
          name="name"
          defaultValue={activity?.name}
          required
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Category</span>
        <select
          name="category"
          defaultValue={activity?.category ?? "activity"}
          required
          className={inputClasses}
        >
          <option value="activity">Activity</option>
          <option value="food_drink">Food & Drink</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Photo URL
          <span className="ml-1 font-normal text-foreground/60">
            (optional — real photo upload comes with the Photos milestone)
          </span>
        </span>
        <input
          name="photo_url"
          type="url"
          defaultValue={activity?.photo_url ?? ""}
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Blurb
          <span className="ml-1 font-normal text-foreground/60">
            (your personal take — this is the couple&apos;s voice)
          </span>
        </span>
        <textarea
          name="blurb"
          defaultValue={activity?.blurb}
          required
          rows={3}
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Neighborhood</span>
        <input
          name="neighborhood"
          defaultValue={activity?.neighborhood}
          required
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Link</span>
        <input
          name="link_url"
          type="url"
          defaultValue={activity?.link_url}
          required
          className={inputClasses}
        />
      </label>
    </>
  );
}

export default function ActivityEditor({
  activities,
}: {
  activities: AdminActivity[];
}) {
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
      const result = await addActivity(formData);
      if (result.error) setError(result.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateActivity(id, formData);
      if (result.error) setError(result.error);
      else setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteActivity(id);
      if (result.error) setError(result.error);
      setConfirmingDeleteId(null);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const result = await moveActivity(id, direction);
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

      {activities.map((activity, i) => {
        const isEditing = editingId === activity.id;
        const isConfirmingDelete = confirmingDeleteId === activity.id;

        return (
          <Panel key={activity.id} className="p-5 sm:p-6">
            {isEditing ? (
              <form
                action={(formData) => handleUpdate(activity.id, formData)}
                className="flex flex-col gap-3"
              >
                <ActivityFields activity={activity} />
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
                <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-night">
                  {CATEGORY_LABEL[activity.category]}
                </span>
                <h3 className="font-heading text-lg text-accent">
                  {activity.name}
                </h3>
                <p className="text-sm text-foreground/90">
                  {activity.blurb}
                </p>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {activity.neighborhood}
                </p>
                {!activity.photo_url && (
                  <p className="text-xs italic text-foreground/50">
                    No photo yet
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(activity.id, "up")}
                    disabled={isPending || i === 0}
                    aria-label="Move up"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(activity.id, "down")}
                    disabled={isPending || i === activities.length - 1}
                    aria-label="Move down"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(activity.id)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Edit
                  </button>

                  {isConfirmingDelete ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-foreground/80">Delete this?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(activity.id)}
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
                      onClick={() => setConfirmingDeleteId(activity.id)}
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
            <ActivityFields />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
              >
                Add
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
            + Add a new recommendation
          </button>
        )}
      </Panel>
    </div>
  );
}
