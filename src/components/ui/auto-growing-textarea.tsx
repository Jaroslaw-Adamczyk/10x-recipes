import { useEffect, useRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const AutoGrowingTextarea = ({
  className,
  value,
  onChange,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = `${textarea.scrollHeight + 1}px`;

    const isOverflowing = textarea.scrollHeight > textarea.clientHeight;
    textarea.style.overflowY = isOverflowing ? "auto" : "hidden";
  }, [value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cn(
        "min-h-28 w-full rounded-md border border-border bg-background p-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary  resize-none",
        className
      )}
    />
  );
};
