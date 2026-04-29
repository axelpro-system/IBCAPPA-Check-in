# Project Plan: NPS Templates Fix

## Phase -1: Context Check
- **User Request**: Fix the `form_templates` so they persist to the database and are visible to other users. The templates currently only save to localStorage. The user needs this urgently for creating NPS templates for Ana Carolina.
- **Mode**: Edit / Fix
- **Scope**: Single migration file edit and application to Supabase.

## Phase 0: Socratic Gate (Skipped due to urgency & exact cause found)
Since the user is in a hurry and the exact root cause has been found (missing table in production + restrictive RLS policy), we are directly proposing and applying the fix to unblock Ana Carolina's operation this week.

## Phase 1: Task Breakdown
1. **Update Migration File**: Modify `20260427_create_form_templates.sql` to change the `SELECT` RLS policy so all authenticated users can read templates (`using (true);`).
2. **Apply Migration**: Apply the migration to the remote Supabase database `[FORM] [IBCAPPA]` so the table is created.
3. **Verify**: Ensure the table exists by executing a `SELECT` query.

## Phase 2: Agent Assignments
- **Orchestrator / Backend-Specialist**: To modify the SQL schema and run the migration on Supabase.
