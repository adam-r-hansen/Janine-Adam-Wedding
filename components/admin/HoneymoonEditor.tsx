"use client";

import {
  useEffect,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Panel from "@/components/Panel";
import ImagePicker from "@/components/admin/ImagePicker";
import { formatCurrencyFromCents } from "@/lib/format";
import {
  addItem,
  deleteItem,
  reorderItems,
  toggleItemActive,
  updateItem,
} from "@/app/admin/(dashboard)/honeymoon/actions";

export interface AdminHoneymoonItem {
  id: string;
  title: string;
  blurb: string | null;
  photo_url: string | null;
  suggested_cents: number;
  goal_cents: number | null;
  is_active: boolean;
  sort_order: number | null;
}

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

// The suggested amount is stored as an integer number of cents but edited
// as dollars. Split it back into dollars and cents with integer math so
// the value shown in the field can't pick up a rounding error.
function centsToDollarsInput(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return remainder === 0
    ? String(dollars)
    : `${dollars}.${String(remainder).padStart(2, "0")}`;
}

// Tracks the OS-level "reduce motion" setting so drag reordering can skip
// its drop animation for admins who have it on.
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);
    const handleChange = () => setPrefersReducedMotion(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

function ItemFields({ item }: { item?: AdminHoneymoonItem }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">Title</span>
        <input
          name="title"
          defaultValue={item?.title}
          required
          maxLength={120}
          className={inputClasses}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Description
          <span className="ml-1 font-normal text-foreground/60">
            (optional &mdash; a sentence or two in your own voice)
          </span>
        </span>
        <textarea
          name="blurb"
          defaultValue={item?.blurb ?? ""}
          rows={3}
          maxLength={500}
          className={inputClasses}
        />
      </label>
      <ImagePicker name="photo_url" defaultValue={item?.photo_url} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground/80">
          Suggested amount
          <span className="ml-1 font-normal text-foreground/60">
            (in dollars, e.g. 210 or 210.50)
          </span>
        </span>
        <input
          name="suggested_dollars"
          inputMode="decimal"
          defaultValue={
            item ? centsToDollarsInput(item.suggested_cents) : ""
          }
          required
          className={inputClasses}
        />
      </label>
    </>
  );
}

export default function HoneymoonEditor({
  items,
}: {
  items: AdminHoneymoonItem[];
}) {
  const [order, setOrder] = useState(items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startReorderTransition] = useTransition();

  // Re-seed from the server's order whenever the list itself changes (an
  // add, delete, or hide/show completing) — not on our own drag reorders,
  // which already updated `order` optimistically.
  useEffect(() => {
    setOrder(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addItem(formData);
      if (result.error) setError(result.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateItem(id, formData);
      if (result.error) setError(result.error);
      else setEditingId(null);
    });
  }

  function handleToggleActive(id: string, isActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleItemActive(id, isActive);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteItem(id);
      if (result.error) setError(result.error);
      setConfirmingDeleteId(null);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((item) => item.id === active.id);
    const newIndex = order.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = order;
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);

    startReorderTransition(async () => {
      const result = await reorderItems(newOrder.map((item) => item.id));
      if (result.error) {
        setOrder(previousOrder);
        setError(result.error);
      }
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

      <Panel className="p-5 sm:p-6">
        {isAdding ? (
          <form action={handleAdd} className="flex flex-col gap-3">
            <h3 className="font-heading text-lg text-accent">
              Add an experience
            </h3>
            <ItemFields />
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
            + Add an experience
          </button>
        )}
      </Panel>

      {order.length === 0 ? (
        <p className="text-center text-sm italic text-foreground/60">
          No experiences yet &mdash; add your first one above.
        </p>
      ) : (
        <>
          <p className="text-xs text-foreground/60">
            Drag an experience by its handle to change the order. On a phone,
            press and hold the handle for a moment first.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={order.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {order.map((item) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    isPending={isPending}
                    isEditing={editingId === item.id}
                    isConfirmingDelete={confirmingDeleteId === item.id}
                    onEdit={() => setEditingId(item.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onUpdate={(formData) => handleUpdate(item.id, formData)}
                    onToggleActive={() =>
                      handleToggleActive(item.id, !item.is_active)
                    }
                    onDeleteClick={() => setConfirmingDeleteId(item.id)}
                    onCancelDelete={() => setConfirmingDeleteId(null)}
                    onConfirmDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}

function SortableItemRow({
  item,
  isPending,
  isEditing,
  isConfirmingDelete,
  onEdit,
  onCancelEdit,
  onUpdate,
  onToggleActive,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
}: {
  item: AdminHoneymoonItem;
  isPending: boolean;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (formData: FormData) => void;
  onToggleActive: () => void;
  onDeleteClick: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    transition: prefersReducedMotion ? null : undefined,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-10" : ""}>
      <Panel
        className={`p-5 sm:p-6 ${
          isDragging
            ? "opacity-70"
            : item.is_active
              ? ""
              : "opacity-60"
        }`}
      >
        {isEditing ? (
          <form
            action={onUpdate}
            className="flex flex-col gap-3"
          >
            <ItemFields item={item} />
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
                onClick={onCancelEdit}
                className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
                className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-full border border-dahlia/20 text-lg text-accent dark:border-cream/20"
              >
                ⠿
              </button>

              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dahlia/10 text-center text-[10px] italic text-foreground/50 dark:border-cream/10">
                  No photo
                </div>
              )}

              <div className="flex min-w-0 flex-col gap-1">
                {!item.is_active && (
                  <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-night">
                    Hidden from guests
                  </span>
                )}
                <h3 className="font-heading text-lg text-accent">
                  {item.title}
                </h3>
                {item.blurb && (
                  <p className="text-sm text-foreground/90">{item.blurb}</p>
                )}
                <p className="text-sm font-medium text-foreground/80">
                  Suggested: {formatCurrencyFromCents(item.suggested_cents)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item.is_active ? (
                <button
                  type="button"
                  onClick={onToggleActive}
                  disabled={isPending}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                >
                  Hide
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onToggleActive}
                  disabled={isPending}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                >
                  Show
                </button>
              )}

              <button
                type="button"
                onClick={onEdit}
                className="rounded-full px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
              >
                Edit
              </button>

              {isConfirmingDelete ? (
                <div className="flex flex-col gap-2 rounded-lg border border-dahlia/20 p-3 text-sm dark:border-cream/20">
                  <p className="text-foreground/80">
                    Hiding is usually the better choice &mdash; a hidden
                    experience just disappears from the guest page and you can
                    bring it back any time. Deleting is permanent. It does
                    not remove any contributions already recorded.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onConfirmDelete}
                      disabled={isPending}
                      className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={onCancelDelete}
                      className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onDeleteClick}
                  className="ml-auto rounded-full border border-dahlia/40 px-3 py-1 text-sm font-medium text-dahlia hover:bg-dahlia/10 dark:border-ember/40 dark:text-ember"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
