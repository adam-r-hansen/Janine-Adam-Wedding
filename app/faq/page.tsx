import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import FaqAccordion from "@/components/FaqAccordion";
import { faqs } from "@/lib/placeholder-data";

export default function FaqPage() {
  return (
    <PageContainer>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          FAQ
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {"Answers to the questions we hear most. Can't find yours? Just text us."}
        </p>
      </Panel>

      <FaqAccordion faqs={faqs} />
    </PageContainer>
  );
}
