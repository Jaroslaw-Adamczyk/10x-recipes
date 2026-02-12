import { useCallback, useState } from "react";
import type { RecipeListQuery } from "@/types";

interface UseRecipeSearchProps {
  onSearch: (nextQuery: RecipeListQuery) => void;
  query: RecipeListQuery;
}

export const useRecipeSearch = ({ onSearch, query }: UseRecipeSearchProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (!value.trim()) {
        onSearch({ ...query, q: undefined });
      }
    },
    [onSearch, query]
  );

  const handleSearchSubmit = useCallback(
    (normalized: string) => {
      if (!normalized) {
        return;
      }
      onSearch({ ...query, q: normalized });
    },
    [onSearch, query]
  );

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
    onSearch({ ...query, q: undefined });
  }, [onSearch, query]);

  return {
    searchInput,
    setSearchInput,
    searchError,
    setSearchError,
    handleSearchChange,
    handleSearchSubmit,
    handleSearchClear,
  };
};
