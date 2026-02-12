import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type {
  RecipeCreateCommand,
  RecipeCreateResultDto,
  RecipeImportCreateCommand,
  RecipeListItemDto,
} from "@/types";
import type { RecipeListErrorViewModel } from "../types/recipeListTypes";

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
        const response = await fetch("/api/recipes/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          if (response.status === 400) {
            setImportError("Enter a valid recipe URL.");
            return;
          }
          if (response.status === 409) {
            setImportError("This recipe URL already exists.");
            return;
          }
          setError({ message: "Unable to import recipe.", statusCode: response.status, context: "import" });
          return;
        }

        onRefresh();
        setIsAddOpen(false);
      } catch {
        setError({ message: "Network error while importing.", context: "import" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [setError, onRefresh]
  );

  const handleCreate = useCallback(
    async (command: RecipeCreateCommand) => {
      setIsSubmitting(true);
      setImportError(null);
      setCreateError(null);
      setError(null);

      try {
        const response = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          if (response.status === 400) {
            setCreateError("Please double-check your recipe details.");
            return;
          }
          if (response.status === 409) {
            setCreateError("A recipe with this source URL already exists.");
            return;
          }
          setError({ message: "Unable to create recipe.", statusCode: response.status, context: "create" });
          return;
        }

        const result = (await response.json()) as RecipeCreateResultDto;
        const preview = result.ingredients.map((ingredient) => ingredient.normalized_name);
        const listItem: RecipeListItemDto = {
          id: result.recipe.id,
          title: result.recipe.title,
          status: result.recipe.status,
          error_message: result.recipe.error_message ?? null,
          created_at: result.recipe.created_at,
          updated_at: result.recipe.updated_at,
          ingredients_preview: preview,
        };
        setItems((current) => [listItem, ...current]);
        setIsAddOpen(false);
      } catch {
        setError({ message: "Network error while creating.", context: "create" });
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
