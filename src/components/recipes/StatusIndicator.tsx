import type { RecipeStatus } from "@/types";

const statusStyles: Record<RecipeStatus, string> = {
  processing: "bg-secondary text-secondary-foreground",
  succeeded: "bg-emerald-100 text-emerald-900",
  failed: "bg-destructive text-white",
};

export const StatusIndicator = ({ status }: { status: RecipeStatus }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
  >
    {status === "processing" ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
    {status === "processing" ? "Processing" : status === "succeeded" ? "Succeeded" : "Failed"}
  </span>
);
