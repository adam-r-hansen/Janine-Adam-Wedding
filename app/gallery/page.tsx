import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import PhotoLightbox from "@/components/PhotoLightbox";
import GuestPhotoUpload from "@/components/GuestPhotoUpload";
import { supabase } from "@/lib/supabase";
import { getPhotoPublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface PhotoRow {
  id: string;
  storage_path: string;
  caption: string | null;
  album: "ours" | "guests";
  uploader_name: string | null;
}

function photoAlt(photo: PhotoRow): string {
  if (photo.caption) return photo.caption;
  if (photo.album === "guests" && photo.uploader_name) {
    return `Photo shared by ${photo.uploader_name}`;
  }
  return photo.album === "ours" ? "Photo from Janine and Adam" : "Guest photo";
}

export default async function GalleryPage() {
  const { data, error } = await supabase
    .from("photos")
    .select("id, storage_path, caption, album, uploader_name")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .returns<PhotoRow[]>();

  const ourPhotos = (data ?? [])
    .filter((photo) => photo.album === "ours")
    .map((photo) => ({
      id: photo.id,
      url: getPhotoPublicUrl(photo.storage_path),
      alt: photoAlt(photo),
    }));

  const guestPhotos = (data ?? [])
    .filter((photo) => photo.album === "guests")
    .map((photo) => ({
      id: photo.id,
      url: getPhotoPublicUrl(photo.storage_path),
      alt: photoAlt(photo),
    }));

  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          GALLERY
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {"Moments from our story, and moments from yours too."}
        </p>
      </Panel>

      {error ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the gallery. Please try again in a
            bit.
          </p>
        </Panel>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-center font-heading text-2xl text-accent">
              Our Photos
            </h2>
            {ourPhotos.length > 0 ? (
              <PhotoLightbox photos={ourPhotos} />
            ) : (
              <Panel className="p-8 text-center">
                <p className="text-sm text-foreground/90">
                  Our photos are on their way.
                </p>
              </Panel>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-center font-heading text-2xl text-accent">
              Guest Photos
            </h2>
            {guestPhotos.length > 0 ? (
              <PhotoLightbox photos={guestPhotos} />
            ) : (
              <Panel className="p-8 text-center">
                <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                  No guest photos yet — be the first!
                </p>
              </Panel>
            )}

            <GuestPhotoUpload />
          </section>
        </>
      )}
    </PageContainer>
  );
}
