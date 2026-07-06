import Panel from "@/components/Panel";
import GuestbookManager, {
  type AdminGuestbookEntry,
} from "@/components/admin/GuestbookManager";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminGuestbookPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guestbook_entries")
    .select("id, author_name, message, approved, created_at")
    .order("created_at", { ascending: false })
    .returns<AdminGuestbookEntry[]>();

  const entries = data ?? [];
  const pending = entries.filter((entry) => !entry.approved);
  const approved = entries.filter((entry) => entry.approved);

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Guestbook
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Approve or reject notes guests leave on the public Guestbook page.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the guestbook. Please try again in a
            bit.
          </p>
        </Panel>
      ) : (
        <GuestbookManager pending={pending} approved={approved} />
      )}
    </div>
  );
}
