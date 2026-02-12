export const formatCookTime = (cookTime: number | null): string | null => {
  if (cookTime === null || Number.isNaN(cookTime)) {
    return null;
  }

  if (cookTime === 0) {
    return "Cook time: 0 min";
  }

  return `Cook time: ${cookTime} min`;
};

export const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US");
};

export const isValidUrl = (value: string | null): value is string => {
  if (!value) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
