-- =========================================================================
-- Update: multiple profile photos per user (Telegram-style gallery).
-- Run this once, after 0001, 0002, 0003.
-- =========================================================================

create table if not exists public.profile_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists profile_photos_user_idx on public.profile_photos (user_id, created_at desc);

alter table public.profile_photos enable row level security;

-- Anyone signed in can view anyone's photo gallery (same visibility as the
-- rest of a public profile). Only the owner can add or remove their own.
drop policy if exists profile_photos_select on public.profile_photos;
create policy profile_photos_select on public.profile_photos
  for select using (auth.uid() is not null);

drop policy if exists profile_photos_insert_own on public.profile_photos;
create policy profile_photos_insert_own on public.profile_photos
  for insert with check (user_id = auth.uid());

drop policy if exists profile_photos_delete_own on public.profile_photos;
create policy profile_photos_delete_own on public.profile_photos
  for delete using (user_id = auth.uid());
