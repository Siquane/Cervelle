const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « 12 nov » from « 2026-11-12 » or an ISO date. */
export function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function longDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/** « 21 min », « 1 h 05 ». */
export function duration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

/** Days from today to a « YYYY-MM-DD » date (0 = today). */
export function daysUntil(day: string): number {
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = day.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - a) / 86_400_000);
}

export function whenLabel(day: string): string {
  const n = daysUntil(day);
  if (n === 0) return "aujourd'hui";
  if (n === 1) return "demain";
  if (n > 1 && n < 7) return `dans ${n} jours`;
  return `le ${shortDate(day)}`;
}

export const LEVEL_LABEL: Record<string, string> = {
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
  superieur: "Études sup.",
  adulte: "Adulte",
};

export const MODE_LABEL: Record<string, string> = {
  fiches: "Fiches",
  qcm: "Quiz",
  cartes: "Fiches-questions",
  interro: "Interro",
  a_revoir: "À revoir",
  express: "Révision express",
  boss: "Combat de boss",
  minuteur: "Minuteur",
};

/** Today in the phone's zone, « YYYY-MM-DD ». */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** « de Léo », mais « d'Anaïs » / « d'Élise » devant un prénom qui commence par une voyelle. */
export function de(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(name.trim()) ? `d'${name.trim()}` : `de ${name.trim()}`;
}
