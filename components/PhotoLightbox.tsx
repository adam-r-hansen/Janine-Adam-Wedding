"use client";

import { useEffect, useRef, useState } from "react";

export interface LightboxPhoto {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
}

export default function PhotoLightbox({
  photos,
}: {
  photos: LightboxPhoto[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (openIndex === null) return;
    closeButtonRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") {
        setOpenIndex((i) => (i === null ? i : Math.min(i + 1, photos.length - 1)));
      }
      if (e.key === "ArrowLeft") {
        setOpenIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openIndex, photos.length]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-cream/10 px-3 py-1.5 text-2xl leading-none text-cream hover:bg-cream/20"
          >
            ×
          </button>

          {openIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => (i === null ? i : i - 1));
              }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-cream/10 px-3 py-2 text-2xl leading-none text-cream hover:bg-cream/20"
            >
              ‹
            </button>
          )}
          {openIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => (i === null ? i : i + 1));
              }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-cream/10 px-3 py-2 text-2xl leading-none text-cream hover:bg-cream/20"
            >
              ›
            </button>
          )}

          <div
            className="flex max-h-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[openIndex].url}
              alt={photos[openIndex].alt}
              className="max-h-[75vh] max-w-full rounded-lg object-contain"
            />
            {photos[openIndex].caption && (
              <p className="max-w-lg px-4 text-center text-sm text-cream">
                {photos[openIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
