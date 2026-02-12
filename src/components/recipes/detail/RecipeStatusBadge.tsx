import type { RecipeImportDto, RecipeStatus } from "@/types";

const statusLabels: Record<RecipeStatus, string> = {
  processing: "Processing",
  succeeded: "Succeeded",
  failed: "Failed",
};

const statusBadgeStyles: Record<RecipeStatus, string> = {
  processing: "bg-secondary text-secondary-foreground",
  succeeded: "bg-emerald-100 text-emerald-900",
  failed: "bg-destructive text-white",
};

interface RecipeStatusBadgeProps {
  status: RecipeStatus;
  importMeta: RecipeImportDto | null;
}

export const RecipeStatusBadge = ({ status, importMeta }: RecipeStatusBadgeProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
    {importMeta?.error_message ? (
      <p className="text-xs text-destructive">Import error: {importMeta.error_message}</p>
    ) : null}
  </div>
);
