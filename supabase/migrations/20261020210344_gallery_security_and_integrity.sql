create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from public, anon, authenticated;

do $$
begin
  if to_regclass('public.gallery_admins') is not null
     and to_regclass('private.gallery_admins') is null then
    alter table public.gallery_admins set schema private;
  elsif to_regclass('private.gallery_admins') is null then
    create table private.gallery_admins (
      user_id uuid primary key references auth.users(id) on delete cascade,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

alter table private.gallery_admins enable row level security;
revoke all on private.gallery_admins from public, anon, authenticated;
grant select (user_id) on private.gallery_admins to authenticated;

drop policy if exists "Approved admins can view their own approval" on private.gallery_admins;
create policy "Approved admins can view their own approval"
  on private.gallery_admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Owners manage their galleries" on public.photo_galleries;
drop policy if exists "Approved admins read their galleries" on public.photo_galleries;
create policy "Approved admins read their galleries"
  on public.photo_galleries for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
  );

drop policy if exists "Approved admins create their galleries" on public.photo_galleries;
create policy "Approved admins create their galleries"
  on public.photo_galleries for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
  );

drop policy if exists "Approved admins update their galleries" on public.photo_galleries;
create policy "Approved admins update their galleries"
  on public.photo_galleries for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
  )
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
  );

create index if not exists photo_galleries_owner_created_at_idx
  on public.photo_galleries(owner_id, created_at desc);
create index if not exists gallery_photos_gallery_created_at_idx
  on public.gallery_photos(gallery_id, created_at asc);
drop index if exists public.photo_galleries_owner_id_idx;
drop index if exists public.gallery_photos_gallery_id_idx;

drop policy if exists "Owners remove their original photos" on storage.objects;
create policy "Owners remove their original photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'gallery-photos'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.photo_galleries
      where photo_galleries.id::text = (storage.foldername(name))[2]
        and photo_galleries.owner_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.gallery_photos
      where gallery_photos.storage_path = storage.objects.name
    )
  );
