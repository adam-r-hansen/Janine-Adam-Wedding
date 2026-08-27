create table if not exists honeymoon_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 120),
  blurb text check (char_length(blurb) <= 500),
  photo_url text,
  suggested_cents integer not null check (suggested_cents > 0),
  goal_cents integer check (goal_cents is null or goal_cents > 0),
  is_active boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists honeymoon_contributions (
  id uuid primary key default gen_random_uuid(),
  claim_code text not null unique
    check (char_length(claim_code) between 4 and 8),
  guest_name text not null check (char_length(guest_name) <= 120),
  guest_email text check (guest_email is null or char_length(guest_email) <= 200),
  message text check (message is null or char_length(message) <= 1000),
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'pending'
    check (status in ('pending', 'received', 'cancelled')),
  received_at timestamptz,
  thanked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists honeymoon_contribution_lines (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null
    references honeymoon_contributions(id) on delete cascade,
  item_id uuid references honeymoon_items(id) on delete set null,
  item_title text not null check (char_length(item_title) <= 120),
  amount_cents integer not null check (amount_cents > 0)
);
