import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecipeListDto, RecipeListItemDto, RecipeListQuery } from "@/types";
import type { RecipeListErrorViewModel } from "../types/recipeListTypes";
import { buildListUrl, normalizeSearchQuery } from "../utils/recipeListUtils";
import { useRecipeCreate } from "./useRecipeCreate";
import { useRecipeDelete } from "./useRecipeDelete";

interface UseRecipeListProps {
  initialList: RecipeListDto;
}

export type EmptyStateVariant = "no-matches" | "no-recipes";

export const useRecipeList = ({ initialList }: UseRecipeListProps) => {
  const [items, setItems] = useState<RecipeListItemDto[]>(initialList.data);
  const [query, setQuery] = useState<RecipeListQuery>({});
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<RecipeListErrorViewModel | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const lastQueryRef = useRef<RecipeListQuery>({});

  const listTitle = useMemo(() => {
    if (query.q) {
      return `Results for "${query.q}"`;
    }
    return "All recipes";
  }, [query.q]);

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

  // -- Search --

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (!value.trim()) {
      setQuery((current) => ({ ...current, q: undefined }));
    }
  }, []);

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

    void fetchRecipes(nextQuery, "load", "load");
  }, [fetchRecipes]);

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
