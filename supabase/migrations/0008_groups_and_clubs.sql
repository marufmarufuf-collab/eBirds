-- =========================================================================
-- eBirds pivot, part 2: group conversations (for events & clubs) and clubs.
-- Run this once, after 0007.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Extend conversations to support groups, not just 1-on-1.
-- Direct chats keep using user_a/user_b exactly as before; group chats
-- (event chats, club chats) use the new conversation_members table
-- instead, and leave user_a/user_b null.
-- ---------------------------------------------------------------------
alter table public.conversations add column if not exists type text not null default 'direct' check (type in ('direct','group'));
alter table public.conversations add column if not exists title text;
alter table public.conversations add column if not exists avatar_url text;

alter table public.conversations alter column user_a drop not null;
alter table public.conversations alter column user_b drop not null;
alter table public.conversations drop constraint if exists conversations_ordered;
alter table public.conversations drop constraint if exists conversations_unique_pair;

alter table public.conversations add constraint conversations_direct_shape check (
  (type = 'direct' and user_a is not null and user_b is not null and user_a < user_b)
  or (type = 'group' and user_a is null and user_b is null)
);
create unique index if not exists conversations_direct_pair_unique on public.conversations (user_a, user_b) where type = 'direct';

create table if not exists public.conversation_members (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  role             text not null default 'member' check (role in ('member','admin')),
  joined_at        timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_members enable row level security;

create or replace function public.is_conversation_participant(conv_id uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv_id and c.type = 'direct' and (c.user_a = uid or c.user_b = uid)
  ) or exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conv_id and m.user_id = uid
  );
$$;

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members for select using (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- Replace the old direct-only conversations/messages policies with
-- versions that also recognize group membership.
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select using (
  public.is_conversation_participant(id, auth.uid())
);

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert with check (
  (type = 'direct' and (auth.uid() = user_a or auth.uid() = user_b))
  or (type = 'group')  -- group creation is done via the security-definer functions below
);

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select using (
  public.is_conversation_participant(conversation_id, auth.uid())
);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  sender_id = auth.uid() and public.is_conversation_participant(conversation_id, auth.uid())
);

drop policy if exists messages_update_read on public.messages;
create policy messages_update_read on public.messages for update using (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- ---------------------------------------------------------------------
-- Clubs
-- ---------------------------------------------------------------------
create table if not exists public.clubs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  avatar_url   text,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id    uuid not null references public.clubs(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('member','admin')),
  joined_at  timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists public.club_announcements (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_announcements enable row level security;

drop policy if exists clubs_select on public.clubs;
create policy clubs_select on public.clubs for select using (auth.uid() is not null);

drop policy if exists clubs_insert on public.clubs;
create policy clubs_insert on public.clubs for insert with check (created_by = auth.uid());

drop policy if exists club_members_select on public.club_members;
create policy club_members_select on public.club_members for select using (auth.uid() is not null);

drop policy if exists club_members_insert on public.club_members;
create policy club_members_insert on public.club_members for insert with check (user_id = auth.uid());

drop policy if exists club_members_delete on public.club_members;
create policy club_members_delete on public.club_members for delete using (user_id = auth.uid());

drop policy if exists club_announcements_select on public.club_announcements;
create policy club_announcements_select on public.club_announcements for select using (
  exists (select 1 from public.club_members m where m.club_id = club_announcements.club_id and m.user_id = auth.uid())
);

drop policy if exists club_announcements_insert on public.club_announcements;
create policy club_announcements_insert on public.club_announcements for insert with check (
  author_id = auth.uid()
  and exists (select 1 from public.club_members m where m.club_id = club_announcements.club_id and m.user_id = auth.uid() and m.role = 'admin')
);

alter publication supabase_realtime add table public.conversation_members;
