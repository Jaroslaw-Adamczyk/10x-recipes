import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeListDto, RecipeListItemDto, RecipeListQuery } from "../../../types";

export interface RecipeListError {
  code: "DATABASE";
  message: string;
}

const DEFAULT_SORT_COLUMN = "updated_at";
const DEFAULT_SORT_DESC = true;
export const RECIPE_ROW_THUMBNAIL_SIZE = 70;
const THUMBNAIL_SIGNED_URL_EXPIRY_SEC = 300;
const IMAGES_BUCKET = "recipes-images";

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
    .select("id,title,status,error_message,created_at,updated_at,source_url,recipe_ingredients(normalized_name)")
    .eq("user_id", userId)
    .order(DEFAULT_SORT_COLUMN, { ascending: !DEFAULT_SORT_DESC })
    .order("position", { referencedTable: "recipe_ingredients", ascending: true });

  if (query.status) {
    request = request.eq("status", query.status);
  }

  if (normalizedQuery) {
    // Use !inner so filtering on recipe_ingredients restricts to parent recipes.
    request = supabase
      .from("recipes")
      .select(
        "id,title,status,error_message,created_at,updated_at,source_url,recipe_ingredients!inner(normalized_name)"
      )
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

  // Inner join returns only matching ingredients; refetch for full preview.
  let recipesData = data ?? [];
  if (normalizedQuery && recipesData.length > 0) {
    const recipeIds = recipesData.map((r) => r.id);
    const { data: fullData, error: fullError } = await supabase
      .from("recipes")
      .select("id,title,status,error_message,created_at,updated_at,source_url,recipe_ingredients(normalized_name)")
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

  const recipeIds = recipesData.map((r) => r.id);
  const thumbnailMap = new Map<string, string>();

  if (recipeIds.length > 0) {
    const { data: imagesRows } = await supabase
      .from("recipe_images")
      .select("recipe_id, storage_path")
      .in("recipe_id", recipeIds)
      .order("position", { ascending: true });

    const firstImagePerRecipe = new Map<string, string>();
    for (const row of imagesRows ?? []) {
      if (!firstImagePerRecipe.has(row.recipe_id)) {
        firstImagePerRecipe.set(row.recipe_id, row.storage_path);
      }
    }

    const transform = { width: RECIPE_ROW_THUMBNAIL_SIZE, height: RECIPE_ROW_THUMBNAIL_SIZE, resize: "cover" as const };
    await Promise.all(
      Array.from(firstImagePerRecipe.entries()).map(async ([rid, storagePath]) => {
        const { data: signed } = await supabase.storage
          .from(IMAGES_BUCKET)
          .createSignedUrl(storagePath, THUMBNAIL_SIGNED_URL_EXPIRY_SEC, { transform });
        if (signed?.signedUrl) {
          thumbnailMap.set(rid, signed.signedUrl);
        }
      })
    );
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
      source_url: item.source_url,
      ingredients_preview: ingredientsPreview,
      thumbnail_url: thumbnailMap.get(item.id) ?? null,
    };

    return entry;
  });

  return {
    data: recipes,
    next_cursor: null,
  };
};
