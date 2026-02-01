import { Button } from "@/components/ui/button";
import type { RecipeListErrorViewModel } from "./types/recipeListTypes";

interface ErrorBannerProps {
  error: RecipeListErrorViewModel | null;
  onDismiss: () => void;
}

export const ErrorBanner = ({ error, onDismiss }: ErrorBannerProps) => {
  if (!error) {
    return null;
  }

  const title =
    error.context === "search"
      ? "Search failed"
      : error.context === "import"
        ? "Import failed"
        : error.context === "create"
          ? "Create failed"
          : error.context === "delete"
            ? "Delete failed"
            : error.context === "refresh"
              ? "Refresh failed"
              : "Something went wrong";

  return (
    <div
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-destructive/80">{error.message}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
};
