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
   (tappable link to Apple/Google Maps), description, dress code. Ordered.
3. `/travel` — editable intro block (airports, getting here) + hotel cards:
   photo, name, description, distance from venue, price range, booking link,
   room-block code and deadline.
4. `/things-to-do` — recommendation cards with filter tabs: Activities vs
   Food & Drink. Each: photo, name, category, personal blurb, neighborhood,
   link. This page should feel personal — the blurbs are the couple's voice.
5. `/faq` — question/answer pairs, ordered.
6. `/rsvp` — guest-list lookup flow (see RSVP section below).
7. `/gallery` — two sections: "Our photos" and "Guest photos". Guests can
   upload; uploads are hidden until approved in admin.
8. `/enter-password` — the shared-password gate. Warm, on-brand, one field.
9. `/admin` — dashboard behind Supabase Auth login. Tabs: Settings, Events,
   Hotels, Things to Do, FAQs, Guest List, RSVPs, Photos (approval queue +
   upload). Every content type gets add/edit/delete/reorder.

## RSVP model (guest-list lookup, not open form)

- Guests type their name; forgiving search (partial, case-insensitive,
  type-ahead) finds their PARTY; they respond for everyone on the invitation.
- Per guest: attending yes/no. Per party: dietary notes (free text), optional
  message to the couple. NO meal selection.
- Under the search box, always show a fallback: "Can't find your name? Text us!"
- Unknown plus-ones are pre-added as named placeholders (e.g. "Sarah's Guest").
- Admin: Guest List tab (add/edit parties & guests, CSV import), RSVP tab
  (responses, live headcounts, who has NOT responded, CSV export).

## Database tables

- `site_settings` — key/value: hero photo, welcome text, date, venue, password
  hints, etc.
- `events` — title, date, start_time, end_time, venue_name, address,
  description, dress_code, sort_order
- `hotels` — name, photo_url, description, distance, price_range, booking_url,
  room_block_code, book_by_date, sort_order
- `activities` — name, category ('activity' | 'food_drink'), photo_url, blurb,
  neighborhood, link_url, sort_order
- `faqs` — question, answer, sort_order
- `parties` — label, responded_at
- `guests` — party_id, full_name, attending (null | true | false),
  dietary_notes
- `photos` — storage_path, caption, album ('ours' | 'guests'), uploader_name,
  approved (boolean, default false), created_at
- Storage bucket: `photos` (also holds hotel/activity images).

Admin image fields support two paths: direct upload, and "fetch from link"
(server-side fetch of a URL's Open Graph preview image, saved into our own
Storage — the live site only ever serves images from our Storage).

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
- Environment variables: `SITE_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and server-side service key only if truly
  needed). Never commit secrets; `.env.local` stays gitignored.

## Build order & status

- [x] Blueprint (this file)
- [x] Scaffold Next.js project
- [ ] Global design foundation: backgrounds, palette, fonts, translucent panel
      component, nav
- [ ] Password gate (middleware + /enter-password)
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
      - `/admin/hotels` and `/admin/things-to-do` show `photo_url` as a
        plain optional text field (with an inline note) instead of an
        upload control, per the Photos milestone still being unbuilt.
- [ ] Public pages reading live data
      - [x] FAQ
      - [x] Home
      - [x] Schedule
      - [x] Travel
      - [x] Things to Do
      - [ ] RSVP — waiting on the guest-list lookup flow
      - [ ] Gallery — waiting on Supabase Storage
- [ ] Guest list + RSVP flow
- [ ] Gallery + uploads + approval queue
- [ ] Deploy to Vercel, custom domain, guest password set
