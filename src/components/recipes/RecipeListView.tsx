import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/recipes/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import type {
  RecipeCreateCommand,
  RecipeCreateResultDto,
  RecipeImportCreateCommand,
  RecipeListDto,
  RecipeListItemDto,
  RecipeListQuery,
} from "@/types";
import { AddRecipeModal } from "./AddRecipeModal";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { RecipeList } from "./RecipeList";
import { RefreshButton } from "./RefreshButton";
import { SearchBar } from "./SearchBar";
import type { RecipeListErrorViewModel } from "./types/recipeListTypes";
import { buildListUrl, normalizeSearchQuery } from "./utils/recipeListUtils";

interface RecipeListViewProps {
  initialList: RecipeListDto;
}

const RecipeListView = ({ initialList }: RecipeListViewProps) => {
  const [items, setItems] = useState<RecipeListItemDto[]>(initialList.data);
  const [query, setQuery] = useState<RecipeListQuery>({});
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecipeListItemDto | null>(null);
  const [error, setError] = useState<RecipeListErrorViewModel | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const lastQueryRef = useRef<RecipeListQuery>({});

  const listTitle = useMemo(() => {
    if (query.q) {
      return `Results for "${query.q}"`;
    }

    return "All recipes";
  }, [query.q]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (!value.trim()) {
      setQuery((current) => ({ ...current, q: undefined }));
    }
  }, []);

  const fetchRecipes = useCallback(
    async (nextQuery: RecipeListQuery, context: RecipeListErrorViewModel["context"], mode: "load" | "refresh") => {
      setError(null);
      setSearchError(null);
      if (mode === "load") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(buildListUrl(nextQuery));
        if (!response.ok) {
          if (response.status === 400 && context === "search") {
            setSearchError("Search query is not valid.");
            return;
          }
          if (response.status === 401) {
            setError({ message: "Please sign in to view recipes.", statusCode: 401, context });
            return;
          }
          setError({ message: "Unable to load recipes right now.", statusCode: response.status, context });
          return;
        }

        const data = (await response.json()) as RecipeListDto;
        setItems(data.data);
        setQuery(nextQuery);
        lastQueryRef.current = nextQuery;
      } catch {
        setError({ message: "Network error while loading recipes.", context });
      } finally {
        if (mode === "load") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  const handleSearchSubmit = useCallback(
    (normalized: string) => {
      if (!normalized) {
        return;
      }

      void fetchRecipes({ ...query, q: normalized }, "search", "load");
    },
    [fetchRecipes, query]
  );

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
    void fetchRecipes({ ...query, q: undefined }, "search", "load");
  }, [fetchRecipes, query]);

  const handleRefresh = useCallback(() => {
    void fetchRecipes(lastQueryRef.current, "refresh", "refresh");
  }, [fetchRecipes]);

  // Initialize and fetch recipes on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    const initialStatus = params.get("status");
    const normalizedQuery = initialQuery ? normalizeSearchQuery(initialQuery) : "";

    const nextQuery: RecipeListQuery = {
      q: normalizedQuery || undefined,
      status:
        initialStatus === "processing" || initialStatus === "succeeded" || initialStatus === "failed"
          ? initialStatus
          : undefined,
    };

    setQuery(nextQuery);
    lastQueryRef.current = nextQuery;

    if (normalizedQuery) {
      setSearchInput(normalizedQuery);
    }

    // Fetch recipes on mount
    void fetchRecipes(nextQuery, "load", "load");
  }, [fetchRecipes]);

  const handleOpenAdd = useCallback(() => {
    setIsAddOpen(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setIsAddOpen(false);
    setImportError(null);
    setCreateError(null);
  }, []);

  const handleSelect = useCallback((id: string) => {
    window.location.assign(`/recipes/${id}`);
  }, []);

  const deleteRecipeById = useCallback(async (target: RecipeListItemDto) => {
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
  }, []);

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

        await fetchRecipes(lastQueryRef.current, "refresh", "refresh");
        setIsAddOpen(false);
      } catch {
        setError({ message: "Network error while importing.", context: "import" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchRecipes]
  );

  const handleCreate = useCallback(async (command: RecipeCreateCommand) => {
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
  }, []);

  const emptyState = useMemo(() => {
    if (items.length > 0) {
      return null;
    }
    return query.q ? "no-matches" : "no-recipes";
  }, [items.length, query.q]);

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
