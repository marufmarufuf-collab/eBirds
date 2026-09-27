-- =========================================================================
-- Update: voice messages.
-- Run this once, after 0001-0004.
-- =========================================================================

alter table public.messages add column if not exists audio_url text;
alter table public.messages add column if not exists audio_duration int; -- seconds

-- Voice recordings reuse the existing public "message-attachments" bucket
-- and its policies from 0002_update.sql — no new bucket/policy needed.
