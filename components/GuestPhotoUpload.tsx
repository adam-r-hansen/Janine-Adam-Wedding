"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Panel from "@/components/Panel";
import { supabase } from "@/lib/supabase";
import { resizeImage, uploadPhoto } from "@/lib/storage";

interface StagedFile {
  id: string;
  file: File;
  status: "pending" | "resizing" | "uploading" | "done" | "error";
  error?: string;
}

export default function GuestPhotoUpload() {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setStaged(
      files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending",
      }))
    );
    setSucceeded(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (staged.length === 0) {
      setError("Please choose at least one photo first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let anyFailed = false;

    for (const item of staged) {
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
        const { path } = await uploadPhoto(supabase, "guests", blob);

        const { error: insertError } = await supabase.from("photos").insert({
          storage_path: path,
          caption: caption.trim() || null,
          album: "guests",
          approved: false,
          uploader_name: name.trim() || null,
        });
        if (insertError) throw new Error("Could not save that photo.");

        setStaged((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: "done" } : s))
        );
      } catch (err) {
        anyFailed = true;
        const message = err instanceof Error ? err.message : "Upload failed.";
        setStaged((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, status: "error", error: message } : s
          )
        );
      }
    }

    setIsSubmitting(false);
    if (!anyFailed) {
      setSucceeded(true);
      setStaged([]);
      setName("");
      setCaption("");
    } else {
      setError("Some photos didn't upload. You can try again below.");
    }
  }

  if (succeeded) {
    return (
      <Panel className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
          Thank you! Your photos will appear here once we&apos;ve had a
          chance to take a look.
        </p>
        <button
          type="button"
          onClick={() => setSucceeded(false)}
          className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Share more photos
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-4 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
          id="guest-photos-input"
        />
        <label
          htmlFor="guest-photos-input"
          className="w-fit cursor-pointer rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-cream dark:text-night"
        >
          {staged.length > 0
            ? `${staged.length} photo${staged.length === 1 ? "" : "s"} chosen`
            : "Choose Photos"}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Your name{" "}
            <span className="font-normal text-foreground/60">(optional)</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">
            Caption{" "}
            <span className="font-normal text-foreground/60">(optional)</span>
          </span>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night"
          />
        </label>

        {staged.length > 0 && (
          <ul className="flex flex-col gap-1 text-xs text-foreground/70">
            {staged.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{item.file.name}</span>
                <span>
                  {item.status === "pending" && "Ready"}
                  {item.status === "resizing" && "Resizing…"}
                  {item.status === "uploading" && "Uploading…"}
                  {item.status === "done" && "Uploaded ✓"}
                  {item.status === "error" && (item.error ?? "Failed")}
                </span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="text-sm font-medium text-dahlia dark:text-ember">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || staged.length === 0}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
        >
          {isSubmitting ? "Uploading…" : "Share Photos"}
        </button>
      </form>
    </Panel>
  );
}
