import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import GuestbookForm from "@/components/GuestbookForm";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface GuestbookEntryRow {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

function formatEntryDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function GuestbookPage() {
  const { data, error } = await supabase
    .from("guestbook_entries")
    .select("id, author_name, message, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .returns<GuestbookEntryRow[]>();

  const entries = data ?? [];

  return (
    <PageContainer narrow>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          GUESTBOOK
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          Leave us a note — we&apos;ll treasure reading these for years to
          come.
        </p>
      </Panel>

      <GuestbookForm />

      {error ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the guestbook. Please try again in a
            bit.
          </p>
        </Panel>
      ) : entries.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm text-foreground/90">
            No notes yet — be the first to sign!
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <Panel key={entry.id} className="flex flex-col gap-2 p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                {entry.message}
              </p>
              <p className="text-sm font-medium text-accent">
                — {entry.author_name}
              </p>
              <p className="text-xs uppercase tracking-wide text-foreground/50">
                {formatEntryDate(entry.created_at)}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
