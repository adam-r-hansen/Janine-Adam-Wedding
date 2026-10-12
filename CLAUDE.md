# Janine & Adam's Wedding Website

Wedding: Saturday, October 17, 2026 — University Place, WA.
This site is the guest hub for a wedding where many guests are from out of town.
It must be beautiful, simple, and flawless on mobile (most guests will visit on phones).

## Working with the owner — READ THIS FIRST

- The owner (Adam) is brand new to coding. Explain every change in plain English
  before making it. Avoid jargon; when jargon is unavoidable, define it.
- Always show and write COMPLETE files, never partial snippets or "add this line
  here" instructions. Adam responds best to full-file updates.
- Make one change at a time. After each change, tell Adam exactly how to verify
  it worked (what to click, what he should see).
- Never run destructive commands (deleting files, dropping tables, force pushes)
  without explaining the consequence and asking first.
- Keep solutions simple. Prefer boring, well-understood patterns over clever ones.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres database, Auth (admins only), Storage (photos)
- Hosted on Vercel; code on GitHub
- No other services or paid dependencies without asking.

## Access model

- The ENTIRE public site sits behind one shared guest password (from the paper
  invitations). Implemented in `middleware.ts`: checks a cookie; if absent,
  redirect to `/enter-password`. Correct password (compared against the
  `SITE_PASSWORD` environment variable) sets a long-lived cookie.
- Guests never create accounts.
- `/admin` is additionally protected by Supabase Auth. Exactly two users exist:
  Janine and Adam. There is no signup flow — accounts are created manually in
  the Supabase dashboard.
- Row Level Security on every table: public (anon) read, authenticated write.
- Guest photo uploads are the one anon write path: inserts allowed into
  `photos` with `approved = false`; only admins can set `approved = true`.

## Pages

1. `/` Home — hero over the mountain artwork: names, date, countdown, venue
   line, short editable welcome message. Content from `site_settings`.
2. `/schedule` — event cards: name, date, start/end time, venue name + address
   (plain text, with separate "Open in Apple Maps" / "Open in Google Maps"
   pill buttons), description, dress code. Ordered.
3. `/travel` — editable intro block (airports, getting here) + hotel cards:
   photo, name, description, address (optional — shows the same Apple/Google
   Maps buttons as Schedule when set), distance from venue, price range,
   booking link, room-block code and deadline.
4. `/things-to-do` — recommendation cards with filter tabs: Activities vs
   Food & Drink. Each: photo, name, category, personal blurb, address
   (optional, same map buttons as above), neighborhood, link. This page
   should feel personal — the blurbs are the couple's voice.
5. `/faq` — question/answer pairs, ordered.
6. `/rsvp` — guest-list lookup flow (see RSVP section below).
7. `/honeymoon` — the honeymoon fund page (in lieu of a traditional
   registry). Editable intro paragraph, then a checklist of "experiences"
   guests tick, an optional "send whatever amount feels right" custom
   amount, a running "Your gift" total, and a name + optional message.
   Submitting records a pending contribution and hands the guest off to
   Venmo. Content from `site_settings` (`registry_intro` — key name
   predates the page being renamed from "Registry" to "Honeymoon";
   nothing user-facing says "registry" — plus `venmo_username` and
   `honeymoon_payment_note`). See "Honeymoon fund" below. The old
   `registry_url` HoneyFund link is retired.
8. `/gallery` — two sections: "Our photos" and "Guest photos". Guests can
   upload; uploads are hidden until approved in admin. Captions show in the
   lightbox (cream text, centered, below the enlarged photo).
9. `/guestbook` — guests leave a name + written note; same moderation
   pattern as guest photos (unapproved until admin approves). Approved
   notes show newest-first with a friendly date.
10. `/enter-password` — the shared-password gate. Warm, on-brand, one field.
11. `/admin` — dashboard behind Supabase Auth login. Tabs: Settings, Events,
    Hotels, Things to Do, Honeymoon (the fund's experiences —
    add/edit/hide/delete/reorder), Gifts (the contributions dashboard —
    see "Honeymoon fund" below), FAQs, Guest List, RSVPs, Seating (assign
    confirmed parties to tables — see "Seating chart" below), Photos
    (approval queue + upload), Guestbook (approval queue). Most content
    types get add/edit/delete/reorder.
12. `/seating` — "Find Your Table": a guest types their name and sees
    their table number. Hidden until an admin flips "Publish seating
    chart" on; until then the page says seating will be posted soon and
    "Seating" is left out of the nav. See "Seating chart" below.

## RSVP model (guest-list lookup, not open form)

- Guests type their name (3+ characters); forgiving search (partial,
  case-insensitive) finds their PARTY; they respond for everyone on the
  invitation. Search is submit-on-click, not live type-ahead — a
  reasonable-enough simplification for now, could become live later.
- Per guest: attending yes/no. Per party: dietary notes (free text, kept in
  sync across every guest row in the party — see below), optional message
  to the couple (`parties.message`, added in stage 2 via
  `add-rsvp-message-column.sql`; run once in the Supabase SQL Editor). NO
  meal selection.
- Under the search box, always show a fallback: "Can't find your name? Text us!"
- Unknown plus-ones are pre-added as named placeholders (e.g. "Sarah's Guest").
- Admin: Guest List tab (add/edit parties & guests, CSV import), RSVP tab
  (responses, live headcounts, who has NOT responded, CSV export).

### The concierge (public RSVP's server-side access to `parties`/`guests`)

`parties` and `guests` are **admin-only** RLS — unlike most tables, there is
no public read/write at all, since this data is guest PII. The public RSVP
flow therefore cannot use the anon or cookie-based clients; it goes through
`lib/supabase-service.ts`, which creates a client using
`SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS entirely). That file starts with
`import "server-only"`, which makes the *build itself fail* if it's ever
imported into a Client Component — the one time this was tested on purpose
(a throwaway client-side import), the build correctly refused to compile.

The service-role client is used in exactly two places, both Server
Actions: `app/rsvp/actions.ts` (the RSVP flow) and `app/seating/actions.ts`
(the "Find Your Table" lookup — see "Seating chart" below). Each is scoped
as narrowly as possible — never a generic query passthrough. Don't add a
third caller without a good reason.

Both share one name search, `lib/guest-search.ts` (also `import
"server-only"`). Its `findMatchingParties(supabase, query, {
attendingOnly })` only answers "which parties match this name, and how
closely" — a map of party id → match distance (0 = exact/prefix). It runs
in two tiers: a case-insensitive substring match first; only if that finds
nothing, a typo-tolerant fallback in plain TypeScript (accent/apostrophe/
hyphen-insensitive, prefix matches, plus a length-scaled Levenshtein edit
budget, so "Janene" finds "Janine"). Queries under 3 characters return
nothing; callers cap at `MAX_RESULTS` (8). Each caller then decides,
narrowly, what to fetch and show about the matched parties.

In `app/rsvp/actions.ts`:
- `searchParties(query)` — the fuzzy, multi-party search. Returns only
  `{ partyId, label, firstNames }` per match, **never** attending status,
  dietary notes, or full surnames — a search match isn't proof the
  searcher belongs to that party.
- `getPartyForResponse(partyId)` — called only after a guest taps one
  specific party from their search results. This is the one place
  response status/dietary notes/message are ever read, to pre-fill the
  form ("Looks like you've already responded — feel free to update.").
- `submitRsvp(...)` — re-fetches the party's real guest ids server-side
  and rejects the submission if the posted ids don't match exactly,
  before writing anything.
- The admin RSVPs dashboard (`/admin/rsvps`) does NOT use the service-role
  client — it's a normal authenticated admin page, reading `parties`/
  `guests` through the same cookie-based `lib/supabase-server.ts` client
  every other admin page uses, since RLS already permits admin reads.

## Seating chart

Each party sits together at one table: `parties.table_number` (nullable
integer; null = unassigned). Seating is per party, not per guest.

Three `site_settings` keys drive it:
- `seating_table_count` — how many tables exist (Table 1..N). Not editable
  in admin; set it directly in Supabase. If it's missing or zero, the
  admin page says so and offers no tables.
- `seating_seats_per_table` — capacity, chosen in admin from a dropdown
  limited to 4–8 (`lib/seating.ts` holds `MIN_SEATS_PER_TABLE` /
  `MAX_SEATS_PER_TABLE`, shared by the dropdown and its Server Action).
- `seating_published` — the "Publish seating chart" switch. Only the exact
  string `"true"` counts as published; a missing row means hidden.

Admin (`/admin/seating`, normal cookie-based admin client): lists only
**confirmed** parties (at least one guest `attending = true`), and only
attending guests count toward a table's seats. A dropdown per party picks
a table or "Unassigned"; each table shows its headcount and an
"Over by N" warning if it's past capacity (a warning, not a block). The
Server Action re-checks the table number against `seating_table_count`
rather than trusting the dropdown. Toggling publish also revalidates the
root layout so the nav link appears/disappears everywhere.

Public (`/seating` + `app/seating/actions.ts`'s `findTable(query)`, via
the service-role client): re-checks `seating_published` itself before
doing anything (the action can be called directly, not just from the
page), searches with `findMatchingParties(..., { attendingOnly: true })`,
and returns only `{ names, tableNumber }` per match — attending guests'
names and the table number. Never party labels, ids, dietary notes,
messages, or guests who aren't coming. The root layout (`app/layout.tsx`)
reads `seating_published` and passes `showSeating` to `NavBar` and
`DrawerShell`, which both build their links from `getNavLinks(showSeating)`
in `components/NavBar.tsx`.

## Honeymoon fund

The `/honeymoon` page replaced the old "one button to HoneyFund" page.
Guests build a gift out of the couple's own suggestions and pay through
Venmo. `registry_url` is gone.

### Experiences are buckets, not inventory

The rows in `honeymoon_items` ("a night in a mountain cabin", "dinner
out in Reykjavik") are **funding buckets**, not things for sale. They
never sell out, are never reserved, and any number of guests can put
money toward the same one. Do not add "claimed" / "remaining" / "only
one left" logic — that's a different, worse page.

`goal_cents` exists in the schema but is **deliberately unused**. There
are no progress bars anywhere, by design: a fundraising thermometer
turns a warm "here are some ideas if you asked" page into a campaign
with a target, and that's the wrong tone for a wedding. Leave it null;
don't build UI on it without an explicit decision to change the tone.

### The site cannot confirm payment

Venmo has no API for personal accounts, so the site has **no way to know
a payment actually arrived**. The flow works around that:

- Submitting the form inserts a row into `honeymoon_contributions` with
  `status = 'pending'`. That's all the site can assert — "a guest said
  they're sending this".
- Each contribution gets a 5-character **claim code** from the alphabet
  `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no `0/O/1/I/L` — it has to survive
  being read off one phone and typed into another). It goes into the
  Venmo note as `Janine & Adam honeymoon - {code}`.
- An admin works `/admin/contributions` ("Gifts" tab): a Venmo
  notification comes in, they search the code or the name, tap **Mark
  received** (`status = 'received'`, `received_at = now()`). A separate
  **thank-you sent** checkbox (`thanked_at`) tracks follow-up. There's a
  **Move back to pending** undo and a **Cancel this one** for gifts that
  never turn up. The three summary figures (received total, pending
  total, received-but-not-thanked count) all key off `status` /
  `thanked_at`, so they only ever reflect what an admin has confirmed.
- Every label that touches "received" says, in some form, that it means
  *an admin confirmed the Venmo payment landed* — never let the UI imply
  the site verified anything.

### Anon may INSERT into `honeymoon_contributions`, never SELECT

Same trusted-anon-write pattern as guest photos and the guestbook — but
with a tighter read rule. Anon can INSERT (RLS `WITH CHECK` requires
`status = 'pending'`, `received_at` null, `thanked_at` null) and can
**never SELECT**. Guests must not be able to browse what other guests
gave. `honeymoon_contribution_lines` is the same: anon INSERT only.

Consequence for code: `.insert().select()` **will fail** on those tables
(the `.select()` half is a blocked read). So the public Server Action
(`app/honeymoon/actions.ts`) generates the row id itself with
`crypto.randomUUID()`, passes it into the insert, and reuses that id for
the line rows. The admin Gifts dashboard reads both tables normally
through the cookie-based `lib/supabase-server.ts` client, since RLS lets
authenticated users read everything.

### Never navigate to Venmo programmatically

iOS Safari blocks `window.open` / `location.assign` to an external app
when it happens after an `await` (the tap's "user gesture" has expired
by then). So the confirmation panel does **not** redirect. It shows a
real `<a href>` the guest taps themselves, plus the handle, the amount,
and the note (with the claim code) as plain selectable text for anyone
whose link doesn't open. Keep it that way.

### Copy rules for `/honeymoon`

The page has to read as a response to guests who *asked* for a way to
give — not a request, and definitely not a store. Never use the words
**Cart, Checkout, Buy, Purchase, Price, Subtotal, or Order** anywhere on
it. Amounts are "suggested" (`$210 suggested`). The running total is
**"Your gift"**, never "Total" or "Subtotal". The page ends on a line
that lets people off the hook entirely.

## Database tables

- `site_settings` — key/value: hero photo, welcome text, date, venue, password
  hints, etc. Honeymoon-page keys: `registry_intro` (the intro paragraph
  — key name predates the "Registry" → "Honeymoon" rename), `venmo_username`
  (the couple's Venmo handle, stored **without** the leading `@` so the
  payment link builds cleanly), and `honeymoon_payment_note` (optional
  small print shown on the confirmation panel). The old `registry_url`
  key is retired — nothing reads it. Seating keys: `seating_table_count`,
  `seating_seats_per_table`, `seating_published` (see "Seating chart").
- `events` — title, date, start_time, end_time, venue_name, address,
  description, dress_code, sort_order
- `hotels` — name, photo_url, description, address (optional), distance,
  price_range, booking_url, room_block_code, book_by_date, sort_order
- `activities` — name, category ('activity' | 'food_drink'), photo_url, blurb,
  address (optional), neighborhood, link_url, sort_order
- `faqs` — question, answer, sort_order
- `parties` — label, responded_at, message, table_number (nullable
  integer, null = unassigned — see "Seating chart")
- `guests` — party_id, full_name, attending (null | true | false),
  dietary_notes
- `photos` — storage_path, caption, album ('ours' | 'guests'), uploader_name,
  approved (boolean, default false), created_at, sort_order (nullable
  integer — new photos arrive with a null sort_order and therefore sort to
  the bottom until an admin drags them, which is intentional; added via
  `add-photo-sort-order.sql`, run manually in the SQL Editor like every
  other schema change)
- `guestbook_entries` — author_name (max 100 chars), message (max 1000
  chars), approved (boolean, default false), created_at. RLS mirrors
  `photos`: anon may SELECT only approved rows and INSERT only with
  approved = false; authenticated has full SELECT/UPDATE/DELETE. Created
  via `create-guestbook-table.sql` (run manually in the SQL Editor, same
  as every other schema change — see "Supabase project + tables + RLS"
  below).
- `honeymoon_items` — title (≤120), blurb (nullable, ≤500), photo_url
  (nullable), suggested_cents (integer, >0), goal_cents (nullable,
  deliberately unused — see "Honeymoon fund"), is_active (boolean,
  default true — the "hidden from guests" toggle in admin), sort_order
  (nullable integer, nulls sort last), created_at. Amounts are stored as
  **integer cents**, never floats; `lib/format.ts` has the paired
  `formatCurrencyFromCents` / `parseDollarsToCents` helpers — don't write
  another.
- `honeymoon_contributions` — claim_code (text, unique, 4–8 chars — see
  "Honeymoon fund" for the alphabet), guest_name (≤120; the form inserts
  `"Anonymous"` when a guest leaves it blank, since the column is NOT
  NULL), guest_email (nullable, kept in the schema but the form no longer
  collects it), message (nullable, ≤1000), amount_cents (integer, >0 —
  the server recomputes this from the ticked items' `suggested_cents`
  plus the custom amount; the browser's number is never trusted), status
  (`'pending' | 'received' | 'cancelled'`, default `'pending'`),
  received_at, thanked_at, created_at. RLS: anon may INSERT only (with
  `status = 'pending'` and `received_at` / `thanked_at` null) and may
  **never SELECT**; authenticated has full access.
- `honeymoon_contribution_lines` — contribution_id (FK, `ON DELETE
  CASCADE`), item_id (nullable FK to `honeymoon_items`, `ON DELETE SET
  NULL`), item_title (≤120, a snapshot taken at submit time so a later
  edit to the item doesn't rewrite history), amount_cents. One row per
  ticked experience, plus one with `item_id` null and title
  `"Their own amount"` for the custom amount. Same RLS as
  `honeymoon_contributions` (anon INSERT only, no SELECT). If the line
  inserts fail the Server Action still returns success — the headline
  `amount_cents` is the number that matters.
- The three `honeymoon_*` tables were created via
  `create-honeymoon-fund-tables.sql` (repo root), run manually in the
  Supabase SQL Editor like every other schema change. That file is the
  record of the table structure; the RLS policies were applied in the
  dashboard.
- Storage bucket: `photos` (public read; anon may only write into `guests/`;
  authenticated has full access), with three folders:
  - `ours/` — admin-uploaded wedding photos (`/admin/photos`)
  - `guests/` — guest uploads from the public `/gallery` page (anon write)
  - `content/` — hotel/activity photos, set via each editor's image picker
- All uploads are resized/compressed in the browser first (long edge ~2000px,
  JPEG) via `lib/storage.ts`'s `resizeImage`, so phone photos (often
  5-10MB) never ship to guests at full size. `getPhotoPublicUrl` builds a
  photo's public URL from its `storage_path` (no network call — safe to use
  in Server Components with the plain anon client).

Admin image fields (Hotels, Things to Do) currently support two paths:
direct upload into `content/`, or pasting an image URL manually — pasted
URLs are hotlinked as-is, NOT copied into our Storage, so they depend on
the source staying up. The originally-envisioned "fetch from link"
convenience (server-side fetch of a URL's Open Graph preview image, saved
into our own Storage so the live site only ever serves from Storage) is
deferred future work.

## Design system — the site should feel like the invitation

Guiding principle: guests should feel like the paper invitation came to life.
Watercolor autumn mountains, generous whitespace, elegant restraint.

### Backgrounds
- Four files in `public/backgrounds/`: bg-mobile-light.webp, bg-mobile-dark.webp,
  bg-desktop-light.webp, bg-desktop-dark.webp.
- The artwork anchors the BOTTOM of the viewport (mountains/forest at bottom,
  open sky above). Use `background-position: bottom center`,
  `background-size: cover`, fixed attachment (content scrolls over it).
- Mobile vs desktop file chosen by orientation/width media query; light vs dark
  by `prefers-color-scheme`.
- Content sits on softly translucent panels (cream-tinted in light mode,
  charcoal in dark) floating in the "sky" area, with rounded corners.

### Colors (sampled from the artwork — do not invent new colors)
- Deep dahlia `#81270B` — PRIMARY. Buttons, links, headings in light mode.
- Cream sky `#FEF6EE` — light-mode background/base.
- Night sky `#312C2C` — dark-mode background/base.
- Burnt orange `#E7823B` — links & accents in DARK mode (dahlia is too dark
  on charcoal; this is the dark-mode counterpart to dahlia).
- Golden `#EDA55E` — badges, highlights, subtle warmth.
- Muted pine `#474930` — quiet secondary; success/confirmed states.
- Dark mode is mandatory and first-class. Every screen must be checked in both.
- Text-on-fill pairing: `bg-gold` is light in BOTH themes, so text on it
  is `text-night` with **no `dark:` variant** (e.g. the "Send with Venmo"
  button on `/honeymoon`, all the gold pill badges). `bg-accent` is the
  one that flips — it's dahlia in light mode, ember in dark — so text on
  it is `text-cream dark:text-night`.

### Typography
- Headings: Cormorant Garamond (Google Fonts) — often letter-spaced capitals,
  echoing the invitation's "J A N I N E   D E E G A N" treatment.
- Script accents: Pinyon Script (Google Fonts) — tiny romantic touches only
  ("and", section flourishes). Never for body text or anything long.
- Body: clean, highly readable sans-serif (system stack or Inter).

## Conventions

- Mobile-first. Test at 390px width mentally before desktop.
- Accessible: real labels on inputs, alt text on images, visible focus states,
  color contrast respected (dahlia-on-cream and orange-on-charcoal both pass).
- All content comes from Supabase — no hardcoded events/hotels/FAQ text in
  components. Placeholder seed data is fine during development.
- Keep components in `/components`, Supabase helpers in `/lib`.
- `components/MapButtons.tsx` is the shared "Open in Apple Maps" / "Open in
  Google Maps" pill-button pair — takes one `query` string (e.g. "Venue
  Name, address"), URL-encodes it, and renders both links. Used by
  EventCard (Schedule), HotelCard (Travel), and ActivityCard (Things to
  Do); reach for it instead of re-inlining the map links a fourth time.
- Environment variables: `SITE_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-side
  only — see "The concierge" under RSVP model; never given a `NEXT_PUBLIC_`
  prefix, only ever imported via `lib/supabase-service.ts`), and
  `GUEST_LINK_KEY` (server-side only — the QR-code magic link; see the
  password gate entry under "Build order & status"). Never commit
  secrets; `.env.local` stays gitignored.

## Build order & status

- [x] Blueprint (this file)
- [x] Scaffold Next.js project
- [ ] Global design foundation: backgrounds, palette, fonts, translucent panel
      component, nav
- [x] Password gate (`proxy.ts` + `/enter-password`) — lives in the same
      `proxy.ts` file that already protected `/admin`, as a first check that
      now runs for the whole site (including `/admin`, on top of its
      existing Supabase Auth check). The gate cookie stores a SHA-256 hash
      of `SITE_PASSWORD`, not the password itself; comparison happens only
      in `proxy.ts` and the `/enter-password` Server Action, both
      server-side — `SITE_PASSWORD` is never sent to the browser.
      **Magic link:** any URL with `?key=<GUEST_LINK_KEY>` (intended use:
      the seating QR code, `https://janineandadam.com/seating?key=...`)
      gets the same guest cookie, then a redirect to the same URL minus
      `key`. A wrong/missing key, or `GUEST_LINK_KEY` unset, falls through
      to the normal gate. It only opens the guest door — `/admin` still
      needs Supabase login. `GUEST_LINK_KEY` is deliberately separate from
      `SITE_PASSWORD` so printed QR codes survive a password change
      (changing `SITE_PASSWORD` still logs everyone out, magic-link
      visitors included, until they rescan). Cookie settings live once in
      `lib/guest-access.ts` (`GUEST_COOKIE_OPTIONS`), shared by both doors.
- [x] Supabase project + tables + RLS — tables were created directly in the
      Supabase dashboard's SQL Editor to match the schema above. There is no
      table-creation SQL checked into this repo; the dashboard is the source
      of truth for schema changes. `seed.sql` (repo root) holds the initial
      content INSERTs only.
- [x] Admin login + FAQ editor end-to-end (this becomes the template pattern)
      — `/admin/login` (Supabase Auth email/password), route-protection for
      everything under `/admin` lives in `proxy.ts` at the repo root (Next.js
      16 renamed the old `middleware.ts` convention to `proxy.ts` — same job,
      new file name). `lib/supabase-server.ts` and `lib/supabase-browser.ts`
      are the cookie-aware Supabase clients used for auth; `lib/supabase.ts`
      is unchanged and still just serves the public, anonymous-read pages.
- [x] Remaining admin editors: settings, events, hotels, activities — all
      four follow the FAQ editor's Server Action pattern (list, add, inline
      edit, delete-with-confirmation, up/down reorder via `sort_order`).
      Two deviations, both content-driven, not template changes:
      - `/admin/settings` isn't a list — `site_settings` is a fixed set of
        key/value rows, so it's a single form instead of add/delete/reorder.
        It also collapses `wedding_date_label` and `wedding_datetime` into
        one "Wedding date & time" picker; saving derives the human-readable
        label from the picked instant so the two keys can't drift apart.
        The picker assumes Pacific time and hardcodes an Oct-appropriate
        `-07:00` offset rather than pulling in a timezone library — fine
        for a date that's set once, but would need revisiting if the
        wedding date ever moved to a different DST season.
      - `/admin/hotels` and `/admin/things-to-do` originally showed
        `photo_url` as a plain text field pending the Photos milestone —
        superseded below, both now use the real `ImagePicker`.
- [x] Public pages reading live data
      - [x] FAQ
      - [x] Home
      - [x] Schedule
      - [x] Travel
      - [x] Things to Do
      - [x] Gallery
      - [x] RSVP
- [x] Guest list + RSVP flow
      - [x] Stage 1: admin guest-list management — `/admin/guest-list` has
            parties as cards (each with its guests, add/rename/delete —
            deleting a party warns it removes its guests too and does),
            add/rename/delete/move-to-another-party for individual guests,
            and a running "X parties, Y guests" total. Plus CSV import
            (`party,full_name` columns, matched case-insensitively so
            typos in casing don't create duplicate parties): shows a
            preview before writing anything, and is safe to re-run —
            existing parties get new guests added rather than duplicated,
            exact-duplicate guests are skipped and counted in the results.
            `lib/csv.ts` is a small hand-rolled parser (no new dependency)
            handling quoted fields with commas, escaped quotes, a header
            row in any capitalization or column order, and blank rows.
      - [x] Stage 2: the public `/rsvp` flow (search by name → tap your
            party → attending toggle per guest, dietary notes, message →
            warm confirmation, flavored by whether anyone said yes) and
            the admin `/admin/rsvps` dashboard (headline counts, the
            not-yet-responded chase list, full responses newest first,
            CSV export at `/admin/rsvps/export`). See "The concierge"
            above for how the public side reaches the admin-only
            `parties`/`guests` tables safely. Needs
            `add-rsvp-message-column.sql` run once before the message
            field will save.
- [x] Gallery + uploads + approval queue — `/admin/photos` (Our Photos
      upload with per-photo captions; guest-photo approval queue; approved
      guest photos, all delete-with-confirmation) and the public `/gallery`
      (real photo grids with a lightweight lightbox, plus the guest upload
      form using the anon Storage/table write path directly from the
      browser — no Server Action, since RLS is already the security
      boundary for that one anon-write path). `lib/storage.ts` holds the
      shared resize/upload/delete helpers used by all upload flows. Photo
      captions show in the lightbox now, in both the guest-photo
      ("Caption — Uploader" / "Shared by Uploader") and "ours" forms.
      Admins can also edit any photo's caption in place from
      `/admin/photos` (both photo tiles and the pending-approval cards),
      and can drag to reorder both the Our Photos and Approved Guest
      Photos grids — that order is what guests see on `/gallery`. Drag
      reordering uses `@dnd-kit` (`core`, `sortable`, `utilities`) with a
      200ms touch-hold delay before a drag starts, so the page still
      scrolls normally under a finger — important since Janine manages
      content from her phone.
- [x] Guestbook — `/guestbook` (name + note form, direct anon insert via
      `lib/supabase.ts` — same trusted anon-write path as the guest photo
      upload) and `/admin/guestbook` (Awaiting Approval / Approved,
      approve/reject/delete, following the PhotoManager pattern minus the
      upload step since there's no file involved). `guestbook_entries`
      table + RLS created via `create-guestbook-table.sql`, mirroring the
      `photos` moderation model exactly.
- [x] Honeymoon fund — the `/honeymoon` fund page (experience checklist +
      custom amount + Venmo handoff), the admin **Honeymoon** editor
      (`/admin/honeymoon` — add/edit/hide/delete/reorder the experiences,
      dnd-kit with the 200ms touch delay like Photos), and the admin
      **Gifts** dashboard (`/admin/contributions` — mark received / undo /
      cancel, thank-you tracking, search by claim code or name, delete
      behind a confirmation). Retired the "Visit Our HoneyFund" button
      and its `registry_url` setting; added `venmo_username` and
      `honeymoon_payment_note` to Settings. `create-honeymoon-fund-tables.sql`
      (repo root) was run manually in the Supabase SQL Editor like every
      other schema change; RLS policies applied in the dashboard. See
      "Honeymoon fund" above for the buckets-not-inventory model, why
      there are no progress bars, the claim-code / can't-confirm-payment
      flow, and the anon-INSERT-never-SELECT rule.
- [x] Seating chart — the admin **Seating** editor (`/admin/seating` —
      assign confirmed parties to tables, seats-per-table, publish
      switch) and the public `/seating` "Find Your Table" lookup, hidden
      from guests and the nav until published. The RSVP name search was
      pulled out of `app/rsvp/actions.ts` into `lib/guest-search.ts` so
      both lookups share it. `parties.table_number` and the three
      `seating_*` settings are recorded in `create-seating.sql` (repo
      root), which was already applied to the live database — do not
      re-run it. See "Seating chart" above.
- [ ] Deploy to Vercel, custom domain, guest password set
