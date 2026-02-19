import type { RecipeStatus } from "@/types";
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/16/solid";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const iconMap: Record<RecipeStatus, React.ElementType> = {
  processing: ArrowPathIcon,
  succeeded: CheckCircleIcon,
  failed: ExclamationCircleIcon,
};

const colorMap: Record<RecipeStatus, string> = {
  processing: "text-muted-foreground animate-spin",
  succeeded: "text-emerald-600",
  failed: "text-destructive",
};

const tooltipMap: Partial<Record<RecipeStatus, string>> = {
  processing: "Recipe is being processed…",
  failed: "Recipe import failed",
};

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

interface StatusIndicatorProps {
  status: RecipeStatus;
  size?: keyof typeof sizeMap;
}

export const StatusIndicator = ({ status, size = "md" }: StatusIndicatorProps) => {
  const tooltip = tooltipMap[status];
  const Icon = iconMap[status];

  const content = (
    <span className="relative inline-flex items-center" aria-label={tooltip ?? status}>
      <Icon className={cn(sizeMap[size], colorMap[status])} />
    </span>
  );

  if (!tooltip) return content;

  return <Tooltip content={tooltip}>{content}</Tooltip>;
};
