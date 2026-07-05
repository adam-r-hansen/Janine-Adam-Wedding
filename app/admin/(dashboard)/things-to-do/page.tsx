import Panel from "@/components/Panel";
import ActivityEditor, {
  type AdminActivity,
} from "@/components/admin/ActivityEditor";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminThingsToDoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(
      "id, name, category, photo_url, blurb, neighborhood, link_url, sort_order"
    )
    .order("sort_order", { ascending: true })
    .returns<AdminActivity[]>();

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Things to Do
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Add, edit, delete, and reorder the recommendations guests see on
          the public Things to Do page. Photos are just a link for now —
          real image upload comes with the Photos milestone.
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
        <ActivityEditor activities={data ?? []} />
      )}
    </div>
  );
}
