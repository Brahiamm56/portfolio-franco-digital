-- Historical migration kept in sync with Supabase project history.
create table if not exists public.photo_galleries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  client_name text not null check (char_length(client_name) between 1 and 120),
  event_date date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  share_token text not null unique check (share_token ~ '^[a-f0-9]{48}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.photo_galleries(id) on delete cascade,
  original_filename text not null,
  storage_path text not null unique,
  price_ars integer not null default 0 check (price_ars >= 0),
  created_at timestamptz not null default now()
);

alter table public.photo_galleries enable row level security;
alter table public.gallery_photos enable row level security;

revoke all on public.photo_galleries from anon, authenticated;
revoke all on public.gallery_photos from anon, authenticated;
grant select, insert, update, delete on public.photo_galleries to authenticated;
grant select, insert, update, delete on public.gallery_photos to authenticated;

drop policy if exists "Owners manage their galleries" on public.photo_galleries;
create policy "Owners manage their galleries"
  on public.photo_galleries for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners manage photos in their galleries" on public.gallery_photos;
create policy "Owners manage photos in their galleries"
  on public.gallery_photos for all to authenticated
  using (exists (
    select 1 from public.photo_galleries
    where photo_galleries.id = gallery_photos.gallery_id
      and photo_galleries.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.photo_galleries
    where photo_galleries.id = gallery_photos.gallery_id
      and photo_galleries.owner_id = (select auth.uid())
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-photos', 'gallery-photos', false, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners read their original photos" on storage.objects;
create policy "Owners read their original photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'gallery-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Owners upload their original photos" on storage.objects;
create policy "Owners upload their original photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Owners remove their original photos" on storage.objects;
create policy "Owners remove their original photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
