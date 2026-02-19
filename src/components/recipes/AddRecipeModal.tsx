import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

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
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        data-testid="add-recipe-modal"
      >
        <div className="p-6 overflow-auto">
          <DialogHeader>
            <DialogTitle id="add-recipe-title">Add a recipe</DialogTitle>
            <DialogDescription id="add-recipe-description">
              Import a recipe URL or enter the recipe manually.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={tab === "import" ? "default" : "outline"}
              onClick={() => setTab("import")}
              data-testid="tab-import"
            >
              Import URL
            </Button>
            <Button
              variant={tab === "manual" ? "default" : "outline"}
              onClick={() => setTab("manual")}
              data-testid="tab-manual"
            >
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
      </DialogContent>
    </Dialog>
  );
};
