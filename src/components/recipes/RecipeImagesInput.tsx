import { useEffect, useState, type ChangeEvent, type RefObject, type DragEvent as ReactDragEvent } from "react";
import { CloudArrowDownIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT, RECIPE_IMAGE_THUMBNAIL_SIZE } from "./constants/recipeImage";
import { cn } from "@/lib/utils";

const ImageWrapper = ({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLLIElement>) => {
  return (
    <li
      className={cn("relative shrink-0 overflow-hidden rounded-md border border-border bg-muted", className)}
      style={{ width: RECIPE_IMAGE_THUMBNAIL_SIZE, height: RECIPE_IMAGE_THUMBNAIL_SIZE }}
      {...props}
    >
      {children}
    </li>
  );
};

const DeleteImageButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => {
  return (
    <Button
      type="button"
      variant="destructive"
      size="icon"
      className="absolute right-1 top-1 size-7 opacity-90"
      aria-label="Remove photo"
      onClick={onClick}
      disabled={disabled}
    >
      <TrashIcon className="size-4" />
    </Button>
  );
};

interface RecipeImagesInputProps {
  imageFiles: File[];
  imageError: string | null;
  previewUrls: string[];
  fileInputRef: RefObject<HTMLInputElement>;
  isSubmitting: boolean;
  handleImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleImageDrop: (files: FileList | File[]) => void;
  removeImageFile: (index: number) => void;
  inputId?: string;
  label?: string;
  existingImages?: { id: string; url: string }[];
  onRemoveExistingImage?: (id: string) => void;
}

export const RecipeImagesInput = ({
  imageFiles,
  imageError,
  previewUrls,
  fileInputRef,
  isSubmitting,
  handleImageFileChange,
  handleImageDrop,
  removeImageFile,
  inputId = "manual-recipe-photos",
  label,
  existingImages,
  onRemoveExistingImage,
}: RecipeImagesInputProps) => {
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDropZoneDragEnter = (event: ReactDragEvent<HTMLLIElement>) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes("Files")) {
      setIsDraggingImage(true);
    }
  };

  const handleDropZoneDragOver = (event: ReactDragEvent<HTMLLIElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (event.dataTransfer.types.includes("Files") && !isDraggingImage) {
      setIsDraggingImage(true);
    }
  };

  const handleDropZoneDragLeave = (event: ReactDragEvent<HTMLLIElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);
  };

  const handleDropZoneDrop = (event: ReactDragEvent<HTMLLIElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);
    if (isSubmitting) return;
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    handleImageDrop(files);
  };

  useEffect(() => {
    setIsDraggingImage(dragCounter > 0);
  }, [dragCounter]);

  useEffect(() => {
    const handleWindowDragEnter = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setDragCounter((count) => count + 1);
    };

    const handleWindowDragLeave = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setDragCounter((count) => count - 1);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only h-0 w-0"
        multiple
        onChange={handleImageFileChange}
      />
      {imageError && (
        <p className="text-xs text-destructive" data-testid="validation-error-images">
          {imageError}
        </p>
      )}

      <ul className="flex flex-wrap gap-3">
        {existingImages && existingImages.length > 0 && (
          <>
            {existingImages.map((image) => (
              <ImageWrapper key={image.id}>
                <img src={image.url} alt="" className="size-full object-cover" />

                {onRemoveExistingImage && (
                  <DeleteImageButton disabled={isSubmitting} onClick={() => onRemoveExistingImage(image.id)} />
                )}
              </ImageWrapper>
            ))}
          </>
        )}

        {imageFiles.map((file, index) => (
          <ImageWrapper key={`${file.name}-${index}`}>
            {previewUrls[index] && <img src={previewUrls[index]} alt="" className="size-full object-cover" />}
            <DeleteImageButton disabled={isSubmitting} onClick={() => removeImageFile(index)} />
          </ImageWrapper>
        ))}

        <ImageWrapper
          className={cn(
            "flex cursor-pointer items-center justify-center text-center text-xs text-muted-foreground hover:border-primary/60 hover:bg-muted/70",
            isDraggingImage ? "border-dashed border-primary/60 border-4" : ""
          )}
          onDragEnter={handleDropZoneDragEnter}
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
        >
          <Button
            asChild
            type="button"
            variant="pure"
            className="w-full h-full"
            disabled={isSubmitting}
            aria-label="Add photo"
          >
            <label htmlFor={inputId} className="flex w-full h-full cursor-pointer items-center justify-center gap-2">
              {isDraggingImage ? <CloudArrowDownIcon className="size-4" /> : <PlusIcon className="size-4" />}
              {isDraggingImage ? "Drop photos here" : "Add photo"}
            </label>
          </Button>
        </ImageWrapper>
      </ul>
    </div>
  );
};
