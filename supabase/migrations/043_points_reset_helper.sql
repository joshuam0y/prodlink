-- Helper to reset points balance to zero for testing/admin support.

create or replace function public.reset_points(
  p_user_id uuid,
  p_reason text default 'manual_reset',
  p_event_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, new_points_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_event_key text;
begin
  insert into public.user_points_balance (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  values (p_user_id, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select balance
  into v_balance
  from public.user_points_balance
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) <= 0 then
    return query select false, 0;
    return;
  end if;

  v_event_key := coalesce(
    nullif(trim(p_event_key), ''),
    'points_reset:' || p_user_id::text || ':' || date_trunc('second', now())::text
  );

  update public.user_points_balance
  set
    balance = 0,
    lifetime_spent = lifetime_spent + v_balance,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.user_points_ledger (user_id, event_name, points, event_key, metadata)
  values (
    p_user_id,
    'points_reset',
    -v_balance,
    v_event_key,
    jsonb_build_object(
      'reason', coalesce(nullif(trim(p_reason), ''), 'manual_reset'),
      'pointsReset', v_balance
    ) || coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, event_key) do nothing;

  return query select true, 0;
end;
$$;

grant execute on function public.reset_points(uuid, text, text, jsonb) to authenticated;
