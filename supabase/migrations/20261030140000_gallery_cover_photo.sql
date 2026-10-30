-- Permite asignar una imagen de portada específica para cada galería/evento.
alter table public.photo_galleries
  add column if not exists cover_photo_id uuid references public.gallery_photos(id) on delete set null;

grant update (status, cover_photo_id) on public.photo_galleries to authenticated;
