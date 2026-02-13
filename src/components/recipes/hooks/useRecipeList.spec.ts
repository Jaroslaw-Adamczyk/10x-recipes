import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRecipeList } from "./useRecipeList";
import type { RecipeListDto, RecipeListItemDto } from "@/types";

// --- Mocks ---
const mockInitialList: RecipeListDto = {
  data: [
    {
      id: "1",
      title: "Pasta",
      status: "succeeded",
      ingredients_preview: ["flour"],
      error_message: null,
      created_at: "",
      updated_at: "",
    },
  ],
  next_cursor: null,
};

// Mock global fetch
global.fetch = vi.fn();

describe("useRecipeList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], next_cursor: null }),
    } as Response);
  });

  describe("Initial State & Hydration", () => {
    it("should initialize with provided initialList data", () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));
      expect(result.current.items).toEqual(mockInitialList.data);
      expect(result.current.listTitle).toBe("All recipes");
    });

    it("should sync query params from URL on mount", async () => {
      // Mock URL search params
      const searchSpy = vi.spyOn(URLSearchParams.prototype, "get");
      searchSpy.mockImplementation((key) => (key === "q" ? "chicken" : null));

      renderHook(() => useRecipeList({ initialList: mockInitialList }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("q=chicken"));
      });

      searchSpy.mockRestore();
    });
  });

  describe("Search Logic", () => {
    it("should update searchInput state when typing", () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));
      act(() => {
        result.current.search.onChange("pizza");
      });
      expect(result.current.search.input).toBe("pizza");
    });

    it("should trigger fetch with normalized query on submit", async () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      await act(async () => {
        result.current.search.onSubmit("Pizza");
      });

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("q=Pizza"));
    });

    it("should handle search validation errors (400)", async () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 400 } as Response);

      await act(async () => {
        result.current.search.onSubmit("invalid");
      });

      expect(result.current.search.error).toBe("Search query is not valid.");
    });
  });

  describe("Deletion Flow", () => {
    const failedRecipe: RecipeListItemDto = {
      id: "2",
      title: "Failed",
      status: "failed",
      ingredients_preview: [],
      error_message: "Import failed",
      created_at: "",
      updated_at: "",
    };

    it("should delete failed recipes immediately without confirmation", async () => {
      const { result } = renderHook(() => useRecipeList({ initialList: { data: [failedRecipe], next_cursor: null } }));

      await act(async () => {
        result.current.delete.handleDelete(failedRecipe);
      });

      expect(fetch).toHaveBeenCalledWith("/api/recipes/2", { method: "DELETE" });
      expect(result.current.items).toHaveLength(0);
    });

    it("should set deleteTarget for successful recipes (requires confirmation)", async () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      act(() => {
        result.current.delete.handleDelete(mockInitialList.data[0]);
      });
      expect(result.current.delete.isDeleteDialogOpen).toBe(true);
      expect(result.current.delete.deleteTargetStatus).toBe("succeeded");
    });

    it("should handle 404 (already deleted) gracefully", async () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);

      act(() => {
        result.current.delete.handleDelete(mockInitialList.data[0]);
      });
      await act(async () => {
        await result.current.delete.handleDeleteConfirmed();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.error?.message).toBe("Recipe already removed.");
    });
  });

  describe("Empty States", () => {
    it("should return 'no-recipes' variant when list is empty and no search", async () => {
      // Clear URL search params for this test
      const searchSpy = vi.spyOn(URLSearchParams.prototype, "get");
      searchSpy.mockReturnValue(null);

      const { result } = renderHook(() => useRecipeList({ initialList: { data: [], next_cursor: null } }));

      expect(result.current.emptyState).toBe("no-recipes");
      searchSpy.mockRestore();
    });

    it("should return 'no-matches' variant when list is empty during search", async () => {
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      // Mock empty search result
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], next_cursor: null }),
      } as Response);

      await act(async () => {
        result.current.search.onSubmit("nonexistent");
      });

      expect(result.current.emptyState).toBe("no-matches");
    });
  });

  describe("Error Handling & Resilience", () => {
    it("should handle network failures during refresh", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network fail"));
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      await act(async () => {
        result.current.handleRefresh();
      });

      expect(result.current.error?.message).toBe("Network error while loading recipes.");
      expect(result.current.isBusy).toBe(false);
    });

    it("should handle 401 Unauthorized by asking user to sign in", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);
      const { result } = renderHook(() => useRecipeList({ initialList: mockInitialList }));

      await act(async () => {
        result.current.handleRefresh();
      });

      expect(result.current.error?.statusCode).toBe(401);
      expect(result.current.error?.message).toContain("sign in");
    });
  });
});
