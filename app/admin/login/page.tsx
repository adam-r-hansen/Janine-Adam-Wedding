"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import { createClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setIsSubmitting(false);
      setError("That email or password doesn't look right. Please try again.");
      return;
    }

    router.push("/admin");
  }

  return (
    <PageContainer narrow>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          ADMIN
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
          Sign in to manage the site.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 text-left"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground/80">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent dark:border-cream/20 dark:bg-night"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground/80">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent dark:border-cream/20 dark:bg-night"
            />
          </label>

          {error && (
            <p className="text-sm font-medium text-dahlia dark:text-ember">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-night"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </Panel>
    </PageContainer>
  );
}
