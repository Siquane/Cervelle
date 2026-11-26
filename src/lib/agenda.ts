import type { AgendaEvent, AgendaExam, EventKind } from "../api/types";
import { color, themed } from "../theme/tokens";
import { weekdayOf } from "./dates";

export const EVENT_KIND: Record<EventKind, { label: string; main: string; soft: string; icon: string }> = themed(() => ({
  cours: { label: "Cours", main: color.sky, soft: color.skySoft, icon: "school" },
  interro: { label: "Interro", main: color.brand, soft: color.brandSoft, icon: "alert-circle" },
  devoir: { label: "Devoir", main: color.sunDark, soft: color.sunSoft, icon: "create" },
  revision: { label: "Révision", main: color.teal, soft: color.tealSoft, icon: "book" },
  // Les mêmes catégories que les tâches de Passerelle (« Activité » s'y appelle « Loisirs »).
  activite: { label: "Loisirs", main: color.violet, soft: color.violetSoft, icon: "football" },
  maison: { label: "Maison", main: color.green, soft: color.greenSoft, icon: "home" },
  sante: { label: "Santé", main: color.red, soft: color.redSoft, icon: "medkit" },
  travail: { label: "Travail", main: color.brandDark, soft: color.corailSoft, icon: "briefcase" },
}));

type KindStyle = { label: string; main: string; soft: string; icon: string };

/** Catégories des tâches de Passerelle (mêmes noms) ; une autre devient « Divers ». */
export const PASSERELLE_CATEGORY: Record<string, KindStyle> = {
  École: { ...EVENT_KIND.cours, label: "École" },
  Travail: EVENT_KIND.travail,
  Maison: EVENT_KIND.maison,
  Santé: EVENT_KIND.sante,
  Loisirs: EVENT_KIND.activite,
};
const DIVERS: KindStyle = themed(() => ({ label: "Divers", main: color.muted, soft: color.chip, icon: "ellipsis-horizontal-circle" }));

/** Ce qui vient de Passerelle garde la catégorie de Passerelle ; le reste, le type choisi dans Cervelle. */
export function styleOf(e: Pick<AgendaEvent, "kind" | "source" | "category">): KindStyle {
  if (e.source === "passerelle") return (e.category && PASSERELLE_CATEGORY[e.category]) || DIVERS;
  return EVENT_KIND[e.kind];
}

export type AgendaItem =
  | { type: "event"; key: string; event: AgendaEvent; start: string; end: string }
  | { type: "exam"; key: string; exam: AgendaExam; start: null; end: null };

/** What happens on one day: weekly slots of that weekday, one-off slots, and the tests of the revisions. */
export function itemsForDay(events: AgendaEvent[], exams: AgendaExam[], day: string): AgendaItem[] {
  const wd = weekdayOf(day);
  const slots: AgendaItem[] = events
    .filter((e) => (e.weekday !== null ? e.weekday === wd : e.day === day))
    .map((e) => ({ type: "event" as const, key: e.id, event: e, start: e.start, end: e.end }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const tests: AgendaItem[] = exams.filter((x) => x.day === day).map((x) => ({ type: "exam" as const, key: `exam-${x.id}`, exam: x, start: null, end: null }));
  return [...tests, ...slots];
}

/** How many things on each day of a week, for the dots under the week strip. */
export function countByDay(events: AgendaEvent[], exams: AgendaExam[], days: string[]): number[] {
  return days.map((d) => itemsForDay(events, exams, d).length);
}

/** Minutes between two « HH:MM ». */
export const minutesBetween = (start: string, end: string) => Number(end.slice(0, 2)) * 60 + Number(end.slice(3)) - (Number(start.slice(0, 2)) * 60 + Number(start.slice(3)));
