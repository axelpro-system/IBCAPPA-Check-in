-- Add tags column to forms and form_templates tables
-- Tags are used to categorize/organize forms by program (Sabatina, Evolute, etc.)

-- Add tags to forms table
alter table public.forms
add column if not exists tags text[] default '{}'::text[];

-- Add tags to form_templates table  
alter table public.form_templates
add column if not exists tags text[] default '{}'::text[];

-- Create index for efficient tag filtering
create index if not exists idx_forms_tags on public.forms using gin (tags);
create index if not exists idx_form_templates_tags on public.form_templates using gin (tags);