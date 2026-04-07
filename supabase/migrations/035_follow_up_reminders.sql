create table if not exists public.message_follow_up_reminders (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id uuid not null references auth.users (id) on delete cascade,
  remind_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  unique (user_id, match_id, remind_at)
);

create index if not exists message_follow_up_reminders_user_remind_idx
  on public.message_follow_up_reminders (user_id, remind_at desc);

alter table public.message_follow_up_reminders enable row level security;

create policy "message_follow_up_reminders_select_own"
  on public.message_follow_up_reminders for select
  using (auth.uid() = user_id);

create policy "message_follow_up_reminders_insert_own"
  on public.message_follow_up_reminders for insert
  with check (auth.uid() = user_id);

create policy "message_follow_up_reminders_update_own"
  on public.message_follow_up_reminders for update
  using (auth.uid() = user_id);
