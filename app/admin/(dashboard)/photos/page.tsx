import Panel from "@/components/Panel";
import PhotoManager, {
  type AdminPhoto,
} from "@/components/admin/PhotoManager";
import { createClient } from "@/lib/supabase-server";
import { getPhotoPublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface PhotoRow {
  id: string;
  storage_path: string;
  caption: string | null;
  album: "ours" | "guests";
  uploader_name: string | null;
  approved: boolean;
  created_at: string;
}

export default async function AdminPhotosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, storage_path, caption, album, uploader_name, approved, created_at"
    )
    .order("created_at", { ascending: false })
    .returns<PhotoRow[]>();

  const photos: AdminPhoto[] =
    data?.map((row) => ({
      ...row,
      publicUrl: getPhotoPublicUrl(row.storage_path),
    })) ?? [];

  const ourPhotos = photos.filter((p) => p.album === "ours");
  const pendingGuestPhotos = photos.filter(
    (p) => p.album === "guests" && !p.approved
  );
  const approvedGuestPhotos = photos.filter(
    (p) => p.album === "guests" && p.approved
  );

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Photos
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Upload your own photos, and approve or reject what guests share.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading photos. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <PhotoManager
          ourPhotos={ourPhotos}
          pendingGuestPhotos={pendingGuestPhotos}
          approvedGuestPhotos={approvedGuestPhotos}
        />
      )}
    </div>
  );
}
