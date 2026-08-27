import Panel from "@/components/Panel";
import HoneymoonEditor, {
  type AdminHoneymoonItem,
} from "@/components/admin/HoneymoonEditor";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminHoneymoonPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("honeymoon_items")
    .select(
      "id, title, blurb, photo_url, suggested_cents, goal_cents, is_active, sort_order"
    )
    .order("sort_order", { ascending: true, nullsFirst: false })
    .returns<AdminHoneymoonItem[]>();

  if (error) {
    console.error("[/admin/honeymoon] Could not load the list:", error);
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Honeymoon
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Add, edit, hide, and reorder the honeymoon fund experiences guests
          can contribute to. The intro paragraph and Venmo details live
          under Settings.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the list. Please try again in a
            bit.
          </p>
        </Panel>
      ) : (
        <HoneymoonEditor items={data ?? []} />
      )}
    </div>
  );
}
