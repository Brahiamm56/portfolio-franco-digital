-- 1. Agregar columnas faltantes con IF NOT EXISTS
alter table public.gallery_photos
  add column if not exists has_watermark boolean not null default true;

alter table public.gallery_photos
  add column if not exists allow_download boolean not null default true;

alter table public.photo_galleries
  add column if not exists client_selected_photo_ids uuid[] not null default '{}'::uuid[];

alter table public.photo_galleries
  add column if not exists cover_photo_id uuid references public.gallery_photos(id) on delete set null;

-- 2. Permisos para usuarios anónimos (públicos)
grant select (id, title, client_name, event_date, status, share_token, client_selected_photo_ids, cover_photo_id, created_at)
  on public.photo_galleries to anon;

grant select (id, gallery_id, original_filename, storage_path, price_ars, has_watermark, allow_download, created_at)
  on public.gallery_photos to anon;

grant update (client_selected_photo_ids)
  on public.photo_galleries to anon;

-- 3. Permisos para usuarios autenticados (admin)
grant select on public.photo_galleries, public.gallery_photos to authenticated;

grant insert (owner_id, title, client_name, event_date, status, share_token, cover_photo_id)
  on public.photo_galleries to authenticated;

grant update (status, cover_photo_id)
  on public.photo_galleries to authenticated;

grant insert (gallery_id, original_filename, storage_path, price_ars, has_watermark, allow_download)
  on public.gallery_photos to authenticated;

grant update (original_filename, has_watermark, allow_download)
  on public.gallery_photos to authenticated;

-- 4. Políticas RLS para lectura pública de galerías publicadas
drop policy if exists "Public read published galleries" on public.photo_galleries;
create policy "Public read published galleries"
  on public.photo_galleries for select to anon
  using (status = 'published');

drop policy if exists "Public read photos of published galleries" on public.gallery_photos;
create policy "Public read photos of published galleries"
  on public.gallery_photos for select to anon
  using (exists (
    select 1 from public.photo_galleries
    where photo_galleries.id = gallery_photos.gallery_id
      and photo_galleries.status = 'published'
  ));

drop policy if exists "Public update selections of published galleries" on public.photo_galleries;
create policy "Public update selections of published galleries"
  on public.photo_galleries for update to anon
  using (status = 'published')
  with check (status = 'published');
