-- =========================================================================
-- Update: login/visit history, so the Super Admin can see when people were
-- last active and a short history of their logins.
-- Run this once, after 0001 and 0002.
-- =========================================================================

create table if not exists public.login_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  user_agent  text
);

create index if not exists login_events_user_idx on public.login_events (user_id, created_at desc);

alter table public.login_events enable row level security;

-- Only the Super Admin can browse this; a user records their own login but
-- never needs to read the log back.
drop policy if exists login_events_insert_own on public.login_events;
create policy login_events_insert_own on public.login_events
  for insert with check (user_id = auth.uid());

drop policy if exists login_events_select_admin on public.login_events;
create policy login_events_select_admin on public.login_events
  for select using (public.is_super_admin());
