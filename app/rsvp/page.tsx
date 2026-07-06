import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import RsvpFlow from "@/components/RsvpFlow";

export default function RsvpPage() {
  return (
    <PageContainer narrow>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          RSVP
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          We can&apos;t wait to celebrate with you. Find your invitation below
          to let us know if you can make it.
        </p>
      </Panel>

      <RsvpFlow />
    </PageContainer>
  );
}
