-- Extra profile photos for public gallery (beyond avatar and beat covers).
alter table public.profiles
  add column if not exists gallery_image_urls jsonb not null default '[]'::jsonb;

comment on column public.profiles.gallery_image_urls is
  'Ordered HTTPS image URLs (max 6 in app) shown on /p/[id] gallery.';
