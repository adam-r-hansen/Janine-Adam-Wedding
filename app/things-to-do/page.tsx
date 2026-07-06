import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import ActivityFilter from "@/components/ActivityFilter";
import { supabase } from "@/lib/supabase";
import type { Activity } from "@/lib/placeholder-data";

export const dynamic = "force-dynamic";

interface ActivityRow {
  id: string;
  name: string;
  category: Activity["category"];
  photo_url: string | null;
  blurb: string;
  neighborhood: string;
  link_url: string;
}

export default async function ThingsToDoPage() {
  const { data, error } = await supabase
    .from("activities")
    .select("id, name, category, photo_url, blurb, neighborhood, link_url")
    .order("sort_order", { ascending: true })
    .returns<ActivityRow[]>();

  const activities: Activity[] =
    data?.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      photoUrl: row.photo_url ?? undefined,
      blurb: row.blurb,
      neighborhood: row.neighborhood,
      linkUrl: row.link_url,
    })) ?? [];

  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          THINGS TO DO
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {"A few of our favorite spots around town, if you're making a trip of it."}
        </p>
      </Panel>

      {error ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading things to do. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <ActivityFilter activities={activities} />
      )}
    </PageContainer>
  );
}
