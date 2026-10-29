alter table public.photo_galleries
  add column if not exists client_selected_photo_ids uuid[] not null default '{}'::uuid[];
