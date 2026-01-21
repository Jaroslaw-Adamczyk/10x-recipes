# Product Requirements Document (PRD) - APP Store Recipes
## 1. Product Overview
APP Store Recipes centralizes text-based cooking recipes sourced from arbitrary URLs, normalizes ingredients and preparation data, and stores structured records per user. The MVP focuses on a local-first experience where authenticated users can import a validated recipe, search saved recipes by ingredients, view structured details (ingredients, steps, cook time), and delete records. Imports are powered by an asynchronous LLM-extraction worker that retries failed attempts and surfaces processing states, while all metadata and errors are logged for future analysis.

## 2. User Problem
Users currently gather recipes from disparate websites where URLs disappear or change formatting, making it difficult to search and consistently reuse favorite ingredients or cooking steps. Storing only destinations causes information loss when sites expire, and inconsistent ingredient/steps formatting hampers searchability. Without a centralized place that ingests ingredients and steps separately, users cannot quickly find recipes by the ingredients they have on hand, nor rely on stable, searchable storage of their own recipes.

## 3. Functional Requirements
1. Recipe Capture
   - The system must allow importing a single recipe from any URL using an LLM-powered extractor that returns title, ingredients, preparation steps, and optional cook time.
   - Imports must validate that at least one ingredient and one step are present; failures surface a one-sentence error explaining the issue. Multiples recipes detected also trigger a failure.
   - Failed imports should log the source URL, failure reason (missing recipe, multiple recipes, validation failure), and any metadata (e.g., attempt counts, timestamps).
   - Extraction runs asynchronously in a retrying background worker (up to three attempts) to avoid blocking the UI while parsing remote content.

2. Manual Recipe Creation
   - The system should allow creating recipes manually through a modal form so users can add entries without importing a URL.
   - Validation rules for manually created recipes must match those applied to imported recipes for title, ingredients, steps, and optional cook time.
   - Successful manual creation should expose the same metadata and status tracking as imported recipes so the list experience stays consistent.

3. Structured Recipe Storage
   - Store recipes with separate fields for ingredients, preparation steps, cook time, and source metadata.
   - Capture the import or creation status (processing, succeeded, failed) and expose it in the recipe list, showing skeleton loaders for entries still processing and inline error descriptions for failed imports.
   - Provide the ability to delete any recipe, with a confirmation dialog for successful or processing entries emphasizing the deletion is permanent; failed imports can be removed without confirmation.
   - Provide an option to modify recipes manually, updating ingredients, steps, or cook time while retaining linked metadata.

4. Recipe List Presentation
   - The primary recipe list view should display only the title and ingredients for each entry to keep the summary concise.
   - Preparation steps and cook time details should be revealed after the user clicks the recipe entry or opens a detail panel, ensuring the list stays scannable.
   - Entries that are importing or processing should show a status indicator and skeleton row, while errors remain visible inline without expanding steps.

5. Ingredient Search
   - Normalize ingredient queries (trim whitespace, lowercase) before running keyword matching so search stays consistent with normalized stored ingredients.
   - Support keyword filtering that matches recipes containing the query terms anywhere within the ingredient list.

6. Authentication
   - Implement email/password authentication without verification or recovery for MVP; accounts link to a user’s own recipe collection.
   - Restrict recipe import, viewing, searching, and deletion to authenticated users; unauthenticated visitors should be redirected to login/signup flows.
   - Store credentials securely and log authentication events for analytics.

7. Backend Observability
   - Log import success/failure metadata centrally, including cases where multiple recipes were detected, to guide future improvements.
   - Track worker retries and failure reasons, and expose status in the recipe list to keep users informed.

## 4. Product Boundaries
In Scope:
- Text-only recipes (no multimedia assets such as photos or videos).
- Recipe imports from any URL that yields a single recipe document; the LLM extractor must validate structure before saving.
- Local-first architecture without mandatory network syncing for MVP.
- Basic email/password authentication with no verification, recovery, or social login.
- Manual recipe deletion with a confirmation dialog emphasizing irreversibility.

Out of Scope:
- Recipe sharing, ratings, comments, or any social interactions between users.
- Multimedia support (images, audio, video) or rich formatting beyond plain text fields.
- Advanced search features like synonym expansion, fuzzy matching, or ingredient grouping.
- Automated scheduling, meal plans, or calendar integrations.
- Recovery flows or multi-factor auth in the MVP phase.

## 5. User Stories

- ID: US-001
- Title: Authenticate with email and password
- Description: As a recipe collector, I want to log in with my email and password so that I can securely access my personal recipes.
- Acceptance Criteria:
  - The login form accepts email and password inputs, validates presence, and returns an error if either is missing.
  - Successful credentials create a session tied to the user account and persist across page reloads.
  - Unauthenticated users are redirected to login before accessing recipe import, listing, or deletion features.

- ID: US-002
- Title: Register a new account
- Description: As a new user, I want to create an account with email and password so that my recipes remain private to me.
- Acceptance Criteria:
  - The signup form captures email and password, enforces password minimum length, and shows inline validation errors.
  - Upon successful signup, a new user record is created and the user is logged in automatically.
  - Duplicate emails return a clear error without creating a second account.

- ID: US-003
- Title: Import a recipe from a URL
- Description: As a user, I want to import recipes from a URL so that I can store structured ingredients and steps without manually copying them.
- Acceptance Criteria:
  - The import workflow accepts a URL, triggers the background worker, and shows a skeleton entry while the worker processes.
  - Imports require a title, at least one ingredient, at least one step, and optionally cook time; missing required data results in a clear error message.
  - If the URL contains multiple recipes, the import fails with an error stating only single recipes are supported, and the URL plus metadata is logged.
  - The background worker retries failed imports up to three times, updates the status, and surfaces errors inline when retries fail.

- ID: US-004
- Title: View saved recipes with structured fields
- Description: As a recipe owner, I want to view my saved recipes showing ingredients, steps, and cook time separately so I can quickly follow each part.
- Acceptance Criteria:
  - The recipe list renders the title, ingredient list, step instructions, cook time when provided, and import status.
  - Entries still processing display a skeleton and a label such as processing with retry count.
  - Failed imports display the inline error and allow deletion without confirmation.
  - The default list view shows only titles and ingredients, and steps/cook time are revealed after clicking or expanding the recipe.

- ID: US-005
- Title: Search recipes by ingredient keywords
- Description: As someone with limited pantry ingredients, I want to search my saved recipes by ingredient keywords so I can find dishes I can cook immediately.
- Acceptance Criteria:
  - Search input normalizes keywords by trimming whitespace and lowercasing before matching.
  - Keyword matching returns recipes whose ingredient lists contain the normalized search terms (case insensitive).
  - Empty search input either shows all recipes or prompts the user to enter an ingredient.

- ID: US-006
- Title: Delete a recipe permanently
- Description: As a user, I want to remove recipes that are no longer useful so my collection stays relevant and uncluttered.
- Acceptance Criteria:
  - Selecting delete opens a confirmation dialog explaining the deletion is permanent.
  - Confirming deletion immediately removes the recipe from the database without further prompts.
  - Failed import records bypass the confirmation dialog but still remove the record immediately.

- ID: US-007
- Title: Inspect import processing status
- Description: As a user, I want to understand why an import is pending, succeeded, or failed so I know whether I can rely on the stored recipe.
- Acceptance Criteria:
  - Each recipe entry displays a status indicator (e.g., processing, succeeded, failed) based on backend metadata.
  - Processing entries show retry counts or loading indicators describing the background worker state.
  - Failure entries include the short failure message returned from validation or worker errors.

- ID: US-008
- Title: Rebuild import after failure
- Description: As a user, I want to delete a failed import and retry the URL so that I can recover from transient extraction errors.
- Acceptance Criteria:
  - Failed entries include a delete option without confirmation to quickly remove the record.
  - After removal, the user can re-enter the same URL and restart the import cycle.
  - Retry attempts again trigger the worker with fresh metadata and logging.

- ID: US-009
- Title: Create a recipe manually
- Description: As a user, I want to open a modal form to type a recipe so I can save recipes from sources that do not provide URLs.
- Acceptance Criteria:
  - The manual creation modal collects title, ingredients, preparation steps, and optional cook time with the same validation as URL imports.
  - Successful creation saves the recipe with processing status metadata and surfaces it in the same list view as imported recipes.
  - Validation failures show inline errors that mention the missing field before form submission allows completion.

- ID: US-010
- Title: Modify a saved recipe
- Description: As a user, I want to update an existing recipe’s ingredients or steps so I can keep entries accurate as I improve them.
- Acceptance Criteria:
  - Each saved recipe offers an edit action that opens a form prefilled with the current title, ingredients, steps, and cook time.
  - Submitting edits validates against the same rules as creation/import and updates the stored record immediately.
  - The recipe list reflects the updated fields without requiring a full page refresh.

## 6. Success Metrics
1. Weekly adoption: 75% of authenticated users import at least one recipe per week within the MVP timeframe.
2. Import reliability: 95% of imports that pass validation succeed within three automatic retries.
3. Search effectiveness: 90% of ingredient searches return at least one matching recipe when a recipe contains the queried term.
4. Deletion clarity: 100% of deletion flows present the permanent deletion confirmation, and no deleted recipe remains accessible afterward.
