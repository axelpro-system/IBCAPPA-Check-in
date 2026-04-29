# Project Plan: Form Categories & Tags (Option A)

## Phase -1: Context Check
- **User Request**: Implement Option A (Sistema de Pastas e Tags / Categorização) for forms and templates to organize NPS by program (Sabatina, Evolute, etc.).
- **Mode**: Planning & Implementation (`/create` workflow)
- **Scope**: Database schema changes, Angular Service updates, UI filter components.

## Phase 0: Architecture & Trade-offs
- **Decision**: Add a `tags` array column (`text[]`) instead of a full relational many-to-many setup.
- **Why**: "Simplicity is the ultimate sophistication." A text array is perfectly supported by Postgres/Supabase, avoids complex joins, and is extremely easy to query and map in the frontend.

## Phase 1: Database Architecture
1. **Migration File**: Create a SQL migration to add `tags text[] default '{}'::text[]` to both `forms` and `form_templates` tables.
2. **Apply Migration**: Run `mcp_supabase_apply_migration`.

## Phase 2: Core Services (Backend)
1. **Models**: Update `form.model.ts` and `form-template.service.ts` to include `tags?: string[]`.
2. **Services**: Ensure `getForms()`, `createForm()`, `updateForm()`, and template methods handle the new `tags` field.

## Phase 3: Frontend UI (Implementation)
1. **Tag Input**: Add a way to specify tags when creating/editing a form or template (e.g., predefined badges to click).
2. **Gallery/Manager UI**: Add a visual display of tags on the cards.
3. **Filtering**: Add a filter bar at the top of the Form Manager and Template Gallery to quickly filter by tag.

## Phase 4: Verification
- Verify that Supabase accepts the tags array.
- Verify UI filtering works.
