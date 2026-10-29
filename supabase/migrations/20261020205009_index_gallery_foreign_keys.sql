-- Historical migration kept in sync with Supabase project history.
create index if not exists photo_galleries_owner_id_idx on public.photo_galleries(owner_id);
create index if not exists gallery_photos_gallery_id_idx on public.gallery_photos(gallery_id);
