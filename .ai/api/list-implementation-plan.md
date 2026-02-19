# API Endpoint Implementation Plan: GET /recipes

## 1. Endpoint Overview

Return a filtered list of the authenticated user's recipes, including a compact ingredient preview and status metadata for list rendering and search.

## 2. Request Details

- URL Structure: `/api/recipes`
- Parameters:
  - Required: none in URL
  - Optional query:
    - `status`: string enum (`processing`, `succeeded`, `failed`)
    - `q`: string, ingredient keyword search
    - `limit`: number, optional pagination size
    - `cursor`: string, optional pagination cursor
    - `sort`: string, optional sort key

## 3. Used Types

- DTOs: `RecipeListDto`, `RecipeListItemDto`
- Query Models: `RecipeListQuery`

## 4. Response Details

- Success: `200 OK`
  - Body: `{ "data": [ ...recipes ], "next_cursor": null }`
- Errors:
  - `400 Bad Request`: invalid query params (empty `q`, invalid status)
  - `401 Unauthorized`: missing/invalid auth session
  - `500 Internal Server Error`: unexpected server or database errors

## 5. Data Flow

1. API route handler reads session and `supabase` from `context.locals`.
2. Validate and normalize query params (trim/lowercase `q`).
3. Call `listRecipes(supabase, userId, query)` to fetch recipes with ingredient preview.
4. Return the list payload as `RecipeListDto`.

## 6. Security Considerations

- Require authenticated user; reject unauthenticated requests with `401`.
- Enforce RLS by using user session on `context.locals.supabase`.
- Normalize search input to avoid unexpected query behavior.

## 7. Error Handling

- Validation errors: return `400` with a concise error message.
- Auth errors: return `401`.
- Database failures: return `500` and log details to server logs.

## 8. Performance Considerations

- Add indexes on `recipes.user_id`, `recipes.status`, and `recipe_ingredients.normalized_name`.
- Limit query size with `limit` and cursor-based pagination when available.
- Prefer ingredient preview aggregation server-side to minimize payload size.

## 9. Implementation Steps

1. Create or update `src/pages/api/recipes/index.ts` with `export const prerender = false`.
2. Add Zod schema for `status` and `q` query validation.
3. Normalize `q` to lowercase before matching.
4. Implement or reuse `listRecipes` service to fetch list data.
5. Map errors to HTTP status codes and return JSON response.
