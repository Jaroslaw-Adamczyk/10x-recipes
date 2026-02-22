-- migration: create recipe schema and rls policies
-- purpose: define core recipe tables, enums, indexes, and row-level security
-- tables: recipes, recipe_ingredients, recipe_steps, recipe_imports, recipe_revisions, auth_event_logs
-- considerations: rls enforced for user-owned data; auth_event_logs is service-role only

-- enum for recipe processing status
create type public.recipe_status as enum ('processing', 'succeeded', 'failed');

-- main recipes table (user-owned)
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cook_time_minutes integer null check (cook_time_minutes >= 0),
  prep_time_minutes integer null check (prep_time_minutes >= 0),
  source_url text null,
  status public.recipe_status not null default 'processing',
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- per-recipe ingredients (user-owned through recipe)
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  raw_text text not null,
  normalized_name text not null,
  position integer null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- per-recipe steps (user-owned through recipe)
create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  step_text text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- import attempts for external recipes (user-owned)
create table public.recipe_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  status public.recipe_status not null default 'processing',
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  error_code text null,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  recipe_id uuid null references public.recipes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_imports_user_source_url_unique unique (user_id, source_url)
);

-- audit revisions for recipes (user-owned through recipe)
create table public.recipe_revisions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  changes jsonb not null,
  created_at timestamptz not null default now()
);

-- authentication event logs (service-role only)
create table public.auth_event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- indexes to support common queries and filters
create index recipes_user_id_idx on public.recipes (user_id);
create index recipes_status_idx on public.recipes (status);
-- unique per user when a source url is provided
create unique index recipes_source_url_unique_idx on public.recipes (user_id, source_url)
  where source_url is not null;

create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_normalized_name_idx on public.recipe_ingredients (normalized_name);

create index recipe_steps_recipe_id_idx on public.recipe_steps (recipe_id);

create index recipe_imports_user_id_idx on public.recipe_imports (user_id);
create index recipe_imports_source_url_idx on public.recipe_imports (source_url);
create index recipe_imports_created_at_idx on public.recipe_imports (created_at);

create index recipe_revisions_recipe_id_idx on public.recipe_revisions (recipe_id);

create index auth_event_logs_created_at_idx on public.auth_event_logs (created_at);

