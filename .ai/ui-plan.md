# UI Architecture for APP Store Recipes

## 1. UI Structure Overview

The MVP UI centers on a single recipes list home view with a dedicated detail route for full recipe content. All recipe creation is accessed through a single “Add Recipe” entry point that toggles between URL import and manual entry. Status-driven feedback (processing, succeeded, failed) is surfaced directly in the list with skeletons and inline errors, while detailed import metadata is shown only in the detail view. Authentication UI is intentionally omitted for MVP per planning decisions.

## 2. View List

- View name: Recipes List (Home)
  - View path: `/`
  - Main purpose: Browse, search, and manage recipe summaries; initiate imports or manual creation.
  - Key information to display: Recipe title, ingredient preview, status indicator (processing/succeeded/failed), inline error for failed imports, last updated time (optional).
  - Key view components:
    - Search input with helper text for empty states.
    - “Add Recipe” button (opens Add Recipe modal).
    - Manual refresh state button; optional polling status indicator.
    - Status chips and skeleton rows for processing items.
    - Inline error text for failed imports with quick delete.
  - UX, accessibility, and security considerations:
    - Distinct empty states for “no recipes yet” vs “no search matches.”
    - Search normalizes input; supports empty input guidance.
    - Keyboard navigation across list rows and actions.
    - Dismissible network error banner that reappears on failure.
    - No auth-related UI elements shown in MVP.

- View name: Recipe Detail
  - View path: `/recipes/:id`
  - Main purpose: Show full recipe content and import/source metadata; allow edit/delete.
  - Key information to display: Title, full ingredient list, full steps, cook time, import status, source URL, attempt count, error message (if failed), timestamps.
  - Key view components:
    - “Back to list” link.
    - Structured sections for ingredients and steps.
    - Metadata panel for import source and status.
    - Edit button (opens Edit Recipe modal).
    - Delete button (opens confirmation dialog for non-failed items).
  - UX, accessibility, and security considerations:
    - 404 empty state if recipe is missing.
    - Clear status messaging with retry context.
    - Accessible headings and list semantics for ingredients/steps.
    - Confirmation dialog copy emphasizes permanent deletion.

- View name: Add Recipe Modal
  - View path: modal on `/`
  - Main purpose: Single entry point for URL import or manual creation.
  - Key information to display: Mode selector, form fields, validation errors, submission status.
  - Key view components:
    - Tabs or segmented control: “Import URL” and “Manual Entry.”
    - Import form: URL input with client-side validation.
    - Manual form: title, ingredients, steps, cook time.
    - Multi-line inputs for ingredients/steps with newline splitting.
    - Inline validation errors.
    - Cancel action with “data will be lost” prompt.
  - UX, accessibility, and security considerations:
    - Basic URL validation before import request.
    - Inline errors for missing fields; focus management on errors.
    - Keyboard-friendly form navigation.
    - No draft persistence; explicit data-loss warning on close.

- View name: Edit Recipe Modal
  - View path: modal on `/recipes/:id`
  - Main purpose: Update recipe content with prefilled values.
  - Key information to display: Current values, validation errors, save state.
  - Key view components:
    - Prefilled form fields for title, ingredients, steps, cook time.
    - Reordering controls (up/down) with keyboard support.
    - Inline validation and optimistic save feedback.
  - UX, accessibility, and security considerations:
    - Optimistic updates with rollback on failure.
    - Accessible reorder controls with labels and keyboard handlers.
    - Consistent validation with creation/import rules.

- View name: Delete Confirmation Dialog
  - View path: dialog on `/` and `/recipes/:id`
  - Main purpose: Confirm permanent deletion for non-failed items.
  - Key information to display: Irreversible deletion warning.
  - Key view components:
    - Simple confirm/cancel actions.
    - Copy: “Are you sure? Deletion is permanent.”
  - UX, accessibility, and security considerations:
    - Focus trap and keyboard controls.
    - Skip confirmation for failed imports (quick delete).

## 3. User Journey Map

Primary journey (import and view):

1. User lands on the Recipes List and sees existing recipes or an empty state.
2. User opens “Add Recipe” modal and selects “Import URL.”
3. User enters a URL; client-side validation runs.
4. On submit, UI creates an import job and immediately shows a processing row with skeletons and status.
5. User can manually refresh or wait for polling until status changes.
6. When succeeded, the list row updates; user clicks the row to open Recipe Detail.
7. Recipe Detail shows full ingredients, steps, cook time, and import metadata.

Secondary journey (manual entry and edit):

1. User opens “Add Recipe” modal and selects “Manual Entry.”
2. User enters title, ingredients, steps, optional cook time; multi-line input splits on newlines.
3. On submit, recipe appears in the list; status set to succeeded.
4. User navigates to Recipe Detail and selects Edit.
5. Edit modal opens with prefilled fields and reorder controls.
6. On save, the list and detail update optimistically.

Deletion journey:

1. User triggers delete from list or detail.
2. For non-failed items, confirmation dialog appears; user confirms.
3. For failed imports, delete executes immediately without dialog.
4. List updates to remove the recipe or failed import.

## 4. Layout and Navigation Structure

- Primary navigation is implicit: the list view is the home route and the detail view is the only nested route.
- “Add Recipe” is a persistent CTA on the list view; modals keep the user in context.
- List rows link to detail; detail view provides a “Back to list” link.
- Edit and delete are contextual actions within detail view (and optionally list rows).
- Manual refresh is available on list; polling is optional and stops when no items are processing.

## 5. Key Components

- RecipeList: summary rows with status, capped ingredient previews, inline errors.
- RecipeRow: title + ingredient preview, status chip, skeleton state.
- SearchBar: normalized ingredient search with guidance text.
- AddRecipeModal: mode switcher, URL import form, manual entry form.
- RecipeDetail: full ingredients, steps, cook time, import metadata section.
- EditRecipeModal: prefilled form with reorder controls and optimistic save.
- StatusIndicator: processing/succeeded/failed with retry context.
- ErrorBanner: dismissible network errors that reappear on failure.
- ConfirmationDialog: reusable delete confirmation dialog.
