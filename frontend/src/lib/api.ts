/**
 * Thin fetch wrapper for the FairGig backend services.
 *
 * Responsibilities:
 *   - Attach the current access token as a Bearer header.
 *   - Parse backend error envelope `{ error: { code, message } }` into an Error.
 *   - Transparently refresh the access token (single-flight) when a 401 is
 *     returned, and retry the original request once.
 *   - Expose low-level helpers (`apiFetch`) and auth-specific helpers
 *     (`authApi`) used by the login / signup flows.
 *
 * Tokens are persisted in localStorage under `fairgig.tokens`. The
 * `AuthProvider` mirrors the same keys and is the source of truth for UI;
 * this module only reads/writes tokens so that requests fired before React
 * rehydrates still work.
 */

export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8001";

const TOKENS_KEY = "fairgig.tokens";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: "worker" | "verifier" | "advocate";
  name: string | null;
  city_zone?: string | null;
  category?: string | null;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/* ------------------------------------------------------------------ */
/* Token storage                                                       */
/* ------------------------------------------------------------------ */

export function readTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTokens;
    if (!parsed?.accessToken || !parsed?.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeTokens(tokens: StoredTokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKENS_KEY);
}

/* ------------------------------------------------------------------ */
/* Request helper                                                      */
/* ------------------------------------------------------------------ */

type FetchOpts = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

let refreshInFlight: Promise<StoredTokens | null> | null = null;

async function refreshTokens(): Promise<StoredTokens | null> {
  if (refreshInFlight) return refreshInFlight;
  const current = readTokens();
  if (!current) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
      };
      const next: StoredTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
      writeTokens(next);
      return next;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiFetch<T = unknown>(
  baseUrl: string,
  path: string,
  opts: FetchOpts = {}
): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;

  const build = (token: string | null): RequestInit => {
    const h = new Headers(headers || {});
    if (body !== undefined && !h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
    if (auth && token) {
      h.set("Authorization", `Bearer ${token}`);
    }
    return {
      ...rest,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    };
  };

  const tokens = readTokens();
  let res = await fetch(`${baseUrl}${path}`, build(tokens?.accessToken ?? null));

  if (res.status === 401 && auth && tokens?.refreshToken) {
    const next = await refreshTokens();
    if (next) {
      res = await fetch(`${baseUrl}${path}`, build(next.accessToken));
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err = payload?.error;
    throw new ApiError(
      res.status,
      err?.code || "HTTP_ERROR",
      err?.message || `Request failed (${res.status})`,
      err?.details
    );
  }

  return payload as T;
}

/* ------------------------------------------------------------------ */
/* Auth endpoints                                                      */
/* ------------------------------------------------------------------ */

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  role: "worker" | "verifier" | "advocate";
  city_zone?: string;
  category?: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    role: AuthUser["role"];
    name: string | null;
  };
};

export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<{ user_id: string; email: string; role: string }>(
      AUTH_BASE_URL,
      "/auth/register",
      { method: "POST", body: input, auth: false }
    ),

  login: (email: string, password: string) =>
    apiFetch<LoginResponse>(AUTH_BASE_URL, "/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  me: () => apiFetch<AuthUser>(AUTH_BASE_URL, "/auth/me", { method: "GET" }),
};
