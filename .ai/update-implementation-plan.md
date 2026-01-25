# API Endpoint Implementation Plan: PATCH /recipes/:id

## 1. Endpoint Overview
Update a saved recipe's title, cook time, ingredients, or steps for the authenticated user while preserving import metadata.

## 2. Request Details

- URL Structure: `/api/recipes/:id`
- Parameters:
  - Required: `id` (UUID)
  - Optional: none in query
- Request Body:
  - `title`: string, optional, non-empty if provided
  - `cook_time_minutes`: number, optional, must be >= 0
  - `ingredients`: array of objects, optional, length >= 1 when provided
    - `id`: string or null, optional (existing ingredient id)
    - `raw_text`: string, required, non-empty
    - `normalized_name`: string, required, non-empty, lowercased and trimmed on server
    - `position`: number, optional, must be >= 0
  - `steps`: array of objects, optional, length >= 1 when provided
    - `id`: string or null, optional (existing step id)
    - `step_text`: string, required, non-empty
    - `position`: number, required, must be >= 0

## 3. Used Types
- DTOs: `RecipeUpdateResultDto`, `RecipeIngredientDto`, `RecipeStepDto`
- Command Models: `RecipeUpdateCommand`, `RecipeIngredientUpsertCommand`, `RecipeStepUpsertCommand`

## 4. Response Details
- Success: `200 OK`
  - Body: `{ "recipe": { ...recipe }, "ingredients": [ ... ], "steps": [ ... ] }`
- Errors:
  - `400 Bad Request`: invalid body, missing required fields, negative times, empty arrays
  - `401 Unauthorized`: missing/invalid auth session
  - `404 Not Found`: recipe not found for user
  - `500 Internal Server Error`: unexpected server or database errors

## 5. Data Flow
1. API route handler reads session and `supabase` from `context.locals`.
2. Validate `id` and request body with Zod.
3. Normalize `normalized_name` values (trim + lowercase).
4. Call `updateRecipe(supabase, userId, id, command)` to update:
   - `recipes` table for core fields.
   - Upsert `recipe_ingredients` and `recipe_steps`.
   - Remove ingredients/steps not present in the payload (if a full replacement strategy is used).
5. Return `RecipeUpdateResultDto`.

## 6. Security Considerations
- Require authenticated user; reject unauthenticated requests with `401`.
- Enforce RLS by using user session on `context.locals.supabase`.
- Ensure updates are scoped to `user_id`.

## 7. Error Handling
- Validation errors: return `400` with a concise error message.
- Auth errors: return `401`.
- Not found: return `404`.
- Database failures: return `500` and log details to server logs.

## 8. Performance Considerations
- Prefer a single transaction for recipe + ingredients + steps updates.
- Batch upserts for ingredients and steps to reduce round trips.
- Avoid excessive payload sizes; enforce max counts if needed later.

## 9. Implementation Steps
1. Add `PATCH` handler to `src/pages/api/recipes/[id].ts` with `export const prerender = false`.
2. Build Zod schema for update payload and `id`.
3. Normalize ingredient names server-side.
4. Implement `updateRecipe` service in `src/lib/services/recipes/`.
5. Map service errors to HTTP status codes and return JSON response.
