import Panel from "@/components/Panel";
import SeatingManager, {
  type SeatingParty,
} from "@/components/admin/SeatingManager";
import { createClient } from "@/lib/supabase-server";
import { MAX_SEATS_PER_TABLE, MIN_SEATS_PER_TABLE } from "@/lib/seating";

export const dynamic = "force-dynamic";

const SETTINGS_KEYS = [
  "seating_table_count",
  "seating_seats_per_table",
  "seating_published",
] as const;

interface PartyRow {
  id: string;
  label: string;
  table_number: number | null;
}

interface GuestRow {
  party_id: string;
  full_name: string;
  attending: boolean | null;
}

interface SettingRow {
  key: string;
  value: string;
}

export default async function AdminSeatingPage() {
  const supabase = await createClient();
  const [partiesResult, guestsResult, settingsResult] = await Promise.all([
    supabase
      .from("parties")
      .select("id, label, table_number")
      .returns<PartyRow[]>(),
    supabase
      .from("guests")
      .select("party_id, full_name, attending")
      .returns<GuestRow[]>(),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS)
      .returns<SettingRow[]>(),
  ]);

  const error =
    partiesResult.error || guestsResult.error || settingsResult.error;

  const settings = new Map(
    (settingsResult.data ?? []).map((row) => [row.key, row.value])
  );

  const parsedTableCount = Number.parseInt(
    settings.get("seating_table_count") ?? "",
    10
  );
  const tableCount =
    Number.isInteger(parsedTableCount) && parsedTableCount > 0
      ? parsedTableCount
      : 0;

  const parsedSeats = Number.parseInt(
    settings.get("seating_seats_per_table") ?? "",
    10
  );
  const seatsPerTable = Number.isInteger(parsedSeats)
    ? Math.min(MAX_SEATS_PER_TABLE, Math.max(MIN_SEATS_PER_TABLE, parsedSeats))
    : MAX_SEATS_PER_TABLE;

  // A missing row counts as "not published" — same rule the public
  // /seating page and the nav use.
  const published = settings.get("seating_published") === "true";

  // Only guests who said yes count. A party is "confirmed" if at least
  // one of its guests is attending; its headcount is just those guests.
  const attendingNamesByParty = new Map<string, string[]>();
  for (const guest of guestsResult.data ?? []) {
    if (guest.attending !== true) continue;
    const names = attendingNamesByParty.get(guest.party_id) ?? [];
    names.push(guest.full_name);
    attendingNamesByParty.set(guest.party_id, names);
  }

  const parties: SeatingParty[] = (partiesResult.data ?? [])
    .filter((party) => attendingNamesByParty.has(party.id))
    .map((party) => ({
      id: party.id,
      label: party.label,
      tableNumber: party.table_number,
      attendingNames: attendingNamesByParty.get(party.id) ?? [],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Seating
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Place each confirmed party at a table. Only parties with at least one
          guest attending show up here, and only attending guests take up seats.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading seating. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <SeatingManager
          parties={parties}
          tableCount={tableCount}
          seatsPerTable={seatsPerTable}
          published={published}
        />
      )}
    </div>
  );
}
