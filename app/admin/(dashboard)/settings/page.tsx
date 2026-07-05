import Panel from "@/components/Panel";
import SettingsEditor, {
  type AdminSettings,
} from "@/components/admin/SettingsEditor";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const SETTINGS_KEYS = [
  "welcome_message",
  "venue_line",
  "travel_intro",
  "wedding_datetime",
] as const;

interface SettingRow {
  key: string;
  value: string;
}

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", SETTINGS_KEYS)
    .returns<SettingRow[]>();

  const settings: AdminSettings = {
    welcome_message: "",
    venue_line: "",
    travel_intro: "",
    wedding_datetime: "",
    ...Object.fromEntries((data ?? []).map((row) => [row.key, row.value])),
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Settings
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          These fields feed the Home and Travel pages.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading settings. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <SettingsEditor settings={settings} />
      )}
    </div>
  );
}
