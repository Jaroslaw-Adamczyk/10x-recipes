# Implementation Plan: Recipe Images with Supabase Storage

Allow users to save recipe images (photos of their cooking results) per recipe, using Supabase Storage for file storage and Postgres for metadata and association with recipes.

---

## 1. Overview

- **Goal**: Users can upload, view, and delete recipe images attached to a recipe.
- **Storage**: Supabase Storage (one private bucket, path scoped by `recipe_id`).
- **Metadata**: New table `recipe_images` linking recipe → storage path and display order.
- **Security**: Only the recipe owner can upload/list/delete images for that recipe; storage RLS enforces path prefix by `auth.uid()`.

---

## 2. Data Model

### 2.1 New table: `recipe_images`

| Column         | Type        | Constraints                                  | Description                                                               |
| -------------- | ----------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `id`           | uuid        | PK, default gen_random_uuid()                | Row id.                                                                   |
| `recipe_id`    | uuid        | NOT NULL, FK → recipes(id) ON DELETE CASCADE | Recipe this image belongs to.                                             |
| `storage_path` | text        | NOT NULL, UNIQUE                             | Full object path in the bucket (e.g. `{user_id}/{recipe_id}/{uuid}.jpg`). |
| `position`     | integer     | NOT NULL, >= 0                               | Display order (0-based).                                                  |
| `created_at`   | timestamptz | NOT NULL, default now()                      | When the image was added.                                                 |

- **Index**: `recipe_images_recipe_id_idx` on `(recipe_id)` for listing by recipe.
- **RLS**: Enable RLS; policies so that only the recipe owner (via `recipes.user_id = auth.uid()`) can SELECT, INSERT, or DELETE rows for that recipe. No UPDATE needed if we only support reorder later via delete+re-upload or a separate reorder endpoint.

### 2.2 Storage path convention

- Bucket: `recipe-images` (private).
- Path: `{recipe_id}/{uuid}.{ext}` (e.g. `a1b2c3.../r4e5.../u6i7....jpg`).
- Allowed extensions/MIME: `image/jpeg`, `image/png`, `image/webp`; max file size (e.g. 5MB) enforced at bucket or app level.

This keeps ownership clear and allows storage RLS to restrict access by folder prefix.

---

## 3. Supabase Storage

### 3.1 Bucket

- **Name**: `recipe-images`.
- **Public**: No (private bucket); serve via signed URLs or via API that checks recipe ownership and returns redirect/URL).
- **File size limit**: e.g. 5MB (align with `config.toml` or bucket setting).
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`.

Bucket can be created in Supabase Dashboard (Storage → New bucket) or via API; storage schema is not fully managed by `supabase db diff`, so RLS for storage is usually configured in Dashboard or a separate script.

### 3.2 Storage RLS (Dashboard / SQL)

Policies on `storage.objects` for bucket `recipe-images`:

- **SELECT**: Authenticated users can read objects where the first path segment equals `auth.uid()::text` (i.e. their own `user_id` folder).
- **INSERT**: Authenticated users can insert only if `(storage.foldername(name))[1] = auth.uid()::text` and the path follows `{user_id}/{recipe_id}/*` and file type/size are allowed.
- **DELETE**: Same as SELECT so users can delete only their own files.

Exact policy expressions depend on Supabase’s current storage schema (e.g. `bucket_id`, `name`); implement in Dashboard or via documented SQL run with appropriate role.

---

## 4. Backend (API & Services)

### 4.1 Types (`src/types.ts`)

- Add type for table row: `RecipeImage` (from DB types after migration).
- DTO: `RecipeImageDto` (e.g. `id`, `recipe_id`, `storage_path`, `position`, `created_at`).
- Optional: `RecipeImageWithUrlDto` extending DTO with `url: string` (signed or public URL) for API responses.
- Extend `RecipeDetailDto` (or a separate type for the detail page) with `recipe_images: RecipeImageDto[]` (or with URLs) so the UI can show them without an extra round-trip.

### 4.2 Database types

- After migration, run Supabase type generation and update `src/db/database.types.ts` so `recipe_images` is typed.

### 4.3 Services (`src/lib/services/`)

- **`recipeImages/uploadRecipeImage.ts`**
  - Input: Supabase client, `userId`, `recipeId`, file (buffer + mimetype + original filename).
  - Verify recipe exists and `recipes.user_id = userId` (ownership).
  - Generate path: `{userId}/{recipeId}/{uuid}.{ext}` (ext from mimetype).
  - Upload to bucket `recipe-images` via `supabase.storage.from('recipe-images').upload(path, file, { contentType, upsert: false })`.
  - Insert row in `recipe_images` (recipe_id, storage_path, position = current max + 1).
  - Return new row (or DTO with signed URL if you generate it here).

- **`recipeImages/listRecipeImages.ts`**
  - Input: Supabase client, `userId`, `recipeId`.
  - Verify recipe ownership; then select from `recipe_images` where `recipe_id = recipeId`, order by `position`, `created_at`.
  - Optionally attach signed URLs (short expiry) for each `storage_path`.
  - Return array of DTOs (with or without URL).

- **`recipeImages/deleteRecipeImage.ts`**
  - Input: Supabase client, `userId`, `imageId` (or `recipeId` + `imageId`).
  - Ensure the image’s recipe belongs to `userId`; delete from storage by `storage_path`; then delete row from `recipe_images`.
  - Return success or throw NOT_FOUND.

- **`getRecipeDetail`**
  - Extend the existing recipe detail query to include `recipe_images` (ordered by position), or keep detail as-is and have the frontend call a dedicated images endpoint. Including in detail reduces round-trips; dedicated endpoint keeps detail smaller and allows lazy loading. Choose one and document.

### 4.4 API routes

- **POST `/api/recipes/[id]/images`**
  - Auth required; validate `id` (recipe id) with Zod.
  - Parse multipart body (e.g. `file` field); validate file type and size.
  - Call `uploadRecipeImage(supabase, user.id, recipeId, file)`.
  - Return 201 with created image DTO (and optional signed URL).

- **GET `/api/recipes/[id]/images`**
  - Auth required; validate recipe `id`.
  - Call `listRecipeImages(supabase, user.id, recipeId)` (with optional signed URL generation).
  - Return 200 with array of image DTOs.

- **DELETE `/api/recipes/[id]/images/[imageId]`**
  - Auth required; validate recipe `id` and `imageId` (UUID).
  - Call `deleteRecipeImage(supabase, user.id, imageId)` (or recipeId + imageId).
  - Return 204 on success.

Optional: **GET `/api/recipes/[id]/images/[imageId]/url`** that returns a short-lived signed URL for one image (if you don’t embed URLs in list/detail).

---

## 5. Frontend

### 5.1 Recipe detail page

- **Location**: Reuse `src/pages/recipes/[id].astro` and `RecipeDetailView`; add a “Recipe photos” (or “My recipe photos”) section.
- **Data**: Either extend `RecipeDetailDto` with `recipe_images` and pass from Astro, or have `RecipeDetailView` fetch `/api/recipes/[id]/images` on load and store in state.

### 5.2 UI components

- **RecipeImagesSection** (or similar)
  - Shows list of thumbnails (using signed URLs or URL endpoint) in order.
  - “Add photo” control: file input (and optionally drag-and-drop) accepting images only; on select, POST to `POST /api/recipes/[id]/images` (FormData with `file`), then refresh list or append new item with returned DTO/URL.
  - Each thumbnail has a delete button; on confirm, call `DELETE /api/recipes/[id]/images/[imageId]` and remove from list.
  - Loading and error states (e.g. “Failed to upload”, “Failed to delete”).
- **Placement**: Below steps or in a dedicated tab/section on the recipe detail page.

### 5.3 Validation

- Client-side: accept only image MIME types and enforce max size (e.g. 5MB) to give immediate feedback; server still validates again.

---

## 6. Migration and Config

### 6.1 Postgres migration

- New file: `supabase/migrations/YYYYMMDDHHmmss_create_recipe_images.sql`.
  - Create table `recipe_images` with columns and FK as above.
  - Create index on `recipe_id`.
  - Enable RLS.
  - Policies: SELECT/INSERT/DELETE for `recipe_images` where `recipe_id` is in (select id from recipes where user_id = auth.uid()).

### 6.2 Storage bucket and policies

- Create bucket `recipe-images` (private) in Supabase Dashboard (or via API).
- Set allowed MIME types and file size limit.
- Add RLS policies on `storage.objects` as in §3.2 (via Dashboard or documented SQL).

### 6.3 Local Supabase config (optional)

- In `supabase/config.toml`, you can uncomment and adapt the `[storage.buckets.images]` example to define a bucket for local dev (e.g. name `recipe-images`, same limits and allowed MIME types).

---

## 7. Implementation Order

1. **Migration**: Add `recipe_images` table and RLS; run migration and regenerate DB types.
2. **Storage**: Create `recipe-images` bucket and storage RLS (Dashboard or script).
3. **Types**: Add `RecipeImage` / DTOs and optional `RecipeDetailDto.recipe_images` in `src/types.ts` and wire DB types.
4. **Services**: Implement `uploadRecipeImage`, `listRecipeImages`, `deleteRecipeImage`; optionally extend `getRecipeDetail` with recipe images.
5. **API**: Add POST/GET/DELETE routes under `/api/recipes/[id]/images` and optional signed-URL endpoint.
6. **Frontend**: Add RecipeImagesSection (or equivalent), integrate into recipe detail page with upload and delete.

---

## 8. Edge Cases & Notes

- **Recipe ownership**: Every image operation must validate that the recipe belongs to the current user (via existing recipe row).
- **Cascade**: On recipe delete, `recipe_images` rows are removed by FK; storage objects under `{user_id}/{recipe_id}/` can be left for eventual cleanup or explicitly deleted in a delete-recipe flow if desired.
- **Quotas**: Rely on Supabase project limits; optionally document or enforce per-recipe or per-user image count in app logic.
- **Signed URLs**: Use short expiry (e.g. 60–300 seconds) for list/detail to avoid leaking URLs; regenerate when the user opens the page or refreshes the list.
- **Errors**: Return 400 for invalid file type/size, 404 when recipe or image not found or not owned, 413 if payload too large.

---

## 9. Testing (optional)

- E2E: On recipe detail, upload an image, assert it appears in the list; delete and assert it disappears.
- Unit/integration: Service tests for upload (with a test bucket or mock), list, and delete under correct and incorrect ownership.

This plan keeps storage and DB in sync, respects RLS and recipe ownership, and fits your existing Astro + Supabase + React structure.
