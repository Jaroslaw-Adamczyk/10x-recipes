import type { SupabaseClient } from "../../../db/supabase.client";

export interface RecipeDeleteError {
  code: "NOT_FOUND" | "DATABASE";
  message: string;
}

const buildError = (message: string, code: RecipeDeleteError["code"]): RecipeDeleteError => ({
  code,
  message,
});

export const deleteRecipe = async (supabase: SupabaseClient, userId: string, recipeId: string): Promise<void> => {
  const { data, error } = await supabase.from("recipes").delete().eq("id", recipeId).eq("user_id", userId).select("id");

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete recipe", error);
    throw buildError("Failed to delete recipe.", "DATABASE");
  }

  if (!data?.length) {
    throw buildError("Recipe not found.", "NOT_FOUND");
  }
};
