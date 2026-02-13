import { useCallback, useMemo, useState } from "react";
import type {
  RecipeDetailDto,
  RecipeDto,
  RecipeImportDto,
  RecipeIngredientDto,
  RecipeStatus,
  RecipeStepDto,
} from "@/types";
import { formatCookTime, formatTimestamp } from "@/components/recipes/utils/formatters";

export interface RecipeDetailViewModel {
  recipe: RecipeDto;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  importMeta: RecipeImportDto | null;
  cookTimeLabel: string | null;
  statusLabel: string;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
}

export interface RecipeDetailErrorViewModel {
  message: string;
  statusCode?: number;
  context?: "load" | "update" | "delete";
}

const statusLabels: Record<RecipeStatus, string> = {
  processing: "Processing",
  succeeded: "Succeeded",
  failed: "Failed",
};

const getSourceUrl = (recipe: RecipeDto, importMeta: RecipeImportDto | null): string | null =>
  recipe.source_url ?? importMeta?.source_url ?? null;

const buildViewModel = (detail: RecipeDetailDto): RecipeDetailViewModel => ({
  recipe: detail.recipe,
  ingredients: detail.ingredients,
  steps: detail.steps,
  importMeta: detail.import,
  cookTimeLabel: formatCookTime(detail.recipe.cook_time_minutes ?? null),
  statusLabel: statusLabels[detail.recipe.status],
  sourceUrl: getSourceUrl(detail.recipe, detail.import),
  createdAt: formatTimestamp(detail.recipe.created_at),
  updatedAt: formatTimestamp(detail.recipe.updated_at),
  errorMessage: detail.recipe.error_message ?? detail.import?.error_message ?? null,
});

export const useRecipeDetail = (recipeId: string, initialDetail: RecipeDetailDto) => {
  const [detail, setDetail] = useState<RecipeDetailDto>(initialDetail);
  const [error, setError] = useState<RecipeDetailErrorViewModel | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const viewModel = useMemo(() => buildViewModel(detail), [detail]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          setError({ message: "Recipe not found.", statusCode: response.status, context: "load" });
          return;
        }

        setError({ message: "Unable to refresh recipe details.", statusCode: response.status, context: "load" });
        return;
      }

      const data = (await response.json()) as RecipeDetailDto;
      setDetail(data);
    } catch {
      setError({ message: "Network error while refreshing.", context: "load" });
    } finally {
      setIsRefreshing(false);
    }
  }, [recipeId]);

  return {
    detail,
    setDetail,
    error,
    setError,
    viewModel,
    refresh,
    isRefreshing,
  };
};
