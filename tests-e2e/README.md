# Playwright E2E Tests - Page Object Model

This directory contains end-to-end tests for the 10x Recipes application using Playwright with the Page Object Model (POM) pattern.

## 📁 Project Structure

```
tests-e2e/
├── page-objects/          # Page Object Models
│   ├── LoginPage.ts       # Login page interactions
│   ├── RecipesPage.ts     # Recipes list page interactions
│   ├── AddRecipeModal.ts  # Add recipe modal interactions
│   └── index.ts           # Export all POMs
├── fixtures.ts            # Custom Playwright fixtures
├── test-data.ts           # Test data and helpers
├── add-recipe.spec.ts     # Add recipe flow tests
├── login.spec.ts          # Login flow tests
├── recipe-search.spec.ts  # Search functionality tests
├── recipe-list.spec.ts    # Recipe list management tests
└── README.md              # This file
```

## 🎯 Page Object Model (POM)

The Page Object Model pattern provides:

- **Separation of concerns** - Test logic separated from page interactions
- **Reusability** - Page objects can be used across multiple tests
- **Maintainability** - UI changes only require updating page objects
- **Readability** - Tests read like user stories

### LoginPage

Handles all login page interactions.

**Locators:**

- `emailInput` - Email input field (`data-test-id="input-email"`)
- `passwordInput` - Password input field (`data-test-id="input-password"`)
- `submitButton` - Submit button (`data-test-id="submit-button"`)
- `formError` - Error alert message
- `registerLink` - Link to registration page

**Methods:**

- `goto()` - Navigate to login page
- `login(email, password)` - Fill credentials and submit
- `waitForRedirect(url)` - Wait for redirect after login
- `expectToBeOnLoginPage()` - Assert on login page
- `expectFormError(message)` - Assert error message

**Example:**

```typescript
await loginPage.goto();
await loginPage.login("test@example.com", "password123");
await loginPage.waitForRedirect("/");
```

### RecipesPage

Handles recipe list page interactions and contains AddRecipeModal.

**Locators:**

- `addRecipeButton` - Button to open add recipe modal
- `refreshButton` - Button to refresh recipes
- `searchInput` - Search input field
- `searchButton` - Search submit button
- `clearButton` - Clear search button
- `recipeList` - Recipe list container (`data-test-id="recipe-list"`)
- `recipeItems` - Individual recipe cards (`data-test-id="recipe-item"`)
- `emptyState` - Empty state message
- `errorBanner` - Error banner
- `addRecipeModal` - Instance of AddRecipeModal

**Methods:**

- `goto()` - Navigate to recipes page
- `expectToBeOnRecipesPage()` - Assert on recipes page
- `openAddRecipeModal()` - Click add button and verify modal opens
- `refreshRecipes()` - Click refresh button
- `searchByIngredient(ingredient)` - Search for recipes
- `clearSearch()` - Clear search filters
- `expectRecipeInList(title)` - Assert recipe is visible
- `expectRecipeNotInList(title)` - Assert recipe is not visible
- `expectRecipeCount(count)` - Assert specific recipe count
- `expectAtLeastOneRecipe()` - Assert at least one recipe exists
- `expectEmptyState(variant)` - Assert empty state shown
- `expectIngredientInPreview(ingredient)` - Assert ingredient visible
- `clickRecipe(title)` - Click on a recipe card
- `deleteRecipe(title)` - Click delete button on recipe
- `expectErrorBanner(message)` - Assert error banner shown
- `dismissError()` - Dismiss error banner

**Example:**

```typescript
await recipesPage.expectToBeOnRecipesPage();
await recipesPage.openAddRecipeModal();
await recipesPage.expectRecipeInList("My Recipe");
```

### AddRecipeModal

Handles add recipe modal interactions (nested in RecipesPage).

**Locators:**

- `modal` - Modal container (`data-test-id="add-recipe-modal"`)
- `importTab` - Import URL tab (`data-test-id="tab-import"`)
- `manualTab` - Manual entry tab (`data-test-id="tab-manual"`)
- `titleInput` - Recipe title input (`data-test-id="input-recipe-title"`)
- `ingredientsInput` - Ingredients textarea (`data-test-id="input-recipe-ingredients"`)
- `stepsInput` - Steps textarea (`data-test-id="input-recipe-steps"`)
- `cookTimeInput` - Cook time input (`data-test-id="input-recipe-cooktime"`)
- `cancelButton` - Cancel button (`data-test-id="button-cancel"`)
- `createButton` - Create button (`data-test-id="button-create-recipe"`)
- `importUrlInput` - URL input for import
- `importButton` - Import button
- `errorMessage` - Validation error message

**Methods:**

- `expectModalToBeVisible()` - Assert modal is open
- `expectModalToBeHidden()` - Assert modal is closed
- `switchToManualEntry()` - Switch to manual tab
- `switchToImport()` - Switch to import tab
- `fillManualRecipe(recipe)` - Fill all recipe fields
- `createRecipe()` - Click create button
- `fillAndCreateManualRecipe(recipe)` - Fill and submit in one action
- `importRecipeFromUrl(url)` - Import recipe from URL
- `cancel()` - Click cancel button
- `expectValidationError(text)` - Assert validation error shown
- `handleCancelDialog(accept)` - Set up dialog handler for cancel confirmation

**Example:**

```typescript
await recipesPage.addRecipeModal.switchToManualEntry();
await recipesPage.addRecipeModal.fillManualRecipe({
  title: "Chocolate Chip Cookies",
  ingredients: "2 cups flour\n1 cup sugar",
  steps: "Mix ingredients\nBake for 10 minutes",
  cookTime: "10",
});
await recipesPage.addRecipeModal.createRecipe();
```

## 🧪 Test Data

The `test-data.ts` file provides reusable test data and helpers.

**Constants:**

- `TEST_USER` - Default test user credentials
- `SAMPLE_RECIPES` - Pre-defined recipe data

**Functions:**

- `generateRecipeTitle(baseName)` - Generate unique title with timestamp
- `createUniqueRecipe(baseRecipe)` - Clone recipe with unique title

**Example:**

```typescript
import { TEST_USER, SAMPLE_RECIPES, createUniqueRecipe } from "./test-data";

// Use test user
await loginPage.login(TEST_USER.email, TEST_USER.password);

// Create unique recipe
const recipe = createUniqueRecipe(SAMPLE_RECIPES.chocolateChipCookies);
```

## 🔧 Custom Fixtures

The `fixtures.ts` file extends Playwright's test fixture with page objects.

**Usage:**

```typescript
import { test, expect } from "./fixtures";

test("my test", async ({ loginPage, recipesPage }) => {
  // Page objects are automatically instantiated
  await loginPage.goto();
  await recipesPage.expectToBeOnRecipesPage();
});
```

**Benefits:**

- Automatic page object instantiation
- Clean test syntax
- Shared page context
- Type safety

## 📝 Test Scenarios

### add-recipe.spec.ts

Tests for adding recipes manually:

- ✅ Complete flow: login → add recipe → verify in list
- ✅ Create multiple recipes with different data
- ✅ Validation: empty form
- ✅ Validation: missing ingredients
- ✅ Validation: missing steps
- ✅ Cancel with dirty form
- ✅ Cancel with clean form
- ✅ Create recipe without cook time
- ✅ Switch between import/manual tabs

### login.spec.ts

Tests for authentication:

- ✅ Login with valid credentials
- ✅ Invalid email format
- ✅ Empty fields
- ✅ Incorrect credentials
- ✅ Link to register page
- ✅ Redirect authenticated users

### recipe-search.spec.ts

Tests for search functionality:

- ✅ Search by ingredient
- ✅ No results message
- ✅ Clear search
- ✅ Case-insensitive search
- ✅ Empty search submission

### recipe-list.spec.ts

Tests for recipe list management:

- ✅ Empty state display
- ✅ Refresh recipe list
- ✅ Display recipe with details
- ✅ Display multiple recipes
- ✅ Processing status indicator
- ✅ Navigate to recipe detail

## 🚀 Running Tests

### All tests

```bash
npm run test:e2e
```

### Specific test file

```bash
npx playwright test tests-e2e/add-recipe.spec.ts
```

### Headed mode (see browser)

```bash
npx playwright test --headed
```

### UI mode (interactive)

```bash
npx playwright test --ui
```

### Debug mode

```bash
npx playwright test --debug
```

### Specific test by name

```bash
npx playwright test -g "should login and add recipe"
```

### Run in specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🎨 Data Test IDs Reference

### Login Components

- `input-email` - Email input field
- `input-password` - Password input field
- `submit-button` - Login submit button

### Recipe List Components

- `add-recipe-button` - Button to open Add Recipe modal
- `recipe-list` - Recipe list container
- `recipe-item` - Individual recipe cards

### Add Recipe Modal

- `add-recipe-modal` - Modal container
- `tab-import` - Import URL tab button
- `tab-manual` - Manual entry tab button
- `input-recipe-title` - Recipe title input
- `input-recipe-ingredients` - Ingredients textarea
- `input-recipe-steps` - Steps textarea
- `input-recipe-cooktime` - Cook time number input
- `button-cancel` - Cancel button
- `button-create-recipe` - Create recipe button

## 📋 Best Practices

### 1. Use Page Objects

```typescript
// ❌ Bad - Direct page interactions in test
await page.getByTestId("input-email").fill("test@example.com");
await page.getByTestId("submit-button").click();

// ✅ Good - Use page object
await loginPage.login("test@example.com", "password123");
```

### 2. Use Test Data Constants

```typescript
// ❌ Bad - Hardcoded data
await loginPage.login("test@example.com", "password123");

// ✅ Good - Use constants
await loginPage.login(TEST_USER.email, TEST_USER.password);
```

### 3. Use Unique Data for Creation

```typescript
// ❌ Bad - Same title every time
const recipe = SAMPLE_RECIPES.chocolateChipCookies;

// ✅ Good - Unique title with timestamp
const recipe = createUniqueRecipe(SAMPLE_RECIPES.chocolateChipCookies);
```

### 4. Use Descriptive Assertions

```typescript
// ❌ Bad - Generic assertion
await expect(page.getByText(title)).toBeVisible();

// ✅ Good - Descriptive method
await recipesPage.expectRecipeInList(title);
```

### 5. Use beforeEach for Common Setup

```typescript
test.beforeEach(async ({ loginPage, recipesPage }) => {
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  await recipesPage.expectToBeOnRecipesPage();
});
```

## 🐛 Debugging Tips

### 1. Use UI Mode

Best for understanding test flow:

```bash
npx playwright test --ui
```

### 2. Use Debug Mode

Step through test execution:

```bash
npx playwright test --debug
```

### 3. Add Screenshots on Failure

Already configured in `playwright.config.ts`

### 4. View Trace

```bash
npx playwright show-trace trace.zip
```

### 5. Slow Down Execution

```bash
npx playwright test --headed --slow-mo=1000
```

## 🔄 CI/CD Integration

Tests can be run in CI with:

```bash
npx playwright test --reporter=github
```

See `playwright.config.ts` for CI-specific configuration.

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
