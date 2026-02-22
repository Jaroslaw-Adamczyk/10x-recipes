import type { SupabaseClient } from "../../../db/supabase.client";

const BUCKET = "recipes-images";

export interface DeleteRecipeImageError {
  code: "NOT_FOUND" | "DATABASE" | "STORAGE";
  message: string;
}

const buildError = (message: string, code: DeleteRecipeImageError["code"]): DeleteRecipeImageError => ({
  code,
  message,
});

export const deleteRecipeImage = async (supabase: SupabaseClient, userId: string, imageId: string): Promise<void> => {
  const { data: row, error: selectError } = await supabase
    .from("recipe_images")
    .select("id, storage_path, recipe_id")
    .eq("id", imageId)
    .maybeSingle();

  if (selectError) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch recipe image", selectError);
    throw buildError("Failed to find image.", "DATABASE");
  }

  if (!row) {
    throw buildError("Image not found.", "NOT_FOUND");
  }

  const { error: deleteStorageError } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
  if (deleteStorageError) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete recipe image from storage", deleteStorageError);
    throw buildError("Failed to delete image file.", "STORAGE");
  }

  const { error: deleteRowError } = await supabase.from("recipe_images").delete().eq("id", imageId);

  if (deleteRowError) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete recipe image row", deleteRowError);
    throw buildError("Failed to delete image metadata.", "DATABASE");
  }
};
