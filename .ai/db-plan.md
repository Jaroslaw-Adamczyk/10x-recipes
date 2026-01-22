1. List of tables with their columns, data types, and constraints

### `users`

This table will be managed by Supabase Auth

### `recipes`
- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid not null references auth.users(id) on delete cascade
- `title` text not null
- `cook_time_minutes` integer null check (cook_time_minutes >= 0)
- `prep_time_minutes` integer null check (prep_time_minutes >= 0)
- `source_url` text null
- `status` recipe_status not null default 'processing'
- `error_message` text null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Constraints:
- check (`status` in 'processing' | 'succeeded' | 'failed')
- optional uniqueness on (`user_id`, `source_url`) where `source_url` is not null to prevent duplicate imports per user

### `recipe_ingredients`
- `id` uuid primary key default gen_random_uuid()
- `recipe_id` uuid not null references recipes(id) on delete cascade
- `raw_text` text not null
- `normalized_name` text not null
- `position` integer null check (position >= 0)
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### `recipe_steps`
- `id` uuid primary key default gen_random_uuid()
- `recipe_id` uuid not null references recipes(id) on delete cascade
- `step_text` text not null
- `position` integer not null check (position >= 0)
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### `recipe_imports`
- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid not null references auth.users(id) on delete cascade
- `source_url` text not null
- `status` recipe_status not null default 'processing'
- `attempt_count` integer not null default 0 check (attempt_count between 0 and 3)
- `error_code` text null
- `error_message` text null
- `metadata` jsonb not null default '{}'::jsonb
- `recipe_id` uuid null references recipes(id) on delete set null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Constraints:
- unique (`user_id`, `source_url`)

### `recipe_revisions` 
- `id` uuid primary key default gen_random_uuid()
- `recipe_id` uuid not null references recipes(id) on delete cascade
- `user_id` uuid not null references auth.users(id) on delete cascade
- `changes` jsonb not null
- `created_at` timestamptz not null default now()

### `auth_event_logs` ( 30-day retention)
- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid null references auth.users(id) on delete set null
- `event_type` text not null
- `metadata` jsonb not null default '{}'::jsonb
- `created_at` timestamptz not null default now()

Enums:
- `recipe_status` enum ('processing', 'succeeded', 'failed')

2. Relationships between tables

- auth.users (1) → (many) recipes via `recipes.user_id`
- recipes (1) → (many) recipe_ingredients via `recipe_ingredients.recipe_id`
- recipes (1) → (many) recipe_steps via `recipe_steps.recipe_id`
- auth.users (1) → (many) recipe_imports via `recipe_imports.user_id`
- recipe_imports (optional) → recipes via `recipe_imports.recipe_id` (null until success)
- recipes (1) → (many) recipe_revisions via `recipe_revisions.recipe_id`
- auth.users (1) → (many) recipe_revisions via `recipe_revisions.user_id`
- auth.users (1) → (many) auth_event_logs via `auth_event_logs.user_id`

3. Indexes

- `recipes_user_id_idx` on recipes (`user_id`)
- `recipes_status_idx` on recipes (`status`)
- `recipes_source_url_unique_idx` unique on recipes (`user_id`, `source_url`) where `source_url` is not null
- `recipe_ingredients_recipe_id_idx` on recipe_ingredients (`recipe_id`)
- `recipe_ingredients_normalized_name_idx` on recipe_ingredients (`normalized_name`)
- `recipe_steps_recipe_id_idx` on recipe_steps (`recipe_id`)
- `recipe_imports_user_id_idx` on recipe_imports (`user_id`)
- `recipe_imports_source_url_idx` on recipe_imports (`source_url`)
- `recipe_imports_created_at_idx` on recipe_imports (`created_at`)
- `recipe_revisions_recipe_id_idx` on recipe_revisions (`recipe_id`)
- `auth_event_logs_created_at_idx` on auth_event_logs (`created_at`)

4. PostgreSQL policies (if applicable)

Enable RLS on: `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_imports`, `recipe_revisions`.

Policies:
- `recipes`:
  - select/insert/update/delete: `user_id = auth.uid()`
- `recipe_ingredients`:
  - select/insert/update/delete: `exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())`
- `recipe_steps`:
  - select/insert/update/delete: `exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())`
- `recipe_imports`:
  - select/insert/update/delete: `user_id = auth.uid()`
- `recipe_revisions`:
  - select/insert/update/delete: `exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())`

Service role access:
- Full access to all tables for backend workers and observability.

5. Additional notes or explanations about design decisions

- `recipe_imports` is separated from `recipes` to track retry attempts, processing status, and failures even when a recipe record is not created.
- `recipe_ingredients.normalized_name` supports case-insensitive keyword search; use `ILIKE` for MVP and consider `pg_trgm` for scale.
- `recipes.source_url` is nullable to support manual recipe creation; uniqueness is enforced only when present.
- `recipe_revisions` and `auth_event_logs` are optional but outlined for auditability and authentication analytics; both can be added later without impacting core flows.
