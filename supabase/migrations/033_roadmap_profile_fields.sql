-- Roadmap: dual roles, SoundCloud URL for future verification flows.
alter table public.profiles
  add column if not exists secondary_role text;

alter table public.profiles
  add column if not exists soundcloud_url text;

comment on column public.profiles.secondary_role is
  'Optional second hat (e.g. DJ) when dual-role roadmap is enabled in the app.';

comment on column public.profiles.soundcloud_url is
  'Optional HTTPS SoundCloud profile URL for verification / discovery.';
