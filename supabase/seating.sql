alter table public.parties
  add column if not exists table_number smallint
  check (table_number >= 1);

insert into public.site_settings (key, value) values
  ('seating_published', 'false'),
  ('seating_table_count', '6'),
  ('seating_seats_per_table', '6')
on conflict (key) do nothing;
