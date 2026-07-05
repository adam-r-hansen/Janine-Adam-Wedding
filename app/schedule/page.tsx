import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import EventCard from "@/components/EventCard";
import { scheduleEvents } from "@/lib/placeholder-data";

export default function SchedulePage() {
  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          SCHEDULE
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {"Here's what we have planned for the weekend. Tap any address for directions."}
        </p>
      </Panel>

      <div className="flex flex-col gap-6">
        {scheduleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </PageContainer>
  );
}
