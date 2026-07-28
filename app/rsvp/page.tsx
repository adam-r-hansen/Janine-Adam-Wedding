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

        {/*
          This reply-by date is a one-time ask tied to Adam's birthday, not a
          piece of ongoing site content — it doesn't belong in site_settings
          alongside things like the wedding date that admins manage long-term.
        */}
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-gold/40 bg-gold/10 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.2em] text-pine dark:text-gold">
            Kindly reply by
          </p>
          <p className="mt-1 font-heading text-2xl tracking-[0.1em] text-accent lining-nums sm:text-3xl">
            SEPTEMBER 13
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            As a birthday present to Adam, please have your RSVP returned to
            us by his birthday, September 13.
          </p>
        </div>
      </Panel>

      <RsvpFlow />
    </PageContainer>
  );
}
