import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { RecipeListItemDto } from "@/types";
import type { RecipeListErrorViewModel } from "../types/recipeListTypes";

interface UseRecipeDeleteProps {
  setItems: Dispatch<SetStateAction<RecipeListItemDto[]>>;
  setError: Dispatch<SetStateAction<RecipeListErrorViewModel | null>>;
}

export const useRecipeDelete = ({ setItems, setError }: UseRecipeDeleteProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecipeListItemDto | null>(null);

  const deleteRecipeById = useCallback(
    async (target: RecipeListItemDto) => {
      setError(null);
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/recipes/${target.id}`, { method: "DELETE" });
        if (!response.ok) {
          if (response.status === 404) {
            setItems((current) => current.filter((item) => item.id !== target.id));
            setError({ message: "Recipe already removed.", statusCode: 404, context: "delete" });
            return;
          }
          setError({ message: "Unable to delete recipe.", statusCode: response.status, context: "delete" });
          return;
        }

        setItems((current) => current.filter((item) => item.id !== target.id));
      } catch {
        setError({ message: "Network error while deleting.", context: "delete" });
      } finally {
        setIsDeleting(false);
      }
    },
    [setItems, setError]
  );

  const handleDelete = useCallback(
    (item: RecipeListItemDto) => {
      if (item.status === "failed") {
        void deleteRecipeById(item);
        return;
      }
      setDeleteTarget(item);
    },
    [deleteRecipeById]
  );

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }
    await deleteRecipeById(deleteTarget);
    setDeleteTarget(null);
  }, [deleteRecipeById, deleteTarget]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const isDeleteDialogOpen = Boolean(deleteTarget) && deleteTarget?.status !== "failed";
  const deleteTargetStatus = deleteTarget?.status ?? "succeeded";

  return {
    isDeleting,
    isDeleteDialogOpen,
    deleteTargetStatus,
    handleDelete,
    handleDeleteConfirmed,
    handleDeleteCancel,
  };
};
