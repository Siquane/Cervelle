import { addDays, weekdayOf } from "./dates";

/**
 * Planned days in a row that were ticked, going back from today. Today only
 * breaks the streak once it's over: not ticked yet this morning is fine.
 */
export function habitStreak(checked: string[], days: number[], today: string): number {
  const done = new Set(checked);
  let n = 0;
  let d = done.has(today) ? today : addDays(today, -1);
  for (let i = 0; i < 60; i++, d = addDays(d, -1)) {
    if (!days.includes(weekdayOf(d))) continue;
    if (!done.has(d)) break;
    n++;
  }
  return n;
}

/**
 * Share of the planned days ticked over the last `span` days (today included),
 * in percent — only since the habit exists, so a new one doesn't start at 3 %.
 */
export function habitRate(checked: string[], days: number[], today: string, span = 30, since = ""): number {
  const done = new Set(checked);
  let planned = 0;
  let hit = 0;
  for (let i = 0; i < span; i++) {
    const d = addDays(today, -i);
    if (d < since) break;
    if (!days.includes(weekdayOf(d))) continue;
    planned++;
    if (done.has(d)) hit++;
  }
  return planned ? Math.round((hit / planned) * 100) : 0;
}

export const HABIT_EMOJIS = ["📖", "💧", "😴", "🏃", "🧘", "🎹", "✏️", "🍎", "🧹", "📵", "🌙", "⭐"];
export const HABIT_IDEAS = [
  { title: "Lire 20 min", emoji: "📖" },
  { title: "Boire de l'eau", emoji: "💧" },
  { title: "8 h de sommeil", emoji: "😴" },
  { title: "20 min de sport", emoji: "🏃" },
  { title: "Relire mes cours le soir", emoji: "✏️" },
  { title: "Pas d'écran avant le lit", emoji: "📵" },
];
