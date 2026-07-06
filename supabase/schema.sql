-- ============================================================
-- Diurn — Supabase schema
-- Run this once in your Supabase project's SQL Editor.
-- ============================================================

-- ---------- Diary entries ----------
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entry_date  date not null,
  content     text not null check (char_length(btrim(content)) > 0),
  rating      smallint check (rating between 1 and 5),
  image_paths text[],
  created_at  timestamptz not null default now(),

  -- One entry per user per day.
  unique (user_id, entry_date),

  -- A diary records days that have happened, not days to come.
  check (entry_date <= (now() at time zone 'utc')::date + 1)
);

alter table public.entries enable row level security;

-- Users can read only their own entries.
create policy "read own entries"
  on public.entries for select
  using (auth.uid() = user_id);

-- Users can create entries only for themselves.
create policy "insert own entries"
  on public.entries for insert
  with check (auth.uid() = user_id);

-- Deliberately NO update or delete policies:
-- once sealed, an entry is immutable — enforced by the database,
-- not just the UI.

-- ---------- Image storage ----------
insert into storage.buckets (id, name, public)
values ('diary-images', 'diary-images', false);

-- Each user may upload only into their own folder: <user_id>/...
create policy "upload own diary images"
  on storage.objects for insert
  with check (
    bucket_id = 'diary-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Each user may read only their own images (via signed URLs).
create policy "read own diary images"
  on storage.objects for select
  using (
    bucket_id = 'diary-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- No update/delete policies for images either: attachments are
-- sealed along with their entry.
