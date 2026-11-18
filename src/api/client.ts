import { API_URL, useSession } from "../state/session";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

const OFFLINE = "Pas de connexion au serveur. Vérifie ta connexion et réessaie.";

function token() {
  const s = useSession.getState().session;
  if (!s) return null;
  return s.kind === "parent" ? s.accessToken : s.token;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as Record<string, string>) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, OFFLINE);
  }
  // Render waking up: wait and try again once.
  if ((res.status === 502 || res.status === 503) && retry && !path.includes("/revisions") && init.method !== "POST") {
    await new Promise((r) => setTimeout(r, 3000));
    return request<T>(path, init, false);
  }
  if (res.status === 401) {
    const s = useSession.getState().session;
    if (s?.kind === "parent" && retry && (await useSession.getState().refresh())) return request<T>(path, init, false);
    const body = await res.json().catch(() => ({}));
    await useSession.getState().signOut();
    throw new ApiError(401, body.error ?? "Tu as été déconnecté. Reconnecte-toi pour continuer.", body.code);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Ça n'a pas marché. Réessaie dans un instant.", body.code);
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Ça n'a pas marché. Réessaie dans un instant.");
