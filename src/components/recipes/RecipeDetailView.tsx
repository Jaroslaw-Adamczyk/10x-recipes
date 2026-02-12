import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/recipes/DeleteConfirmationDialog";
import { EditRecipeModal } from "@/components/recipes/EditRecipeModal";
import type { RecipeDetailDto, RecipeUpdateCommand, RecipeUpdateResultDto } from "@/types";

import { useRecipeDetail } from "./hooks/useRecipeDetail";
import { RecipeHeader } from "./detail/RecipeHeader";
import { RecipeStatusBadge } from "./detail/RecipeStatusBadge";
import { RecipeMetaPanel } from "./detail/RecipeMetaPanel";
import { RecipeIngredientsSection } from "./detail/RecipeIngredientsSection";
import { RecipeStepsSection } from "./detail/RecipeStepsSection";
import { ErrorBanner } from "./detail/ErrorBanner";

interface RecipeDetailViewProps {
  initialDetail: RecipeDetailDto;
  recipeId: string;
}

interface UpdateError {
  message: string;
  statusCode?: number;
}

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
