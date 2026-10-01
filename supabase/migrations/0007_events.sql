-- =========================================================================
-- eBirds pivot, part 1: activities & events.
-- Run this once, after 0001-0006.
-- =========================================================================

create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  organizer_id      uuid not null references public.profiles(id) on delete cascade,
  activity          text not null check (activity in ('walking','running','jogging','swimming','trips','sightseeing','camping')),
  title             text not null,
  description       text,
  event_date        timestamptz not null,
  location_area     text not null,   -- shown to everyone browsing
  meeting_point     text,            -- only revealed to confirmed participants
  max_participants  int,
  is_paid           boolean not null default false,
  price             numeric,
  currency          text not null default 'UZS',
  status            text not null default 'open' check (status in ('open','full','cancelled','completed')),
  created_at        timestamptz not null default now()
);

create index if not exists events_date_idx on public.events (event_date);
create index if not exists events_activity_idx on public.events (activity);
create index if not exists events_organizer_idx on public.events (organizer_id);

create table if not exists public.event_participants (
  event_id      uuid not null references public.events(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','confirmed','declined','cancelled')),
  requested_at  timestamptz not null default now(),
  confirmed_at  timestamptz,
  completed     boolean not null default false,
  primary key (event_id, user_id)
);

alter table public.profiles add column if not exists points int not null default 0;

create table if not exists public.points_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      int not null,
  reason      text not null,
  event_id    uuid references public.events(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.points_ledger enable row level security;

-- Events: anyone signed in can browse; only the organizer can edit/cancel;
-- anyone can create one (organizer_id must be themselves).
drop policy if exists events_select on public.events;
create policy events_select on public.events for select using (auth.uid() is not null);

drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert with check (organizer_id = auth.uid());

drop policy if exists events_update_organizer on public.events;
create policy events_update_organizer on public.events for update
  using (organizer_id = auth.uid() or public.is_super_admin());

-- Participation: the organizer and the participant themselves can see a
-- request; only the organizer can confirm/decline; the requester can
-- cancel their own request.
drop policy if exists event_participants_select on public.event_participants;
create policy event_participants_select on public.event_participants for select using (
  user_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
  or public.is_super_admin()
);

drop policy if exists event_participants_insert on public.event_participants;
create policy event_participants_insert on public.event_participants for insert with check (user_id = auth.uid());

drop policy if exists event_participants_update on public.event_participants;
create policy event_participants_update on public.event_participants for update using (
  user_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
);

-- Points: everyone can read their own history; only the award functions
-- below (security definer) ever write to this table.
drop policy if exists points_ledger_select_own on public.points_ledger;
create policy points_ledger_select_own on public.points_ledger for select using (
  user_id = auth.uid() or public.is_super_admin()
);
