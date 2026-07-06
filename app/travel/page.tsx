import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import HotelCard from "@/components/HotelCard";
import { supabase } from "@/lib/supabase";
import { formatShortDate } from "@/lib/format";
import type { Hotel } from "@/lib/placeholder-data";

export const dynamic = "force-dynamic";

interface HotelRow {
  id: string;
  name: string;
  photo_url: string | null;
  description: string;
  distance: string;
  price_range: string;
  booking_url: string;
  room_block_code: string | null;
  book_by_date: string | null;
}

export default async function TravelPage() {
  const [introResult, hotelsResult] = await Promise.all([
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "travel_intro")
      .single(),
    supabase
      .from("hotels")
      .select(
        "id, name, photo_url, description, distance, price_range, booking_url, room_block_code, book_by_date"
      )
      .order("sort_order", { ascending: true })
      .returns<HotelRow[]>(),
  ]);

  const error = introResult.error || hotelsResult.error;

  const hotels: Hotel[] =
    hotelsResult.data?.map((row) => ({
      id: row.id,
      name: row.name,
      photoUrl: row.photo_url ?? undefined,
      description: row.description,
      distance: row.distance,
      priceRange: row.price_range,
      bookingUrl: row.booking_url,
      roomBlockCode: row.room_block_code ?? undefined,
      bookByDate: row.book_by_date
        ? formatShortDate(row.book_by_date)
        : undefined,
    })) ?? [];

  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          TRAVEL
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {introResult.data?.value ?? ""}
        </p>
      </Panel>

      {error ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading travel info. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel, i) => (
            <HotelCard key={hotel.id} hotel={hotel} variant={i} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
