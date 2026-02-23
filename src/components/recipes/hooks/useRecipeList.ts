import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecipeListDto, RecipeListItemDto, RecipeListQuery } from "@/types";
import type { RecipeListErrorViewModel } from "../types/recipeListTypes";
import { buildListUrl, normalizeSearchQuery } from "../utils/recipeListUtils";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useRecipeCreate } from "./useRecipeCreate";
import { useRecipeDelete } from "./useRecipeDelete";
import { useRecipeSearch } from "./useRecipeSearch";

interface UseRecipeListProps {
  initialList: RecipeListDto;
}

export type EmptyStateVariant = "no-matches" | "no-recipes";

export const useRecipeList = ({ initialList }: UseRecipeListProps) => {
  const [items, setItems] = useState<RecipeListItemDto[]>(initialList.data);
  const [query, setQuery] = useState<RecipeListQuery>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<RecipeListErrorViewModel | null>(null);
  const lastQueryRef = useRef<RecipeListQuery>({});

  const listTitle = useMemo(() => {
    if (query.q) {
      return `Results for "${query.q}"`;
    }
    return "All recipes";
  }, [query.q]);

  // -- Search --

  const {
    searchInput,
    setSearchInput,
    searchError,
    setSearchError,
    handleSearchChange,
    handleSearchSubmit,
    handleSearchClear,
  } = useRecipeSearch({
    query,
    onSearch: (nextQuery) => fetchRecipes(nextQuery, "search", "load"),
  });

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
        const data = await apiClient.get<RecipeListDto>(buildListUrl(nextQuery));
        setItems(data.data);
        setQuery(nextQuery);
        lastQueryRef.current = nextQuery;
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 400 && context === "search") {
            setSearchError("Search query is not valid.");
            return;
          }
          if (err.statusCode === 401) {
            setError({ message: "Please sign in to view recipes.", statusCode: 401, context });
            return;
          }
          setError({ message: "Unable to load recipes right now.", statusCode: err.statusCode, context });
        } else {
          setError({ message: "Network error while loading recipes.", context });
        }
      } finally {
        if (mode === "load") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [setSearchError]
  );

  // -- Refresh & navigation --

  const handleRefresh = useCallback(() => {
    void fetchRecipes(lastQueryRef.current, "refresh", "refresh");
  }, [fetchRecipes]);

  const handleSelect = useCallback((id: string) => {
    window.location.assign(`/recipes/${id}`);
  }, []);

  // -- URL init --

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
          ? (initialStatus as RecipeListQuery["status"])
          : undefined,
    };

    setQuery(nextQuery);
    lastQueryRef.current = nextQuery;

    if (normalizedQuery) {
      setSearchInput(normalizedQuery);
    }

    // Skip fetch on first load if no URL params - we already have initialList data
    const hasUrlParams = normalizedQuery || nextQuery.status;
    if (hasUrlParams) {
      void fetchRecipes(nextQuery, "load", "load");
    }
  }, [fetchRecipes, setSearchInput]);

  // -- Composed hooks --

  const {
    isDeleting,
    isDeleteDialogOpen,
    deleteTargetStatus,
    handleDelete,
    handleDeleteConfirmed,
    handleDeleteCancel,
  } = useRecipeDelete({
    setItems,
    setError,
  });

  const {
    isSubmitting,
    isAddOpen,
    importError,
    createError,
    handleOpenAdd,
    handleCloseAdd,
    handleImport,
    handleCreate,
  } = useRecipeCreate({
    setItems,
    setError,
    onRefresh: handleRefresh,
  });

  // -- Derived state --

  const isBusy = isLoading || isRefreshing;

  const emptyState = useMemo<EmptyStateVariant | null>(() => {
    if (items.length > 0) {
      return null;
    }
    return query.q ? "no-matches" : "no-recipes";
  }, [items.length, query.q]);

  return {
    items,
    listTitle,
    isBusy,
    isSubmitting,
    isDeleting,
    isAddOpen,
    error,
    emptyState,
    handleRefresh,
    handleOpenAdd,
    handleCloseAdd,
    handleSelect,
    handleDelete,
    handleImport,
    handleCreate,
    setError,
    search: {
      input: searchInput,
      error: searchError,
      onChange: handleSearchChange,
      onSubmit: handleSearchSubmit,
      onClear: handleSearchClear,
    },
    delete: {
      isDeleting,
      isDeleteDialogOpen,
      deleteTargetStatus,
      handleDelete,
      handleDeleteConfirmed,
      handleDeleteCancel,
    },
    create: {
      isSubmitting,
      isAddOpen,
      importError,
      createError,
      handleOpenAdd,
      handleCloseAdd,
      handleImport,
      handleCreate,
    },
  };
};
