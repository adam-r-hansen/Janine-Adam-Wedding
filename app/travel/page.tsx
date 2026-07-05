import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import HotelCard from "@/components/HotelCard";
import { travelIntro, hotels } from "@/lib/placeholder-data";

export default function TravelPage() {
  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          TRAVEL
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {travelIntro}
        </p>
      </Panel>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel, i) => (
          <HotelCard key={hotel.id} hotel={hotel} variant={i} />
        ))}
      </div>
    </PageContainer>
  );
}
