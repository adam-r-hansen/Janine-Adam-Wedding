"use client";

import { useEffect, useState } from "react";

function getTimeLeft(targetMs: number) {
  const msLeft = Math.max(targetMs - Date.now(), 0);
  return {
    msLeft,
    days: Math.floor(msLeft / (1000 * 60 * 60 * 24)),
    hours: Math.floor((msLeft / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((msLeft / (1000 * 60)) % 60),
    seconds: Math.floor((msLeft / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: { targetDate: string }) {
  const targetMs = new Date(targetDate).getTime();

  // Computed once up front (server render and first client render both call
  // this) then refreshed every second on the client via the interval below.
  const [time, setTime] = useState(() => getTimeLeft(targetMs));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (time.msLeft <= 0) {
    return (
      <p className="font-heading text-xl tracking-wide text-accent">
        {"We're married!"}
      </p>
    );
  }

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div
      className="flex items-start justify-center gap-4 sm:gap-6"
      role="timer"
      aria-label="Countdown to the wedding"
    >
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <span
            className="font-heading text-3xl tabular-nums text-accent sm:text-4xl"
            suppressHydrationWarning
          >
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-foreground/70 sm:text-xs">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
