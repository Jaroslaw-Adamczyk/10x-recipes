import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeListDto, RecipeListItemDto, RecipeListQuery } from "../../../types";

export interface RecipeListError {
  code: "DATABASE";
  message: string;
}

const DEFAULT_SORT_COLUMN = "updated_at";
const DEFAULT_SORT_DESC = true;

const buildError = (message: string): RecipeListError => ({
  code: "DATABASE",
  message,
});

const buildIngredientsPreview = (items: { normalized_name: string }[] | null) => {
  if (!items?.length) {
    return [];
  }

  const unique = new Set<string>();
  items.forEach((item) => {
    const value = item.normalized_name.trim();
    if (value) {
      unique.add(value);
    }
  });

  return Array.from(unique);
};

export const listRecipes = async (
  supabase: SupabaseClient,
  userId: string,
  query: RecipeListQuery
): Promise<RecipeListDto> => {
  const normalizedQuery = query.q?.trim().toLowerCase();

  let request = supabase
    .from("recipes")
    .select("id,title,status,error_message,created_at,updated_at,recipe_ingredients(normalized_name)")
    .eq("user_id", userId)
    .order(DEFAULT_SORT_COLUMN, { ascending: !DEFAULT_SORT_DESC })
    .order("position", { referencedTable: "recipe_ingredients", ascending: true });

  if (query.status) {
    request = request.eq("status", query.status);
  }

  if (normalizedQuery) {
    // We want to filter recipes that have at least one ingredient matching the query.
    // In Supabase/PostgREST, filtering on a joined table (recipe_ingredients)
    // using .ilike() only filters the joined rows, not the parent rows.
    // To filter the parent rows (recipes), we need to use an inner join.
    // We do this by adding !inner to the joined table name in the select.
    request = supabase
      .from("recipes")
      .select("id,title,status,error_message,created_at,updated_at,recipe_ingredients!inner(normalized_name)")
      .eq("user_id", userId)
      .order(DEFAULT_SORT_COLUMN, { ascending: !DEFAULT_SORT_DESC })
      .order("position", { referencedTable: "recipe_ingredients", ascending: true })
      .ilike("recipe_ingredients.normalized_name", `%${normalizedQuery}%`);

    if (query.status) {
      request = request.eq("status", query.status);
    }
  }

  const { data, error } = await request;
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list recipes", error);
    throw buildError("Failed to list recipes.");
  }

  // If we filtered by ingredients, we might have duplicate recipes because of the inner join.
  // Also, the recipe_ingredients only contains the MATCHING ingredients.
  // We need to fetch ALL ingredients for these recipes to show the full preview.
  let recipesData = data ?? [];
  if (normalizedQuery && recipesData.length > 0) {
    const recipeIds = recipesData.map((r) => r.id);
    const { data: fullData, error: fullError } = await supabase
      .from("recipes")
      .select("id,title,status,error_message,created_at,updated_at,recipe_ingredients(normalized_name)")
      .in("id", recipeIds)
      .order(DEFAULT_SORT_COLUMN, { ascending: !DEFAULT_SORT_DESC })
      .order("position", { referencedTable: "recipe_ingredients", ascending: true });

    if (fullError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch full recipe data after filtering", fullError);
      throw buildError("Failed to load recipes.");
    }
    recipesData = fullData ?? [];
  }

  const recipes = recipesData.map((item) => {
    const ingredientsPreview = buildIngredientsPreview(item.recipe_ingredients ?? []);
    const entry: RecipeListItemDto = {
      id: item.id,
      title: item.title,
      status: item.status,
      error_message: item.error_message,
      created_at: item.created_at,
      updated_at: item.updated_at,
      ingredients_preview: ingredientsPreview,
    };

    return entry;
  });

  return {
    data: recipes,
    next_cursor: null,
  };
};
