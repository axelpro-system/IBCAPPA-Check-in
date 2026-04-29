alter table public.forms add column if not exists tags text[] default '{}'::text[];
alter table public.form_templates add column if not exists tags text[] default '{}'::text[];
