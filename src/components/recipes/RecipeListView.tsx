import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { DeleteConfirmationDialog } from "@/components/recipes/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import type {
  RecipeCreateCommand,
  RecipeCreateResultDto,
  RecipeImportCreateCommand,
  RecipeListDto,
  RecipeListItemDto,
  RecipeListQuery,
  RecipeStatus,
} from "@/types";

interface RecipeListViewProps {
  initialList: RecipeListDto;
}

interface RecipeListErrorViewModel {
  message: string;
  statusCode?: number;
  context?: "load" | "search" | "import" | "create" | "delete" | "refresh";
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear: () => void;
  error?: string | null;
  disabled?: boolean;
}

const SearchBar = ({ value, onChange, onSubmit, onClear, error, disabled }: SearchBarProps) => {
  const inputId = useId();
  const [showHelper, setShowHelper] = useState(false);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        setShowHelper(true);
        return;
      }

      setShowHelper(false);
      onChange(normalized);
      onSubmit(normalized);
    },
    [onChange, onSubmit, value]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowHelper(false);
      onChange(event.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setShowHelper(false);
    onClear();
  }, [onClear]);

  const helperText = showHelper ? "Enter at least one ingredient keyword to search." : "Search by ingredient.";
  const helperStyle = error ? "text-destructive" : "text-muted-foreground";

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
        Ingredient search
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="e.g. chicken, garlic"
          disabled={disabled}
          aria-describedby={`${inputId}-helper`}
        />
        <Button type="submit" disabled={disabled}>
          Search
        </Button>
        {value ? (
          <Button type="button" variant="outline" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        ) : null}
      </div>
      <p className={`text-xs ${helperStyle}`} id={`${inputId}-helper`}>
        {error ?? helperText}
      </p>
    </form>
  );
};

const statusStyles: Record<RecipeStatus, string> = {
  processing: "bg-secondary text-secondary-foreground",
  succeeded: "bg-emerald-100 text-emerald-900",
  failed: "bg-destructive text-white",
};

const normalizeText = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizeIngredientName = (value: string): string => normalizeText(value).toLowerCase();

const normalizeSearchQuery = (value: string): string => value.trim().toLowerCase();

const isValidUrl = (value: string): boolean => {
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

const buildListUrl = (query: RecipeListQuery): string => {
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

const StatusIndicator = ({ status }: { status: RecipeStatus }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
  >
    {status === "processing" ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
    {status === "processing" ? "Processing" : status === "succeeded" ? "Succeeded" : "Failed"}
  </span>
);

const RecipeRow = ({
  item,
  onSelect,
  onDelete,
}: {
  item: RecipeListItemDto;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-label={`Open recipe ${item.title}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">{item.title}</p>
          {item.ingredients_preview.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.ingredients_preview.slice(0, 5).join(", ")}
              {item.ingredients_preview.length > 5 ? "..." : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No ingredients preview yet.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusIndicator status={item.status} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Delete recipe ${item.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {item.error_message ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {item.error_message}
        </p>
      ) : null}
    </div>
  );
};

const RecipeList = ({
  items,
  onSelect,
  onDelete,
}: {
  items: RecipeListItemDto[];
  onSelect: (id: string) => void;
  onDelete: (item: RecipeListItemDto) => void;
}) => (
  <ul className="flex flex-col gap-3">
    {items.map((item) => (
      <li key={item.id}>
        <RecipeRow item={item} onSelect={() => onSelect(item.id)} onDelete={() => onDelete(item)} />
      </li>
    ))}
  </ul>
);

const ErrorBanner = ({ error, onDismiss }: { error: RecipeListErrorViewModel | null; onDismiss: () => void }) => {
  if (!error) {
    return null;
  }

  const title =
    error.context === "search"
      ? "Search failed"
      : error.context === "import"
        ? "Import failed"
        : error.context === "create"
          ? "Create failed"
          : error.context === "delete"
            ? "Delete failed"
            : error.context === "refresh"
              ? "Refresh failed"
              : "Something went wrong";

  return (
    <div
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-destructive/80">{error.message}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
};

const EmptyState = ({ variant, onAdd }: { variant: "no-recipes" | "no-matches"; onAdd: () => void }) => (
  <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-card-foreground">
    <h2 className="text-lg font-semibold">{variant === "no-recipes" ? "No recipes yet" : "No matching recipes"}</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      {variant === "no-recipes"
        ? "Start by importing a recipe URL or adding one manually."
        : "Try another ingredient keyword or clear your search."}
    </p>
    {variant === "no-recipes" ? (
      <Button className="mt-4" onClick={onAdd}>
        Add recipe
      </Button>
    ) : null}
  </div>
);

const RefreshButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
  <Button variant="outline" onClick={onClick} disabled={loading} aria-busy={loading}>
    {loading ? "Refreshing..." : "Refresh"}
  </Button>
);

interface ImportRecipeFormProps {
  onSubmit: (command: RecipeImportCreateCommand) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onDirtyChange: (dirty: boolean) => void;
}

const ImportRecipeForm = ({ onSubmit, onCancel, isSubmitting, error, onDirtyChange }: ImportRecipeFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [sourceUrl, setSourceUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [error]);

  useEffect(() => {
    onDirtyChange(sourceUrl.trim().length > 0);
  }, [onDirtyChange, sourceUrl]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSubmit = () => {
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
      setLocalError("Source URL is required.");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setLocalError("Enter a valid URL.");
      return;
    }

    setLocalError(null);
    onSubmit({ source_url: trimmed });
  };

  const message = error ?? localError;

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-foreground" htmlFor="import-url">
        Recipe URL
      </label>
      <input
        id="import-url"
        ref={inputRef}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        type="url"
        value={sourceUrl}
        onChange={(event) => setSourceUrl(event.target.value)}
        placeholder="https://example.com/recipe"
        disabled={isSubmitting}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? errorId : undefined}
      />
      {message ? (
        <p className="text-xs text-destructive" id={errorId}>
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Importing..." : "Import recipe"}
        </Button>
      </div>
    </div>
  );
};

interface ManualRecipeFormProps {
  onSubmit: (command: RecipeCreateCommand) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onDirtyChange: (dirty: boolean) => void;
}

const ManualRecipeForm = ({ onSubmit, onCancel, isSubmitting, error, onDirtyChange }: ManualRecipeFormProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [error]);

  useEffect(() => {
    const isDirty =
      title.trim().length > 0 || ingredients.trim().length > 0 || steps.trim().length > 0 || cookTime.trim().length > 0;
    onDirtyChange(isDirty);
  }, [cookTime, ingredients, onDirtyChange, steps, title]);

  useEffect(() => {
    requestAnimationFrame(() => titleRef.current?.focus());
  }, []);

  const buildIngredients = (value: string) =>
    value
      .split("\n")
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .map((line, index) => ({
        raw_text: line,
        normalized_name: normalizeIngredientName(line),
        position: index + 1,
      }));

  const buildSteps = (value: string) =>
    value
      .split("\n")
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .map((line, index) => ({
        step_text: line,
        position: index + 1,
      }));

  const handleSubmit = () => {
    const trimmedTitle = normalizeText(title);
    if (!trimmedTitle) {
      setLocalError("Title is required.");
      return;
    }

    const ingredientItems = buildIngredients(ingredients);
    if (ingredientItems.length === 0) {
      setLocalError("Add at least one ingredient.");
      return;
    }

    const stepItems = buildSteps(steps);
    if (stepItems.length === 0) {
      setLocalError("Add at least one step.");
      return;
    }

    const cookTimeValue = cookTime.trim() === "" ? null : Number(cookTime);
    if (cookTimeValue !== null && (Number.isNaN(cookTimeValue) || cookTimeValue < 0)) {
      setLocalError("Cook time must be a positive number.");
      return;
    }

    setLocalError(null);
    onSubmit({
      title: trimmedTitle,
      cook_time_minutes: cookTimeValue,
      source_url: null,
      ingredients: ingredientItems,
      steps: stepItems,
    });
  };

  const message = error ?? localError;

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-foreground" htmlFor="manual-title">
        Title
      </label>
      <input
        id="manual-title"
        ref={titleRef}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Recipe title"
        disabled={isSubmitting}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? errorId : undefined}
      />
      <label className="text-sm font-medium text-foreground" htmlFor="manual-ingredients">
        Ingredients (one per line)
      </label>
      <textarea
        id="manual-ingredients"
        className="min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        value={ingredients}
        onChange={(event) => setIngredients(event.target.value)}
        placeholder="1 cup flour"
        disabled={isSubmitting}
      />
      <label className="text-sm font-medium text-foreground" htmlFor="manual-steps">
        Steps (one per line)
      </label>
      <textarea
        id="manual-steps"
        className="min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        value={steps}
        onChange={(event) => setSteps(event.target.value)}
        placeholder="Mix the batter"
        disabled={isSubmitting}
      />
      <label className="text-sm font-medium text-foreground" htmlFor="manual-cooktime">
        Cook time (minutes)
      </label>
      <input
        id="manual-cooktime"
        className="h-10 w-40 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        type="number"
        min={0}
        value={cookTime}
        onChange={(event) => setCookTime(event.target.value)}
        placeholder="30"
        disabled={isSubmitting}
      />
      {message ? (
        <p className="text-xs text-destructive" id={errorId}>
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create recipe"}
        </Button>
      </div>
    </div>
  );
};

const AddRecipeModal = ({
  open,
  onClose,
  isSubmitting,
  onImport,
  onCreate,
  importError,
  createError,
}: {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onImport: (command: RecipeImportCreateCommand) => Promise<void>;
  onCreate: (command: RecipeCreateCommand) => Promise<void>;
  importError?: string | null;
  createError?: string | null;
}) => {
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

const RecipeListView = ({ initialList }: RecipeListViewProps) => {
  const [items, setItems] = useState<RecipeListItemDto[]>(initialList.data);
  const [query, setQuery] = useState<RecipeListQuery>({});
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecipeListItemDto | null>(null);
  const [error, setError] = useState<RecipeListErrorViewModel | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const lastQueryRef = useRef<RecipeListQuery>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    const initialStatus = params.get("status");
    const normalizedQuery = initialQuery ? normalizeSearchQuery(initialQuery) : "";

    setQuery((current) => {
      const nextQuery = {
        ...current,
        q: normalizedQuery || current.q,
        status:
          initialStatus === "processing" || initialStatus === "succeeded" || initialStatus === "failed"
            ? initialStatus
            : current.status,
      };

      lastQueryRef.current = nextQuery;
      return nextQuery;
    });
    if (normalizedQuery) {
      setSearchInput(normalizedQuery);
    }
  }, []);

  const listTitle = useMemo(() => {
    if (query.q) {
      return `Results for "${query.q}"`;
    }

    return "All recipes";
  }, [query.q]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (!value.trim()) {
      setQuery((current) => ({ ...current, q: undefined }));
    }
  }, []);

  const fetchRecipes = useCallback(
    async (nextQuery: RecipeListQuery, context: RecipeListErrorViewModel["context"], mode: "load" | "refresh") => {
      setError(null);
      setSearchError(null);
      if (mode === "load") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(buildListUrl(nextQuery));
        if (!response.ok) {
          if (response.status === 400 && context === "search") {
            setSearchError("Search query is not valid.");
            return;
          }
          if (response.status === 401) {
            setError({ message: "Please sign in to view recipes.", statusCode: 401, context });
            return;
          }
          setError({ message: "Unable to load recipes right now.", statusCode: response.status, context });
          return;
        }

        const data = (await response.json()) as RecipeListDto;
        setItems(data.data);
        setQuery(nextQuery);
        lastQueryRef.current = nextQuery;
      } catch {
        setError({ message: "Network error while loading recipes.", context });
      } finally {
        if (mode === "load") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  const handleSearchSubmit = useCallback(
    (normalized: string) => {
      if (!normalized) {
        return;
      }

      void fetchRecipes({ ...query, q: normalized }, "search", "load");
    },
    [fetchRecipes, query]
  );

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
    void fetchRecipes({ ...query, q: undefined }, "search", "load");
  }, [fetchRecipes, query]);

  const handleRefresh = useCallback(() => {
    void fetchRecipes(lastQueryRef.current, "refresh", "refresh");
  }, [fetchRecipes]);

  const handleOpenAdd = useCallback(() => {
    setIsAddOpen(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setIsAddOpen(false);
    setImportError(null);
    setCreateError(null);
  }, []);

  const handleSelect = useCallback((id: string) => {
    window.location.assign(`/recipes/${id}`);
  }, []);

  const deleteRecipeById = useCallback(async (target: RecipeListItemDto) => {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${target.id}`, { method: "DELETE" });
      if (!response.ok) {
        if (response.status === 404) {
          setItems((current) => current.filter((item) => item.id !== target.id));
          setError({ message: "Recipe already removed.", statusCode: 404, context: "delete" });
          return;
        }
        setError({ message: "Unable to delete recipe.", statusCode: response.status, context: "delete" });
        return;
      }

      setItems((current) => current.filter((item) => item.id !== target.id));
    } catch {
      setError({ message: "Network error while deleting.", context: "delete" });
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const handleDelete = useCallback(
    (item: RecipeListItemDto) => {
      if (item.status === "failed") {
        void deleteRecipeById(item);
        return;
      }

      setDeleteTarget(item);
    },
    [deleteRecipeById]
  );

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    await deleteRecipeById(deleteTarget);
    setDeleteTarget(null);
  }, [deleteRecipeById, deleteTarget]);

  const handleImport = useCallback(
    async (command: RecipeImportCreateCommand) => {
      setIsSubmitting(true);
      setImportError(null);
      setCreateError(null);
      setError(null);

      try {
        const response = await fetch("/api/recipes/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          if (response.status === 400) {
            setImportError("Enter a valid recipe URL.");
            return;
          }
          if (response.status === 409) {
            setImportError("This recipe URL already exists.");
            return;
          }
          setError({ message: "Unable to import recipe.", statusCode: response.status, context: "import" });
          return;
        }

        await fetchRecipes(lastQueryRef.current, "refresh", "refresh");
        setIsAddOpen(false);
      } catch {
        setError({ message: "Network error while importing.", context: "import" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchRecipes]
  );

  const handleCreate = useCallback(async (command: RecipeCreateCommand) => {
    setIsSubmitting(true);
    setImportError(null);
    setCreateError(null);
    setError(null);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 400) {
          setCreateError("Please double-check your recipe details.");
          return;
        }
        if (response.status === 409) {
          setCreateError("A recipe with this source URL already exists.");
          return;
        }
        setError({ message: "Unable to create recipe.", statusCode: response.status, context: "create" });
        return;
      }

      const result = (await response.json()) as RecipeCreateResultDto;
      const preview = result.ingredients.map((ingredient) => ingredient.normalized_name);
      const listItem: RecipeListItemDto = {
        id: result.recipe.id,
        title: result.recipe.title,
        status: result.recipe.status,
        error_message: result.recipe.error_message ?? null,
        created_at: result.recipe.created_at,
        updated_at: result.recipe.updated_at,
        ingredients_preview: preview,
      };
      setItems((current) => [listItem, ...current]);
      setIsAddOpen(false);
    } catch {
      setError({ message: "Network error while creating.", context: "create" });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const emptyState = useMemo(() => {
    if (items.length > 0) {
      return null;
    }
    return query.q ? "no-matches" : "no-recipes";
  }, [items.length, query.q]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recipes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{listTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleOpenAdd}>Add recipe</Button>
          <RefreshButton onClick={handleRefresh} loading={isLoading || isRefreshing} />
        </div>
      </div>
      <SearchBar
        value={searchInput}
        onChange={handleSearchChange}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
        error={searchError}
        disabled={isLoading || isRefreshing}
      />
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      {emptyState ? (
        <EmptyState variant={emptyState} onAdd={handleOpenAdd} />
      ) : (
        <RecipeList items={items} onSelect={handleSelect} onDelete={handleDelete} />
      )}
      <AddRecipeModal
        open={isAddOpen}
        onClose={handleCloseAdd}
        isSubmitting={isSubmitting}
        onImport={handleImport}
        onCreate={handleCreate}
        importError={importError}
        createError={createError}
      />
      <DeleteConfirmationDialog
        open={Boolean(deleteTarget) && deleteTarget?.status !== "failed"}
        status={deleteTarget?.status ?? "succeeded"}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </section>
  );
};

export default RecipeListView;
