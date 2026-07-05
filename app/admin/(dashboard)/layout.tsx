import { redirect } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";
import { createClient } from "@/lib/supabase-server";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middleware.ts already redirects unauthenticated requests before they
  // reach here; this is a second check in case this layout is ever
  // reached another way.
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <PageContainer>
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-6">
        <h1 className="font-heading text-2xl tracking-wide text-accent">
          Admin — Janine &amp; Adam
        </h1>
        <SignOutButton />
      </Panel>

      <Panel className="p-4">
        <AdminNav />
      </Panel>

      {children}
    </PageContainer>
  );
}
