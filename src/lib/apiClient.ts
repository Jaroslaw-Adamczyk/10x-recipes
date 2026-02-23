function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") return b.error;
  if (b.error && typeof b.error === "object") {
    const e = b.error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return fallback;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { ...init, signal });

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // eslint-disable-next-line no-console
      console.error("Failed to parse response body as JSON", body);
    }
    throw new ApiError(response.status, extractErrorMessage(body, response.statusText), body);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;

  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(url: string, signal?: AbortSignal): Promise<T> {
    return request<T>(url, {}, signal);
  },

  post<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>(
      url,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      signal
    );
  },

  patch<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>(
      url,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      signal
    );
  },

  delete(url: string, signal?: AbortSignal): Promise<void> {
    return request<undefined>(url, { method: "DELETE" }, signal);
  },

  postForm<T>(url: string, form: FormData, signal?: AbortSignal): Promise<T> {
    return request<T>(url, { method: "POST", body: form }, signal);
  },
};
