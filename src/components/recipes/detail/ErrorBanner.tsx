import { Button } from "@/components/ui/button";
import type { RecipeDetailErrorViewModel } from "../hooks/useRecipeDetail";

interface ErrorBannerProps {
  error: RecipeDetailErrorViewModel | null;
  onDismiss: () => void;
  onRetryLoad?: () => void;
  onRetryUpdate?: () => void;
  onRetryDelete?: () => void;
}

export const ErrorBanner = ({ error, onDismiss, onRetryLoad, onRetryUpdate, onRetryDelete }: ErrorBannerProps) => {
  if (!error) {
    return null;
  }

  const title =
    error.context === "load"
      ? "Unable to load recipe"
      : error.context === "update"
        ? "Update failed"
        : error.context === "delete"
          ? "Delete failed"
          : "Something went wrong";

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-destructive/80">{error.message}</p>
        </div>
        <div className="flex gap-2">
          {error.context === "load" && onRetryLoad ? (
            <Button size="sm" variant="outline" onClick={onRetryLoad}>
              Retry
            </Button>
          ) : null}
          {error.context === "update" && onRetryUpdate ? (
            <Button size="sm" variant="outline" onClick={onRetryUpdate}>
              Retry update
            </Button>
          ) : null}
          {error.context === "delete" && onRetryDelete ? (
            <Button size="sm" variant="outline" onClick={onRetryDelete}>
              Retry delete
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
