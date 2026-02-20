import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-t-xs border-b bg-surface-variant px-4 py-2 text-base ring-offset-background transition-all focus:bg-surface-variant/80 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "border-on-surface-variant/20 hover:border-on-surface-variant/40 focus:border-primary",
        "aria-invalid:border-destructive focus:border-primary focus:ring-0",
        "placeholder:text-on-surface-variant",
        className
      )}
      {...props}
    />
  );
}

export { Input };
