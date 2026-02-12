import type { RecipeDto, RecipeImportDto, RecipeStatus } from "@/types";
import { formatTimestamp, isValidUrl } from "@/components/recipes/utils/formatters";

const statusLabels: Record<RecipeStatus, string> = {
  processing: "Processing",
  succeeded: "Succeeded",
  failed: "Failed",
};

const getSourceUrl = (recipe: RecipeDto, importMeta: RecipeImportDto | null): string | null =>
  recipe.source_url ?? importMeta?.source_url ?? null;

interface RecipeMetaPanelProps {
  recipe: RecipeDto;
  importMeta: RecipeImportDto | null;
}

export const RecipeMetaPanel = ({ recipe, importMeta }: RecipeMetaPanelProps) => {
  const sourceUrl = getSourceUrl(recipe, importMeta);
  const sourceLabel = isValidUrl(sourceUrl) ? sourceUrl : "Unavailable";

  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metadata</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Source URL</dt>
          <dd className="mt-1">
            {isValidUrl(sourceUrl) ? (
              <a className="text-primary hover:underline" href={sourceUrl} rel="noreferrer" target="_blank">
                {sourceLabel}
              </a>
            ) : (
              <span className="text-muted-foreground">{sourceLabel}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1 text-foreground">{statusLabels[recipe.status]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Created</dt>
          <dd className="mt-1 text-foreground">{formatTimestamp(recipe.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Updated</dt>
          <dd className="mt-1 text-foreground">{formatTimestamp(recipe.updated_at)}</dd>
        </div>
      </dl>
      {recipe.error_message ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {recipe.error_message}
        </p>
      ) : null}
    </section>
  );
};
