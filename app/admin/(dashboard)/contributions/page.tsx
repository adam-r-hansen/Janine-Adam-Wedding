import Panel from "@/components/Panel";
import ContributionsManager, {
  type AdminContribution,
} from "@/components/admin/ContributionsManager";
import { formatCurrencyFromCents } from "@/lib/format";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface ContributionRow {
  id: string;
  claim_code: string;
  guest_name: string;
  guest_email: string | null;
  message: string | null;
  amount_cents: number;
  status: "pending" | "received" | "cancelled";
  received_at: string | null;
  thanked_at: string | null;
  created_at: string;
}

interface LineRow {
  contribution_id: string;
  item_id: string | null;
  item_title: string;
  amount_cents: number;
}

export default async function AdminContributionsPage() {
  const supabase = await createClient();

  const [contributionsResult, linesResult] = await Promise.all([
    supabase
      .from("honeymoon_contributions")
      .select(
        "id, claim_code, guest_name, guest_email, message, amount_cents, status, received_at, thanked_at, created_at"
      )
      .order("created_at", { ascending: false })
      .returns<ContributionRow[]>(),
    supabase
      .from("honeymoon_contribution_lines")
      .select("contribution_id, item_id, item_title, amount_cents")
      .returns<LineRow[]>(),
  ]);

  if (contributionsResult.error) {
    console.error(
      "[/admin/contributions] Could not load contributions:",
      contributionsResult.error
    );
  }
  if (linesResult.error) {
    console.error(
      "[/admin/contributions] Could not load contribution lines:",
      linesResult.error
    );
  }

  const loadError = contributionsResult.error || linesResult.error;

  const lines = linesResult.data ?? [];

  // Join in TypeScript so the shape handed to the client is obvious.
  const contributions: AdminContribution[] = (
    contributionsResult.data ?? []
  ).map((row) => ({
    ...row,
    lines: lines
      .filter((line) => line.contribution_id === row.id)
      .map((line) => ({
        item_title: line.item_title,
        amount_cents: line.amount_cents,
      })),
  }));

  const totalReceivedCents = contributions
    .filter((c) => c.status === "received")
    .reduce((sum, c) => sum + c.amount_cents, 0);

  const totalPendingCents = contributions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount_cents, 0);

  const receivedNotThankedCount = contributions.filter(
    (c) => c.status === "received" && c.thanked_at === null
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Gifts
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Honeymoon fund gifts guests have sent. &quot;Received&quot; means
          you&apos;ve confirmed the Venmo payment actually landed &mdash; the
          site can&apos;t know that on its own, so nothing counts until you
          mark it.
        </p>
      </Panel>

      {loadError ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the gifts. Please try again in a
            bit.
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Panel className="p-5 text-center">
              <p className="font-heading text-2xl text-accent">
                {formatCurrencyFromCents(totalReceivedCents)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-foreground/60">
                Confirmed received
              </p>
            </Panel>
            <Panel className="p-5 text-center">
              <p className="font-heading text-2xl text-accent">
                {formatCurrencyFromCents(totalPendingCents)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-foreground/60">
                Awaiting your confirmation
              </p>
            </Panel>
            <Panel className="p-5 text-center">
              <p className="font-heading text-2xl text-accent">
                {receivedNotThankedCount}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-foreground/60">
                Received, not yet thanked
              </p>
            </Panel>
          </div>

          <ContributionsManager contributions={contributions} />
        </>
      )}
    </div>
  );
}
