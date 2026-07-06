import Panel from "@/components/Panel";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface PartyRow {
  id: string;
  label: string;
  responded_at: string | null;
  message: string | null;
}

interface GuestRow {
  id: string;
  party_id: string;
  full_name: string;
  attending: boolean | null;
  dietary_notes: string | null;
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Panel className="flex flex-col items-center gap-1 p-4 text-center">
      <span className="font-heading text-3xl text-accent">{value}</span>
      <span className="text-xs uppercase tracking-wide text-foreground/60">
        {label}
      </span>
    </Panel>
  );
}

export default async function AdminRsvpsPage() {
  const supabase = await createClient();
  const [partiesResult, guestsResult] = await Promise.all([
    supabase
      .from("parties")
      .select("id, label, responded_at, message")
      .returns<PartyRow[]>(),
    supabase
      .from("guests")
      .select("id, party_id, full_name, attending, dietary_notes")
      .returns<GuestRow[]>(),
  ]);

  const error = partiesResult.error || guestsResult.error;
  const parties = partiesResult.data ?? [];
  const guests = guestsResult.data ?? [];

  const guestsByParty = new Map<string, GuestRow[]>();
  for (const guest of guests) {
    const list = guestsByParty.get(guest.party_id) ?? [];
    list.push(guest);
    guestsByParty.set(guest.party_id, list);
  }

  const guestsAttending = guests.filter((g) => g.attending === true).length;
  const guestsDeclined = guests.filter((g) => g.attending === false).length;
  const guestsNotResponded = guests.filter((g) => g.attending === null).length;
  const partiesResponded = parties.filter((p) => p.responded_at).length;

  const notResponded = [...parties]
    .filter((p) => !p.responded_at)
    .sort((a, b) => a.label.localeCompare(b.label));

  const responded = [...parties]
    .filter((p) => p.responded_at)
    .sort((a, b) => (b.responded_at ?? "").localeCompare(a.responded_at ?? ""));

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-6 text-center sm:p-8">
        <h2 className="font-heading text-2xl tracking-wide text-accent">
          RSVPs
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          Live headcounts and responses from the public RSVP page.
        </p>
      </Panel>

      {error ? (
        <Panel className="p-6 text-center">
          <p className="text-sm text-foreground/90">
            Something went wrong loading RSVPs. Please try again in a bit.
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Attending" value={guestsAttending} />
            <StatTile label="Declined" value={guestsDeclined} />
            <StatTile label="Not Yet Responded" value={guestsNotResponded} />
            <StatTile
              label="Parties Responded"
              value={`${partiesResponded} / ${parties.length}`}
            />
          </div>

          <a
            href="/admin/rsvps/export"
            className="mx-auto w-fit rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream dark:text-night"
          >
            Export CSV
          </a>

          <section className="flex flex-col gap-3">
            <h3 className="font-heading text-xl text-accent">
              Waiting to Hear From ({notResponded.length})
            </h3>
            {notResponded.length === 0 ? (
              <p className="text-center text-sm italic text-foreground/60">
                Everyone has responded!
              </p>
            ) : (
              <Panel className="flex flex-col gap-2 p-5 sm:p-6">
                {notResponded.map((party) => (
                  <div
                    key={party.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-t border-dahlia/10 pt-2 first:border-t-0 first:pt-0 dark:border-cream/10"
                  >
                    <span className="text-sm font-medium text-foreground/90">
                      {party.label}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {(guestsByParty.get(party.id) ?? [])
                        .map((g) => g.full_name)
                        .join(", ")}
                    </span>
                  </div>
                ))}
              </Panel>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-heading text-xl text-accent">
              Responses ({responded.length})
            </h3>
            {responded.length === 0 ? (
              <p className="text-center text-sm italic text-foreground/60">
                No responses yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {responded.map((party) => {
                  const partyGuests = guestsByParty.get(party.id) ?? [];
                  const dietaryNotes = partyGuests.find(
                    (g) => g.dietary_notes
                  )?.dietary_notes;

                  return (
                    <Panel
                      key={party.id}
                      className="flex flex-col gap-2 p-5 sm:p-6"
                    >
                      <h4 className="font-heading text-lg text-accent">
                        {party.label}
                      </h4>
                      <ul className="flex flex-col gap-1 text-sm text-foreground/90">
                        {partyGuests.map((guest) => (
                          <li
                            key={guest.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>{guest.full_name}</span>
                            <span
                              className={
                                guest.attending
                                  ? "text-pine"
                                  : "text-dahlia dark:text-ember"
                              }
                            >
                              {guest.attending ? "Attending" : "Not attending"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {dietaryNotes && (
                        <p className="text-xs text-foreground/70">
                          <span className="font-medium">Dietary notes:</span>{" "}
                          {dietaryNotes}
                        </p>
                      )}
                      {party.message && (
                        <p className="text-xs text-foreground/70">
                          <span className="font-medium">Message:</span>{" "}
                          {party.message}
                        </p>
                      )}
                      <p className="text-[11px] uppercase tracking-wide text-foreground/50">
                        Responded{" "}
                        {new Date(party.responded_at!).toLocaleString()}
                      </p>
                    </Panel>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
