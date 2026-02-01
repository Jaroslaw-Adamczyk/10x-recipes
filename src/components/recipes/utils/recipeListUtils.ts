import type { RecipeListQuery } from "@/types";

export const normalizeText = (value: string): string => value.trim().replace(/\s+/g, " ");

export const normalizeIngredientName = (value: string): string => normalizeText(value).toLowerCase();

export const normalizeSearchQuery = (value: string): string => value.trim().toLowerCase();

export const isValidUrl = (value: string): boolean => {
  if (!value.trim()) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const buildListUrl = (query: RecipeListQuery): string => {
  const url = new URL("/api/recipes", window.location.origin);
  if (query.q) {
    url.searchParams.set("q", query.q);
  }
  if (query.status) {
    url.searchParams.set("status", query.status);
  }
  if (query.limit) {
    url.searchParams.set("limit", String(query.limit));
  }
  if (query.cursor) {
    url.searchParams.set("cursor", query.cursor);
  }
  if (query.sort) {
    url.searchParams.set("sort", query.sort);
  }
  return url.toString();
};
