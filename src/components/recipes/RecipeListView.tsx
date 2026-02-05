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
    searchInput,
    isLoading,
    isRefreshing,
    isSubmitting,
    isDeleting,
    isAddOpen,
    deleteTarget,
    error,
    searchError,
    importError,
    createError,
    emptyState,
    handleSearchChange,
    handleSearchSubmit,
    handleSearchClear,
    handleRefresh,
    handleOpenAdd,
    handleCloseAdd,
    handleSelect,
    handleDelete,
    handleDeleteConfirmed,
    handleImport,
    handleCreate,
    setError,
    setDeleteTarget,
  } = useRecipeList({ initialList });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recipes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{listTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleOpenAdd}>Add recipe</Button>
          <RefreshButton onClick={handleRefresh} loading={isLoading || isRefreshing} />
        </div>
      </div>
      <SearchBar
        value={searchInput}
        onChange={handleSearchChange}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
        error={searchError}
        disabled={isLoading || isRefreshing}
      />
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      {emptyState ? (
        <EmptyState variant={emptyState} onAdd={handleOpenAdd} />
      ) : (
        <RecipeList items={items} onSelect={handleSelect} onDelete={handleDelete} />
      )}
      <AddRecipeModal
        open={isAddOpen}
        onClose={handleCloseAdd}
        isSubmitting={isSubmitting}
        onImport={handleImport}
        onCreate={handleCreate}
        importError={importError}
        createError={createError}
      />
      <DeleteConfirmationDialog
        open={Boolean(deleteTarget) && deleteTarget?.status !== "failed"}
        status={deleteTarget?.status ?? "succeeded"}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </section>
  );
};

export default RecipeListView;
