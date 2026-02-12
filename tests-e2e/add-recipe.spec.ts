import { test, expect } from "./fixtures";
import { TEST_USER, SAMPLE_RECIPES, createUniqueRecipe } from "./test-data";

test.describe("Add Recipe Flow", () => {
  test("should login, add a new recipe manually, and verify it appears in the list", async ({
    loginPage,
    recipesPage,
  }) => {
    // Step 1: Open login page
    await loginPage.goto();
    await loginPage.expectToBeOnLoginPage();

    // Step 2: Insert login and password and login
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");

    // Verify we're on the recipes page
    await recipesPage.expectToBeOnRecipesPage();

    // Step 3: Click Add recipe and open modal
    await recipesPage.openAddRecipeModal();

    // Step 4: Switch to manual entry tab and fill in all necessary fields
    const uniqueRecipe = createUniqueRecipe(SAMPLE_RECIPES.mushroomRisotto);
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(uniqueRecipe);

    // Step 5: Modal should close after successful creation
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Step 6: Check if new record appeared on the list
    await recipesPage.expectRecipeInList(uniqueRecipe.title);
    await recipesPage.expectIngredientInPreview("Arborio rice");
  });

  test("should create multiple recipes with different data", async ({ loginPage, recipesPage }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Create first recipe
    const recipe1 = createUniqueRecipe(SAMPLE_RECIPES.frenchToast);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe1);
    await recipesPage.addRecipeModal.expectModalToBeHidden();
    await recipesPage.expectRecipeInList(recipe1.title);

    // Create second recipe
    const recipe2 = createUniqueRecipe(SAMPLE_RECIPES.simpleOmelette);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe2);
    await recipesPage.addRecipeModal.expectModalToBeHidden();
    await recipesPage.expectRecipeInList(recipe2.title);

    // Both recipes should be visible
    await recipesPage.expectRecipeInList(recipe1.title);
    await recipesPage.expectRecipeInList(recipe2.title);
  });

  test("should show validation errors when submitting empty form", async ({ loginPage, recipesPage }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Open add recipe modal
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.switchToManualEntry();

    // Try to submit empty form
    await recipesPage.addRecipeModal.createRecipe();

    // Modal should remain open and show error
    await recipesPage.addRecipeModal.expectModalToBeVisible();
    await recipesPage.addRecipeModal.expectValidationError("Title is required");
  });

  test("should show validation error when title is provided but ingredients are missing", async ({
    loginPage,
    recipesPage,
  }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Open modal and fill only title
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.switchToManualEntry();
    await recipesPage.addRecipeModal.titleInput.fill("Incomplete Recipe");
    await recipesPage.addRecipeModal.createRecipe();

    // Should show validation error
    await recipesPage.addRecipeModal.expectModalToBeVisible();
    await recipesPage.addRecipeModal.expectValidationError("Add at least one ingredient");
  });

  test("should allow canceling recipe creation with dirty form", async ({ loginPage, recipesPage }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Open modal and fill some data
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.switchToManualEntry();
    await recipesPage.addRecipeModal.titleInput.fill("Test Recipe");

    // Cancel with confirmation dialog (accept it)
    await recipesPage.addRecipeModal.cancelWithConfirmation(true);

    // Modal should close after accepting the confirmation
    await recipesPage.addRecipeModal.expectModalToBeHidden();
  });

  test("should allow canceling without confirmation when form is clean", async ({ loginPage, recipesPage }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Open modal without filling anything
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.switchToManualEntry();

    // Cancel should work immediately without dialog
    await recipesPage.addRecipeModal.cancel();
    await recipesPage.addRecipeModal.expectModalToBeHidden();
  });

  test("should create recipe with minimal data (no cook time)", async ({ loginPage, recipesPage }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Create recipe without cook time
    const minimalRecipe = createUniqueRecipe(SAMPLE_RECIPES.simpleOmelette);
    delete minimalRecipe.cookTime;

    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(minimalRecipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();
    await recipesPage.expectRecipeInList(minimalRecipe.title);
  });

  test("should switch between import and manual tabs", async ({ loginPage, recipesPage }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");
    await recipesPage.expectToBeOnRecipesPage();

    // Open modal
    await recipesPage.openAddRecipeModal();

    // Verify import tab is active by default
    await expect(recipesPage.addRecipeModal.importUrlInput).toBeVisible();

    // Switch to manual
    await recipesPage.addRecipeModal.switchToManualEntry();

    // Switch back to import
    await recipesPage.addRecipeModal.switchToImport();

    // Cancel
    await recipesPage.addRecipeModal.cancel();
  });
});
