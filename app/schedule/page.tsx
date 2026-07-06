import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import EventCard from "@/components/EventCard";
import { supabase } from "@/lib/supabase";
import { formatEventDate, formatTime } from "@/lib/format";
import type { ScheduleEvent } from "@/lib/placeholder-data";

export const dynamic = "force-dynamic";

interface EventRow {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  address: string;
  description: string;
  dress_code: string;
}

export default async function SchedulePage() {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, date, start_time, end_time, venue_name, address, description, dress_code"
    )
    .order("sort_order", { ascending: true })
    .returns<EventRow[]>();

  const events: ScheduleEvent[] =
    data?.map((row) => ({
      id: row.id,
      name: row.title,
      date: formatEventDate(row.date),
      startTime: formatTime(row.start_time),
      endTime: formatTime(row.end_time),
      venueName: row.venue_name,
      address: row.address,
      description: row.description,
      dressCode: row.dress_code,
    })) ?? [];

  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          SCHEDULE
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {"Here's what we have planned for the weekend. Tap a map button on any event for directions."}
        </p>
      </Panel>

      {error ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the schedule. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
