-- Ejecutar en el SQL Editor de un proyecto Supabase nuevo para Franco Digital.
-- Las galerías privadas solo se consultan desde el panel autenticado y desde la función pública por token.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Nuevos objetos del esquema público requieren permisos explícitos.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from public, anon, authenticated;

-- Migra la allowlist anterior sin perder aprobaciones al actualizar un proyecto existente.
do $$
begin
  if to_regclass('public.gallery_admins') is not null
     and to_regclass('private.gallery_admins') is null then
    alter table public.gallery_admins set schema private;
  end if;
end $$;

create table if not exists public.photo_galleries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null constraint photo_galleries_title_trimmed_check
    check (char_length(btrim(title)) between 2 and 120),
  client_name text not null constraint photo_galleries_client_name_trimmed_check
    check (char_length(btrim(client_name)) between 1 and 120),
  event_date date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  client_selected_photo_ids uuid[] not null default '{}'::uuid[],
  share_token text not null unique check (share_token ~ '^[a-f0-9]{48}$'),
  created_at timestamptz not null default now()
);

alter table public.photo_galleries
  add column if not exists client_selected_photo_ids uuid[] not null default '{}'::uuid[];

alter table public.photo_galleries
  add column if not exists cover_photo_id uuid references public.gallery_photos(id) on delete set null;

-- La lista de administradores se gestiona solo desde el SQL Editor.
-- No se permite a una cuenta autenticada añadirse a sí misma.
create table if not exists private.gallery_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_gallery_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and exists (
      select 1
      from private.gallery_admins
      where user_id = auth.uid()
    );
$function$;
revoke all on function public.is_gallery_admin() from public, anon, authenticated;
grant execute on function public.is_gallery_admin() to authenticated;

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.photo_galleries(id) on delete cascade,
  original_filename text not null constraint gallery_photos_filename_check
    check (char_length(btrim(original_filename)) between 1 and 255),
  storage_path text not null unique check (
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
  ),
  price_ars integer not null default 0 check (price_ars >= 0),
  created_at timestamptz not null default now()
);

create index if not exists photo_galleries_owner_created_at_idx
  on public.photo_galleries(owner_id, created_at desc);

create index if not exists gallery_photos_gallery_created_at_idx
  on public.gallery_photos(gallery_id, created_at asc);
drop index if exists public.photo_galleries_owner_id_idx;
drop index if exists public.gallery_photos_gallery_id_idx;

alter table private.gallery_admins enable row level security;
alter table public.photo_galleries enable row level security;
alter table public.gallery_photos enable row level security;

-- Constraints extra para bases ya creadas antes de este endurecimiento.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'photo_galleries_title_trimmed_check'
      and conrelid = 'public.photo_galleries'::regclass
  ) then
    alter table public.photo_galleries
      add constraint photo_galleries_title_trimmed_check
      check (char_length(btrim(title)) between 2 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'photo_galleries_client_name_trimmed_check'
      and conrelid = 'public.photo_galleries'::regclass
  ) then
    alter table public.photo_galleries
      add constraint photo_galleries_client_name_trimmed_check
      check (char_length(btrim(client_name)) between 1 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'gallery_photos_filename_check'
      and conrelid = 'public.gallery_photos'::regclass
  ) then
    alter table public.gallery_photos
      add constraint gallery_photos_filename_check
      check (char_length(btrim(original_filename)) between 1 and 255);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'gallery_photos_storage_path_check'
      and conrelid = 'public.gallery_photos'::regclass
  ) then
    alter table public.gallery_photos
      add constraint gallery_photos_storage_path_check
      check (
        storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
      );
  end if;
end $$;

revoke all on private.gallery_admins from public, anon, authenticated;
revoke all on public.photo_galleries from public, anon, authenticated;
revoke all on public.gallery_photos from public, anon, authenticated;
grant select (user_id) on private.gallery_admins to authenticated;
grant select on public.photo_galleries, public.gallery_photos to authenticated;
grant insert (owner_id, title, client_name, event_date, status, share_token, cover_photo_id)
  on public.photo_galleries to authenticated;
grant update (status, cover_photo_id) on public.photo_galleries to authenticated;
grant delete on public.photo_galleries to authenticated;
grant insert (gallery_id, original_filename, storage_path, price_ars)
  on public.gallery_photos to authenticated;

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
    and exists (
      select 1 from private.gallery_admins
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Approved admins create their galleries" on public.photo_galleries;
create policy "Approved admins create their galleries"
  on public.photo_galleries for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from private.gallery_admins
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Approved admins update their galleries" on public.photo_galleries;
create policy "Approved admins update their galleries"
  on public.photo_galleries for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from private.gallery_admins
      where user_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from private.gallery_admins
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Approved admins delete their galleries" on public.photo_galleries;
create policy "Approved admins delete their galleries"
  on public.photo_galleries for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from private.gallery_admins
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Owners manage photos in their galleries" on public.gallery_photos;
drop policy if exists "Approved admins read gallery photos" on public.gallery_photos;
create policy "Approved admins read gallery photos"
  on public.gallery_photos for select to authenticated
  using (exists (
    select 1 from public.photo_galleries
    where photo_galleries.id = gallery_photos.gallery_id
      and photo_galleries.owner_id = (select auth.uid())
  ));

drop policy if exists "Approved admins add gallery photos" on public.gallery_photos;
create policy "Approved admins add gallery photos"
  on public.gallery_photos for insert to authenticated
  with check (
    storage_path like ((select auth.uid())::text || '/' || gallery_id::text || '/%')
    and exists (
      select 1 from public.photo_galleries
      where photo_galleries.id = gallery_photos.gallery_id
        and photo_galleries.owner_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-photos', 'gallery-photos', false, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners read their original photos" on storage.objects;
create policy "Owners read their original photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'gallery-photos'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(name) ~ '[.](jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.photo_galleries
      where photo_galleries.id::text = (storage.foldername(name))[2]
        and photo_galleries.owner_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.gallery_photos
      where gallery_photos.storage_path = storage.objects.name
    )
  );

drop policy if exists "Owners upload their original photos" on storage.objects;
create policy "Owners upload their original photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gallery-photos'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(name) ~ '[.](jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.photo_galleries
      where photo_galleries.id::text = (storage.foldername(name))[2]
        and photo_galleries.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners remove their original photos" on storage.objects;
create policy "Owners remove their original photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'gallery-photos'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.photo_galleries
      where photo_galleries.id::text = (storage.foldername(name))[2]
        and photo_galleries.owner_id = (select auth.uid())
    )
  );
