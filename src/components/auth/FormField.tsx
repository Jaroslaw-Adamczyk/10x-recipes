import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({
  label,
  name,
  type,
  error,
  required = false,
  autoComplete,
  placeholder,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-on-surface-variant font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cn(error && "border-destructive", className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        data-testid={`input-${name}`}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="px-1 text-xs text-destructive flex items-baseline gap-1.5" role="alert">
          <ExclamationTriangleIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
