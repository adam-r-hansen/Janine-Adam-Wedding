import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import PlaceholderImage from "@/components/PlaceholderImage";
import { ourPhotos } from "@/lib/placeholder-data";

const VARIANT_ASPECT: Record<string, string> = {
  tall: "aspect-[3/4]",
  square: "aspect-square",
  short: "aspect-[4/3]",
};

export default function GalleryPage() {
  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          GALLERY
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {"Moments from our story, and soon, moments from yours too."}
        </p>
      </Panel>

      <section className="flex flex-col gap-4">
        <h2 className="text-center font-heading text-2xl text-accent">
          Our Photos
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ourPhotos.map((photo, i) => (
            <PlaceholderImage
              key={photo.id}
              label={photo.label}
              variant={i}
              className={`rounded-2xl ${VARIANT_ASPECT[photo.variant]}`}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-center font-heading text-2xl text-accent">
          Guest Photos
        </h2>
        <Panel className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
            {"Coming soon — you'll be able to share your favorite moments from the weekend right here."}
          </p>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full bg-foreground/10 px-6 py-2 text-sm font-medium text-foreground/50"
          >
            Upload Photos (Coming Soon)
          </button>
        </Panel>
      </section>
    </PageContainer>
  );
}
