import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import FaqAccordion from "@/components/FaqAccordion";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const { data: faqs, error } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .order("sort_order", { ascending: true });

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

      {error ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the FAQs. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <FaqAccordion faqs={faqs ?? []} />
      )}
    </PageContainer>
  );
}
