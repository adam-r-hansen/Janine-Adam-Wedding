import Panel from "@/components/Panel";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Panel className="p-6 sm:p-8">
      <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
        {"Welcome"}
        {user?.email ? `, ${user.email}` : ""}
        {
          ". Pick a section above to manage the site's content. Only FAQs is wired up so far — the rest are on the way."
        }
      </p>
    </Panel>
  );
}
