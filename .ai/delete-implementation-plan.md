# API Endpoint Implementation Plan: DELETE /recipes/:id

## 1. Endpoint Overview
Delete a single recipe (and related ingredients/steps/import metadata) for the authenticated user.

## 2. Request Details

- URL Structure: `/api/recipes/:id`
- Parameters:
  - Required: `id` (UUID)
  - Optional: none in query
- Request Body: none

## 3. Used Types
- Errors: `RecipeDeleteError` (service-level)

## 4. Response Details
- Success: `204 No Content`
- Errors:
  - `400 Bad Request`: invalid recipe id
  - `401 Unauthorized`: missing/invalid auth session
  - `404 Not Found`: recipe not found for user
  - `500 Internal Server Error`: unexpected server or database errors

## 5. Data Flow
1. API route handler reads session and `supabase` from `context.locals`.
2. Validate `id` as UUID.
3. Call `deleteRecipe(supabase, userId, id)` to delete the record.
4. Return `204` with no body.

## 6. Security Considerations
- Require authenticated user; reject unauthenticated requests with `401`.
- Enforce RLS by using user session on `context.locals.supabase`.
- Ensure delete is scoped to `user_id`.

## 7. Error Handling
- Validation errors: return `400` with a concise error message.
- Auth errors: return `401`.
- Not found: return `404`.
- Database failures: return `500` and log details to server logs.

## 8. Performance Considerations
- Prefer cascading deletes at the database layer for related rows.
- Avoid extra reads; delete by id + user scope.

## 9. Implementation Steps
1. Create `src/pages/api/recipes/[id].ts` with `export const prerender = false`.
2. Add Zod schema for `id` validation.
3. Implement `deleteRecipe` service in `src/lib/services/recipes/`.
4. Map service errors to HTTP status codes.
5. Return `204 No Content` on success.
