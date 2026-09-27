-- =========================================================================
-- Update: edit messages (within 24h), delete for me / delete for everyone.
-- Deletes are soft — rows stay in the database (queryable directly in
-- Supabase) and are only hidden from the app's own users.
-- Run this once, after 0001-0005.
-- =========================================================================

alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;

-- "Delete for me" — a per-viewer hide, doesn't touch the message itself.
create table if not exists public.message_deletions (
  message_id  uuid not null references public.messages(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_deletions enable row level security;

drop policy if exists message_deletions_own on public.message_deletions;
create policy message_deletions_own on public.message_deletions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Server-side enforcement of who can edit/delete what, and the 24h edit
-- window — RLS alone can't easily do per-column rules, so a trigger backs
-- it up (the app UI enforces the same rules, but this is what actually
-- stops someone bypassing the UI).
create or replace function public.protect_message_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.conversation_id := old.conversation_id;
  new.sender_id := old.sender_id;
  new.created_at := old.created_at;

  if (new.content is distinct from old.content
      or new.image_url is distinct from old.image_url
      or new.audio_url is distinct from old.audio_url
      or new.deleted_at is distinct from old.deleted_at)
     and auth.uid() is distinct from old.sender_id then
    raise exception 'only the sender can edit or delete this message';
  end if;

  if new.content is distinct from old.content and old.deleted_at is null then
    if now() - old.created_at > interval '24 hours' then
      raise exception 'this message is too old to edit';
    end if;
    new.edited_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists before_message_update on public.messages;
create trigger before_message_update
  before update on public.messages
  for each row execute function public.protect_message_fields();
