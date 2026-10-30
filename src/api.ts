import type {
  CaseDetail,
  CaseSummary,
  InteractionResult,
  ProtocolResult,
  Result,
  Simulation,
  SimulationSummary,
  User,
} from "./types";

const base = (
  process.env.API_BASE_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");
const tokenKey = "clinical-simulator-token";
export const sessionExpiredEvent = "clinical-simulator-session-expired";
export const tokenStore = {
  get: () => sessionStorage.getItem(tokenKey),
  set: (value: string) => sessionStorage.setItem(tokenKey, value),
  clear: () => sessionStorage.removeItem(tokenKey),
};
const adminTokenKey = "clinical-simulator-admin-token";
export const adminTokenStore = {
  get: () => sessionStorage.getItem(adminTokenKey),
  set: (value: string) => sessionStorage.setItem(adminTokenKey, value),
  clear: () => sessionStorage.removeItem(adminTokenKey),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  admin = false,
): Promise<T> {
  const store = admin ? adminTokenStore : tokenStore;
  const token = store.get();
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const authenticated =
    !!token &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    !path.startsWith("/admin/login");
  if (authenticated) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar ao servidor. Verifique se a API está ativa.",
    );
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const data = body as {
      error?: { code?: string; message?: string };
      detail?: string | { msg: string }[];
    } | null;
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data?.detail;
    if (response.status === 401 && authenticated) {
      store.clear();
      if (!admin) window.dispatchEvent(new Event(sessionExpiredEvent));
    }
    throw new ApiError(
      response.status,
      data?.error?.message || detail || `Erro ${response.status}`,
      data?.error?.code,
    );
  }
  return body as T;
}

const post = <T>(path: string, body?: object) =>
  request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
export const api = {
  interactStream: async (id: string, studentText: string, symptomName: string, onPreview: (text: string) => void): Promise<InteractionResult> => {
    let response: Response;
    try {
      response = await fetch(`${base}/simulations/${encodeURIComponent(id)}/interactions/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenStore.get() || ""}` },
        body: JSON.stringify({ student_text: studentText, symptom_name: symptomName }),
      });
    } catch { throw new ApiError(0, "Não foi possível conectar ao servidor. Seu texto foi preservado."); }
    if (response.status === 401) { tokenStore.clear(); window.dispatchEvent(new Event(sessionExpiredEvent)); }
    if (!response.ok || !response.body) throw new ApiError(response.status, `Não foi possível iniciar a resposta (${response.status}).`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: InteractionResult | null = null;
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replaceAll("\r\n", "\n");
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";
      for (const frame of frames) {
        const event = frame.split("\n").find(line => line.startsWith("event: "))?.slice(7);
        const data = frame.split("\n").find(line => line.startsWith("data: "))?.slice(6);
        if (!data) continue;
        const payload = JSON.parse(data);
        if (event === "preview") onPreview(payload.text as string);
        if (event === "complete") result = payload as InteractionResult;
        if (event === "error") throw new ApiError(503, payload.message || "A resposta não pôde ser concluída.", payload.code);
      }
      if (done) break;
    }
    if (!result) throw new ApiError(503, "A resposta terminou sem confirmação. Verifique o histórico antes de reenviar.");
    return result;
  },
  feedback: (id: string) => request<ExperienceFeedback | null>(`/simulations/${encodeURIComponent(id)}/experience-feedback`),
  submitFeedback: (id: string, body: ExperienceFeedback) => post<ExperienceFeedback>(`/simulations/${encodeURIComponent(id)}/experience-feedback`, body),
  updateFeedback: (id: string, body: ExperienceFeedback) => request<ExperienceFeedback>(`/simulations/${encodeURIComponent(id)}/experience-feedback`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  register: (email: string, password: string, name: string) =>
    post<User>("/auth/register", { email, password, name }),
  login: (email: string, password: string) =>
    post<{ access_token: string }>("/auth/login", { email, password }),
  logout: () => post<void>("/auth/logout"),
  me: () => request<User>("/auth/me"),
  cases: () => request<CaseSummary[]>("/cases"),
  case: (id: string) => request<CaseDetail>(`/cases/${encodeURIComponent(id)}`),
  simulations: () => request<SimulationSummary[]>("/simulations"),
  simulation: (id: string) =>
    request<Simulation>(`/simulations/${encodeURIComponent(id)}`),
  start: (caseId: string, minutes: number) =>
    post<Simulation>("/simulations", {
      case_id: caseId,
      time_limit_minutes: minutes,
    }),
  interact: (id: string, studentText: string, symptomName: string) =>
    post<InteractionResult>(
      `/simulations/${encodeURIComponent(id)}/interactions`,
      { student_text: studentText, symptom_name: symptomName },
    ),
  advance: (id: string, seconds: number) =>
    post<Simulation>(`/simulations/${encodeURIComponent(id)}/time/advance`, {
      seconds,
    }),
  reveal: (id: string, symptomName: string) =>
    post<ProtocolResult>(
      `/simulations/${encodeURIComponent(id)}/protocols/${encodeURIComponent(symptomName)}/reveal`,
    ),
  report: (id: string, interactionId: string, description: string) =>
    post<{ id: string }>(`/simulations/${encodeURIComponent(id)}/reports`, {
      interaction_id: interactionId,
      description,
    }),
  finish: (id: string) =>
    post<Simulation>(`/simulations/${encodeURIComponent(id)}/finish`),
  result: (id: string) =>
    request<Result>(`/simulations/${encodeURIComponent(id)}/result`),
};

export type ExperienceFeedback = {
  liked: boolean;
  clarity: number;
  difficulty: number;
  useful_feature: string;
  improvement: string;
};

export type AdminFeedback = ExperienceFeedback & {
  simulation_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: string;
};

export const adminApi = {
  login: (username: string, password: string) => request<{ access_token: string }>(
    "/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }, true,
  ),
  me: () => request<{ username: string }>("/admin/me", {}, true),
  accounts: () => request<User[]>("/admin/accounts", {}, true),
  feedback: () => request<AdminFeedback[]>("/admin/feedback", {}, true),
  logout: () => request<void>("/admin/logout", { method: "POST" }, true),
};
