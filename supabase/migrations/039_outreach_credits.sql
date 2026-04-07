-- Redeem points into outreach credits and safely spend credits.

create table if not exists public.user_outreach_credits_balance (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_outreach_credits_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null check (char_length(event_name) >= 2),
  credits integer not null check (credits <> 0),
  event_key text not null check (char_length(event_key) >= 4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create index if not exists user_outreach_credits_ledger_user_created_idx
  on public.user_outreach_credits_ledger (user_id, created_at desc);

alter table public.user_outreach_credits_balance enable row level security;
alter table public.user_outreach_credits_ledger enable row level security;

create policy "user_outreach_credits_balance_select_own"
  on public.user_outreach_credits_balance for select
  using (auth.uid() = user_id);

create policy "user_outreach_credits_ledger_select_own"
  on public.user_outreach_credits_ledger for select
  using (auth.uid() = user_id);

create or replace function public.redeem_points_for_outreach_credits(
  p_user_id uuid,
  p_points_to_spend integer,
  p_credits_to_grant integer,
  p_event_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, new_points_balance integer, new_credit_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_balance integer;
  v_credit_balance integer;
  v_existing boolean;
begin
  if p_points_to_spend <= 0 or p_credits_to_grant <= 0 then
    return query select false, 0, 0;
    return;
  end if;

  select exists(
    select 1
    from public.user_outreach_credits_ledger
    where user_id = p_user_id
      and event_key = p_event_key
  ) into v_existing;

  if v_existing then
    select coalesce(balance, 0) into v_points_balance
    from public.user_points_balance
    where user_id = p_user_id;

    select coalesce(balance, 0) into v_credit_balance
    from public.user_outreach_credits_balance
    where user_id = p_user_id;

    return query select false, coalesce(v_points_balance, 0), coalesce(v_credit_balance, 0);
    return;
  end if;

  insert into public.user_points_balance (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  values (p_user_id, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  insert into public.user_outreach_credits_balance (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  values (p_user_id, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select balance
  into v_points_balance
  from public.user_points_balance
  where user_id = p_user_id
  for update;

  if coalesce(v_points_balance, 0) < p_points_to_spend then
    select balance into v_credit_balance
    from public.user_outreach_credits_balance
    where user_id = p_user_id;
    return query select false, coalesce(v_points_balance, 0), coalesce(v_credit_balance, 0);
    return;
  end if;

  update public.user_points_balance
  set
    balance = balance - p_points_to_spend,
    lifetime_spent = lifetime_spent + p_points_to_spend,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.user_points_ledger (user_id, event_name, points, event_key, metadata)
  values (
    p_user_id,
    'points_redeemed_outreach_credit',
    -p_points_to_spend,
    p_event_key,
    jsonb_build_object(
      'pointsSpent', p_points_to_spend,
      'creditsGranted', p_credits_to_grant
    ) || coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, event_key) do nothing;

  insert into public.user_outreach_credits_ledger (user_id, event_name, credits, event_key, metadata)
  values (
    p_user_id,
    'outreach_credit_redeemed',
    p_credits_to_grant,
    p_event_key,
    jsonb_build_object(
      'pointsSpent', p_points_to_spend,
      'creditsGranted', p_credits_to_grant
    ) || coalesce(p_metadata, '{}'::jsonb)
  );

  update public.user_outreach_credits_balance
  set
    balance = balance + p_credits_to_grant,
    lifetime_earned = lifetime_earned + p_credits_to_grant,
    updated_at = now()
  where user_id = p_user_id;

  select p.balance, c.balance
  into v_points_balance, v_credit_balance
  from public.user_points_balance p
  join public.user_outreach_credits_balance c
    on c.user_id = p.user_id
  where p.user_id = p_user_id;

  return query select true, coalesce(v_points_balance, 0), coalesce(v_credit_balance, 0);
end;
$$;

create or replace function public.spend_outreach_credits(
  p_user_id uuid,
  p_credits integer,
  p_event_name text,
  p_event_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, new_credit_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credit_balance integer;
  v_existing boolean;
begin
  if p_credits <= 0 then
    return query select false, 0;
    return;
  end if;

  select exists(
    select 1
    from public.user_outreach_credits_ledger
    where user_id = p_user_id
      and event_key = p_event_key
  ) into v_existing;

  if v_existing then
    select coalesce(balance, 0) into v_credit_balance
    from public.user_outreach_credits_balance
    where user_id = p_user_id;
    return query select false, coalesce(v_credit_balance, 0);
    return;
  end if;

  insert into public.user_outreach_credits_balance (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  values (p_user_id, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select balance
  into v_credit_balance
  from public.user_outreach_credits_balance
  where user_id = p_user_id
  for update;

  if coalesce(v_credit_balance, 0) < p_credits then
    return query select false, coalesce(v_credit_balance, 0);
    return;
  end if;

  update public.user_outreach_credits_balance
  set
    balance = balance - p_credits,
    lifetime_spent = lifetime_spent + p_credits,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.user_outreach_credits_ledger (user_id, event_name, credits, event_key, metadata)
  values (
    p_user_id,
    coalesce(nullif(trim(p_event_name), ''), 'outreach_credit_spent'),
    -p_credits,
    p_event_key,
    jsonb_build_object('creditsSpent', p_credits) || coalesce(p_metadata, '{}'::jsonb)
  );

  select balance into v_credit_balance
  from public.user_outreach_credits_balance
  where user_id = p_user_id;

  return query select true, coalesce(v_credit_balance, 0);
end;
$$;

grant execute on function public.redeem_points_for_outreach_credits(uuid, integer, integer, text, jsonb) to authenticated;
grant execute on function public.spend_outreach_credits(uuid, integer, text, text, jsonb) to authenticated;
