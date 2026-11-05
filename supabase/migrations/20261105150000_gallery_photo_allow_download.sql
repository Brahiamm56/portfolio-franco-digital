-- Permite configurar si cada foto de la galería permite descarga directa por parte de los clientes.
alter table public.gallery_photos
  add column if not exists allow_download boolean not null default true;

grant update (original_filename, has_watermark, allow_download) on public.gallery_photos to authenticated;
