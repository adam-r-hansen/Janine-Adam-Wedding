"use client";

import {
  useEffect,
  useRef,
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Panel from "@/components/Panel";
import { resizeImage, uploadPhoto } from "@/lib/storage";
import { createClient } from "@/lib/supabase-browser";
import {
  addOurPhoto,
  approvePhoto,
  deletePhoto,
  reorderPhotos,
  updatePhotoCaption,
} from "@/app/admin/(dashboard)/photos/actions";

export interface AdminPhoto {
  id: string;
  storage_path: string;
  caption: string | null;
  album: "ours" | "guests";
  uploader_name: string | null;
  approved: boolean;
  created_at: string;
  sort_order: number | null;
  publicUrl: string;
}

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  status: "pending" | "resizing" | "uploading" | "done" | "error";
  error?: string;
}

// Shared caption-editing state for a single photo — used by both the
// grid tiles (Our Photos, Approved Guest Photos) and the pending guest
// photo cards, so the input/save/"Saved ✓" behavior stays identical in
// all three spots.
function useCaptionEditor(photo: AdminPhoto, onError: (message: string) => void) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [isSaving, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setCaption(photo.caption ?? "");
  }, [photo.caption]);

  function save() {
    startTransition(async () => {
      const result = await updatePhotoCaption(photo.id, caption);
      if (result.error) {
        onError(result.error);
        return;
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    });
  }

  const changed = caption !== (photo.caption ?? "");

  return { caption, setCaption, isSaving, justSaved, changed, save };
}

// Tracks the OS-level "reduce motion" accessibility setting so drag
// reordering can skip its drop animation for guests/admins who have it on.
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

export default function PhotoManager({
  ourPhotos,
  pendingGuestPhotos,
  approvedGuestPhotos,
}: {
  ourPhotos: AdminPhoto[];
  pendingGuestPhotos: AdminPhoto[];
  approvedGuestPhotos: AdminPhoto[];
}) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [confirming, setConfirming] = useState<{
    id: string;
    action: "delete" | "reject";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploadingBatch = staged.some(
    (s) => s.status === "resizing" || s.status === "uploading"
  );
  const retryableCount = staged.filter((s) => s.status !== "done").length;
  const allDone = staged.length > 0 && retryableCount === 0;

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setStaged((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
        status: "pending" as const,
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateCaption(id: string, caption: string) {
    setStaged((prev) =>
      prev.map((s) => (s.id === id ? { ...s, caption } : s))
    );
  }

  function removeStaged(id: string) {
    setStaged((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleUploadAll() {
    setError(null);
    const supabaseBrowser = createClient();

    for (const item of staged) {
      if (item.status === "done") continue;

      setStaged((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: "resizing" } : s))
      );

      try {
        const blob = await resizeImage(item.file);
        setStaged((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, status: "uploading" } : s
          )
        );
        const { path } = await uploadPhoto(supabaseBrowser, "ours", blob);

        const formData = new FormData();
        formData.set("storage_path", path);
        formData.set("caption", item.caption);
        const result = await addOurPhoto(formData);
        if (result.error) throw new Error(result.error);

        setStaged((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: "done" } : s))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setStaged((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, status: "error", error: message } : s
          )
        );
      }
    }
  }

  function handleApprove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await approvePhoto(id);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(id: string, storagePath: string) {
    setError(null);
    startTransition(async () => {
      const result = await deletePhoto(id, storagePath);
      if (result.error) setError(result.error);
      setConfirming(null);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        </Panel>
      )}

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">Our Photos</h3>

        <Panel className="flex flex-col gap-3 p-5 sm:p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
            id="our-photos-input"
          />
          <label
            htmlFor="our-photos-input"
            className="w-fit cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream dark:text-night"
          >
            + Choose Photos
          </label>

          {staged.length > 0 && (
            <div className="flex flex-col gap-3">
              {staged.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-dahlia/10 p-2 dark:border-cream/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={item.caption}
                    onChange={(e) => updateCaption(item.id, e.target.value)}
                    disabled={item.status !== "pending"}
                    className="flex-1 rounded-lg border border-dahlia/20 bg-cream px-2 py-1 text-sm text-foreground dark:border-cream/20 dark:bg-night"
                  />
                  <span className="w-24 shrink-0 text-xs text-foreground/70">
                    {item.status === "pending" && "Ready"}
                    {item.status === "resizing" && "Resizing…"}
                    {item.status === "uploading" && "Uploading…"}
                    {item.status === "done" && "Saved ✓"}
                    {item.status === "error" && (item.error ?? "Failed")}
                  </span>
                  {item.status !== "uploading" && item.status !== "resizing" && (
                    <button
                      type="button"
                      onClick={() => removeStaged(item.id)}
                      aria-label="Remove"
                      className="shrink-0 rounded-full px-2 text-accent hover:bg-accent/10"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                {!allDone && (
                  <button
                    type="button"
                    onClick={handleUploadAll}
                    disabled={isUploadingBatch}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
                  >
                    Upload {retryableCount} Photo
                    {retryableCount === 1 ? "" : "s"}
                  </button>
                )}
                {allDone && (
                  <button
                    type="button"
                    onClick={() => setStaged([])}
                    className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          )}
        </Panel>

        {ourPhotos.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            No photos yet — upload your first one above.
          </p>
        ) : (
          <SortablePhotoGrid
            photos={ourPhotos}
            album="ours"
            isPending={isPending}
            confirming={confirming}
            onConfirmDelete={(id) => setConfirming({ id, action: "delete" })}
            onCancelDelete={() => setConfirming(null)}
            onDelete={handleDelete}
            onCaptionError={setError}
            onReorderError={setError}
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">
          Guest Photos — Awaiting Approval
        </h3>
        {pendingGuestPhotos.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            Nothing waiting on you right now.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingGuestPhotos.map((photo) => (
              <PendingGuestPhotoCard
                key={photo.id}
                photo={photo}
                isPending={isPending}
                isConfirmingReject={
                  confirming?.id === photo.id && confirming.action === "reject"
                }
                onApprove={() => handleApprove(photo.id)}
                onRejectClick={() =>
                  setConfirming({ id: photo.id, action: "reject" })
                }
                onConfirmReject={() =>
                  handleDelete(photo.id, photo.storage_path)
                }
                onCancelReject={() => setConfirming(null)}
                onCaptionError={setError}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-xl text-accent">
          Approved Guest Photos
        </h3>
        {approvedGuestPhotos.length === 0 ? (
          <p className="text-center text-sm italic text-foreground/60">
            None approved yet.
          </p>
        ) : (
          <SortablePhotoGrid
            photos={approvedGuestPhotos}
            album="guests"
            isPending={isPending}
            confirming={confirming}
            onConfirmDelete={(id) => setConfirming({ id, action: "delete" })}
            onCancelDelete={() => setConfirming(null)}
            onDelete={handleDelete}
            onCaptionError={setError}
            onReorderError={setError}
          />
        )}
      </section>
    </div>
  );
}

function SortablePhotoGrid({
  photos,
  album,
  isPending,
  confirming,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
  onCaptionError,
  onReorderError,
}: {
  photos: AdminPhoto[];
  album: "ours" | "guests";
  isPending: boolean;
  confirming: { id: string; action: "delete" | "reject" } | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: (id: string, storagePath: string) => void;
  onCaptionError: (message: string) => void;
  onReorderError: (message: string) => void;
}) {
  const [order, setOrder] = useState(photos);
  const [, startReorderTransition] = useTransition();

  // Re-seed from the server's order whenever the photo list itself
  // changes (an upload or delete completing) — never on our own local
  // reorders, since those pass a fresh `photos` array reference only
  // after the server confirms the change.
  useEffect(() => {
    setOrder(photos);
  }, [photos]);

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((photo) => photo.id === active.id);
    const newIndex = order.findIndex((photo) => photo.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = order;
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);

    startReorderTransition(async () => {
      const result = await reorderPhotos(
        album,
        newOrder.map((photo) => photo.id)
      );
      if (result.error) {
        setOrder(previousOrder);
        onReorderError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-foreground/60">
        Drag a photo to change the order guests see it in on the Gallery
        page.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={order.map((photo) => photo.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {order.map((photo) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                isPending={isPending}
                isConfirming={
                  confirming?.id === photo.id && confirming.action === "delete"
                }
                confirmLabel="Delete this photo?"
                onConfirm={() => onConfirmDelete(photo.id)}
                onCancel={onCancelDelete}
                onDelete={() => onDelete(photo.id, photo.storage_path)}
                onCaptionError={onCaptionError}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function PhotoTile({
  photo,
  isPending,
  isConfirming,
  confirmLabel,
  onConfirm,
  onCancel,
  onDelete,
  onCaptionError,
}: {
  photo: AdminPhoto;
  isPending: boolean;
  isConfirming: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onCaptionError: (message: string) => void;
}) {
  const {
    caption,
    setCaption,
    isSaving,
    justSaved,
    changed,
    save,
  } = useCaptionEditor(photo, onCaptionError);
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
    id: photo.id,
    transition: prefersReducedMotion ? null : undefined,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "z-10 opacity-70" : ""}
    >
      <Panel className="flex flex-col overflow-hidden p-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.publicUrl}
            alt={photo.caption ?? "Photo"}
            className="aspect-square w-full object-cover"
          />
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="absolute right-1.5 top-1.5 flex h-11 w-11 touch-none items-center justify-center rounded-full bg-night/50 text-lg text-cream hover:bg-night/70"
          >
            ⠿
          </button>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isSaving}
              className="min-w-0 flex-1 rounded-lg border border-dahlia/20 bg-cream px-2 py-1 text-xs text-foreground dark:border-cream/20 dark:bg-night"
            />
            {changed && (
              <button
                type="button"
                onClick={save}
                disabled={isSaving}
                className="shrink-0 rounded-full bg-accent px-2 py-1 text-xs font-medium text-cream disabled:opacity-60 dark:text-night"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            )}
            {justSaved && !changed && (
              <span className="shrink-0 text-xs text-foreground/70">
                Saved ✓
              </span>
            )}
          </div>
          {isConfirming ? (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-foreground/80">{confirmLabel}</span>
              <button
                type="button"
                onClick={onDelete}
                disabled={isPending}
                className="rounded-full bg-dahlia px-2 py-0.5 font-medium text-cream disabled:opacity-60"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full px-2 py-0.5 font-medium text-accent hover:bg-accent/10"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              className="w-fit rounded-full px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/10"
            >
              Delete
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
}

function PendingGuestPhotoCard({
  photo,
  isPending,
  isConfirmingReject,
  onApprove,
  onRejectClick,
  onConfirmReject,
  onCancelReject,
  onCaptionError,
}: {
  photo: AdminPhoto;
  isPending: boolean;
  isConfirmingReject: boolean;
  onApprove: () => void;
  onRejectClick: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
  onCaptionError: (message: string) => void;
}) {
  const {
    caption,
    setCaption,
    isSaving,
    justSaved,
    changed,
    save,
  } = useCaptionEditor(photo, onCaptionError);

  return (
    <Panel className="flex flex-col overflow-hidden p-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.publicUrl}
        alt={photo.caption ?? "Guest photo awaiting approval"}
        className="max-h-96 w-full object-cover"
      />
      <div className="flex flex-col gap-2 p-4">
        {(photo.uploader_name || photo.caption) && (
          <p className="text-sm text-foreground/90">
            {photo.uploader_name && (
              <span className="font-medium">{photo.uploader_name}</span>
            )}
            {photo.uploader_name && photo.caption && " — "}
            {photo.caption}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add a caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isSaving}
            className="min-w-0 flex-1 rounded-lg border border-dahlia/20 bg-cream px-2 py-1 text-sm text-foreground dark:border-cream/20 dark:bg-night"
          />
          {changed && (
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-medium text-cream disabled:opacity-60 dark:text-night"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          )}
          {justSaved && !changed && (
            <span className="shrink-0 text-xs text-foreground/70">
              Saved ✓
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={isPending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
          >
            Approve
          </button>
          {isConfirmingReject ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-foreground/80">Reject this?</span>
              <button
                type="button"
                onClick={onConfirmReject}
                disabled={isPending}
                className="rounded-full bg-dahlia px-3 py-1 font-medium text-cream disabled:opacity-60"
              >
                Yes, reject
              </button>
              <button
                type="button"
                onClick={onCancelReject}
                className="rounded-full px-3 py-1 font-medium text-accent hover:bg-accent/10"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={onRejectClick}
              className="rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
