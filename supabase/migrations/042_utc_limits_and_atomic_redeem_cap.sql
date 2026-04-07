-- Enforce UTC-day limits and make redeem option caps atomic.

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
  v_daily_points_limit integer;
  v_today_earned integer;
  v_utc_day_start timestamptz;
begin
  if p_points <= 0 then
    return query select false, coalesce((
      select balance from public.user_points_balance where user_id = p_user_id
    ), 0);
    return;
  end if;

  v_daily_points_limit := case p_event_name
    when 'onboarding_completed' then 25
    when 'like_sent' then 100
    when 'match_created' then 200
    when 'message_sent' then 100
    else null
  end;

  if v_daily_points_limit is not null then
    v_utc_day_start := date_trunc('day', timezone('utc', now())) at time zone 'utc';
    select coalesce(sum(points), 0)
    into v_today_earned
    from public.user_points_ledger
    where user_id = p_user_id
      and event_name = p_event_name
      and points > 0
      and created_at >= v_utc_day_start
      and created_at < v_utc_day_start + interval '1 day';

    if coalesce(v_today_earned, 0) + p_points > v_daily_points_limit then
      return query select false, coalesce((
        select balance from public.user_points_balance where user_id = p_user_id
      ), 0);
      return;
    end if;
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

create or replace function public.redeem_points_for_outreach_credits(
  p_user_id uuid,
  p_points_to_spend integer,
  p_credits_to_grant integer,
  p_event_key text,
  p_metadata jsonb default '{}'::jsonb,
  p_max_per_day integer default null
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
  v_redeemed_today integer;
  v_utc_day_start timestamptz;
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

  select balance
  into v_credit_balance
  from public.user_outreach_credits_balance
  where user_id = p_user_id
  for update;

  if p_max_per_day is not null and p_max_per_day > 0 then
    v_utc_day_start := date_trunc('day', timezone('utc', now())) at time zone 'utc';
    select count(*)
    into v_redeemed_today
    from public.user_outreach_credits_ledger
    where user_id = p_user_id
      and event_name = 'outreach_credit_redeemed'
      and metadata @> jsonb_build_object(
        'pointsSpent', p_points_to_spend,
        'creditsGranted', p_credits_to_grant
      )
      and created_at >= v_utc_day_start
      and created_at < v_utc_day_start + interval '1 day';

    if coalesce(v_redeemed_today, 0) >= p_max_per_day then
      return query select false, coalesce(v_points_balance, 0), coalesce(v_credit_balance, 0);
      return;
    end if;
  end if;

  if coalesce(v_points_balance, 0) < p_points_to_spend then
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

grant execute on function public.award_points(uuid, text, integer, text, jsonb) to authenticated;
grant execute on function public.redeem_points_for_outreach_credits(uuid, integer, integer, text, jsonb, integer) to authenticated;
