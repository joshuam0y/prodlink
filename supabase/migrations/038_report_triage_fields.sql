alter table public.match_message_reports
  add column if not exists escalation_status text not null default 'none'
    check (escalation_status in ('none', 'watch', 'urgent')),
  add column if not exists moderator_note text,
  add column if not exists triaged_at timestamptz,
  add column if not exists triaged_by uuid references auth.users (id) on delete set null;

create index if not exists match_message_reports_escalation_created_idx
  on public.match_message_reports (escalation_status, created_at desc);
