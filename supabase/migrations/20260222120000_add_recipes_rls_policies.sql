-- Idempotent RLS policies for recipe tables: drop if exists then create.
-- Ensures recipes, recipe_ingredients, recipe_steps, recipe_imports, recipe_revisions have correct policies.

alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_imports enable row level security;
alter table public.recipe_revisions enable row level security;
alter table public.auth_event_logs enable row level security;

-- recipes
  drop policy if exists recipes_auth on public.recipes;
  drop policy if exists recipes_anon on public.recipes;


create policy recipes_auth on public.recipes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recipes_anon on public.recipes for all to anon
  using (false) with check (false);

-- recipe_ingredients
drop policy if exists recipe_ingredients_auth on public.recipe_ingredients;
drop policy if exists recipe_ingredients_anon on public.recipe_ingredients;

create policy recipe_ingredients_auth on public.recipe_ingredients for all 
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())) 
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy recipe_ingredients_anon on public.recipe_ingredients for all using (false) with check (false);

-- recipe_steps
drop policy if exists recipe_steps_auth on public.recipe_steps;
drop policy if exists recipe_steps_anon on public.recipe_steps;

create policy recipe_steps_auth on public.recipe_steps for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())) 
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy recipe_steps_anon on public.recipe_steps for all to anon
  using (false) with check (false);

-- recipe_imports
drop policy if exists recipe_imports_auth on public.recipe_imports;
drop policy if exists recipe_imports_anon on public.recipe_imports;

create policy recipe_imports_auth on public.recipe_imports for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recipe_imports_anon on public.recipe_imports for all to anon
  using (false) with check (false);

-- recipe_revisions
drop policy if exists recipe_revisions_auth on public.recipe_revisions;
drop policy if exists recipe_revisions_anon on public.recipe_revisions;

create policy recipe_revisions_auth on public.recipe_revisions for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())) 
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy recipe_revisions_anon on public.recipe_revisions for all to anon
  using (false) with check (false);
