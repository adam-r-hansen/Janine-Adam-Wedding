import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// proxy.ts already blocks unauthenticated requests to anything under
// /admin before they ever reach here; this check is the same
// defense-in-depth pattern used by the admin dashboard layout.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: parties }, { data: guests }] = await Promise.all([
    supabase.from("parties").select("id, label"),
    supabase
      .from("guests")
      .select("party_id, full_name, attending, dietary_notes"),
  ]);

  const partyLabelById = new Map((parties ?? []).map((p) => [p.id, p.label]));

  const rows = (guests ?? [])
    .map((guest) => ({
      party: partyLabelById.get(guest.party_id) ?? "",
      fullName: guest.full_name,
      attending:
        guest.attending === true
          ? "Yes"
          : guest.attending === false
            ? "No"
            : "Not yet responded",
      dietaryNotes: guest.dietary_notes ?? "",
    }))
    .sort(
      (a, b) =>
        a.party.localeCompare(b.party) || a.fullName.localeCompare(b.fullName)
    );

  const lines = [
    ["party", "full_name", "attending", "dietary_notes"].map(escapeCsvField).join(","),
    ...rows.map((row) =>
      [row.party, row.fullName, row.attending, row.dietaryNotes]
        .map(escapeCsvField)
        .join(",")
    ),
  ];

  const csv = lines.join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="guest-list-rsvps.csv"',
    },
  });
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
