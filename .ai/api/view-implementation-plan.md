# API Endpoint Implementation Plan: POST /recipes

## 1. Endpoint Overview
Create a recipe manually for the authenticated user, including ingredients and steps. The endpoint validates input, enforces per-user `source_url` uniqueness (when provided), and returns the full created recipe payload.

## 2. Request Details
- HTTP Method: POST
- URL Structure: `/api/recipes`
- Parameters:
  - Required: none in URL
  - Optional: none in query
- Request Body:
  - `title`: string, required, non-empty
  - `cook_time_minutes`: number, optional, must be >= 0
  - `source_url`: string or null, optional, must be a valid URL if provided, unique per user
  - `ingredients`: array of objects, required, length >= 1
    - `raw_text`: string, required, non-empty
    - `normalized_name`: string, required, non-empty, lowercased and trimmed on server
    - `position`: number, optional, must be >= 0
  - `steps`: array of objects, required, length >= 1
    - `step_text`: string, required, non-empty
    - `position`: number, required, must be >= 0

## 3. Used Types
- DTOs: `RecipeDto`, `RecipeIngredientDto`, `RecipeStepDto`, `RecipeCreateResultDto`
- Command Models: `RecipeCreateCommand`, `RecipeIngredientCreateCommand`, `RecipeStepCreateCommand`

## 4. Response Details
- Success: `201 Created`
  - Body: `{ "recipe": { ...recipes }, "ingredients": [ ...recipe_ingredients ], "steps": [ ...recipe_steps ] }`
- Errors:
  - `400 Bad Request`: invalid body, missing required fields, invalid URL, negative times, empty arrays
  - `401 Unauthorized`: missing/invalid auth session
  - `409 Conflict`: duplicate `user_id + source_url` when `source_url` provided
  - `500 Internal Server Error`: unexpected server or database errors

## 5. Data Flow
1. API route handler reads session and `supabase` from `context.locals`.
2. Validate request body with Zod and normalize `normalized_name`.
3. Create recipe record with `status = "succeeded"` and optional `source_url`.
4. Insert ingredients and steps referencing the new recipe ID.
5. Fetch and return the created recipe, ingredients, and steps as `RecipeCreateResultDto`.

## 6. Security Considerations
- Require authenticated user; reject unauthenticated requests with `401`.
- Enforce RLS by using user session on `context.locals.supabase`.
- Validate and normalize user input to mitigate injection and malformed data.
- Ensure `source_url` uniqueness per user to avoid duplicate imports/entries.

## 7. Error Handling
- Validation errors: return `400` with a concise error message.
- Auth errors: return `401`.
- Uniqueness violation on `source_url`: return `409`.
- Database failures: return `500` and log details to server logs.
- No dedicated error table for this endpoint; only log auth events to `auth_event_logs` if product requires it later.

## 8. Performance Considerations
- Limit payload size by rejecting large ingredient/step arrays if needed later.
- Use batched inserts for ingredients and steps.
- Prefer a single database transaction (via a SQL function or RPC) if atomicity becomes a requirement.

## 9. Implementation Steps
1. Create `src/pages/api/recipes/index.ts` with `export const prerender = false`.
2. In the handler, read `supabase` from `context.locals` and check auth session.
3. Build Zod schema for the request body, including URL validation and numeric bounds.
4. Normalize `normalized_name` values (trim + lowercase) before insertion.
5. Implement a service in `src/lib/services/recipes/createRecipe.ts` to:
   - Insert into `recipes` with `status = "succeeded"`.
   - Insert `recipe_ingredients` and `recipe_steps`.
   - Return `RecipeCreateResultDto`.
6. In the route, call the service and map errors to status codes.
7. Add tests or minimal smoke checks (optional) to verify validation and 409 handling.
