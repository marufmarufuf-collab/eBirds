-- =========================================================================
-- Update: full name, random usernames, message photos
-- Run this AFTER 0001_init.sql, once, in the SQL editor.
-- =========================================================================

alter table public.profiles add column if not exists full_name text;
alter table public.messages add column if not exists image_url text;

-- ---------------------------------------------------------------------
-- Random 10-character alphanumeric username generator (replaces the old
-- email-derived one). Mixed-case letters + digits, checked for uniqueness.
-- ---------------------------------------------------------------------
create or replace function public.generate_username()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
  i int;
begin
  loop
    candidate := '';
    for i in 1..10 loop
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where lower(username) = lower(candidate));
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  super_admin_email constant text := 'marufmarufuf@gmail.com';
  meta_full_name text;
begin
  meta_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, username, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    public.generate_username(),
    meta_full_name,
    new.raw_user_meta_data ->> 'avatar_url',
    case when lower(new.email) = lower(super_admin_email) then 'super_admin' else 'user' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Storage bucket for message photo attachments
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', true)
on conflict (id) do nothing;

drop policy if exists message_attachments_read on storage.objects;
create policy message_attachments_read on storage.objects
  for select using (bucket_id = 'message-attachments' and auth.uid() is not null);

drop policy if exists message_attachments_write on storage.objects;
create policy message_attachments_write on storage.objects
  for insert with check (bucket_id = 'message-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
