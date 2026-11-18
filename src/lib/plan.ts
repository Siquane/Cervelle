import type { AgendaEvent, AgendaExam } from "../api/types";
import { addDays, weekdayOf } from "./dates";

// Automatic revision planning: before each interro, short sessions spread
// out (7, 4, 2 and 1 days before: spaced repetition works better than one
// long evening), placed after the day's lessons in the free time of the
// timetable. Nothing is stored: the plan is recomputed from the agenda each
// time, so it follows a changed interro date or a new lesson by itself.

/** Days before the interro. */
export const PLAN_OFFSETS = [7, 4, 2, 1] as const;

/** Session length by school level, in minutes. */
export const SESSION_MINUTES: Record<string, number> = { primaire: 15, college: 20, lycee: 30, superieur: 40, adulte: 30 };

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const WEEKDAY_FROM = 17 * 60; // after school
const WEEKEND_FROM = 10 * 60;
const LATEST_END = 20 * 60 + 30;
const GAP = 15; // a short break after a lesson

const PREFIX = "plan-";

/** « plan-<revisionId>-<offset> » → the revision id, or null for a normal event. */
export function plannedRevisionId(eventId: string): string | null {
  if (!eventId.startsWith(PREFIX)) return null;
  return eventId.slice(PREFIX.length).replace(/-\d+$/, "");
}

/**
 * The planned sessions, as agenda events of kind « revision », for every
 * interro from today on. A day with no free slot before 20:30 gets none.
 */
export function planSessions(events: AgendaEvent[], exams: AgendaExam[], today: string, level = "college"): AgendaEvent[] {
  const length = SESSION_MINUTES[level] ?? 20;
  const planned: AgendaEvent[] = [];
  const upcoming = exams.filter((x) => x.day > today).sort((a, b) => a.day.localeCompare(b.day));
  for (const exam of upcoming) {
    for (const offset of PLAN_OFFSETS) {
      const day = addDays(exam.day, -offset);
      if (day < today) continue;
      const wd = weekdayOf(day);
      // Busy times that day: the timetable, one-off events, and sessions already planned.
      const busy = [...events, ...planned]
        .filter((e) => (e.weekday !== null ? e.weekday === wd : e.day === day))
        .map((e) => [toMin(e.start), toMin(e.end)] as const)
        .sort((a, b) => a[0] - b[0]);
      let start = wd >= 5 ? WEEKEND_FROM : WEEKDAY_FROM;
      for (const [s, e] of busy) {
        if (e <= start - GAP) continue;
        if (s >= start + length) break;
        start = Math.max(start, e + GAP);
      }
      if (start + length > LATEST_END) continue;
      planned.push({
        id: `${PREFIX}${exam.id}-${offset}`,
        title: `Réviser : ${exam.title}`,
        kind: "revision",
        weekday: null,
        day,
        start: toHHMM(start),
        end: toHHMM(start + length),
        room: "",
        createdBy: "enfant",
        source: "cervelle",
        synced: false,
      });
    }
  }
  return planned;
}
