// Small helpers for turning plain database values (ISO dates, 24-hour
// times) into the human-friendly strings the page components expect,
// e.g. "2026-10-17" -> "Saturday, October 17, 2026" and "18:00:00" -> "6:00 PM".
//
// formatEventDate/formatShortDate/formatTime read plain DATE/TIME columns,
// which have no timezone of their own — they're pinned to "UTC" here only
// as a trick to stop JavaScript's Date from silently shifting them by the
// machine's local offset, not because the values are actually in UTC.
//
// formatDateTime/formatTimestampDate are different: they read Postgres
// timestamptz columns (parties.responded_at, guestbook_entries.created_at,
// etc.), which ARE stored in UTC. Those two ALWAYS pass
// `timeZone: WEDDING_TIME_ZONE` on purpose. Locally the dev machine is on
// Pacific time, so a bare .toLocaleString() looks right — but Vercel's
// server runs in UTC, so without an explicit timeZone the exact same code
// renders times hours off once deployed. Never format a timestamptz value
// without going through one of these helpers.

export const WEDDING_TIME_ZONE = "America/Los_Angeles";

export function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Short form of a plain DATE column ("2026-10-12" -> "Oct 12, 2026"), e.g.
// other_gifts.received_on. Split into parts rather than handed to
// new Date("2026-10-12") — that parses as UTC midnight, which is the
// previous evening in Pacific time, so the day would show one early.
export function formatDateOnly(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Today's date as a "YYYY-MM-DD" string (the format a date input and a
// DATE column both use), in the wedding's time zone rather than UTC — so
// late on a Pacific evening it's still "today", not tomorrow.
export function todayDateOnly(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: WEDDING_TIME_ZONE,
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatTime(timeStr: string): string {
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: WEDDING_TIME_ZONE,
  });
}

export function formatTimestampDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: WEDDING_TIME_ZONE,
  });
}

// Turns an integer number of cents (how honeymoon_items stores an amount)
// into a "$1,234.00" string. Works purely on integers — the dollars and
// cents parts are split with division and modulo, never by dividing into
// a floating-point dollar value — so amounts can't drift by a rounding
// error.
export function formatCurrencyFromCents(cents: number): string {
  const rounded = Math.round(cents);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${String(remainder).padStart(
    2,
    "0"
  )}`;
}

// The inverse of formatCurrencyFromCents for form input: takes dollars as
// a person typed them ("210", "210.50", "$1,200") and returns an integer
// number of cents, or a friendly error message. Never uses floating point
// — the whole-dollars half and the cents half are parsed as separate
// integers and combined — so the stored amount can't pick up a rounding
// error, and more than two decimal places is rejected outright. Callers
// that treat the amount as optional must check for an empty string before
// calling.
export function parseDollarsToCents(
  raw: string
): { cents: number } | { error: string } {
  const cleaned = raw.replace(/^\$/, "").replace(/,/g, "").trim();

  if (!cleaned) {
    return { error: "Please enter an amount." };
  }

  const match = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    return {
      error:
        "Please enter the amount as a number of dollars, like 210 or 210.50.",
    };
  }

  const dollars = Number(match[1]);
  const centsPart = match[2] ? Number(match[2].padEnd(2, "0")) : 0;
  const cents = dollars * 100 + centsPart;

  if (cents <= 0) {
    return { error: "Please enter an amount greater than zero." };
  }

  return { cents };
}
