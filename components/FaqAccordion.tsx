"use client";

import { useState } from "react";
import Panel from "./Panel";
import type { Faq } from "@/lib/placeholder-data";

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {faqs.map((faq) => {
        const isOpen = openIds.has(faq.id);
        return (
          <Panel key={faq.id} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => toggle(faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="font-heading text-lg text-accent sm:text-xl">
                {faq.question}
              </span>
              <span
                className="shrink-0 text-xl leading-none text-accent"
                aria-hidden="true"
              >
                {isOpen ? "–" : "+"}
              </span>
            </button>
            {isOpen && (
              <p className="px-6 pb-5 text-sm leading-relaxed text-foreground/90 sm:text-base">
                {faq.answer}
              </p>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
