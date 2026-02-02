import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/recipes/DeleteConfirmationDialog";
import { EditRecipeModal } from "@/components/recipes/EditRecipeModal";
import type {
  RecipeDetailDto,
  RecipeDto,
  RecipeImportDto,
  RecipeIngredientDto,
  RecipeStatus,
  RecipeStepDto,
  RecipeUpdateCommand,
  RecipeUpdateResultDto,
} from "@/types";

interface RecipeDetailViewProps {
  initialDetail: RecipeDetailDto;
  recipeId: string;
}

interface RecipeDetailViewModel {
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

interface RecipeDetailErrorViewModel {
  message: string;
  statusCode?: number;
  context?: "load" | "update" | "delete";
}

interface UpdateError {
  message: string;
  statusCode?: number;
}

const statusLabels: Record<RecipeStatus, string> = {
  processing: "Processing",
  succeeded: "Succeeded",
  failed: "Failed",
};

const statusBadgeStyles: Record<RecipeStatus, string> = {
  processing: "bg-secondary text-secondary-foreground",
  succeeded: "bg-emerald-100 text-emerald-900",
  failed: "bg-destructive text-white",
};

const formatCookTime = (cookTime: number | null): string | null => {
  if (cookTime === null || Number.isNaN(cookTime)) {
    return null;
  }

  if (cookTime === 0) {
    return "Cook time: 0 min";
  }

  return `Cook time: ${cookTime} min`;
};

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US");
};

const getSourceUrl = (recipe: RecipeDto, importMeta: RecipeImportDto | null): string | null =>
  recipe.source_url ?? importMeta?.source_url ?? null;

const isValidUrl = (value: string | null): value is string => {
  if (!value) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

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

const RecipeHeader = ({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: RecipeDto;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">{recipe.title}</h1>
      {recipe.cook_time_minutes !== null ? (
        <p className="text-sm text-muted-foreground">{formatCookTime(recipe.cook_time_minutes)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Cook time not set</p>
      )}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </div>
  </header>
);

const RecipeStatusBadge = ({ status, importMeta }: { status: RecipeStatus; importMeta: RecipeImportDto | null }) => (
  <div className="flex flex-wrap items-center gap-3">
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
    {importMeta?.error_message ? (
      <p className="text-xs text-destructive">Import error: {importMeta.error_message}</p>
    ) : null}
  </div>
);

const RecipeMetaPanel = ({ recipe, importMeta }: { recipe: RecipeDto; importMeta: RecipeImportDto | null }) => {
  const sourceUrl = getSourceUrl(recipe, importMeta);
  const sourceLabel = isValidUrl(sourceUrl) ? sourceUrl : "Unavailable";

  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metadata</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Source URL</dt>
          <dd className="mt-1">
            {isValidUrl(sourceUrl) ? (
              <a className="text-primary hover:underline" href={sourceUrl} rel="noreferrer" target="_blank">
                {sourceLabel}
              </a>
            ) : (
              <span className="text-muted-foreground">{sourceLabel}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1 text-foreground">{statusLabels[recipe.status]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Created</dt>
          <dd className="mt-1 text-foreground">{formatTimestamp(recipe.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Updated</dt>
          <dd className="mt-1 text-foreground">{formatTimestamp(recipe.updated_at)}</dd>
        </div>
      </dl>
      {recipe.error_message ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {recipe.error_message}
        </p>
      ) : null}
    </section>
  );
};

const RecipeIngredientsSection = ({ ingredients }: { ingredients: RecipeIngredientDto[] }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Ingredients</h2>
    {ingredients.length === 0 ? (
      <p className="text-sm text-muted-foreground">No ingredients available.</p>
    ) : (
      <ul className="space-y-2 text-sm text-foreground">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="rounded-md border border-border bg-card px-3 py-2 text-card-foreground">
            {ingredient.raw_text}
          </li>
        ))}
      </ul>
    )}
  </section>
);

const RecipeStepsSection = ({ steps }: { steps: RecipeStepDto[] }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Steps</h2>
    {steps.length === 0 ? (
      <p className="text-sm text-muted-foreground">No steps available.</p>
    ) : (
      <ol className="space-y-3 text-sm text-foreground">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-md border border-border bg-card px-3 py-2 text-card-foreground">
            <span className="block text-xs text-muted-foreground">Step {index + 1}</span>
            <span className="mt-1 block">{step.step_text}</span>
          </li>
        ))}
      </ol>
    )}
  </section>
);

const ErrorBanner = ({
  error,
  onDismiss,
  onRetryLoad,
  onRetryUpdate,
  onRetryDelete,
}: {
  error: RecipeDetailErrorViewModel | null;
  onDismiss: () => void;
  onRetryLoad?: () => void;
  onRetryUpdate?: () => void;
  onRetryDelete?: () => void;
}) => {
  if (!error) {
    return null;
  }

  const title =
    error.context === "load"
      ? "Unable to load recipe"
      : error.context === "update"
        ? "Update failed"
        : error.context === "delete"
          ? "Delete failed"
          : "Something went wrong";

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-destructive/80">{error.message}</p>
        </div>
        <div className="flex gap-2">
          {error.context === "load" && onRetryLoad ? (
            <Button size="sm" variant="outline" onClick={onRetryLoad}>
              Retry
            </Button>
          ) : null}
          {error.context === "update" && onRetryUpdate ? (
            <Button size="sm" variant="outline" onClick={onRetryUpdate}>
              Retry update
            </Button>
          ) : null}
          {error.context === "delete" && onRetryDelete ? (
            <Button size="sm" variant="outline" onClick={onRetryDelete}>
              Retry delete
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};

const useRecipeDetail = (recipeId: string, initialDetail: RecipeDetailDto) => {
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

const RecipeDetailView = ({ initialDetail, recipeId }: RecipeDetailViewProps) => {
  const { detail, setDetail, error, setError, viewModel, refresh, isRefreshing } = useRecipeDetail(
    recipeId,
    initialDetail
  );
  const lastUpdateCommandRef = useRef<RecipeUpdateCommand | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    if (detail.recipe.status === "failed") {
      await handleDeleteConfirmed();
      return;
    }

    setIsDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (!response.ok) {
        setError({ message: "Unable to delete recipe.", statusCode: response.status, context: "delete" });
        return;
      }

      window.location.assign("/");
    } catch {
      setError({ message: "Network error while deleting.", context: "delete" });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleUpdateSubmit = async (command: RecipeUpdateCommand) => {
    setIsSaving(true);
    setError(null);
    lastUpdateCommandRef.current = command;

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw { message: "A recipe with this source URL already exists.", statusCode: 409 } as UpdateError;
        }

        setError({ message: "Unable to update recipe.", statusCode: response.status, context: "update" });
        throw { message: "Unable to update recipe.", statusCode: response.status } as UpdateError;
      }

      const result = (await response.json()) as RecipeUpdateResultDto;
      setDetail((current) => ({
        recipe: result.recipe,
        ingredients: result.ingredients,
        steps: result.steps,
        import: current.import,
      }));
      setIsEditOpen(false);
    } catch (error) {
      const updateError = error as UpdateError | undefined;
      if (!updateError?.statusCode) {
        setError({ message: "Network error while updating.", context: "update" });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a className="text-sm font-medium text-primary hover:underline" href="/">
          Back to recipes
        </a>
        <Button size="sm" variant="outline" onClick={refresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <ErrorBanner
        error={error}
        onDismiss={() => setError(null)}
        onRetryLoad={refresh}
        onRetryUpdate={
          error?.context === "update" && lastUpdateCommandRef.current
            ? () => handleUpdateSubmit(lastUpdateCommandRef.current as RecipeUpdateCommand)
            : undefined
        }
        onRetryDelete={error?.context === "delete" ? handleDeleteConfirmed : undefined}
      />
      <RecipeHeader recipe={viewModel.recipe} onDelete={handleDelete} onEdit={handleEdit} />
      <RecipeStatusBadge status={viewModel.recipe.status} importMeta={viewModel.importMeta} />
      <RecipeMetaPanel recipe={viewModel.recipe} importMeta={viewModel.importMeta} />
      <RecipeIngredientsSection ingredients={viewModel.ingredients} />
      <RecipeStepsSection steps={viewModel.steps} />
      <EditRecipeModal
        open={isEditOpen}
        initialRecipe={detail}
        onSubmit={handleUpdateSubmit}
        onClose={() => setIsEditOpen(false)}
        isSaving={isSaving}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        status={detail.recipe.status}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setIsDeleteOpen(false)}
        isDeleting={isDeleting}
      />
    </section>
  );
};

export default RecipeDetailView;
