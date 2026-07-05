import Panel from "@/components/Panel";
import EventEditor, { type AdminEvent } from "@/components/admin/EventEditor";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, date, start_time, end_time, venue_name, address, description, dress_code, sort_order"
    )
    .order("sort_order", { ascending: true })
    .returns<AdminEvent[]>();

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Schedule
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Add, edit, delete, and reorder the events guests see on the public
          Schedule page.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the events. Please try again in a
            bit.
          </p>
        </Panel>
      ) : (
        <EventEditor events={data ?? []} />
      )}
    </div>
  );
}
