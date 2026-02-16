import type { RecipeStatus } from "@/types";
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/16/solid";

const iconMap: Record<RecipeStatus, React.ReactNode> = {
  processing: <ArrowPathIcon className="h-4 w-4 animate-spin text-muted-foreground" />,
  succeeded: <CheckCircleIcon className="h-4 w-4 text-emerald-600" />,
  failed: <ExclamationCircleIcon className="h-4 w-4 text-destructive" />,
};

const tooltipMap: Partial<Record<RecipeStatus, string>> = {
  processing: "Recipe is being processed…",
  failed: "Recipe import failed",
};

export const StatusIndicator = ({ status }: { status: RecipeStatus }) => {
  const tooltip = tooltipMap[status];

  return (
    <span className="relative inline-flex items-center group/status" aria-label={tooltip ?? status}>
      {iconMap[status]}
      {tooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md border border-border opacity-0 transition-opacity group-hover/status:opacity-100"
        >
          {tooltip}
        </span>
      ) : null}
    </span>
  );
};
