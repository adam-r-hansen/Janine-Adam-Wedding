import Panel from "./Panel";
import type { ScheduleEvent } from "@/lib/placeholder-data";

export default function EventCard({ event }: { event: ScheduleEvent }) {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venueName}, ${event.address}`
  )}`;

  return (
    <Panel className="flex flex-col gap-3 p-6 sm:p-8">
      <h3 className="font-heading text-2xl tracking-wide text-accent sm:text-3xl">
        {event.name}
      </h3>
      <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
        {event.date} &middot; {event.startTime}&ndash;{event.endTime}
      </p>
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-accent underline-offset-4 hover:underline"
      >
        {event.venueName} — {event.address}
      </a>
      <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
        {event.description}
      </p>
      <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-night">
        {event.dressCode}
      </span>
    </Panel>
  );
}
