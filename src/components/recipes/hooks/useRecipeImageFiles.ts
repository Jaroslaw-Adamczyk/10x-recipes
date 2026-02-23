import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_IMAGE_SIZE_BYTES } from "../constants/recipeImage";

const IMAGE_SIZE_ERROR = "File too large. Maximum size is 5MB.";

export function useRecipeImageFiles() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImageClick = useCallback(() => {
    setImageError(null);
    fileInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError(IMAGE_SIZE_ERROR);
      return;
    }
    setImageError(null);
    setImageFiles((prev) => [...prev, file]);
  }, []);

  const removeImageFile = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  }, []);

  const reset = useCallback(() => {
    setImageFiles([]);
    setImageError(null);
  }, []);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [imageFiles]);

  return {
    imageFiles,
    imageError,
    previewUrls,
    fileInputRef,
    handleAddImageClick,
    handleImageFileChange,
    removeImageFile,
    setImageError,
    reset,
  };
}
