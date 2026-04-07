create or replace function public.spend_points(
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
  v_balance integer;
begin
  if p_points <= 0 then
    return query select false, coalesce((
      select balance from public.user_points_balance where user_id = p_user_id
    ), 0);
    return;
  end if;

  insert into public.user_points_balance (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  values (p_user_id, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select balance
  into v_balance
  from public.user_points_balance
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) < p_points then
    return query select false, coalesce(v_balance, 0);
    return;
  end if;

  insert into public.user_points_ledger (user_id, event_name, points, event_key, metadata)
  values (p_user_id, p_event_name, -p_points, p_event_key, coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, event_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return query select false, coalesce(v_balance, 0);
    return;
  end if;

  update public.user_points_balance
  set
    balance = balance - p_points,
    lifetime_spent = lifetime_spent + p_points,
    updated_at = now()
  where user_id = p_user_id;

  return query
    select true, b.balance
    from public.user_points_balance b
    where b.user_id = p_user_id;
end;
$$;

grant execute on function public.spend_points(uuid, text, integer, text, jsonb) to authenticated;
