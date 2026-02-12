import * as React from "react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  isLoading: boolean;
  disabled?: boolean;
}

export function SubmitButton({ label, loadingLabel = "Loading...", isLoading, disabled = false }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isLoading} className="w-full" data-testid="submit-button">
      {isLoading ? loadingLabel : label}
    </Button>
  );
}
