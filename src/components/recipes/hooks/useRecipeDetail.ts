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
import { apiClient, ApiError } from "@/lib/apiClient";

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
      const data = await apiClient.get<RecipeDetailDto>(`/api/recipes/${recipeId}`);
      setDetail(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400 || err.statusCode === 404) {
          setError({ message: "Recipe not found.", statusCode: err.statusCode, context: "load" });
          return;
        }
        setError({ message: "Unable to refresh recipe details.", statusCode: err.statusCode, context: "load" });
      } else {
        setError({ message: "Network error while refreshing.", context: "load" });
      }
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
