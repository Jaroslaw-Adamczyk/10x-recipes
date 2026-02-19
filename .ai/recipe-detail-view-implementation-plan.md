# View Implementation Plan Recipe Detail

## 1. Overview

Recipe Detail shows the full structured recipe (ingredients, steps, cook time) plus import/source metadata and status. It lets users edit or delete a recipe while keeping the list view concise.

## 2. View Routing

Route: `/recipes/:id` (Astro page `src/pages/recipes/[id].astro`).

## 3. Component Structure

- `RecipeDetailPage`
- `RecipeDetailView`
- `RecipeHeader`
- `RecipeStatusBadge`
- `RecipeMetaPanel`
- `RecipeIngredientsSection`
- `RecipeStepsSection`
- `EditRecipeModal`
- `DeleteConfirmationDialog`
- `ErrorBanner`

## 4. Component Details

### RecipeDetailPage

- Component description: Page wrapper that loads initial recipe detail
- Main elements: Layout wrapper, `RecipeDetailView`.
- Validation conditions: validate `id` param as UUID; redirect to not-found state if invalid.
- Types: `RecipeDetailDto`.
- Props: none.

### RecipeDetailView

- Component description: Main interactive shell for detail view with edit/delete actions.
- Main elements: back link, header, status badge, metadata panel, ingredients list, steps list, action buttons, error banner.
- Handled interactions: refresh, open edit, submit edit, open delete, confirm delete, dismiss error.
- Handled validation: client-side checks before PATCH submit (non-empty title, at least one ingredient and step, cook time >= 0, positions >= 0).
- Types: `RecipeDetailDto`, `RecipeUpdateCommand`, `RecipeUpdateResultDto`, `RecipeDeleteErrorViewModel`.
- Props:
  - `initialDetail: RecipeDetailDto`
  - `recipeId: string`

### RecipeHeader

- Component description: Displays title, cook time, and main actions (Edit/Delete).
- Main elements: `h1`, cook time text, action buttons.
- Handled interactions: click edit, click delete.
- Validation: none.
- Types: `RecipeDto`.
- Props:
  - `recipe: RecipeDto`
  - `onEdit(): void`
  - `onDelete(): void`

### RecipeStatusBadge

- Component description: Visual indicator for processing/succeeded/failed with optional retry context.
- Main elements: status chip, optional error text.
- Handled interactions: none.
- Validation: status must be one of `RecipeStatus`.
- Types: `RecipeStatus`, `RecipeImportDto | null`.
- Props:
  - `status: RecipeStatus`
  - `importMeta: RecipeImportDto | null`

### RecipeMetaPanel

- Component description: Shows source URL, status details, timestamps, and error message if any.
- Main elements: definition list, external link to source URL.
- Handled interactions: open source URL in new tab.
- Validation: URL must be valid if present.
- Types: `RecipeDto`, `RecipeImportDto | null`.
- Props:
  - `recipe: RecipeDto`
  - `importMeta: RecipeImportDto | null`

### RecipeIngredientsSection

- Component description: Full ingredients list with proper list semantics.
- Main elements: section heading, `ul` with `li`.
- Handled interactions: none.
- Validation: ingredients array length >= 1.
- Types: `RecipeIngredientDto`.
- Props:
  - `ingredients: RecipeIngredientDto[]`

### RecipeStepsSection

- Component description: Full steps list with ordered list.
- Main elements: section heading, `ol` with `li`.
- Handled interactions: none.
- Validation: steps array length >= 1.
- Types: `RecipeStepDto`.
- Props:
  - `steps: RecipeStepDto[]`

### EditRecipeModal

- Component description: Prefilled form for updating recipe title, cook time, ingredients, steps, and ordering.
- Main elements: dialog, inputs, textareas, reorder controls, submit/cancel buttons.
- Handled interactions: add/remove rows, reorder, submit, cancel.
- Validation:
  - Title non-empty if provided.
  - Ingredients/steps arrays length >= 1.
  - Each ingredient `raw_text` non-empty.
  - Each step `step_text` non-empty.
  - `cook_time_minutes` >= 0 if provided.
  - `position` >= 0 for all items.
- Types: `RecipeUpdateCommand`, `RecipeIngredientUpsertCommand`, `RecipeStepUpsertCommand`.
- Props:
  - `open: boolean`
  - `initialRecipe: RecipeDetailDto`
  - `onSubmit(command: RecipeUpdateCommand): Promise<void>`
  - `onClose(): void`

### DeleteConfirmationDialog

- Component description: Confirms permanent delete for non-failed recipes.
- Main elements: dialog content, confirm/cancel buttons.
- Handled interactions: confirm, cancel.
- Validation: not shown for failed recipes (delete immediately).
- Types: `RecipeStatus`.
- Props:
  - `open: boolean`
  - `status: RecipeStatus`
  - `onConfirm(): Promise<void>`
  - `onClose(): void`

### ErrorBanner

- Component description: Dismissible error banner for API failures.
- Main elements: alert container, message, dismiss button.
- Handled interactions: dismiss.
- Validation: none.
- Types: `RecipeDetailErrorViewModel`.
- Props:
  - `error: RecipeDetailErrorViewModel | null`
  - `onDismiss(): void`

## 5. Types

Use existing DTOs and add view models:

- `RecipeDetailDto`: `{ recipe, ingredients, steps, import }`.
- `RecipeUpdateCommand`: partial fields for PATCH (title, cook_time_minutes, ingredients, steps).
- `RecipeIngredientUpsertCommand`: `{ id?: string | null, raw_text: string, normalized_name: string, position?: number | null }`.
- `RecipeStepUpsertCommand`: `{ id?: string | null, step_text: string, position: number }`.

New view models:

- `RecipeDetailViewModel`
  - `recipeId: string`
  - `title: string`
  - `cookTimeLabel: string | null`
  - `status: RecipeStatus`
  - `statusLabel: string`
  - `errorMessage: string | null`
  - `sourceUrl: string | null`
  - `createdAt: string`
  - `updatedAt: string`
  - `ingredients: RecipeIngredientDto[]`
  - `steps: RecipeStepDto[]`
  - `importMeta: RecipeImportDto | null`
- `RecipeDetailErrorViewModel`
  - `message: string`
  - `statusCode?: number`
  - `context?: "load" | "update" | "delete"`

## 6. State Management

- Local state in `RecipeDetailView`:
  - `detail: RecipeDetailDto | null`
  - `isLoading: boolean`
  - `error: RecipeDetailErrorViewModel | null`
  - `isEditOpen: boolean`
  - `isDeleteOpen: boolean`
  - `isSaving: boolean`
  - `isDeleting: boolean`
- Optional custom hook `useRecipeDetail(recipeId)` to load data, refresh, and normalize view model; returns `{ detail, viewModel, loading, error, reload }`.

## 7. API Integration

- GET `/api/recipes/:id`
  - Response: `RecipeDetailDto`
  - Use for initial load and refresh after updates.
- PATCH `/api/recipes/:id`
  - Request: `RecipeUpdateCommand`
  - Response: `RecipeUpdateResultDto`
  - Map form fields to command, normalize `normalized_name` from `raw_text`.
- DELETE `/api/recipes/:id`
  - Response: `204 No Content`
  - If success, navigate back to `/`.

## 8. User Interactions

- Back to list: link to `/`.
- Edit recipe:
  - Open modal with prefilled values.
  - Reorder items and edit fields.
  - Save triggers PATCH and optimistic UI update.
- Delete recipe:
  - If status is `failed`, delete immediately.
  - Otherwise show confirmation dialog, then DELETE.
- View metadata: show source URL and status details.

## 9. Conditions and Validation

- UUID route param required; show not-found state on invalid.
- Edit form:
  - Title required if provided.
  - Ingredients/steps arrays must be non-empty.
  - Each ingredient raw text and normalized name must be non-empty.
  - Each step text must be non-empty.
  - Cook time >= 0 if provided.
  - Position >= 0 for all items.
- Delete confirmation skipped for failed status.

## 10. Error Handling

- 400/404 on GET: show not-found state with link back.
- 401: show generic error banner (auth UI is omitted per MVP).
- 409 on PATCH: show inline form error (duplicate source URL if ever used).
- 500: show error banner with retry.
- Network errors: keep existing detail, show dismissible banner.

## 11. Implementation Steps

1. Create `src/pages/recipes/[id].astro` and load initial recipe detail via GET.
2. Add `RecipeDetailView` React component with props for initial detail and `recipeId`.
3. Build `RecipeHeader`, `RecipeStatusBadge`, `RecipeMetaPanel`, `RecipeIngredientsSection`, and `RecipeStepsSection`.
4. Implement `EditRecipeModal` with form state, reorder controls, and client validation.
5. Implement delete flow with `DeleteConfirmationDialog`, skipping dialog for failed status.
6. Wire API calls (GET, PATCH, DELETE) and update local state after success.
7. Add `ErrorBanner` for load/update/delete failures.
8. Ensure keyboard navigation and accessible headings/list semantics.
