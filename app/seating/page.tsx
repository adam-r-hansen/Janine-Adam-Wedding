import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import SeatingLookup from "@/components/SeatingLookup";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SeatingPage() {
  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "seating_published")
    .maybeSingle();

  const published = setting?.value === "true";

  return (
    <PageContainer narrow>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          FIND YOUR TABLE
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {published
            ? "Type your name below and we'll show you where you're sitting."
            : "Seating will be posted soon — check back closer to the big day!"}
        </p>
      </Panel>

      {published && <SeatingLookup />}
    </PageContainer>
  );
}
