import Panel from "./Panel";
import PlaceholderImage from "./PlaceholderImage";
import MapButtons from "./MapButtons";
import type { Hotel } from "@/lib/placeholder-data";

export default function HotelCard({
  hotel,
  variant = 0,
}: {
  hotel: Hotel;
  variant?: number;
}) {
  return (
    <Panel className="flex flex-col overflow-hidden p-0">
      {hotel.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hotel.photoUrl}
          alt={hotel.name}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <PlaceholderImage
          label={hotel.name}
          variant={variant}
          className="aspect-[4/3]"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-xl text-accent">{hotel.name}</h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          {hotel.description}
        </p>
        <p className="text-xs uppercase tracking-wide text-foreground/60">
          {hotel.distance} &middot; {hotel.priceRange}
        </p>
        {hotel.address && (
          <>
            <p className="text-sm text-foreground/90">{hotel.address}</p>
            <MapButtons query={`${hotel.name}, ${hotel.address}`} />
          </>
        )}
        {hotel.roomBlockCode && hotel.bookByDate && (
          <p className="w-fit rounded-full bg-pine px-3 py-1 text-xs font-medium text-cream">
            Code {hotel.roomBlockCode} &middot; book by {hotel.bookByDate}
          </p>
        )}
        <a
          href={hotel.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-cream transition-opacity hover:opacity-90 dark:text-night"
        >
          Book Now
        </a>
      </div>
    </Panel>
  );
}
