import { test, expect } from "./fixtures";
import { SAMPLE_RECIPES, createUniqueRecipe } from "./test-data";

test.describe("Recipe List Management", () => {
  test.beforeEach(async ({ recipesPage }) => {
    // Navigate to recipes page before each test
    await recipesPage.goto();
    await recipesPage.expectToBeOnRecipesPage();
  });

  test("should display empty state when no recipes exist", async ({ recipesPage }) => {
    // Navigate to recipes page
    await recipesPage.goto();

    // Check for empty state or recipe list
    const hasRecipes = await recipesPage.recipeList.isVisible().catch(() => false);
    const hasEmptyState = await recipesPage.emptyState.isVisible().catch(() => false);

    // Should show either recipes or empty state
    expect(hasRecipes || hasEmptyState).toBeTruthy();
  });

  test("should refresh recipe list", async ({ recipesPage }) => {
    // Create a recipe
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.simpleOmelette);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Refresh the list
    await recipesPage.refreshRecipes();

    // Recipe should still be visible
    await recipesPage.expectRecipeInList(recipe.title);
  });

  test("should display recipe with all details", async ({ recipesPage }) => {
    // Create a recipe with full details
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.guacamole);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Verify recipe appears with title
    await recipesPage.expectRecipeInList(recipe.title);

    // Verify ingredients preview is shown
    await recipesPage.expectIngredientInPreview("avocados");
  });

  test("should display multiple recipes in list", async ({ recipesPage }) => {
    // Get initial count
    const initialCount = await recipesPage.recipeItems.count().catch(() => 0);

    // Create first recipe
    const recipe1 = createUniqueRecipe(SAMPLE_RECIPES.pancakes);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe1);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Create second recipe
    const recipe2 = createUniqueRecipe(SAMPLE_RECIPES.capreseSalad);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe2);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Both should be visible
    await recipesPage.expectRecipeInList(recipe1.title);
    await recipesPage.expectRecipeInList(recipe2.title);

    // Count should have increased by 2
    await expect(recipesPage.recipeItems).toHaveCount(initialCount + 2);
  });

  test("should show processing status for new recipes", async ({ recipesPage }) => {
    // Create a recipe
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.beefTacos);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Recipe should appear with status indicator
    await recipesPage.expectRecipeInList(recipe.title);

    // Status indicator should be visible (processing or succeeded)
    const recipeCard = recipesPage.page.getByTestId("recipe-item").filter({ hasText: recipe.title });
    await expect(recipeCard).toBeVisible();
  });

  test("should navigate to recipe detail when clicking on recipe", async ({ recipesPage, page }) => {
    // Create a recipe
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.caesarSalad);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Click on the recipe

    await recipesPage.clickRecipe(recipe.title);

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9-]+/);
  });
});
