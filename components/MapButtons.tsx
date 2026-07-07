// Shared "open in maps" pill buttons — used by EventCard, HotelCard, and
// ActivityCard. Apple Maps is listed first since most guests are on
// iPhones, where it opens the native Maps app instead of a webpage.
export default function MapButtons({ query }: { query: string }) {
  const encoded = encodeURIComponent(query);
  const appleMapsHref = `https://maps.apple.com/?q=${encoded}`;
  const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  return (
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
  );
}
