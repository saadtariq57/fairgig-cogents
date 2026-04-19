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
/* Earnings types                                                      */
/* ------------------------------------------------------------------ */

export const EARNINGS_BASE_URL =
  process.env.NEXT_PUBLIC_EARNINGS_URL || "http://localhost:8002";

/** Backend verification_status enum values */
export type VerificationStatus =
  | "unverified"
  | "pending_review"
  | "confirmed"
  | "flagged"
  | "unverifiable";

export type Shift = {
  id: string;
  worker_id: string;
  platform: string;
  date: string; // YYYY-MM-DD
  hours_worked: number;
  gross_earned: number;
  platform_deductions: number;
  net_received: number;
  notes: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
};

export type ShiftListResponse = {
  items: Shift[];
  total: number;
  page: number;
  page_size: number;
};

export type CreateShiftInput = {
  platform: string;
  date: string;
  hours_worked: number;
  gross_earned: number;
  platform_deductions: number;
  net_received: number;
  notes?: string;
};

export type UpdateShiftInput = Partial<CreateShiftInput>;

export type ShiftFilters = {
  from?: string;
  to?: string;
  platform?: string;
  worker_id?: string;
  verification_status?: VerificationStatus;
  page?: number;
  page_size?: number;
};

export type CsvImportResult = {
  imported: number;
  skipped: { row: number; reason: string }[];
};

/* ------------------------------------------------------------------ */
/* Multipart fetch helper (for file uploads)                          */
/* ------------------------------------------------------------------ */

export async function apiFetchMultipart<T = unknown>(
  baseUrl: string,
  path: string,
  formData: FormData,
  method = "POST"
): Promise<T> {
  const tokens = readTokens();
  const headers = new Headers();
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  let res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: formData,
  });

  if (res.status === 401 && tokens?.refreshToken) {
    const next = await refreshTokens();
    if (next) {
      headers.set("Authorization", `Bearer ${next.accessToken}`);
      res = await fetch(`${baseUrl}${path}`, { method, headers, body: formData });
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
/* Earnings endpoints                                                  */
/* ------------------------------------------------------------------ */

function buildQuery(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const earningsApi = {
  listShifts: (filters: ShiftFilters = {}) => {
    const qs = buildQuery({
      from: filters.from,
      to: filters.to,
      platform: filters.platform,
      worker_id: filters.worker_id,
      verification_status: filters.verification_status,
      page: filters.page ?? 1,
      page_size: filters.page_size ?? 50,
    });
    return apiFetch<ShiftListResponse>(EARNINGS_BASE_URL, `/shifts${qs}`);
  },

  createShift: (input: CreateShiftInput) =>
    apiFetch<Shift>(EARNINGS_BASE_URL, "/shifts", {
      method: "POST",
      body: input,
    }),

  updateShift: (id: string, patch: UpdateShiftInput) =>
    apiFetch<Shift>(EARNINGS_BASE_URL, `/shifts/${id}`, {
      method: "PATCH",
      body: patch,
    }),

  deleteShift: (id: string) =>
    apiFetch<void>(EARNINGS_BASE_URL, `/shifts/${id}`, { method: "DELETE" }),

  importCsv: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetchMultipart<CsvImportResult>(EARNINGS_BASE_URL, "/shifts/import", fd);
  },
};

/* ------------------------------------------------------------------ */
/* Verification types & endpoints                                      */
/* ------------------------------------------------------------------ */

export type Verification = {
  id: string;
  shift_id: string;
  worker_id: string;
  verifier_id: string | null;
  screenshot_url: string;       // relative: /uploads/<filename>
  status: VerificationStatus;
  reviewer_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  shift?: Shift | null;         // included in GET /verifications list
};

export type VerificationListResponse = {
  items: (Verification & { shift: Shift | null })[];
};

export type ReviewInput = {
  status: "confirmed" | "flagged" | "unverifiable";
  reviewer_note?: string;
};

export const verificationsApi = {
  /** Worker: submit a screenshot for a shift */
  submit: (shiftId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("shift_id", shiftId);
    return apiFetchMultipart<Verification>(EARNINGS_BASE_URL, "/verifications", fd);
  },

  /** Verifier / Advocate: list verifications by status (default pending_review) */
  list: (status?: VerificationStatus) => {
    const qs = status ? `?status=${status}` : "";
    return apiFetch<VerificationListResponse>(EARNINGS_BASE_URL, `/verifications${qs}`);
  },

  /** Verifier: approve / flag / mark unverifiable */
  review: (id: string, input: ReviewInput) =>
    apiFetch<Verification>(EARNINGS_BASE_URL, `/verifications/${id}`, {
      method: "PATCH",
      body: input,
    }),
};

/* ------------------------------------------------------------------ */
/* Worker profile types & endpoint                                     */
/* ------------------------------------------------------------------ */

export type WorkerProfile = {
  worker_id: string;
  name: string | null;
  city_zone: string | null;
  category: string | null;
  totals: {
    shifts: number;
    verified_shifts: number;
    net_earned_last_30d: number;
  };
};

export const workerApi = {
  getProfile: (workerId: string) =>
    apiFetch<WorkerProfile>(EARNINGS_BASE_URL, `/workers/${workerId}/profile`),
};

/* ------------------------------------------------------------------ */
/* Grievance types & endpoints                                         */
/* ------------------------------------------------------------------ */

export const GRIEVANCE_BASE_URL =
  process.env.NEXT_PUBLIC_GRIEVANCE_URL || "http://localhost:8004";

export type GrievanceCategory =
  | "commission_change"
  | "sudden_deactivation"
  | "unpaid_earnings"
  | "rate_drop"
  | "other"
  | "community_post";

export type GrievanceStatus = "open" | "escalated" | "resolved";

export type GrievanceComment = {
  id: string;
  grievance_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type Grievance = {
  id: string;
  worker_id: string | null;
  worker_id_masked: string | null;
  anonymous: boolean;
  author_display: string;
  platform: string;
  category: GrievanceCategory;
  description: string;
  status: GrievanceStatus;
  tags: string[];
  cluster_id: string | null;
  upvotes: number;
  posted_at: string;
  updated_at: string;
  comments?: GrievanceComment[];
};

export type GrievanceListResponse = {
  items: Grievance[];
  total: number;
  page: number;
  page_size: number;
};

export type CreateGrievanceInput = {
  platform: string;
  category: GrievanceCategory;
  description: string;
  anonymous?: boolean;
  tags?: string[];
};

export type GrievanceFilters = {
  platform?: string;
  category?: GrievanceCategory;
  status?: GrievanceStatus;
  cluster_id?: string;
  page?: number;
  page_size?: number;
};

export type AdvocatePatchInput = {
  status?: "escalated" | "resolved";
  tags?: string[];
  cluster_id?: string | null;
};

export type GrievanceCluster = {
  cluster_id: string;
  platform: string;
  category: GrievanceCategory;
  count: number;
  sample_ids: string[];
};

export const grievanceApi = {
  list: (filters: GrievanceFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.platform) q.set("platform", filters.platform);
    if (filters.category) q.set("category", filters.category);
    if (filters.status) q.set("status", filters.status);
    if (filters.cluster_id) q.set("cluster_id", filters.cluster_id);
    q.set("page", String(filters.page ?? 1));
    q.set("page_size", String(filters.page_size ?? 50));
    const qs = q.toString() ? `?${q}` : "";
    return apiFetch<GrievanceListResponse>(GRIEVANCE_BASE_URL, `/grievances${qs}`);
  },

  get: (id: string) =>
    apiFetch<Grievance & { comments: GrievanceComment[] }>(
      GRIEVANCE_BASE_URL,
      `/grievances/${id}`
    ),

  create: (input: CreateGrievanceInput) =>
    apiFetch<Grievance>(GRIEVANCE_BASE_URL, "/grievances", {
      method: "POST",
      body: input,
    }),

  patch: (id: string, patch: AdvocatePatchInput) =>
    apiFetch<Grievance>(GRIEVANCE_BASE_URL, `/grievances/${id}`, {
      method: "PATCH",
      body: patch,
    }),

  upvote: (id: string) =>
    apiFetch<{ id: string; upvotes: number }>(
      GRIEVANCE_BASE_URL,
      `/grievances/${id}/upvote`,
      { method: "POST" }
    ),

  addComment: (grievanceId: string, body: string) =>
    apiFetch<GrievanceComment>(
      GRIEVANCE_BASE_URL,
      `/grievances/${grievanceId}/comments`,
      { method: "POST", body: { body } }
    ),

  getClusters: () =>
    apiFetch<{ clusters: GrievanceCluster[] }>(
      GRIEVANCE_BASE_URL,
      "/grievances/clusters"
    ),
};

/* ------------------------------------------------------------------ */
/* Analytics types & endpoints                                         */
/* ------------------------------------------------------------------ */

export const ANALYTICS_BASE_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_URL || "http://localhost:8005";

export const ANOMALY_BASE_URL =
  process.env.NEXT_PUBLIC_ANOMALY_URL || "http://localhost:8003";

export type MedianHourlyResponse = {
  category: string;
  city_zone: string;
  median_hourly_rate: number | null;
  sample_size: number;
  k_anonymity_min?: number;
  reason?: string;
};

export type CommissionTrendPoint = {
  week: string;
  platform: string;
  avg_commission_pct: number | null;
  sample_size: number;
  reason?: string;
};

export type CommissionTrendsResponse = {
  platform: string | null;
  from: string | null;
  to: string | null;
  series: CommissionTrendPoint[];
};

export type IncomeDistributionBucket = {
  label: string;
  min: number;
  max: number | null;
  count: number;
};

export type IncomeDistributionResponse = {
  city_zone: string | null;
  total_workers: number;
  buckets: IncomeDistributionBucket[];
  reason?: string;
};

export type TopComplaintItem = {
  category: string;
  count: number;
};

export type TopComplaintsResponse = {
  window: string;
  window_days: number;
  items: TopComplaintItem[];
};

export type VulnerabilityWorker = {
  worker_id_masked: string;
  drop_pct: number;
  last_month_net: number;
  prev_month_net: number;
  city_zone: string;
  category: string;
};

export type VulnerabilityFlagsResponse = {
  workers: VulnerabilityWorker[];
  generated_at: string;
};

export type WorkerWeeklyPoint = {
  week: string;
  net: number;
  hours: number;
  effective_hourly_rate: number | null;
};

export type WorkerMonthlyPoint = {
  month: string;
  net: number;
  hours: number;
};

export type WorkerPlatformPoint = {
  month: string;
  platform: string;
  avg_commission_pct: number | null;
};

export type WorkerSummaryResponse = {
  worker_id: string;
  city_zone: string | null;
  category: string | null;
  weekly: WorkerWeeklyPoint[];
  monthly: WorkerMonthlyPoint[];
  platform_commission: WorkerPlatformPoint[];
  city_median: MedianHourlyResponse | null;
};

export const analyticsApi = {
  medianHourly: (category: string, city_zone: string) =>
    apiFetch<MedianHourlyResponse>(
      ANALYTICS_BASE_URL,
      `/analytics/median-hourly?category=${encodeURIComponent(category)}&city_zone=${encodeURIComponent(city_zone)}`
    ),

  commissionTrends: (params: { platform?: string; from?: string; to?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.platform) q.set("platform", params.platform);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    const qs = q.toString() ? `?${q}` : "";
    return apiFetch<CommissionTrendsResponse>(ANALYTICS_BASE_URL, `/analytics/commission-trends${qs}`);
  },

  incomeDistribution: (city_zone?: string) => {
    const qs = city_zone ? `?city_zone=${encodeURIComponent(city_zone)}` : "";
    return apiFetch<IncomeDistributionResponse>(ANALYTICS_BASE_URL, `/analytics/income-distribution${qs}`);
  },

  topComplaints: (window = "7d") =>
    apiFetch<TopComplaintsResponse>(ANALYTICS_BASE_URL, `/analytics/top-complaints?window=${window}`),

  vulnerabilityFlags: () =>
    apiFetch<VulnerabilityFlagsResponse>(ANALYTICS_BASE_URL, "/analytics/vulnerability-flags"),

  workerSummary: (workerId: string) =>
    apiFetch<WorkerSummaryResponse>(ANALYTICS_BASE_URL, `/analytics/worker/${workerId}/summary`),
};

/* ------------------------------------------------------------------ */
/* Anomaly detection types & endpoints                                 */
/* ------------------------------------------------------------------ */

export type AnomalyShiftIn = {
  date: string;
  platform: string;
  hours_worked: number;
  gross_earned: number;
  platform_deductions: number;
  net_received: number;
};

export type AnomalyFlag = {
  type: "unusual_deduction" | "sudden_income_drop" | "below_median_hourly";
  severity: "low" | "medium" | "high";
  explanation: string;
  date?: string;
  period?: string;
};

export type DetectAnomaliesInput = {
  worker_id?: string;
  city_median_hourly_rate?: number;
  shifts: AnomalyShiftIn[];
};

export type DetectAnomaliesResponse = {
  worker_id: string | null;
  summary: string;
  flags: AnomalyFlag[];
  method: Record<string, string>;
};

export const anomalyApi = {
  detect: (input: DetectAnomaliesInput) =>
    apiFetch<DetectAnomaliesResponse>(ANOMALY_BASE_URL, "/anomalies/detect", {
      method: "POST",
      body: input,
    }),
};

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
