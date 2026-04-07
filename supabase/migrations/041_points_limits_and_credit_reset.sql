-- Add point-earn limits and an outreach-credit reset helper.

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
begin
  if p_points <= 0 then
    return query select false, coalesce((
      select balance from public.user_points_balance where user_id = p_user_id
    ), 0);
    return;
  end if;

  -- Hard limits per earn event to slow abuse and runaway accrual.
  v_daily_points_limit := case p_event_name
    when 'onboarding_completed' then 25
    when 'like_sent' then 100
    when 'match_created' then 200
    when 'message_sent' then 100
    else null
  end;

  if v_daily_points_limit is not null then
    select coalesce(sum(points), 0)
    into v_today_earned
    from public.user_points_ledger
    where user_id = p_user_id
      and event_name = p_event_name
      and points > 0
      and created_at >= date_trunc('day', now())
      and created_at < date_trunc('day', now()) + interval '1 day';

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

create or replace function public.reset_outreach_credits(
  p_user_id uuid,
  p_reason text default 'manual_reset',
  p_event_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, new_credit_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_event_key text;
begin
  insert into public.user_outreach_credits_balance (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  values (p_user_id, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select balance
  into v_balance
  from public.user_outreach_credits_balance
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) <= 0 then
    return query select false, 0;
    return;
  end if;

  v_event_key := coalesce(
    nullif(trim(p_event_key), ''),
    'outreach_credit_reset:' || p_user_id::text || ':' || date_trunc('second', now())::text
  );

  update public.user_outreach_credits_balance
  set
    balance = 0,
    lifetime_spent = lifetime_spent + v_balance,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.user_outreach_credits_ledger (user_id, event_name, credits, event_key, metadata)
  values (
    p_user_id,
    'outreach_credit_reset',
    -v_balance,
    v_event_key,
    jsonb_build_object(
      'reason', coalesce(nullif(trim(p_reason), ''), 'manual_reset'),
      'creditsReset', v_balance
    ) || coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, event_key) do nothing;

  return query select true, 0;
end;
$$;

grant execute on function public.award_points(uuid, text, integer, text, jsonb) to authenticated;
grant execute on function public.reset_outreach_credits(uuid, text, text, jsonb) to authenticated;
