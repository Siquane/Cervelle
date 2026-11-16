import { create } from "zustand";

// The timer lives outside the screens so it keeps running while the child
// looks at another tab. Times are wall-clock (endsAt), so it stays right when
// the phone goes to sleep: the watcher in the tabs layout notices the end as
// soon as the app is back.

export type Phase = "idle" | "focus" | "pause";

export interface Target {
  label: string;
  revisionId: string | null;
  todoId: string | null;
}

interface TimerState {
  phase: Phase;
  running: boolean;
  /** When the current phase ends (running), ms since epoch. */
  endsAt: number | null;
  /** Time left when paused, ms. */
  leftMs: number;
  /** Full length of the current phase, ms (for the ring). */
  lengthMs: number;
  /** Focus time already worked in this session, ms (counted on pause). */
  workedMs: number;
  /** When the focus phase last (re)started, ms. */
  runningSince: number | null;
  target: Target;
  setTarget: (t: Partial<Target>) => void;
  startFocus: (minutes: number) => void;
  startPause: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  /** Ends the focus phase now; returns the seconds worked. */
  stop: () => number;
  reset: () => void;
}

const NO_TARGET: Target = { label: "", revisionId: null, todoId: null };

export const useTimer = create<TimerState>((set, get) => ({
  phase: "idle",
  running: false,
  endsAt: null,
  leftMs: 0,
  lengthMs: 0,
  workedMs: 0,
  runningSince: null,
  target: NO_TARGET,
  setTarget: (t) => set({ target: { ...get().target, ...t } }),
  startFocus: (minutes) => {
    const now = Date.now();
    const ms = minutes * 60_000;
    set({ phase: "focus", running: true, endsAt: now + ms, leftMs: ms, lengthMs: ms, workedMs: 0, runningSince: now });
  },
  startPause: (minutes) => {
    const now = Date.now();
    const ms = minutes * 60_000;
    set({ phase: "pause", running: true, endsAt: now + ms, leftMs: ms, lengthMs: ms, runningSince: null });
  },
  pause: () => {
    const s = get();
    if (!s.running || !s.endsAt) return;
    const now = Date.now();
    set({
      running: false,
      leftMs: Math.max(0, s.endsAt - now),
      endsAt: null,
      workedMs: s.phase === "focus" && s.runningSince ? s.workedMs + Math.min(now, s.endsAt) - s.runningSince : s.workedMs,
      runningSince: null,
    });
  },
  resume: () => {
    const s = get();
    if (s.running || s.phase === "idle") return;
    const now = Date.now();
    set({ running: true, endsAt: now + s.leftMs, runningSince: s.phase === "focus" ? now : null });
  },
  stop: () => {
    const s = get();
    const now = Date.now();
    const extra = s.phase === "focus" && s.running && s.runningSince && s.endsAt ? Math.min(now, s.endsAt) - s.runningSince : 0;
    const worked = s.phase === "focus" ? s.workedMs + extra : 0;
    set({ phase: "idle", running: false, endsAt: null, leftMs: 0, lengthMs: 0, workedMs: 0, runningSince: null });
    return Math.round(worked / 1000);
  },
  reset: () => set({ phase: "idle", running: false, endsAt: null, leftMs: 0, lengthMs: 0, workedMs: 0, runningSince: null, target: NO_TARGET }),
}));

/** Time left in the current phase, ms. */
export function leftOf(s: Pick<TimerState, "running" | "endsAt" | "leftMs">, now = Date.now()) {
  return s.running && s.endsAt ? Math.max(0, s.endsAt - now) : s.leftMs;
}

export const mmss = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
