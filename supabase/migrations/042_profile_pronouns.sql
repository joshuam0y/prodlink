-- Optional profile pronouns shown in profile editor/public card contexts.
alter table public.profiles
add column if not exists pronouns text;
