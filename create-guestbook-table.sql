-- Guestbook feature: guests leave a written note, which only appears
-- publicly once an admin approves it — the exact same moderation
-- pattern already used for guest photos.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run: CREATE
-- TABLE IF NOT EXISTS and DROP POLICY IF EXISTS guard against errors
-- on a second run.

create table if not exists guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) <= 100),
  message text not null check (char_length(message) <= 1000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table guestbook_entries enable row level security;

drop policy if exists "Public can read approved entries" on guestbook_entries;
create policy "Public can read approved entries"
  on guestbook_entries for select
  to anon
  using (approved = true);

drop policy if exists "Public can submit unapproved entries" on guestbook_entries;
create policy "Public can submit unapproved entries"
  on guestbook_entries for insert
  to anon
  with check (approved = false);

drop policy if exists "Admins can read all entries" on guestbook_entries;
create policy "Admins can read all entries"
  on guestbook_entries for select
  to authenticated
  using (true);

drop policy if exists "Admins can update entries" on guestbook_entries;
create policy "Admins can update entries"
  on guestbook_entries for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins can delete entries" on guestbook_entries;
create policy "Admins can delete entries"
  on guestbook_entries for delete
  to authenticated
  using (true);
