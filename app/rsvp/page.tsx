import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import { WEDDING_DATE_LABEL } from "@/lib/placeholder-data";

export default function RsvpPage() {
  return (
    <PageContainer narrow>
      <Panel className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          RSVP
        </h1>
        <p className="font-heading text-lg text-foreground sm:text-xl">
          RSVP opens soon
        </p>
        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
          {`We're finishing up our guest list tools — check back before ${WEDDING_DATE_LABEL} to look up your invitation and let us know if you can make it.`}
        </p>
      </Panel>
    </PageContainer>
  );
}
