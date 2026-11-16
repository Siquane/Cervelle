import { itemsForDay } from "../agenda";
import { addDays, mondayOf, weekOf, weekdayOf } from "../dates";
import { habitRate, habitStreak } from "../habits";
import { computeProfile, QUESTIONS } from "../profile";
import type { AgendaEvent } from "../../api/types";

const ev = (over: Partial<AgendaEvent>): AgendaEvent => ({
  id: "e",
  title: "Français",
  kind: "cours",
  weekday: null,
  day: null,
  start: "08:00",
  end: "09:00",
  room: "",
  createdBy: "enfant",
  source: "cervelle",
  synced: false,
  ...over,
});

describe("dates", () => {
  it("starts weeks on Monday", () => {
    expect(mondayOf("2026-11-22")).toBe("2026-11-16");
    expect(weekdayOf("2026-11-16")).toBe(0);
    expect(weekOf("2026-11-18")).toHaveLength(7);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("agenda", () => {
  it("puts weekly slots on their weekday, one-off slots on their date, tests first", () => {
    const events = [ev({ id: "a", weekday: 0, start: "10:00" }), ev({ id: "b", weekday: 0, start: "08:00" }), ev({ id: "c", day: "2026-11-17" })];
    const monday = itemsForDay(events, [{ id: "r", title: "Fractions", subject: "Maths", day: "2026-11-16" }], "2026-11-16");
    expect(monday.map((i) => i.key)).toEqual(["exam-r", "b", "a"]);
    expect(itemsForDay(events, [], "2026-11-17").map((i) => i.key)).toEqual(["c"]);
    expect(itemsForDay(events, [], "2026-11-23").map((i) => i.key)).toEqual(["b", "a"]);
  });
});

describe("habits", () => {
  it("counts planned days in a row, and today only once it's ticked", () => {
    // Mondays and Wednesdays.
    const days = [0, 2];
    expect(habitStreak(["2026-11-11", "2026-11-16"], days, "2026-11-17")).toBe(2);
    expect(habitStreak(["2026-11-09", "2026-11-11"], days, "2026-11-16")).toBe(2);
    expect(habitStreak(["2026-11-09"], days, "2026-11-16")).toBe(0);
    expect(habitRate(["2026-11-16"], [0], "2026-11-16", 14)).toBe(50);
    // Created today and ticked: 100 %, not 3 %.
    expect(habitRate(["2026-11-16"], [0, 1, 2, 3, 4, 5, 6], "2026-11-16", 30, "2026-11-16")).toBe(100);
  });
});

describe("profile", () => {
  it("finds what's hardest and the methods that help", () => {
    // Agrees with every « hard » sentence about getting started, fine elsewhere.
    const answers = QUESTIONS.map((q) => (q.dim === "motivation" ? 3 : q.hard ? 0 : 3));
    const r = computeProfile(answers);
    expect(r.profile).toBe("marmotte");
    expect(r.scores.motivation).toBe(100);
    expect(r.scores.memoire).toBe(0);
    expect(["pomodoro", "petites_etapes", "routine", "defi"]).toContain(r.methods[0].id);
    expect(r.methods).toHaveLength(6);
    expect(r.methods[0].fit).toBeGreaterThanOrEqual(r.methods[5].fit);
    // Nothing hard: the owl.
    expect(computeProfile(QUESTIONS.map((q) => (q.hard ? 0 : 3))).profile).toBe("hibou");
  });
});

import { useTimer } from "../../state/timer";

describe("timer", () => {
  it("counts only the focus time actually run, pauses included", () => {
    jest.useFakeTimers({ now: 1_000_000 });
    const t = useTimer.getState();
    t.startFocus(25);
    jest.setSystemTime(1_000_000 + 10 * 60_000);
    useTimer.getState().pause();
    jest.setSystemTime(1_000_000 + 30 * 60_000);
    useTimer.getState().resume();
    jest.setSystemTime(1_000_000 + 35 * 60_000);
    expect(useTimer.getState().stop()).toBe(15 * 60);
    // Left running past the end: capped at the planned length.
    useTimer.getState().startFocus(15);
    jest.setSystemTime(1_000_000 + 3 * 3600_000);
    expect(useTimer.getState().stop()).toBe(15 * 60);
    jest.useRealTimers();
  });
});
