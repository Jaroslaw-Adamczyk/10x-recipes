import { Button } from "@/components/ui/button";
import type { RecipeListDto } from "@/types";
import { AddRecipeModal } from "./AddRecipeModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { RecipeList } from "./RecipeList";
import { RefreshButton } from "./RefreshButton";
import { SearchBar } from "./SearchBar";
import { useRecipeList } from "./hooks/useRecipeList";

interface RecipeListViewProps {
  initialList: RecipeListDto;
}

const RecipeListView = ({ initialList }: RecipeListViewProps) => {
  const {
    items,
    listTitle,
    isBusy,
    error,
    setError,
    emptyState,
    handleRefresh,
    handleSelect,
    search,
    create,
    delete: del,
  } = useRecipeList({ initialList });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recipes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{listTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={create.handleOpenAdd} data-testid="add-recipe-button">
            Add recipe
          </Button>
          <RefreshButton onClick={handleRefresh} loading={isBusy} />
        </div>
      </div>
      <SearchBar
        value={search.input}
        onChange={search.onChange}
        onSubmit={search.onSubmit}
        onClear={search.onClear}
        error={search.error}
        disabled={isBusy}
      />
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      {emptyState ? (
        <EmptyState variant={emptyState} onAdd={create.handleOpenAdd} />
      ) : (
        <RecipeList items={items} onSelect={handleSelect} onDelete={del.handleDelete} data-testid="recipe-list" />
      )}
      <AddRecipeModal
        open={create.isAddOpen}
        onClose={create.handleCloseAdd}
        isSubmitting={create.isSubmitting}
        onImport={create.handleImport}
        onCreate={create.handleCreate}
        importError={create.importError}
        createError={create.createError}
      />
      <DeleteConfirmationDialog
        open={del.isDeleteDialogOpen}
        status={del.deleteTargetStatus}
        onConfirm={del.handleDeleteConfirmed}
        onClose={del.handleDeleteCancel}
        isDeleting={del.isDeleting}
      />
    </section>
  );
};

export default RecipeListView;
