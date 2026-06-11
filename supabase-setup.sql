-- Run this in Supabase SQL Editor
-- Go to: supabase.com → your project → SQL Editor → New query → paste → Run

create table if not exists profiles (
  user_id text primary key,
  profile jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists states (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

-- Allow public access (no login required)
alter table profiles enable row level security;
alter table states enable row level security;

create policy "Public read" on profiles for select using (true);
create policy "Public write" on profiles for insert with check (true);
create policy "Public update" on profiles for update using (true);

create policy "Public read" on states for select using (true);
create policy "Public write" on states for insert with check (true);
create policy "Public update" on states for update using (true);
