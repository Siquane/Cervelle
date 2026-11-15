import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { Learner } from "../api/types";

// Who uses this phone:
//   - a parent, signed in with their Passerelle account (access + refresh tokens);
//   - a child, linked once with a code from their parent (a device token « cv_… »).

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000");

const KEY = "cervelle.session";

const storage = {
  get: (k: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.getItem(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.setItem(k, v)) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.removeItem(k)) : SecureStore.deleteItemAsync(k)),
};

export type Saved =
  | { kind: "parent"; accessToken: string; refreshToken: string; name: string; email: string }
  | { kind: "child"; token: string; learner: Learner };

interface SessionState {
  session: Saved | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (s: Saved | null) => Promise<void>;
  refresh: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

/** Render's free plan sleeps: the first call after a pause can take ~40 s. Retry 502/503/504 and network errors until then. */
export async function postWithRetry(path: string, body: unknown, deadlineMs = 60_000): Promise<{ status: number; data: Record<string, unknown> }> {
  const deadline = Date.now() + deadlineMs;
  for (;;) {
    try {
      const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (![502, 503, 504].includes(res.status) || Date.now() > deadline) {
        return { status: res.status, data: await res.json().catch(() => ({})) };
      }
    } catch {
      if (Date.now() > deadline) throw new Error("Le serveur ne répond pas. Vérifie ta connexion et réessaie.");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

let refreshing: Promise<boolean> | null = null;

export const useSession = create<SessionState>((set, get) => ({
  session: null,
  hydrated: false,

  hydrate: async () => {
    let session: Saved | null = null;
    try {
      const raw = await storage.get(KEY);
      session = raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      session = null;
    }
    set({ session, hydrated: true });
  },

  save: async (s) => {
    if (s) await storage.set(KEY, JSON.stringify(s));
    else await storage.del(KEY);
    set({ session: s });
  },

  // Refresh tokens are single use: concurrent 401s share one refresh call.
  refresh: () => {
    if (refreshing) return refreshing;
    const s = get().session;
    if (s?.kind !== "parent") return Promise.resolve(false);
    refreshing = (async () => {
      try {
        const { status, data } = await postWithRetry("/auth/refresh", { refreshToken: s.refreshToken });
        if (status !== 200 || typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") return false;
        await get().save({ ...s, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  },

  signOut: async () => {
    const s = get().session;
    await get().save(null);
    if (s?.kind === "parent") {
      fetch(`${API_URL}/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: s.refreshToken }) }).catch(() => {});
    } else if (s?.kind === "child") {
      fetch(`${API_URL}/cervelle/child/logout`, { method: "POST", headers: { Authorization: `Bearer ${s.token}` } }).catch(() => {});
    }
  },
}));
