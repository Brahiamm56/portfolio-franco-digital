-- Permite a cada administrador eliminar sus propias galerías y sus archivos asociados.
grant delete on public.photo_galleries to authenticated;

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

drop policy if exists "Owners remove their original photos" on storage.objects;
create policy "Owners remove their original photos"
  on storage.objects for delete to authenticated
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
  );
