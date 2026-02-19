# View Implementation Plan Recipes List

## 1. Overview

Recipes List is the home view that lets users browse, search, and manage recipe summaries. It provides a single entry point to add recipes (URL import or manual), shows processing status and errors inline, and links to the detail view for full content.

## 2. View Routing

Route: `/` (Astro page `src/pages/index.astro`).

## 3. Component Structure

- `RecipeListPage`
- `RecipeListView`
- `SearchBar`
- `RecipeList`
- `RecipeRow`
- `StatusIndicator`
- `AddRecipeModal`
- `ImportRecipeForm`
- `ManualRecipeForm`
- `DeleteConfirmationDialog`
- `EmptyState`
- `ErrorBanner`
- `RefreshButton`

## 4. Component Details

### RecipeListPage

- Component description: Astro page wrapper that loads initial list data and renders the React view.
- Main elements: `Layout`, `RecipeListView`.
- Handled events: none.
- Validation conditions: validate query params (`q`, `status`) before fetch; default to empty query.
- Types: `RecipeListDto`, `RecipeListQuery`.
- Props: none.

### RecipeListView

- Component description: Main interactive shell for list view, search, add, refresh, and list actions.
- Main elements: search bar, actions row (add/refresh), error banner, list, empty states, add modal, delete dialog.
- Handled events: search submit/change, open add modal, close modal, refresh list, delete recipe.
- Validation conditions: normalize search input (trim, lowercase) and block empty search submit; allow clear to reset.
- Types: `RecipeListDto`, `RecipeListItemDto`, `RecipeListQuery`, `RecipeCreateCommand`, `RecipeImportCreateCommand`, `RecipeListErrorViewModel`.
- Props:
  - `initialList: RecipeListDto`

### SearchBar

- Component description: Input + helper text for ingredient keyword search.
- Main elements: text input, helper text, optional clear button.
- Handled events: input change, submit, clear.
- Validation conditions: trim and lowercase `q`; if empty, show helper text and do not call API.
- Types: `RecipeListQuery`.
- Props:
  - `value: string`
  - `onChange(value: string): void`
  - `onSubmit(): void`
  - `onClear(): void`
  - `disabled?: boolean`

### RecipeList

- Component description: Renders list of recipe summary rows with status and inline error.
- Main elements: `ul`, `RecipeRow` children.
- Handled events: pass-through row click, delete click.
- Validation conditions: list length check to render empty state.
- Types: `RecipeListItemDto`.
- Props:
  - `items: RecipeListItemDto[]`
  - `onSelect(id: string): void`
  - `onDelete(item: RecipeListItemDto): void`

### RecipeRow

- Component description: Summary row showing title, ingredient preview, status chip, and inline error.
- Main elements: clickable container (link), title, ingredient preview list, status indicator, error text, delete action.
- Handled events: click to open detail, click delete, key navigation (Enter/Space).
- Validation conditions: `ingredients_preview` length >= 1; handle empty preview gracefully.
- Types: `RecipeListItemDto`, `RecipeStatus`.
- Props:
  - `item: RecipeListItemDto`
  - `onSelect(): void`
  - `onDelete(): void`

### StatusIndicator

- Component description: Visual status chip for `processing`, `succeeded`, `failed`, with optional loading state.
- Main elements: badge/chip, optional spinner.
- Handled events: none.
- Validation conditions: status must be one of `RecipeStatus`.
- Types: `RecipeStatus`.
- Props:
  - `status: RecipeStatus`

### AddRecipeModal

- Component description: Modal entry point to import URL or add manual recipe.
- Main elements: dialog, tabs/segmented control, `ImportRecipeForm`, `ManualRecipeForm`.
- Handled events: open, close, submit for active tab, tab switch.
- Validation conditions: show data-loss warning on close when form is dirty.
- Types: `RecipeCreateCommand`, `RecipeImportCreateCommand`, `RecipeCreateResultDto`.
- Props:
  - `open: boolean`
  - `onClose(): void`
  - `onImport(command: RecipeImportCreateCommand): Promise<void>`
  - `onCreate(command: RecipeCreateCommand): Promise<void>`
  - `isSubmitting: boolean`

### ImportRecipeForm

- Component description: Form for URL import.
- Main elements: URL input, submit/cancel buttons, inline error text.
- Handled events: submit, cancel, input change.
- Validation conditions: `source_url` must be a valid URL, non-empty.
- Types: `RecipeImportCreateCommand`.
- Props:
  - `onSubmit(command: RecipeImportCreateCommand): void`
  - `onCancel(): void`
  - `isSubmitting: boolean`
  - `error?: string | null`

### ManualRecipeForm

- Component description: Form for manual recipe creation with multiline inputs.
- Main elements: title input, ingredients textarea, steps textarea, cook time input, submit/cancel.
- Handled events: submit, cancel, input change.
- Validation conditions:
  - Title non-empty.
  - At least one ingredient and one step.
  - Cook time minutes >= 0 if provided.
  - Ingredients/steps split by newline; empty lines ignored.
- Types: `RecipeCreateCommand`, `RecipeIngredientCreateCommand`, `RecipeStepCreateCommand`.
- Props:
  - `onSubmit(command: RecipeCreateCommand): void`
  - `onCancel(): void`
  - `isSubmitting: boolean`
  - `error?: string | null`

### DeleteConfirmationDialog

- Component description: Confirms permanent deletion for non-failed recipes.
- Main elements: dialog content, confirm/cancel buttons.
- Handled events: confirm, cancel.
- Validation conditions: skip for `failed` status and delete immediately.
- Types: `RecipeStatus`.
- Props:
  - `open: boolean`
  - `status: RecipeStatus`
  - `onConfirm(): Promise<void>`
  - `onClose(): void`

### EmptyState

- Component description: Shows “no recipes yet” or “no search matches”.
- Main elements: title, helper text, optional CTA to add recipe.
- Handled events: CTA click to open add modal.
- Validation conditions: differentiate empty reasons based on `q` and list length.
- Types: none.
- Props:
  - `variant: "no-recipes" | "no-matches"`
  - `onAdd(): void`

### ErrorBanner

- Component description: Dismissible error banner for network or API failures.
- Main elements: alert container, message, dismiss button.
- Handled events: dismiss.
- Validation conditions: none.
- Types: `RecipeListErrorViewModel`.
- Props:
  - `error: RecipeListErrorViewModel | null`
  - `onDismiss(): void`

### RefreshButton

- Component description: Manual refresh trigger and optional loading state.
- Main elements: button, spinner.
- Handled events: click refresh.
- Validation conditions: disabled while loading.
- Types: none.
- Props:
  - `onClick(): void`
  - `loading: boolean`

## 5. Types

Use existing DTOs and add view models:

- `RecipeListDto`: `{ data: RecipeListItemDto[], next_cursor: string | null }`.
- `RecipeListItemDto`: `{ id, title, status, error_message, created_at, updated_at, ingredients_preview }`.
- `RecipeListQuery`: `{ status?: RecipeStatus, q?: string, limit?: number, cursor?: string, sort?: string }`.
- `RecipeCreateCommand`: `{ title, cook_time_minutes, source_url, ingredients, steps }`.
- `RecipeImportCreateCommand`: `{ source_url }`.

New view models:

- `RecipeListViewModel`
  - `items: RecipeListItemDto[]`
  - `query: RecipeListQuery`
  - `isLoading: boolean`
  - `isRefreshing: boolean`
  - `isSubmitting: boolean`
  - `error: RecipeListErrorViewModel | null`
  - `emptyState: "no-recipes" | "no-matches" | null`
- `RecipeListErrorViewModel`
  - `message: string`
  - `statusCode?: number`
  - `context?: "load" | "search" | "import" | "create" | "delete" | "refresh"`

## 6. State Management

- Local state in `RecipeListView`:
  - `items: RecipeListItemDto[]`
  - `query: RecipeListQuery`
  - `searchInput: string`
  - `isLoading: boolean`
  - `isRefreshing: boolean`
  - `isSubmitting: boolean`
  - `isAddOpen: boolean`
  - `deleteTarget: RecipeListItemDto | null`
  - `error: RecipeListErrorViewModel | null`
- Optional hook `useRecipeList(initialList)`:
  - Handles fetch, refresh, search normalization, and optimistic updates.
  - Returns `{ items, query, setQuery, reload, importRecipe, createRecipe, deleteRecipe, loading, error }`.

## 7. API Integration

- GET `/api/recipes`
  - Query: `RecipeListQuery` (`q` normalized: trim + lowercase).
  - Response: `RecipeListDto`.
  - Use for initial load, search, refresh, and polling updates.
- POST `/api/recipes/import`
  - Request: `RecipeImportCreateCommand`.
  - Response: `202` with import record (use to show processing row immediately).
  - On success, append placeholder row or refetch list.
- POST `/api/recipes`
  - Request: `RecipeCreateCommand`.
  - Response: `201` with `RecipeCreateResultDto`.
  - On success, prepend/append new list item and close modal.
- DELETE `/api/recipes/:id`
  - Response: `204 No Content`.
  - If status is `failed`, delete without confirmation; otherwise show dialog.

## 8. User Interactions

- Search:
  - User types ingredient keywords; submit normalizes and triggers GET.
  - Clear resets query and reloads full list.
- Add recipe:
  - Open modal; choose Import URL or Manual Entry.
  - Import URL submits to `/api/recipes/import` and shows processing entry.
  - Manual Entry submits to `/api/recipes` and shows new entry.
- Refresh:
  - User clicks refresh to reload list; show loading indicator.
- Navigate:
  - Clicking a row navigates to `/recipes/:id`.
- Delete:
  - For `failed` status: delete immediately on action.
  - For others: show confirmation dialog, then delete.

## 9. Conditions and Validation

- Search input:
  - Trim whitespace and lowercase before sending.
  - Empty input should not call API; show helper text instead.
- Import form:
  - `source_url` must be valid URL.
- Manual form:
  - Title required.
  - Ingredients and steps must each have at least one non-empty line.
  - Cook time minutes must be >= 0 when provided.
- Delete:
  - Skip confirmation for `failed` status.
- Status indicator:
  - Only render valid `RecipeStatus` values.

## 10. Error Handling

- GET `/api/recipes`:
  - 400: show inline error near search, keep previous list.
  - 401: show banner (auth UI omitted per MVP).
  - 500/network: show dismissible error banner; allow refresh retry.
- POST import/create:
  - 400: show inline validation error in modal.
  - 409: show conflict error (duplicate URL) inline.
  - 500/network: keep modal open, show error banner.
- DELETE:
  - 404: remove item from UI and show info banner.
  - 500/network: show error banner; do not remove item.

## 11. Implementation Steps

1. Create `src/pages/index.astro` to fetch initial list and pass to `RecipeListView`.
2. Build `RecipeListView` with search bar, list, add modal, and error banner.
3. Implement `SearchBar` with normalization and helper text.
4. Implement `RecipeList` and `RecipeRow` with status indicator and inline error.
5. Implement `AddRecipeModal`, `ImportRecipeForm`, and `ManualRecipeForm` with validation.
6. Wire API calls for list, import, create, and delete; update local state optimistically where safe.
7. Add `DeleteConfirmationDialog` and enforce skip on failed status.
8. Add `EmptyState` variants and `RefreshButton`.
9. Ensure keyboard navigation and accessible labels for list rows and modal controls.
