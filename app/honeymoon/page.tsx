import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import HoneymoonFund, {
  type HoneymoonItem,
} from "@/components/HoneymoonFund";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SETTINGS_KEYS = [
  "registry_intro",
  "venmo_username",
  "honeymoon_payment_note",
] as const;

interface SettingRow {
  key: string;
  value: string;
}

export default async function HoneymoonPage() {
  const [settingsResult, itemsResult] = await Promise.all([
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS)
      .returns<SettingRow[]>(),
    supabase
      .from("honeymoon_items")
      .select("id, title, blurb, photo_url, suggested_cents")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .returns<HoneymoonItem[]>(),
  ]);

  const settings = Object.fromEntries(
    (settingsResult.data ?? []).map((row) => [row.key, row.value])
  );

  const loadError = settingsResult.error || itemsResult.error;

  return (
    <PageContainer narrow>
      <Panel className="p-8 sm:p-10">
        <h1 className="text-center font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          HONEYMOON
        </h1>

        {loadError ? (
          <p className="mt-3 text-center text-sm text-foreground/90">
            Something went wrong loading this page. Please try again in a
            bit.
          </p>
        ) : (
          <>
            {settings.registry_intro && (
              <p className="mx-auto mt-4 max-w-prose text-center text-sm leading-relaxed text-foreground/90 sm:text-base">
                {settings.registry_intro}
              </p>
            )}

            <HoneymoonFund
              items={itemsResult.data ?? []}
              venmoUsername={settings.venmo_username ?? ""}
              paymentNote={settings.honeymoon_payment_note ?? ""}
            />
          </>
        )}
      </Panel>
    </PageContainer>
  );
}
