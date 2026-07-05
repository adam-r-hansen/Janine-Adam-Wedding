import Panel from "@/components/Panel";
import FaqEditor, { type AdminFaq } from "@/components/admin/FaqEditor";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer, sort_order")
    .order("sort_order", { ascending: true })
    .returns<AdminFaq[]>();

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          FAQs
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Add, edit, delete, and reorder the questions guests see on the
          public FAQ page.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the FAQs. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <FaqEditor faqs={data ?? []} />
      )}
    </div>
  );
}
