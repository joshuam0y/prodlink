-- Points system: balance wallet + immutable ledger + safe award function.

create table if not exists public.user_points_balance (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_points_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null check (char_length(event_name) >= 2),
  points integer not null check (points <> 0),
  event_key text not null check (char_length(event_key) >= 4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create index if not exists user_points_ledger_user_created_idx
  on public.user_points_ledger (user_id, created_at desc);

alter table public.user_points_balance enable row level security;
alter table public.user_points_ledger enable row level security;

create policy "user_points_balance_select_own"
  on public.user_points_balance for select
  using (auth.uid() = user_id);

create policy "user_points_ledger_select_own"
  on public.user_points_ledger for select
  using (auth.uid() = user_id);

create policy "user_points_ledger_insert_own"
  on public.user_points_ledger for insert
  with check (auth.uid() = user_id);

create policy "user_points_balance_insert_own"
  on public.user_points_balance for insert
  with check (auth.uid() = user_id);

create policy "user_points_balance_update_own"
  on public.user_points_balance for update
  using (auth.uid() = user_id);

create or replace function public.award_points(
  p_user_id uuid,
  p_event_name text,
  p_points integer,
  p_event_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_id bigint;
begin
  if p_points <= 0 then
    return query select false, coalesce((
      select balance from public.user_points_balance where user_id = p_user_id
    ), 0);
    return;
  end if;

  insert into public.user_points_ledger (user_id, event_name, points, event_key, metadata)
  values (p_user_id, p_event_name, p_points, p_event_key, coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, event_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return query select false, coalesce((
      select balance from public.user_points_balance where user_id = p_user_id
    ), 0);
    return;
  end if;

  insert into public.user_points_balance (user_id, balance, lifetime_earned, updated_at)
  values (p_user_id, p_points, p_points, now())
  on conflict (user_id) do update
  set
    balance = public.user_points_balance.balance + excluded.balance,
    lifetime_earned = public.user_points_balance.lifetime_earned + excluded.lifetime_earned,
    updated_at = now();

  return query
    select true, b.balance
    from public.user_points_balance b
    where b.user_id = p_user_id;
end;
$$;

grant execute on function public.award_points(uuid, text, integer, text, jsonb) to authenticated;
