-- =========================================================================
-- Update: a map/location link for events (Google Maps, etc).
-- Same privacy tier as meeting_point — only shown to confirmed
-- participants and the organizer, not public.
-- Run this once, after 0010.
-- =========================================================================

alter table public.events add column if not exists location_link text;
