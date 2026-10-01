-- =========================================================================
-- eBirds pivot, part 3: the functions that actually run the
-- request -> confirm -> group chat -> points flow.
-- Run this once, after 0008.
-- =========================================================================

alter table public.events add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

create or replace function public.award_points(p_user_id uuid, p_amount int, p_reason text, p_event_id uuid default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.points_ledger (user_id, amount, reason, event_id) values (p_user_id, p_amount, p_reason, p_event_id);
  update public.profiles set points = points + p_amount where id = p_user_id;
end;
$$;

-- Creates the event's group chat on first confirmation, or returns the
-- existing one.
create or replace function public.ensure_event_conversation(p_event_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_conv_id uuid;
  v_title text;
  v_organizer uuid;
begin
  select conversation_id, title, organizer_id into v_conv_id, v_title, v_organizer
  from public.events where id = p_event_id;

  if v_conv_id is not null then
    return v_conv_id;
  end if;

  insert into public.conversations (type, title) values ('group', v_title) returning id into v_conv_id;
  update public.events set conversation_id = v_conv_id where id = p_event_id;
  insert into public.conversation_members (conversation_id, user_id, role) values (v_conv_id, v_organizer, 'admin')
    on conflict do nothing;

  return v_conv_id;
end;
$$;

create or replace function public.request_join_event(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select status into v_status from public.events where id = p_event_id;
  if v_status is null then raise exception 'event not found'; end if;
  if v_status not in ('open') then raise exception 'this event is not accepting requests right now'; end if;

  insert into public.event_participants (event_id, user_id, status)
  values (p_event_id, v_uid, 'pending')
  on conflict (event_id, user_id) do update set status = 'pending', requested_at = now()
    where public.event_participants.status in ('declined','cancelled');
end;
$$;

create or replace function public.confirm_event_participant(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_organizer uuid;
  v_title text;
  v_max int;
  v_conv_id uuid;
  v_confirmed_count int;
begin
  select organizer_id, title, max_participants into v_organizer, v_title, v_max from public.events where id = p_event_id;
  if auth.uid() is distinct from v_organizer then raise exception 'only the organizer can confirm participants'; end if;

  update public.event_participants set status = 'confirmed', confirmed_at = now()
    where event_id = p_event_id and user_id = p_user_id;

  v_conv_id := public.ensure_event_conversation(p_event_id);
  insert into public.conversation_members (conversation_id, user_id, role) values (v_conv_id, p_user_id, 'member')
    on conflict do nothing;

  perform public.award_points(p_user_id, 10, 'Joined event: ' || coalesce(v_title, ''), p_event_id);

  select count(*) into v_confirmed_count from public.event_participants
    where event_id = p_event_id and status = 'confirmed';
  if v_max is not null and v_confirmed_count >= v_max then
    update public.events set status = 'full' where id = p_event_id;
  end if;
end;
$$;

create or replace function public.decline_event_participant(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from (select organizer_id from public.events where id = p_event_id) then
    raise exception 'only the organizer can decline participants';
  end if;
  update public.event_participants set status = 'declined' where event_id = p_event_id and user_id = p_user_id;
end;
$$;

create or replace function public.cancel_event_participation(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conv_id uuid;
  v_was_confirmed boolean;
begin
  select status = 'confirmed' into v_was_confirmed from public.event_participants where event_id = p_event_id and user_id = v_uid;

  update public.event_participants set status = 'cancelled' where event_id = p_event_id and user_id = v_uid;

  if v_was_confirmed then
    select conversation_id into v_conv_id from public.events where id = p_event_id;
    if v_conv_id is not null then
      delete from public.conversation_members where conversation_id = v_conv_id and user_id = v_uid;
    end if;
    update public.events set status = 'open' where id = p_event_id and status = 'full';
  end if;
end;
$$;

-- Organizer marks the event done: everyone still confirmed gets points,
-- the organizer gets points, event is closed.
create or replace function public.complete_event(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_organizer uuid;
  v_title text;
  r record;
begin
  select organizer_id, title into v_organizer, v_title from public.events where id = p_event_id;
  if auth.uid() is distinct from v_organizer then raise exception 'only the organizer can complete this event'; end if;

  update public.events set status = 'completed' where id = p_event_id;

  for r in select user_id from public.event_participants where event_id = p_event_id and status = 'confirmed' and completed = false loop
    update public.event_participants set completed = true where event_id = p_event_id and user_id = r.user_id;
    perform public.award_points(r.user_id, 20, 'Completed event: ' || coalesce(v_title, ''), p_event_id);
  end loop;

  perform public.award_points(v_organizer, 30, 'Organized event: ' || coalesce(v_title, ''), p_event_id);
end;
$$;

create or replace function public.cancel_event(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from (select organizer_id from public.events where id = p_event_id) then
    raise exception 'only the organizer can cancel this event';
  end if;
  update public.events set status = 'cancelled' where id = p_event_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Clubs: join/leave also manage the club's group chat membership.
-- ---------------------------------------------------------------------
create or replace function public.ensure_club_conversation(p_club_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_conv_id uuid;
  v_name text;
  v_creator uuid;
begin
  select conversation_id, name, created_by into v_conv_id, v_name, v_creator from public.clubs where id = p_club_id;
  if v_conv_id is not null then return v_conv_id; end if;

  insert into public.conversations (type, title) values ('group', v_name) returning id into v_conv_id;
  update public.clubs set conversation_id = v_conv_id where id = p_club_id;
  insert into public.conversation_members (conversation_id, user_id, role) values (v_conv_id, v_creator, 'admin')
    on conflict do nothing;

  return v_conv_id;
end;
$$;

create or replace function public.join_club(p_club_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conv_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.club_members (club_id, user_id) values (p_club_id, v_uid) on conflict do nothing;
  v_conv_id := public.ensure_club_conversation(p_club_id);
  insert into public.conversation_members (conversation_id, user_id, role) values (v_conv_id, v_uid, 'member')
    on conflict do nothing;
end;
$$;

create or replace function public.leave_club(p_club_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conv_id uuid;
begin
  delete from public.club_members where club_id = p_club_id and user_id = v_uid;
  select conversation_id into v_conv_id from public.clubs where id = p_club_id;
  if v_conv_id is not null then
    delete from public.conversation_members where conversation_id = v_conv_id and user_id = v_uid;
  end if;
end;
$$;

-- The organizer/creator also needs to see their own event/club chat in
-- their conversations list from the moment they create it, before anyone
-- else has joined.
create or replace function public.create_club(p_name text, p_description text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_club_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into public.clubs (name, description, created_by) values (p_name, p_description, v_uid) returning id into v_club_id;
  insert into public.club_members (club_id, user_id, role) values (v_club_id, v_uid, 'admin');
  perform public.ensure_club_conversation(v_club_id);
  return v_club_id;
end;
$$;
