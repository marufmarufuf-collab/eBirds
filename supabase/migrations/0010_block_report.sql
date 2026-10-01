-- =========================================================================
-- eBirds pivot, part 4: block & report.
-- Run this once, after 0009.
-- =========================================================================

create table if not exists public.user_blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists public.user_reports (
  id                 uuid primary key default gen_random_uuid(),
  reporter_id        uuid not null references public.profiles(id) on delete cascade,
  reported_user_id   uuid not null references public.profiles(id) on delete cascade,
  reason             text not null,
  status             text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at         timestamptz not null default now()
);

alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;

drop policy if exists user_blocks_own on public.user_blocks;
create policy user_blocks_own on public.user_blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

drop policy if exists user_reports_insert on public.user_reports;
create policy user_reports_insert on public.user_reports for insert with check (reporter_id = auth.uid());

drop policy if exists user_reports_select on public.user_reports;
create policy user_reports_select on public.user_reports for select using (
  reporter_id = auth.uid() or public.is_super_admin()
);

drop policy if exists user_reports_update_admin on public.user_reports;
create policy user_reports_update_admin on public.user_reports for update using (public.is_super_admin());

-- Two blocked people should never be able to start (or continue reading)
-- a direct conversation with each other.
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.get_or_create_conversation(other_user uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv_id uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if me = other_user then
    raise exception 'cannot message yourself';
  end if;
  if public.is_blocked_pair(me, other_user) then
    raise exception 'you cannot message this user';
  end if;
  if me < other_user then a := me; b := other_user; else a := other_user; b := me; end if;

  select id into conv_id from public.conversations where type = 'direct' and user_a = a and user_b = b;
  if conv_id is null then
    insert into public.conversations (type, user_a, user_b) values ('direct', a, b) returning id into conv_id;
  end if;
  return conv_id;
end;
$$;
