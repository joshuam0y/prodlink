alter table public.profiles
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'partial', 'verified')),
  add column if not exists id_verified_at timestamptz,
  add column if not exists linked_account_verified_at timestamptz;

create index if not exists profiles_verification_status_idx
  on public.profiles (verification_status);
