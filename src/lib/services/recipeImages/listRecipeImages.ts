import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeImageWithUrlDto } from "../../../types";

const BUCKET = "recipes-images";
const SIGNED_URL_EXPIRY_SEC = 300;

export interface ListRecipeImagesError {
  code: "NOT_FOUND" | "DATABASE";
  message: string;
}

export interface ListRecipeImagesOptions {
  size?: number;
}

const buildError = (message: string, code: ListRecipeImagesError["code"]): ListRecipeImagesError => ({
  code,
  message,
});

export const listRecipeImages = async (
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  options?: ListRecipeImagesOptions
): Promise<RecipeImageWithUrlDto[]> => {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (recipeError || !recipe) {
    throw buildError("Recipe not found.", "NOT_FOUND");
  }

  const { data: rows, error } = await supabase
    .from("recipe_images")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list recipe images", error);
    throw buildError("Failed to list images.", "DATABASE");
  }

  if (!rows?.length) {
    return [];
  }

  const transform = options?.size ? { width: options.size, height: options.size, resize: "cover" as const } : undefined;

  const withUrls: RecipeImageWithUrlDto[] = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_EXPIRY_SEC, transform ? { transform } : {});
      return { ...row, url: signed?.signedUrl ?? "" };
    })
  );

  return withUrls;
};
