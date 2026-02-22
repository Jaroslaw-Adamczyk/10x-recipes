create table public.recipe_images (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  storage_path text not null unique,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now()
);

create index recipe_images_recipe_id_idx on public.recipe_images (recipe_id);
