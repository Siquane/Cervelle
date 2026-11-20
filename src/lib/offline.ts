import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { create } from "zustand";
import { ApiError } from "../api/client";

// Fiches hors ligne : what the child needs to revise without network is kept
// in files on the phone (the home screen, the revision list, each sheet and
// its memory cards). A request that fails for lack of network falls back to
// that copy. Answers and sessions done offline wait in an outbox and are sent
// when the network is back. Nothing is kept on the web.

const supported = Platform.OS !== "web";

/** True while the screens show the phone's copy instead of the server's. */
export const useOffline = create<{ offline: boolean; set: (v: boolean) => void }>((set) => ({ offline: false, set: (offline) => set({ offline }) }));

function dir(): Directory {
  const d = new Directory(Paths.document, "offline");
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}
const fileOf = (key: string) => new File(dir(), `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);

export function saveOffline(key: string, data: unknown) {
  if (!supported) return;
  try {
    fileOf(key).write(JSON.stringify(data));
  } catch {
    // A full disk must not break the screen.
  }
}

export function readOffline<T>(key: string): T | null {
  if (!supported) return null;
  try {
    const f = fileOf(key);
    return f.exists ? (JSON.parse(f.textSync()) as T) : null;
  } catch {
    return null;
  }
}

export const hasOffline = (key: string) => supported && (() => { try { return fileOf(key).exists; } catch { return false; } })();

export const isNetworkError = (e: unknown) => e instanceof ApiError && e.status === 0;

/** Fetches and keeps a copy; without network, returns the copy if there is one. */
export async function withOffline<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const value = await fetcher();
    saveOffline(key, value);
    if (useOffline.getState().offline) useOffline.getState().set(false);
    return value;
  } catch (e) {
    if (isNetworkError(e)) {
      const copy = readOffline<T>(key);
      if (copy !== null) {
        useOffline.getState().set(true);
        return copy;
      }
    }
    throw e;
  }
}

// ─── Outbox: what was done offline, sent later ────────────────────────────

interface Pending {
  path: string;
  body: unknown;
}
const OUTBOX = "outbox";

export function queueOffline(path: string, body: unknown) {
  const list = readOffline<Pending[]>(OUTBOX) ?? [];
  list.push({ path, body });
  saveOffline(OUTBOX, list.slice(-500));
}

let flushing = false;
/** Sends what waits in the outbox, in order. Stops at the first network error; drops what the server refuses. */
export async function flushOutbox(post: (path: string, body: unknown) => Promise<unknown>) {
  if (!supported || flushing) return;
  flushing = true;
  try {
    let list = readOffline<Pending[]>(OUTBOX) ?? [];
    while (list.length) {
      try {
        await post(list[0].path, list[0].body);
      } catch (e) {
        if (isNetworkError(e)) break;
      }
      list = list.slice(1);
      saveOffline(OUTBOX, list);
    }
  } finally {
    flushing = false;
  }
}
