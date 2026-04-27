create extension if not exists pgcrypto;

create table if not exists public.form_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  form_id uuid not null references public.forms(id) on delete cascade,
  field_id uuid null references public.form_fields(id) on delete set null,
  field_label text,
  page_slug text,
  visitor_id text not null,
  session_id text not null,
  user_id uuid null references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_form_events_form_id on public.form_events(form_id);
create index if not exists idx_form_events_event_type on public.form_events(event_type);
create index if not exists idx_form_events_created_at on public.form_events(created_at desc);
create index if not exists idx_form_events_visitor_id on public.form_events(visitor_id);

alter table public.form_events enable row level security;

drop policy if exists "Allow insert form events (public)" on public.form_events;
create policy "Allow insert form events (public)"
on public.form_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow read form events owner" on public.form_events;
create policy "Allow read form events owner"
on public.form_events
for select
to authenticated
using (
  exists (
    select 1
    from public.forms f
    where f.id = form_events.form_id
      and f.created_by = auth.uid()
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  user_id uuid not null references auth.users(id) on delete cascade,
  before_data jsonb null,
  after_data jsonb null,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Allow insert own audit logs" on public.audit_logs;
create policy "Allow insert own audit logs"
on public.audit_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Allow read own audit logs" on public.audit_logs;
create policy "Allow read own audit logs"
on public.audit_logs
for select
to authenticated
using (auth.uid() = user_id);
