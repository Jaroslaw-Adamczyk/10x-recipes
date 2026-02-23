import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { RecipeCreateCommand, RecipeCreateResultDto, RecipeImportCreateCommand, RecipeListItemDto } from "@/types";
import type { RecipeListErrorViewModel } from "../types/recipeListTypes";
import { apiClient, ApiError } from "@/lib/apiClient";
import { uploadRecipeImages } from "@/lib/uploadRecipeImages";

interface UseRecipeCreateProps {
  setItems: Dispatch<SetStateAction<RecipeListItemDto[]>>;
  setError: Dispatch<SetStateAction<RecipeListErrorViewModel | null>>;
  onRefresh: () => void;
}

export const useRecipeCreate = ({ setItems, setError, onRefresh }: UseRecipeCreateProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleOpenAdd = useCallback(() => {
    setIsAddOpen(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setIsAddOpen(false);
    setImportError(null);
    setCreateError(null);
  }, []);

  const handleImport = useCallback(
    async (command: RecipeImportCreateCommand) => {
      setIsSubmitting(true);
      setImportError(null);
      setCreateError(null);
      setError(null);

      try {
        await apiClient.post("/api/recipes/import", command);
        onRefresh();
        setIsAddOpen(false);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 400) {
            setImportError("Enter a valid recipe URL.");
            return;
          }
          if (err.statusCode === 409) {
            setImportError("This recipe URL already exists.");
            return;
          }
          setError({ message: "Unable to import recipe.", statusCode: err.statusCode, context: "import" });
        } else {
          setError({ message: "Network error while importing.", context: "import" });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [setError, onRefresh]
  );

  const handleCreate = useCallback(
    async (command: RecipeCreateCommand, imageFiles?: File[]) => {
      setIsSubmitting(true);
      setImportError(null);
      setCreateError(null);
      setError(null);

      try {
        const result = await apiClient.post<RecipeCreateResultDto>("/api/recipes", command);
        const recipeId = result.recipe.id;

        if (imageFiles?.length) {
          try {
            await uploadRecipeImages(recipeId, imageFiles);
          } catch (err) {
            const apiErr = err instanceof ApiError ? err : null;
            setCreateError(apiErr?.message ?? "Recipe created but one or more photos failed to upload.");
            return;
          }
        }

        const preview = result.ingredients.map((ingredient) => ingredient.normalized_name);
        const listItem: RecipeListItemDto = {
          id: result.recipe.id,
          title: result.recipe.title,
          status: result.recipe.status,
          error_message: result.recipe.error_message ?? null,
          created_at: result.recipe.created_at,
          updated_at: result.recipe.updated_at,
          source_url: result.recipe.source_url,
          ingredients_preview: preview,
          thumbnail_url: null,
        };
        setItems((current) => [listItem, ...current]);
        setIsAddOpen(false);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 400) {
            setCreateError("Please double-check your recipe details.");
            return;
          }
          if (err.statusCode === 409) {
            setCreateError("A recipe with this source URL already exists.");
            return;
          }
          setError({ message: "Unable to create recipe.", statusCode: err.statusCode, context: "create" });
        } else {
          setError({ message: "Network error while creating.", context: "create" });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [setItems, setError]
  );

  return {
    isSubmitting,
    isAddOpen,
    importError,
    createError,
    handleOpenAdd,
    handleCloseAdd,
    handleImport,
    handleCreate,
  };
};
