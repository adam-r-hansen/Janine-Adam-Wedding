import PageContainer from "@/components/PageContainer";
import Panel from "@/components/Panel";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SETTINGS_KEYS = ["registry_intro", "registry_url"] as const;

interface SettingRow {
  key: string;
  value: string;
}

export default async function HoneymoonPage() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", SETTINGS_KEYS)
    .returns<SettingRow[]>();

  const settings = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value])
  );

  return (
    <PageContainer narrow>
      <Panel className="p-8 text-center sm:p-10">
        <h1 className="font-heading text-3xl tracking-[0.15em] text-accent sm:text-4xl">
          HONEYMOON
        </h1>

        {error ? (
          <p className="mt-3 text-sm text-foreground/90">
            Something went wrong loading this page. Please try again in a
            bit.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
              {settings.registry_intro}
            </p>

            <a
              href={settings.registry_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream transition-opacity hover:opacity-90 dark:text-night"
            >
              Visit Our HoneyFund
            </a>
          </>
        )}
      </Panel>
    </PageContainer>
  );
}
