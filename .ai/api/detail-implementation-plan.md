# API Endpoint Implementation Plan: GET /recipes/:id

## 1. Endpoint Overview

Fetch a single recipe with full structured data (ingredients, steps, optional import metadata) for the authenticated user.

## 2. Request Details

- URL Structure: `/api/recipes/:id`
- Parameters:
  - Required: `id` (UUID)
  - Optional: none in query
- Request Body: none

## 3. Used Types

- DTOs: `RecipeDetailDto`, `RecipeDto`, `RecipeIngredientDto`, `RecipeStepDto`, `RecipeImportDto`

## 4. Response Details

- Success: `200 OK`
  - Body: `{ "recipe": { ... }, "ingredients": [ ... ], "steps": [ ... ], "import": { ... } | null }`
- Errors:
  - `400 Bad Request`: invalid recipe id
  - `401 Unauthorized`: missing/invalid auth session
  - `404 Not Found`: recipe not found for user
  - `500 Internal Server Error`: unexpected server or database errors

## 5. Data Flow

1. API route handler reads session and `supabase` from `context.locals`.
2. Validate `id` as UUID.
3. Query `recipes` with related `recipe_ingredients`, `recipe_steps`, and `recipe_imports`.
4. If no record found for the user, return `404`.
5. Return `RecipeDetailDto`.

## 6. Security Considerations

- Require authenticated user; reject unauthenticated requests with `401`.
- Enforce RLS by using user session on `context.locals.supabase`.
- Ensure user-scoped lookup to prevent data leakage.

## 7. Error Handling

- Validation errors: return `400` with a concise error message.
- Auth errors: return `401`.
- Not found: return `404`.
- Database failures: return `500` and log details to server logs.

## 8. Performance Considerations

- Fetch ingredients and steps ordered by `position`.
- Use a single query with selective columns to reduce payload size.
- Cache detail view on the client if needed to limit repetitive fetches.

## 9. Implementation Steps

1. Create `src/pages/api/recipes/[id].ts` with `export const prerender = false`.
2. Add Zod schema for `id` validation.
3. Implement `getRecipeDetail` service in `src/lib/services/recipes/`.
4. Query and map to `RecipeDetailDto`.
5. Map errors to status codes and return JSON response.
