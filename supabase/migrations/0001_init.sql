-- =========================================================================
-- Platform schema: profiles, roles, messaging
-- Run this once against a fresh Supabase project (SQL editor or CLI).
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
-- Free-form text role column rather than a fixed enum, so the Super Admin
-- can create custom tags later ("Moderator", "Beta Tester", ...) without a
-- migration. Two reserved values that carry real permission weight:
--   'user'        -> default for every new account
--   'super_admin' -> full admin dashboard access
-- Any other string is just a cosmetic label with no extra permissions.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,                 -- mirrored, read-only, never editable
  username      text not null unique,
  avatar_url    text,
  bio           text,
  role          text not null default 'user',
  is_active     boolean not null default true, -- for admin suspend/ban
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

create index if not exists profiles_username_idx on public.profiles (lower(username));
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ---------------------------------------------------------------------
-- Conversations & messages
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references public.profiles(id) on delete cascade,
  user_b      uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- normalize pair order so (a,b) and (b,a) can never both exist
  constraint conversations_ordered check (user_a < user_b),
  constraint conversations_unique_pair unique (user_a, user_b)
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  content          text not null check (char_length(content) between 1 and 4000),
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Helper: get-or-create a conversation between two users in canonical order
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
  if me < other_user then a := me; b := other_user; else a := other_user; b := me; end if;

  select id into conv_id from public.conversations where user_a = a and user_b = b;
  if conv_id is null then
    insert into public.conversations (user_a, user_b) values (a, b) returning id into conv_id;
  end if;
  return conv_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user is confirmed
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  super_admin_email constant text := 'marufmarufuf@gmail.com';
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := split_part(new.email, '@', 1);
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if base_username = '' then base_username := 'user'; end if;
  final_username := base_username;

  while exists (select 1 from public.profiles where lower(username) = lower(final_username)) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    final_username,
    case when lower(new.email) = lower(super_admin_email) then 'super_admin' else 'user' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  when (new.email_confirmed_at is not null)  -- only once verified
  execute function public.handle_new_user();

-- If confirmation happens after insert (OTP flow updates the row rather than
-- inserting a fresh one), also handle the UPDATE transition into confirmed.
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Guard: never allow email to be changed on profiles, never allow a user
-- to self-promote to super_admin, keep updated_at fresh.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  acting_role text;
begin
  -- email is permanent, full stop -- not even the Super Admin can change it
  new.email := old.email;

  select role into acting_role from public.profiles where id = auth.uid();

  if new.role is distinct from old.role and coalesce(acting_role, '') <> 'super_admin' then
    raise exception 'only a super_admin may change roles';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists before_profile_update on public.profiles;
create trigger before_profile_update
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles: any signed-in user can read (needed for search/messaging/admin);
-- update only your own row (email/role changes are further restricted by the
-- trigger above), or any row if you are super_admin.
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id or public.is_super_admin());

-- conversations: only the two participants can see or create it
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

-- messages: only participants of the parent conversation
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists messages_update_read on public.messages;
create policy messages_update_read on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- Storage: avatar bucket + policies
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatar_public_read on storage.objects;
create policy avatar_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatar_own_write on storage.objects;
create policy avatar_own_write on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_own_update on storage.objects;
create policy avatar_own_update on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_own_delete on storage.objects;
create policy avatar_own_delete on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Realtime: allow message + conversation change streams
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
