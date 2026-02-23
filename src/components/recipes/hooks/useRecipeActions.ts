import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

import { apiClient, ApiError } from "@/lib/apiClient";
import { uploadRecipeImages } from "@/lib/uploadRecipeImages";
import type { RecipeDetailDto, RecipeUpdateCommand, RecipeUpdateResultDto } from "@/types";
import type { RecipeDetailErrorViewModel } from "./useRecipeDetail";

interface UpdateError {
  message: string;
  statusCode?: number;
}

interface UseRecipeActionsProps {
  recipeId: string;
  setDetail: Dispatch<SetStateAction<RecipeDetailDto>>;
  setError: Dispatch<SetStateAction<RecipeDetailErrorViewModel | null>>;
  onImagesUpdated: () => void;
}

export const useRecipeActions = ({ recipeId, setDetail, setError, onImagesUpdated }: UseRecipeActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirmed = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/api/recipes/${recipeId}`);
      window.location.assign("/");
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setError({ message: "Unable to delete recipe.", statusCode: apiErr?.statusCode, context: "delete" });
    } finally {
      setIsDeleting(false);
    }
  }, [recipeId, setError]);

  const handleUpdateSubmit = useCallback(
    async (command: RecipeUpdateCommand, imageFiles?: File[]) => {
      setIsSaving(true);
      setError(null);

      try {
        let result: RecipeUpdateResultDto;

        try {
          result = await apiClient.patch<RecipeUpdateResultDto>(`/api/recipes/${recipeId}`, command);
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.statusCode === 409) {
              throw { message: "A recipe with this source URL already exists.", statusCode: 409 } as UpdateError;
            }
            setError({ message: "Unable to update recipe.", statusCode: err.statusCode, context: "update" });
            throw { message: "Unable to update recipe.", statusCode: err.statusCode } as UpdateError;
          }
          setError({ message: "Network error while updating.", context: "update" });
          throw err;
        }

        setDetail((current) => ({
          recipe: result.recipe,
          ingredients: result.ingredients,
          steps: result.steps,
          import: current.import,
          recipe_images: current.recipe_images,
        }));

        if (imageFiles?.length) {
          try {
            await uploadRecipeImages(recipeId, imageFiles);
            onImagesUpdated();
          } catch (err) {
            const apiErr = err instanceof ApiError ? err : null;
            throw {
              message: apiErr?.message ?? "Recipe updated but one or more photos failed to upload.",
            } as UpdateError;
          }
        }
      } finally {
        setIsSaving(false);
      }
    },
    [recipeId, setDetail, setError, onImagesUpdated]
  );

  return { isSaving, isDeleting, handleDeleteConfirmed, handleUpdateSubmit };
};
