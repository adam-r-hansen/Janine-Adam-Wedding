import Countdown from "@/components/Countdown";
import Panel from "@/components/Panel";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SETTINGS_KEYS = [
  "welcome_message",
  "wedding_date_label",
  "wedding_datetime",
  "venue_line",
] as const;

interface SettingRow {
  key: string;
  value: string;
}

export default async function Home() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", SETTINGS_KEYS)
    .returns<SettingRow[]>();

  const settings = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value])
  );

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-24 pt-10 sm:pt-16">
      <Panel className="w-full max-w-lg p-8 text-center sm:p-10">
        <h1 className="font-heading text-4xl leading-tight tracking-[0.2em] text-accent sm:text-5xl">
          JANINE{" "}
          <span className="font-script text-3xl tracking-normal sm:text-4xl">
            and
          </span>{" "}
          ADAM
        </h1>

        {error ? (
          <p className="mt-6 text-sm text-foreground/90">
            Something went wrong loading this page. Please try again in a bit.
          </p>
        ) : (
          <>
            <p className="mt-4 font-heading text-lg tracking-wide text-foreground sm:text-xl">
              {settings.wedding_date_label}
            </p>

            <div className="mt-8">
              <Countdown targetDate={settings.wedding_datetime} />
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.3em] text-foreground/70 sm:text-sm">
              {settings.venue_line}
            </p>

            <p className="mt-6 text-base leading-relaxed text-foreground/90">
              {settings.welcome_message}
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}
