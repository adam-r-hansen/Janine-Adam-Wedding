import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import ActivityFilter from "@/components/ActivityFilter";
import { activities } from "@/lib/placeholder-data";

export default function ThingsToDoPage() {
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

      <ActivityFilter activities={activities} />
    </PageContainer>
  );
}
