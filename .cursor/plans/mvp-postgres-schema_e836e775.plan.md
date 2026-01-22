---
name: ""
overview: ""
todos: []
---

# MVP Postgres Schema Plan

## Scope and goals

- Define the core entities and relationships for recipes, ingredients, steps, import tracking, and logs.
- Specify constraints, data types, and indexes aligned with MVP scale and partial ingredient search.
- Outline RLS policies for per-user access and admin observability.
- Keep immutable import metadata and allow optional audit history via revisions.

## Key entities and relationships

- `recipes` (owned by a single user): one-to-many users→recipes. Required `user_id` FK to Supabase auth users.
- `recipe_ingredients` (child table): one-to-many recipes→ingredients. Store `raw_text` and `normalized_name`.
- `recipe_steps` (child table): one-to-many recipes→steps with explicit ordering.
- `recipe_imports` (import attempts and status): one-to-many users→recipe_imports. Optional link to `recipes` on success. Enforce one import per user+URL until user deletes failed record.
- `recipe_revisions` (optional audit trail): track edits to recipes if auditability is desired.
- `auth_event_logs` or `import_logs` (if not already covered by `recipe_imports`): retained for 30 days with pruning in mind.

## Data model details

- `recipes`
- Fields: `id`, `user_id`, `title`, `cook_time_minutes`, `prep_time_minutes`, `source_url` (immutable), `import_metadata` (JSONB), `status` (processing/succeeded/failed), `error_message`, timestamps.
- Constraints: `title` required; `status` enum; immutable `source_url`/`import_metadata` by convention or trigger.
- `recipe_ingredients`
- Fields: `id`, `recipe_id`, `raw_text`, `normalized_name`, `position`, timestamps.
- Constraints: `raw_text` required; `normalized_name` required; `position` optional but recommended for ordering.
- `recipe_steps`
- Fields: `id`, `recipe_id`, `step_text`, `position`, timestamps.
- Constraints: `step_text` required; `position` required for ordering.
- `recipe_imports`
- Fields: `id`, `user_id`, `source_url`, `status`, `attempt_count`, `error_code`, `error_message`, `metadata` (JSONB), `recipe_id` nullable, timestamps.
- Constraints: unique `(user_id, source_url)`; status enum; `attempt_count` <= 3.
- `recipe_revisions`
- Fields: `id`, `recipe_id`, `editor_user_id`, `changes` (JSONB), timestamps.

## Indexing and performance

- B-tree indexes on:
- `recipes.user_id`, `recipes.status`, `recipe_imports.user_id`, `recipe_imports.source_url`, `recipe_ingredients.normalized_name`.
- Ingredient search: use `ILIKE` on `normalized_name` for partial matches at small scale; note upgrade path to `pg_trgm` if needed.
- Add `created_at` indexes on log/import tables to support 30-day pruning.

## RLS and security

- Enable RLS on all user-owned tables.
- Policies:
- `recipes`: user can select/insert/update/delete where `user_id = auth.uid()`.
- `recipe_ingredients`, `recipe_steps`: access via parent `recipe_id` belonging to user.
- `recipe_imports`: user can select/insert/update/delete where `user_id = auth.uid()`.
- `recipe_revisions`: same ownership rule via `recipe_id`.
- Admin access via service role key for observability.

## Deliverables

- A schema outline with field lists, constraints, relationships, and indexes.
- RLS policy outlines for each table.
- Notes for future upgrades (trigram/FTS search, audit trail expansion).