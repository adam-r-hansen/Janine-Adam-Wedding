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
7. `/gallery` — two sections: "Our photos" and "Guest photos". Guests can
   upload; uploads are hidden until approved in admin. Captions show in the
   lightbox (cream text, centered, below the enlarged photo).
8. `/guestbook` — guests leave a name + written note; same moderation
   pattern as guest photos (unapproved until admin approves). Approved
   notes show newest-first with a friendly date.
9. `/enter-password` — the shared-password gate. Warm, on-brand, one field.
10. `/admin` — dashboard behind Supabase Auth login. Tabs: Settings, Events,
    Hotels, Things to Do, FAQs, Guest List, RSVPs, Photos (approval queue +
    upload), Guestbook (approval queue). Every content type gets
    add/edit/delete/reorder.

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

Every use of that service-role client lives in `app/rsvp/actions.ts`
(Server Actions) and is scoped as narrowly as possible — never a generic
query passthrough:
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

## Database tables

- `site_settings` — key/value: hero photo, welcome text, date, venue, password
  hints, etc.
- `events` — title, date, start_time, end_time, venue_name, address,
  description, dress_code, sort_order
- `hotels` — name, photo_url, description, address (optional), distance,
  price_range, booking_url, room_block_code, book_by_date, sort_order
- `activities` — name, category ('activity' | 'food_drink'), photo_url, blurb,
  address (optional), neighborhood, link_url, sort_order
- `faqs` — question, answer, sort_order
- `parties` — label, responded_at
- `guests` — party_id, full_name, attending (null | true | false),
  dietary_notes
- `photos` — storage_path, caption, album ('ours' | 'guests'), uploader_name,
  approved (boolean, default false), created_at
- `guestbook_entries` — author_name (max 100 chars), message (max 1000
  chars), approved (boolean, default false), created_at. RLS mirrors
  `photos`: anon may SELECT only approved rows and INSERT only with
  approved = false; authenticated has full SELECT/UPDATE/DELETE. Created
  via `create-guestbook-table.sql` (run manually in the SQL Editor, same
  as every other schema change — see "Supabase project + tables + RLS"
  below).
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
  prefix, only ever imported via `lib/supabase-service.ts`). Never commit
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
- [x] Guestbook — `/guestbook` (name + note form, direct anon insert via
      `lib/supabase.ts` — same trusted anon-write path as the guest photo
      upload) and `/admin/guestbook` (Awaiting Approval / Approved,
      approve/reject/delete, following the PhotoManager pattern minus the
      upload step since there's no file involved). `guestbook_entries`
      table + RLS created via `create-guestbook-table.sql`, mirroring the
      `photos` moderation model exactly.
- [ ] Deploy to Vercel, custom domain, guest password set
