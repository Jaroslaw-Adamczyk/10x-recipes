# API Endpoint Implementation Plan: POST /recipes/import

## 1. Endpoint Overview
Trigger an asynchronous import for a recipe URL. The endpoint creates a processing recipe placeholder and a corresponding import record, then queues a background worker to extract structured data.

## 2. Request Details

- URL Structure: `/api/recipes/import`
- Parameters:
  - Required: none in URL
  - Optional: none in query
- Request Body:
  - `source_url`: string, required, must be a valid URL, unique per user

## 3. Used Types
- DTOs: `RecipeDto`, `RecipeImportDto`
- Command Models: `RecipeImportCreateCommand`

## 4. Response Details
- Success: `202 Accepted`
  - Body: `{ "recipe": { ...recipe }, "import": { ...import } }`
- Errors:
  - `400 Bad Request`: invalid body, invalid URL
  - `401 Unauthorized`: missing/invalid auth session
  - `409 Conflict`: duplicate `user_id + source_url`
  - `500 Internal Server Error`: unexpected server or database errors

## 5. Data Flow
1. API route handler reads session and `supabase` from `context.locals`.
2. Validate `source_url` with Zod.
3. Create a `recipes` record with `status = "processing"` and `source_url`.
4. Create a `recipe_imports` record with attempt metadata and initial status.
5. Enqueue a background worker job to fetch and parse the URL (up to 3 retries).
6. Return the created `recipe` and `import` payloads.

## 6. Security Considerations
- Require authenticated user; reject unauthenticated requests with `401`.
- Enforce RLS by using user session on `context.locals.supabase`.
- Reject duplicate `source_url` per user to avoid repeated imports.

## 7. Error Handling
- Validation errors: return `400` with a concise error message.
- Auth errors: return `401`.
- Uniqueness violation on `source_url`: return `409`.
- Database failures: return `500` and log details to server logs.

## 8. Performance Considerations
- Use asynchronous worker for extraction to keep API latency low.
- Track retry counts and failure reasons on the import record.
- Avoid duplicate worker jobs for the same recipe/import.

## 9. Implementation Steps
1. Create `src/pages/api/recipes/import.ts` with `export const prerender = false`.
2. Add Zod schema for `source_url`.
3. Implement `createRecipeImport` service in `src/lib/services/recipes/`.
4. Insert into `recipes` and `recipe_imports`, then enqueue worker.
5. Return `202 Accepted` with import metadata and recipe placeholder.
