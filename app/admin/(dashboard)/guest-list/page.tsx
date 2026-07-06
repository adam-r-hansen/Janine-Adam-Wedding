import Panel from "@/components/Panel";
import GuestListManager, {
  type AdminParty,
} from "@/components/admin/GuestListManager";
import CsvImportPanel from "@/components/admin/CsvImportPanel";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface PartyRow {
  id: string;
  label: string;
}

interface GuestRow {
  id: string;
  party_id: string;
  full_name: string;
}

export default async function AdminGuestListPage() {
  const supabase = await createClient();
  const [partiesResult, guestsResult] = await Promise.all([
    supabase.from("parties").select("id, label").returns<PartyRow[]>(),
    supabase
      .from("guests")
      .select("id, party_id, full_name")
      .returns<GuestRow[]>(),
  ]);

  const error = partiesResult.error || guestsResult.error;

  const parties: AdminParty[] =
    partiesResult.data
      ?.map((party) => ({
        id: party.id,
        label: party.label,
        guests: (guestsResult.data ?? []).filter(
          (guest) => guest.party_id === party.id
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          Guest List
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Manage parties and guests. RSVP responses live on the RSVPs tab
          once guests start responding.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading the guest list. Please try again in
            a bit.
          </p>
        </Panel>
      ) : (
        <>
          <GuestListManager parties={parties} />
          <CsvImportPanel />
        </>
      )}
    </div>
  );
}
