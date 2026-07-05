"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="rounded-full border border-dahlia/20 px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60 dark:border-cream/20"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
