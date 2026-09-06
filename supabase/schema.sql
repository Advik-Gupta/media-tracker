-- ============================================================
-- MEDIA VAULT - Supabase schema
--
-- Run this once, in the SQL Editor of your Supabase project.
--
-- One row per account, holding that account's entire state as
-- JSON: what has been watched, which shows were added, what is
-- hidden, the order things were dragged into.
--
-- Why one JSON column rather than proper tables: nothing here is
-- ever queried across users. Each account reads and writes only
-- its own state, the whole thing at once, and the app already
-- keeps that state as a single object in local storage. A
-- relational split would buy nothing and cost a migration on
-- every shape change.
--
-- The row is protected by row level security, so an account can
-- only ever see and write its own - that is enforced by the
-- database, not by the app.
-- ============================================================

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  -- the app's own clock, used to decide which copy is newer when a
  -- browser has been offline; not the same as updated_at
  client_updated bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.user_state is
  'One row per account: the whole of that user''s Media Vault state.';

alter table public.user_state enable row level security;

-- A user may do anything to their own row, and nothing to anyone else's.
drop policy if exists "own state is readable" on public.user_state;
create policy "own state is readable"
  on public.user_state for select
  using (auth.uid() = user_id);

drop policy if exists "own state is writable" on public.user_state;
create policy "own state is writable"
  on public.user_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "own state is updatable" on public.user_state;
create policy "own state is updatable"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own state is deletable" on public.user_state;
create policy "own state is deletable"
  on public.user_state for delete
  using (auth.uid() = user_id);

-- Keep updated_at honest without the client having to set it.
create or replace function public.touch_user_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch
  before update on public.user_state
  for each row execute function public.touch_user_state();

-- Give every new account an empty row, so the app never has to
-- distinguish "no row yet" from "row with nothing in it".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
