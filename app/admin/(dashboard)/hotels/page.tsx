import Panel from "@/components/Panel";
import HotelEditor, { type AdminHotel } from "@/components/admin/HotelEditor";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select(
      "id, name, photo_url, description, distance, price_range, booking_url, room_block_code, book_by_date, sort_order"
    )
    .order("sort_order", { ascending: true })
    .returns<AdminHotel[]>();

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Hotels
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Add, edit, delete, and reorder the hotels guests see on the public
          Travel page. Photos are just a link for now — real image upload
          comes with the Photos milestone.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the hotels. Please try again in a
            bit.
          </p>
        </Panel>
      ) : (
        <HotelEditor hotels={data ?? []} />
      )}
    </div>
  );
}
