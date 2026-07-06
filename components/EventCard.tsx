import Panel from "./Panel";
import type { ScheduleEvent } from "@/lib/placeholder-data";

export default function EventCard({ event }: { event: ScheduleEvent }) {
  const query = `${event.venueName}, ${event.address}`;
  const appleMapsHref = `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
  const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;

  return (
    <Panel className="flex flex-col gap-3 p-6 sm:p-8">
      <h3 className="font-heading text-2xl tracking-wide text-accent sm:text-3xl">
        {event.name}
      </h3>
      <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
        {event.date} &middot; {event.startTime}&ndash;{event.endTime}
      </p>
      <p className="text-sm text-foreground/90">
        {event.venueName} — {event.address}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={appleMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-dahlia/20 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 dark:border-cream/20"
        >
          Open in Apple Maps
        </a>
        <a
          href={googleMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-dahlia/20 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 dark:border-cream/20"
        >
          Open in Google Maps
        </a>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
        {event.description}
      </p>
      <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-night">
        {event.dressCode}
      </span>
    </Panel>
  );
}
