"use client";

import { useState, useTransition } from "react";
import Panel from "@/components/Panel";
import ImagePicker from "@/components/admin/ImagePicker";
import { formatShortDate } from "@/lib/format";
import {
  addHotel,
  deleteHotel,
  moveHotel,
  updateHotel,
} from "@/app/admin/(dashboard)/hotels/actions";

export interface AdminHotel {
  id: string;
  name: string;
  photo_url: string | null;
  description: string;
  distance: string;
  price_range: string;
  booking_url: string;
  room_block_code: string | null;
  book_by_date: string | null;
  sort_order: number;
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

function HotelFields({ hotel }: { hotel?: AdminHotel }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Hotel name</span>
        <input
          name="name"
          defaultValue={hotel?.name}
          required
          className={inputClasses}
        />
      </label>
      <ImagePicker name="photo_url" defaultValue={hotel?.photo_url} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Description</span>
        <textarea
          name="description"
          defaultValue={hotel?.description}
          required
          rows={3}
          className={inputClasses}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Distance from venue
          </span>
          <input
            name="distance"
            defaultValue={hotel?.distance}
            required
            className={inputClasses}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">Price range</span>
          <input
            name="price_range"
            defaultValue={hotel?.price_range}
            required
            className={inputClasses}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Booking link</span>
        <input
          name="booking_url"
          type="url"
          defaultValue={hotel?.booking_url}
          required
          className={inputClasses}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Room block code
            <span className="ml-1 font-normal text-foreground/60">
              (optional)
            </span>
          </span>
          <input
            name="room_block_code"
            defaultValue={hotel?.room_block_code ?? ""}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Book by date
            <span className="ml-1 font-normal text-foreground/60">
              (optional)
            </span>
          </span>
          <input
            type="date"
            name="book_by_date"
            defaultValue={hotel?.book_by_date ?? ""}
            className={inputClasses}
          />
        </label>
      </div>
    </>
  );
}

export default function HotelEditor({ hotels }: { hotels: AdminHotel[] }) {
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
      const result = await addHotel(formData);
      if (result.error) setError(result.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateHotel(id, formData);
      if (result.error) setError(result.error);
      else setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteHotel(id);
      if (result.error) setError(result.error);
      setConfirmingDeleteId(null);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const result = await moveHotel(id, direction);
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

      {hotels.map((hotel, i) => {
        const isEditing = editingId === hotel.id;
        const isConfirmingDelete = confirmingDeleteId === hotel.id;

        return (
          <Panel key={hotel.id} className="p-5 sm:p-6">
            {isEditing ? (
              <form
                action={(formData) => handleUpdate(hotel.id, formData)}
                className="flex flex-col gap-3"
              >
                <HotelFields hotel={hotel} />
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
                  {hotel.name}
                </h3>
                <p className="text-sm text-foreground/90">
                  {hotel.description}
                </p>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {hotel.distance} &middot; {hotel.price_range}
                </p>
                {hotel.room_block_code && hotel.book_by_date && (
                  <p className="w-fit rounded-full bg-pine px-3 py-1 text-xs font-medium text-cream">
                    Code {hotel.room_block_code} &middot; book by{" "}
                    {formatShortDate(hotel.book_by_date)}
                  </p>
                )}
                {!hotel.photo_url && (
                  <p className="text-xs italic text-foreground/50">
                    No photo yet
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(hotel.id, "up")}
                    disabled={isPending || i === 0}
                    aria-label="Move up"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(hotel.id, "down")}
                    disabled={isPending || i === hotels.length - 1}
                    aria-label="Move down"
                    className="rounded-full border border-dahlia/20 px-3 py-1 text-sm text-accent disabled:opacity-30 dark:border-cream/20"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(hotel.id)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Edit
                  </button>

                  {isConfirmingDelete ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-foreground/80">Delete this?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(hotel.id)}
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
                      onClick={() => setConfirmingDeleteId(hotel.id)}
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
            <HotelFields />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
              >
                Add Hotel
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
            + Add a new hotel
          </button>
        )}
      </Panel>
    </div>
  );
}
