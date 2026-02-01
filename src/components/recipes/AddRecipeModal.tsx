import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RecipeCreateCommand, RecipeImportCreateCommand } from "@/types";
import { ImportRecipeForm } from "./ImportRecipeForm";
import { ManualRecipeForm } from "./ManualRecipeForm";

interface AddRecipeModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onImport: (command: RecipeImportCreateCommand) => Promise<void>;
  onCreate: (command: RecipeCreateCommand) => Promise<void>;
  importError?: string | null;
  createError?: string | null;
}

export const AddRecipeModal = ({
  open,
  onClose,
  isSubmitting,
  onImport,
  onCreate,
  importError,
  createError,
}: AddRecipeModalProps) => {
  const [tab, setTab] = useState<"import" | "manual">("import");
  const [importDirty, setImportDirty] = useState(false);
  const [manualDirty, setManualDirty] = useState(false);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    const isDirty = tab === "import" ? importDirty : manualDirty;
    if (isDirty && !isSubmitting) {
      const shouldClose = window.confirm("Discard your changes?");
      if (!shouldClose) {
        return;
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-recipe-title"
      aria-describedby="add-recipe-description"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 text-foreground shadow-lg">
        <h2 className="text-lg font-semibold" id="add-recipe-title">
          Add a recipe
        </h2>
        <p className="mt-2 text-sm text-muted-foreground" id="add-recipe-description">
          Import a recipe URL or enter the recipe manually.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={tab === "import" ? "default" : "outline"} onClick={() => setTab("import")}>
            Import URL
          </Button>
          <Button variant={tab === "manual" ? "default" : "outline"} onClick={() => setTab("manual")}>
            Manual entry
          </Button>
        </div>
        <div className="mt-6">
          {tab === "import" ? (
            <ImportRecipeForm
              onSubmit={(command) => onImport(command)}
              onCancel={handleClose}
              isSubmitting={isSubmitting}
              error={importError}
              onDirtyChange={setImportDirty}
            />
          ) : (
            <ManualRecipeForm
              onSubmit={(command) => onCreate(command)}
              onCancel={handleClose}
              isSubmitting={isSubmitting}
              error={createError}
              onDirtyChange={setManualDirty}
            />
          )}
        </div>
      </div>
    </div>
  );
};
