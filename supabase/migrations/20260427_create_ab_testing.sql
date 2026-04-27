create table if not exists public.ab_experiments (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'finished')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create index if not exists idx_ab_experiments_form_id on public.ab_experiments(form_id);
create index if not exists idx_ab_experiments_status on public.ab_experiments(status);

create table if not exists public.ab_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.ab_experiments(id) on delete cascade,
  name text not null,
  weight int not null default 50,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ab_variants_experiment_id on public.ab_variants(experiment_id);

create table if not exists public.ab_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.ab_experiments(id) on delete cascade,
  variant_id uuid not null references public.ab_variants(id) on delete cascade,
  visitor_id text not null,
  session_id text,
  assigned_at timestamptz not null default now(),
  unique (experiment_id, visitor_id)
);

create index if not exists idx_ab_assignments_experiment_visitor on public.ab_assignments(experiment_id, visitor_id);

alter table public.ab_experiments enable row level security;
alter table public.ab_variants enable row level security;
alter table public.ab_assignments enable row level security;

drop policy if exists "AB experiments owner read" on public.ab_experiments;
create policy "AB experiments owner read"
on public.ab_experiments
for select
to authenticated
using (
  auth.uid() = created_by
  or exists (
    select 1 from public.forms f
    where f.id = ab_experiments.form_id and f.created_by = auth.uid()
  )
);

drop policy if exists "AB experiments owner write" on public.ab_experiments;
create policy "AB experiments owner write"
on public.ab_experiments
for all
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "AB variants owner read" on public.ab_variants;
create policy "AB variants owner read"
on public.ab_variants
for select
to authenticated
using (
  exists (
    select 1
    from public.ab_experiments e
    where e.id = ab_variants.experiment_id
      and (e.created_by = auth.uid())
  )
);

drop policy if exists "AB variants owner write" on public.ab_variants;
create policy "AB variants owner write"
on public.ab_variants
for all
to authenticated
using (
  exists (
    select 1 from public.ab_experiments e
    where e.id = ab_variants.experiment_id
      and e.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.ab_experiments e
    where e.id = ab_variants.experiment_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "AB assignments public insert" on public.ab_assignments;
create policy "AB assignments public insert"
on public.ab_assignments
for insert
to anon, authenticated
with check (true);

drop policy if exists "AB assignments owner read" on public.ab_assignments;
create policy "AB assignments owner read"
on public.ab_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.ab_experiments e
    where e.id = ab_assignments.experiment_id
      and e.created_by = auth.uid()
  )
);
