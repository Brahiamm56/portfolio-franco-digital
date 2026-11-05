-- Permite configurar si cada foto de la galería lleva marca de agua o se publica sin ella.
alter table public.gallery_photos
  add column if not exists has_watermark boolean not null default true;

grant update (original_filename, has_watermark) on public.gallery_photos to authenticated;

drop policy if exists "Approved admins update gallery photos" on public.gallery_photos;
create policy "Approved admins update gallery photos"
  on public.gallery_photos for update to authenticated
  using (exists (
    select 1 from public.photo_galleries
    where photo_galleries.id = gallery_photos.gallery_id
      and photo_galleries.owner_id = (select auth.uid())
      and exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
  ))
  with check (exists (
    select 1 from public.photo_galleries
    where photo_galleries.id = gallery_photos.gallery_id
      and photo_galleries.owner_id = (select auth.uid())
      and exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
  ));
