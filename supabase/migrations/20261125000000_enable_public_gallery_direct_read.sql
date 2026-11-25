-- Permite lectura y selección directa de galerías publicadas sin depender exclusivamente de Edge Functions
grant select (id, title, client_name, event_date, status, share_token, client_selected_photo_ids, cover_photo_id, created_at)
  on public.photo_galleries to anon;

grant select (id, gallery_id, original_filename, storage_path, price_ars, has_watermark, allow_download, created_at)
  on public.gallery_photos to anon;

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

grant update (client_selected_photo_ids) on public.photo_galleries to anon;

drop policy if exists "Public update selections of published galleries" on public.photo_galleries;
create policy "Public update selections of published galleries"
  on public.photo_galleries for update to anon
  using (status = 'published')
  with check (status = 'published');

-- Asegurar permisos de inserción en gallery_photos para admins
grant insert (gallery_id, original_filename, storage_path, price_ars, has_watermark, allow_download)
  on public.gallery_photos to authenticated;
