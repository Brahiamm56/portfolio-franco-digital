-- Agregar columna cover_photo_id si no existe todavía (migración anterior puede no haberse aplicado)
alter table public.photo_galleries
  add column if not exists cover_photo_id uuid references public.gallery_photos(id) on delete set null;

-- Permite la eliminación completa de galerías y sus fotos a los administradores autenticados.
grant delete on public.photo_galleries to authenticated;
grant delete on public.gallery_photos to authenticated;
grant update (status, cover_photo_id) on public.photo_galleries to authenticated;

-- Política de borrado para gallery_photos
drop policy if exists "Approved admins delete gallery photos" on public.gallery_photos;
create policy "Approved admins delete gallery photos"
  on public.gallery_photos for delete to authenticated
  using (
    exists (
      select 1 from public.photo_galleries
      where photo_galleries.id = gallery_photos.gallery_id
        and (
          photo_galleries.owner_id = (select auth.uid())
          or exists (select 1 from private.gallery_admins where user_id = (select auth.uid()))
        )
    )
  );

-- Política de borrado para photo_galleries
drop policy if exists "Approved admins delete their galleries" on public.photo_galleries;
create policy "Approved admins delete their galleries"
  on public.photo_galleries for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from private.gallery_admins
      where user_id = (select auth.uid())
    )
  );

-- Permitir eliminar fotos asociadas en storage
drop policy if exists "Owners remove their original photos" on storage.objects;
create policy "Owners remove their original photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'gallery-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from private.gallery_admins
        where user_id = (select auth.uid())
      )
    )
  );
