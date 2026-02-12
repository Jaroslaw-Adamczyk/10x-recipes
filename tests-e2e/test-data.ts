import type { RecipeData } from "./page-objects";

/**
 * Test user credentials
 * Loaded from .env.test via playwright.config.ts
 */
export const TEST_USER = {
  email: process.env.E2E_USERNAME || "test@example.com",
  password: process.env.E2E_PASSWORD || "password123",
};

/**
 * Generate a unique recipe title with random UUID
 */
export function generateRecipeTitle(baseName = "Test Recipe"): string {
  return `${baseName} ${crypto.randomUUID()}`;
}

/**
 * Sample recipe data for testing
 */
export const SAMPLE_RECIPES: Record<string, RecipeData> = {
  chocolateChipCookies: {
    title: "Chocolate Chip Cookies",
    ingredients: `2 cups all-purpose flour
1 cup butter, softened
3/4 cup granulated sugar
3/4 cup brown sugar
2 large eggs
2 tsp vanilla extract
1 tsp baking soda
1 tsp salt
2 cups chocolate chips`,
    steps: `Preheat oven to 375°F
Cream together butter and sugars until fluffy
Beat in eggs and vanilla
Mix dry ingredients in separate bowl
Gradually blend dry mixture into wet mixture
Stir in chocolate chips
Drop spoonfuls onto baking sheets
Bake for 9-11 minutes until golden brown
Cool on baking sheet for 2 minutes before transferring`,
    cookTime: "11",
  },

  spaghettiCarbonara: {
    title: "Spaghetti Carbonara",
    ingredients: `400g spaghetti
200g pancetta
4 large eggs
100g Parmesan cheese, grated
2 cloves garlic
Black pepper
Salt`,
    steps: `Cook spaghetti according to package directions
Fry pancetta until crispy
Beat eggs with grated Parmesan
Drain pasta, reserving 1 cup pasta water
Add pasta to pancetta pan
Remove from heat and add egg mixture
Toss quickly, adding pasta water to create creamy sauce
Season with black pepper and serve`,
    cookTime: "20",
  },

  chickenStirFry: {
    title: "Chicken Stir Fry",
    ingredients: `500g chicken breast, sliced
2 cups mixed vegetables
3 tbsp soy sauce
2 tbsp sesame oil
2 cloves garlic, minced
1 tbsp ginger, grated
2 tbsp cornstarch
Rice for serving`,
    steps: `Heat sesame oil in wok over high heat
Add garlic and ginger, stir for 30 seconds
Add chicken and cook until browned
Add vegetables and stir-fry for 3-4 minutes
Mix soy sauce with cornstarch and add to wok
Toss everything together until sauce thickens
Serve over rice`,
    cookTime: "15",
  },

  simpleOmelette: {
    title: "Simple Omelette",
    ingredients: `3 eggs
2 tbsp milk
Salt and pepper
1 tbsp butter
Cheese, optional
Herbs, optional`,
    steps: `Beat eggs with milk, salt, and pepper
Heat butter in non-stick pan over medium heat
Pour in egg mixture
Cook until edges set, about 2 minutes
Add cheese and herbs if using
Fold omelette in half
Slide onto plate and serve`,
    cookTime: "5",
  },

  guacamole: {
    title: "Classic Guacamole",
    ingredients: `3 ripe avocados
1/2 small onion, finely diced
2 Roma tomatoes, diced
3 tbsp fresh cilantro, chopped
1 jalapeno pepper, seeded and minced
2 cloves garlic, minced
1 lime, juiced
1/2 tsp salt`,
    steps: `Mash avocados in a bowl
Stir in onion, tomatoes, cilantro, jalapeno, and garlic
Mix in lime juice and salt
Serve immediately with chips`,
    cookTime: "10",
  },

  pancakes: {
    title: "Fluffy Pancakes",
    ingredients: `1 1/2 cups all-purpose flour
3 1/2 tsp baking powder
1 tsp salt
1 tbsp white sugar
1 1/4 cups milk
1 egg
3 tbsp butter, melted`,
    steps: `Sift flour, baking powder, salt and sugar
Make a well and pour in milk, egg and melted butter
Mix until smooth
Heat a lightly oiled griddle or frying pan
Pour batter onto the griddle
Brown on both sides and serve hot`,
    cookTime: "20",
  },

  capreseSalad: {
    title: "Caprese Salad",
    ingredients: `3 large tomatoes, sliced
1 lb fresh mozzarella cheese, sliced
1 bunch fresh basil leaves
1/4 cup extra virgin olive oil
2 tbsp balsamic glaze
Salt and pepper to taste`,
    steps: `Alternate slices of tomato and mozzarella on a platter
Tuck basil leaves between the slices
Drizzle with olive oil and balsamic glaze
Season with salt and pepper`,
    cookTime: "10",
  },

  beefTacos: {
    title: "Ground Beef Tacos",
    ingredients: `1 lb ground beef
1 packet taco seasoning
12 taco shells
1 cup shredded lettuce
1 cup shredded cheese
1/2 cup sour cream
1/2 cup salsa`,
    steps: `Brown ground beef in a skillet
Drain fat and add taco seasoning with water
Simmer for 5 minutes
Warm taco shells in the oven
Fill shells with beef and top with lettuce, cheese, sour cream, and salsa`,
    cookTime: "15",
  },

  caesarSalad: {
    title: "Classic Caesar Salad",
    ingredients: `1 large head romaine lettuce
1/2 cup grated Parmesan cheese
1 cup croutons
1/2 cup Caesar dressing
1 lemon, juiced
Black pepper to taste`,
    steps: `Chop romaine lettuce into bite-sized pieces
Place in a large bowl and toss with dressing
Add Parmesan cheese and croutons
Squeeze lemon juice over the top
Season with black pepper and toss again`,
    cookTime: "10",
  },

  margaritaPizza: {
    title: "Margherita Pizza",
    ingredients: `1 pizza dough
1/2 cup tomato sauce
8 oz fresh mozzarella, sliced
Fresh basil leaves
2 tbsp olive oil
Salt to taste`,
    steps: `Preheat oven to 450°F
Roll out pizza dough on a floured surface
Spread tomato sauce over the dough
Top with mozzarella slices
Bake for 10-12 minutes until crust is golden
Top with fresh basil and drizzle with olive oil`,
    cookTime: "12",
  },

  bananaBread: {
    title: "Easy Banana Bread",
    ingredients: `3 ripe bananas, mashed
1/3 cup melted butter
1 cup sugar
1 egg, beaten
1 tsp vanilla extract
1 tsp baking soda
Pinch of salt
1 1/2 cups all-purpose flour`,
    steps: `Preheat oven to 350°F
Mix mashed bananas with melted butter
Stir in baking soda and salt
Stir in sugar, beaten egg, and vanilla extract
Mix in flour
Pour into a greased loaf pan
Bake for 50-60 minutes`,
    cookTime: "60",
  },

  greekSalad: {
    title: "Greek Salad",
    ingredients: `2 large cucumbers, chopped
4 Roma tomatoes, chopped
1 red onion, sliced
1/2 cup Kalamata olives
1/2 cup feta cheese, crumbled
1/4 cup olive oil
2 tbsp red wine vinegar
1 tsp dried oregano`,
    steps: `Combine cucumbers, tomatoes, onion, and olives in a bowl
Whisk together olive oil, vinegar, and oregano
Pour dressing over vegetables and toss
Top with crumbled feta cheese`,
    cookTime: "15",
  },

  mushroomRisotto: {
    title: "Mushroom Risotto",
    ingredients: `1 1/2 cups Arborio rice
1 lb mushrooms, sliced
4 cups chicken or vegetable broth
1/2 cup dry white wine
2 shallots, minced
3 cloves garlic, minced
4 tbsp butter
1/2 cup grated Parmesan cheese`,
    steps: `Sauté mushrooms in butter until browned; set aside
Sauté shallots and garlic in butter
Add rice and toast for 2 minutes
Add wine and stir until absorbed
Add broth one ladle at a time, stirring constantly
When rice is creamy and tender, stir in mushrooms and Parmesan`,
    cookTime: "40",
  },

  frenchToast: {
    title: "Classic French Toast",
    ingredients: `6 slices thick bread
2 eggs
2/3 cup milk
1/4 tsp ground cinnamon
1 tsp vanilla extract
Pinch of salt
Butter for frying`,
    steps: `Whisk eggs, milk, cinnamon, vanilla, and salt in a shallow bowl
Dip bread slices into the egg mixture, soaking both sides
Heat butter in a skillet over medium heat
Fry bread until golden brown on both sides
Serve with maple syrup`,
    cookTime: "15",
  },
};

/**
 * Create a unique recipe with custom title
 */
export function createUniqueRecipe(baseRecipe: RecipeData): RecipeData {
  return {
    ...baseRecipe,
    title: generateRecipeTitle(baseRecipe.title),
  };
}
