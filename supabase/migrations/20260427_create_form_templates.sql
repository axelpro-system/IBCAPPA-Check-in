create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text default 'bi-journal-text',
  source_form_id uuid references public.forms(id) on delete set null,
  form_data jsonb not null,
  fields_data jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.form_templates enable row level security;

create policy "Users can read all templates"
on public.form_templates
for select
to authenticated
using (true);

create policy "Users can insert own templates"
on public.form_templates
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Users can delete all templates"
on public.form_templates
for delete
to authenticated
using (true);
