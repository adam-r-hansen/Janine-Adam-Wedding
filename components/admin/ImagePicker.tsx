"use client";

import { useRef, useState } from "react";
import { resizeImage, uploadPhoto } from "@/lib/storage";
import { createClient } from "@/lib/supabase-browser";

const inputClasses =
  "rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground dark:border-cream/20 dark:bg-night";

export default function ImagePicker({
  name,
  defaultValue,
  label = "Photo",
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const blob = await resizeImage(file);
      const supabase = createClient();
      const { publicUrl } = await uploadPhoto(supabase, "content", blob);
      setUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload that photo."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-foreground/80">{label}</span>

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-32 w-full rounded-lg object-cover"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full border border-dahlia/20 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-60 dark:border-cream/20"
        >
          {isUploading
            ? "Uploading…"
            : url
              ? "Replace photo"
              : "Upload photo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
          >
            Remove
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-foreground/60">
          Or paste an image URL
        </span>
        <input
          type="url"
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className={inputClasses}
        />
      </label>

      {error && (
        <p className="text-sm font-medium text-dahlia dark:text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
