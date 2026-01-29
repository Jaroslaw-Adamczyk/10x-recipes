import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { RecipeStatus } from "@/types";

export interface DeleteConfirmationDialogProps {
  open: boolean;
  status: RecipeStatus;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmationDialog = ({
  open,
  status,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteConfirmationDialogProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || status === "failed") {
      return undefined;
    }

    requestAnimationFrame(() => confirmButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, status]);

  useEffect(() => {
    if (!open || status === "failed") {
      return undefined;
    }

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleFocusTrap);

    return () => {
      window.removeEventListener("keydown", handleFocusTrap);
    };
  }, [open, status]);

  if (!open || status === "failed") {
    return null;
  }

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-recipe-title"
      aria-describedby="delete-recipe-description"
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 text-foreground shadow-lg"
        ref={modalRef}
      >
        <h2 className="text-lg font-semibold" id="delete-recipe-title">
          Delete recipe?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground" id="delete-recipe-description">
          This action cannot be undone. The recipe and all its details will be permanently removed.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting} ref={confirmButtonRef}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};
