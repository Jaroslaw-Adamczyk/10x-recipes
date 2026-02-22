alter table public.recipe_images enable row level security;

drop policy if exists recipe_images_auth on public.recipe_images;
drop policy if exists recipe_images_anon on public.recipe_images;

create policy recipe_images_auth on public.recipe_images for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id =(select auth.uid())))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id =(select auth.uid())));
create policy recipe_images_anon on public.recipe_images for all to anon
  using (false) with check (false);

create policy "recipes_images_storage_insert"
  on storage.objects 
  for insert to authenticated
  with check (
    bucket_id = 'recipes-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "recipes_images_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'recipes-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "recipes_images_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'recipes-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

