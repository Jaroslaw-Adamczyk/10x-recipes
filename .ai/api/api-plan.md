# REST API Plan

## 1. Resources

- `recipes` → `recipes`
- `recipe_ingredients` → `recipe_ingredients`
- `recipe_steps` → `recipe_steps`
- `recipe_imports` → `recipe_imports`
- `recipe_revisions` → `recipe_revisions`
- `auth_event_logs` → `auth_event_logs` (internal analytics/observability)

## 2. Endpoints

Base URL: `/api`

### Recipe Imports (async)

#### POST `/recipe-imports`

- Description: Create an import job for a recipe URL; worker runs asynchronously.
- Request JSON:
  - `{ "source_url": "string" }`
- Response JSON:
  - `{ "id": "uuid", "source_url": "string", "status": "processing", "attempt_count": 0, "error_code": null, "error_message": null, "metadata": {}, "recipe_id": null, "created_at": "timestamp", "updated_at": "timestamp" }`
- Success: `202 Accepted`
- Errors:
  - `400 Bad Request` (invalid URL)
  - `409 Conflict` (duplicate `user_id + source_url`)

#### GET `/recipe-imports`

- Description: List import jobs for the current user.
- Query params:
  - `status` (optional: `processing|succeeded|failed`)
  - `limit` (default 20, max 100)
  - `cursor` (pagination cursor)
  - `sort` (default `-created_at`)
- Response JSON:
  - `{ "data": [ { ...recipe_imports } ], "next_cursor": "string|null" }`
- Success: `200 OK`

#### GET `/recipe-imports/{id}`

- Description: Get a specific import job, including errors and retry info.
- Response JSON:
  - `{ ...recipe_imports }`
- Success: `200 OK`
- Errors:
  - `404 Not Found`

#### DELETE `/recipe-imports/{id}`

- Description: Delete an import job; used to clear failed imports quickly.
- Response JSON:
  - `{ "ok": true }`
- Success: `204 No Content`
- Errors:
  - `404 Not Found`

### Recipes

#### POST `/recipes`

- Description: Create a recipe manually.
- Request JSON:
  - `{ "title": "string", "cook_time_minutes": 0, "source_url": null, "ingredients": [ { "raw_text": "string", "normalized_name": "string", "position": 0 } ], "steps": [ { "step_text": "string", "position": 0 } ] }`
- Response JSON:
  - `{ "recipe": { "id": "uuid", "user_id": "uuid", "title": "string", "cook_time_minutes": 0, "prep_time_minutes": null, "source_url": null, "status": "processing|succeeded|failed", "error_message": null, "created_at": "timestamp", "updated_at": "timestamp" }, "ingredients": [ { ...recipe_ingredients } ], "steps": [ { ...recipe_steps } ] }`
- Success: `201 Created`
- Errors:
  - `400 Bad Request` (validation failures)
  - `409 Conflict` (duplicate `user_id + source_url` when provided)

#### GET `/recipes`

- Description: List recipes for the current user.
- Query params:
  - `status` (optional: `processing|succeeded|failed`)
  - `q` (optional ingredient keyword search; normalized server-side)
  - `limit` (default 20, max 100)
  - `cursor` (pagination cursor)
  - `sort` (default `-updated_at`)
- Response JSON:
  - `{ "data": [ { "id": "uuid", "title": "string", "ingredients_preview": [ "string" ], "status": "processing|succeeded|failed", "error_message": "string|null", "created_at": "timestamp", "updated_at": "timestamp" } ], "next_cursor": "string|null" }`
- Success: `200 OK`

#### GET `/recipes/{id}`

- Description: Get full recipe details (ingredients, steps, cook time).
- Response JSON:
  - `{ "recipe": { ...recipes }, "ingredients": [ { ...recipe_ingredients } ], "steps": [ { ...recipe_steps } ], "import": { ...recipe_imports|null } }`
- Success: `200 OK`
- Errors:
  - `404 Not Found`

#### PATCH `/recipes/{id}`

- Description: Update recipe title, ingredients, steps, or cook time; creates a revision.
- Request JSON:
  - `{ "title": "string", "cook_time_minutes": 0, "prep_time_minutes": null, "ingredients": [ { "id": "uuid|null", "raw_text": "string", "normalized_name": "string", "position": 0 } ], "steps": [ { "id": "uuid|null", "step_text": "string", "position": 0 } ] }`
- Response JSON:
  - `{ "recipe": { ...recipes }, "ingredients": [ { ...recipe_ingredients } ], "steps": [ { ...recipe_steps } ] }`
- Success: `200 OK`
- Errors:
  - `400 Bad Request` (validation failures)
  - `404 Not Found`

#### DELETE `/recipes/{id}`

- Description: Delete a recipe (with confirmation enforced by client for non-failed items).
- Response JSON:
  - `{ "ok": true }`
- Success: `204 No Content`
- Errors:
  - `404 Not Found`

<!-- ### Recipe Revisions (audit)
#### GET `/recipes/{id}/revisions`
- Description: List revisions for a recipe.
- Query params:
  - `limit` (default 20, max 100)
  - `cursor`
  - `sort` (default `-created_at`)
- Response JSON:
  - `{ "data": [ { "id": "uuid", "recipe_id": "uuid", "user_id": "uuid", "changes": {}, "created_at": "timestamp" } ], "next_cursor": "string|null" }`
- Success: `200 OK`

### Auth Event Logs (internal/admin)
#### GET `/auth-event-logs`
- Description: List auth events (service role only).
- Query params:
  - `limit` (default 50, max 200)
  - `cursor`
  - `sort` (default `-created_at`)
- Response JSON:
  - `{ "data": [ { "id": "uuid", "user_id": "uuid|null", "event_type": "string", "metadata": {}, "created_at": "timestamp" } ], "next_cursor": "string|null" }`
- Success: `200 OK`
- Errors:
  - `403 Forbidden` (non-service role) -->

## 4. Validation and Business Logic

### Validation Conditions

- `recipes.title`: required, non-empty.
- `recipes.cook_time_minutes`: optional, must be `>= 0`.
- `recipes.prep_time_minutes`: optional, must be `>= 0`.
- `recipes.source_url`: optional; unique per user when present.
- `recipes.status`: enum `processing|succeeded|failed`.
- `recipe_ingredients.raw_text`: required.
- `recipe_ingredients.normalized_name`: required (lowercased, trimmed).
- `recipe_ingredients.position`: optional, must be `>= 0`.
- `recipe_steps.step_text`: required.
- `recipe_steps.position`: required, must be `>= 0`.
- `recipe_imports.source_url`: required, unique per user.
- `recipe_imports.status`: enum `processing|succeeded|failed`.
- `recipe_imports.attempt_count`: integer between `0` and `3`.
- Manual and imported recipes must have at least one ingredient and one step.

### Business Logic Implementation

- Import flow:
  - `POST /recipe-imports` creates a `recipe_imports` row with `status=processing`.
  - Worker attempts extraction up to 3 times; on success, creates `recipes`, `recipe_ingredients`, `recipe_steps`, sets `recipe_imports.recipe_id`, and updates `status=succeeded`.
  - On failure, update `recipe_imports.status=failed` and `error_message` (one-sentence reason), and keep `recipe_id` null.
- Manual creation:
  - `POST /recipes` validates presence of title, ingredients, and steps.
  - Creates `recipes` with `status=succeeded` and associated ingredient/step rows.
- Search:
  - `GET /recipes?q=` trims/lowercases query, matches against `recipe_ingredients.normalized_name` using `ILIKE` or equivalent.
- Delete behavior:
  - Client enforces confirmation for non-failed recipes.
  - `DELETE /recipes/{id}` and `DELETE /recipe-imports/{id}` perform immediate deletion.
- Recipe edits:
  - `PATCH /recipes/{id}` rewrites ingredient/step sets transactionally and logs a `recipe_revisions` record with `changes`.
