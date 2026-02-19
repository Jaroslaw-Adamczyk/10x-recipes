import { LinkIcon } from "@heroicons/react/16/solid";
import { Tooltip } from "../ui/tooltip";
import { cn } from "@/lib/utils";

interface SourceLinkProps {
  url: string;
  size?: "sm" | "md" | "lg";
}

export const SourceLink = ({ url, size = "md" }: SourceLinkProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Tooltip content={url}>
      <LinkIcon className={cn("text-muted-foreground", iconSize)} aria-hidden="true" />
    </Tooltip>
  );
};
