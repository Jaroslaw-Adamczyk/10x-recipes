import { useCallback, useRef, useState } from "react";

import { DeleteConfirmationDialog } from "@/components/recipes/DeleteConfirmationDialog";
import { EditRecipeModal } from "@/components/recipes/EditRecipeModal";
import type { RecipeDetailDto, RecipeUpdateCommand } from "@/types";

import { useRecipeDetail } from "../hooks/useRecipeDetail";
import { useRecipeActions } from "../hooks/useRecipeActions";
import { RecipeHeader } from "./RecipeHeader";
import { RecipeIngredientsSection } from "./RecipeIngredientsSection";
import { RecipeStepsSection } from "./RecipeStepsSection";
import { RecipeImagesSection } from "./RecipeImagesSection";
import { ErrorBanner } from "./ErrorBanner";
import { TooltipProvider } from "@radix-ui/react-tooltip";

interface RecipeDetailViewProps {
  initialDetail: RecipeDetailDto;
  recipeId: string;
}

const RecipeDetailView = ({ initialDetail, recipeId }: RecipeDetailViewProps) => {
  const { detail, setDetail, error, setError, viewModel, refresh } = useRecipeDetail(recipeId, initialDetail);
  const lastUpdateCommandRef = useRef<RecipeUpdateCommand | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imagesRefreshKey, setImagesRefreshKey] = useState(0);

  const {
    isSaving,
    isDeleting,
    handleDeleteConfirmed,
    handleUpdateSubmit: submitUpdate,
  } = useRecipeActions({
    recipeId,
    setDetail,
    setError,
    onImagesUpdated: () => setImagesRefreshKey((k) => k + 1),
  });

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

  const handleDeleteConfirmedWithClose = useCallback(async () => {
    try {
      await handleDeleteConfirmed();
    } finally {
      setIsDeleteOpen(false);
    }
  }, [handleDeleteConfirmed]);

  const handleUpdateSubmit = useCallback(
    async (command: RecipeUpdateCommand, imageFiles?: File[]) => {
      lastUpdateCommandRef.current = command;
      await submitUpdate(command, imageFiles);
      setIsEditOpen(false);
    },
    [submitUpdate]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 px-6 py-10">
        <ErrorBanner
          error={error}
          onDismiss={() => setError(null)}
          onRetryLoad={refresh}
          onRetryUpdate={
            error?.context === "update" && lastUpdateCommandRef.current
              ? () => handleUpdateSubmit(lastUpdateCommandRef.current as RecipeUpdateCommand)
              : undefined
          }
          onRetryDelete={error?.context === "delete" ? handleDeleteConfirmedWithClose : undefined}
        />
        <RecipeHeader recipe={viewModel.recipe} onDelete={handleDelete} onEdit={handleEdit} />
        {/* <RecipeMetaPanel recipe={viewModel.recipe} importMeta={viewModel.importMeta} /> */}
        <RecipeImagesSection recipeId={recipeId} refreshKey={imagesRefreshKey} />
        <RecipeIngredientsSection ingredients={viewModel.ingredients} />
        <RecipeStepsSection steps={viewModel.steps} />
        <EditRecipeModal
          open={isEditOpen}
          initialRecipe={detail}
          onSubmit={handleUpdateSubmit}
          onClose={() => {
            setIsEditOpen(false);
            setImagesRefreshKey((k) => k + 1);
          }}
          isSaving={isSaving}
        />
        <DeleteConfirmationDialog
          open={isDeleteOpen}
          status={detail.recipe.status}
          onConfirm={handleDeleteConfirmedWithClose}
          onClose={() => setIsDeleteOpen(false)}
          isDeleting={isDeleting}
        />
      </div>
    </TooltipProvider>
  );
};

export default RecipeDetailView;
