import type { AgendaEvent } from "../../api/types";
import { planSessions, plannedRevisionId } from "../plan";

const ev = (p: Partial<AgendaEvent>): AgendaEvent => ({ id: "e", title: "Cours", kind: "cours", weekday: null, day: null, start: "08:00", end: "09:00", room: "", createdBy: "enfant", source: "cervelle", synced: false, ...p });

// 2026-11-18 is a Wednesday (weekday 2).
const today = "2026-11-18";

describe("planning automatique", () => {
  it("spreads sessions 7, 4, 2 and 1 days before, skipping the past", () => {
    const plan = planSessions([], [{ id: "r1", title: "Les volcans", subject: "SVT", day: "2026-11-24" }], today);
    // J-7 (11-17) is past; J-4 = Fri 11-20, J-2 = Sun 11-22, J-1 = Mon 11-23.
    expect(plan.map((p) => [p.day, p.start, p.end])).toEqual([
      ["2026-11-20", "17:00", "17:20"],
      ["2026-11-22", "10:00", "10:20"],
      ["2026-11-23", "17:00", "17:20"],
    ]);
    expect(plan[0]).toMatchObject({ kind: "revision", title: "Réviser : Les volcans" });
    expect(plannedRevisionId(plan[0].id)).toBe("r1");
    expect(plannedRevisionId("abc")).toBeNull();
  });

  it("goes after lessons and activities, and lasts by school level", () => {
    const events = [ev({ weekday: 4, start: "15:00", end: "17:30" }), ev({ day: "2026-11-20", start: "17:45", end: "18:30", kind: "activite" })];
    const plan = planSessions(events, [{ id: "r1", title: "Maths", subject: "Maths", day: "2026-11-24" }], today, "lycee");
    // Friday: lesson until 17:30, activity 17:45–18:30 → 18:45, 30 min for a lycéen.
    expect(plan[0]).toMatchObject({ day: "2026-11-20", start: "18:45", end: "19:15" });
  });

  it("does not stack two interros on the same slot, and drops a full day", () => {
    const exams = [
      { id: "a", title: "A", subject: "", day: "2026-11-21" },
      { id: "b", title: "B", subject: "", day: "2026-11-21" },
    ];
    const plan = planSessions([], exams, today, "college").filter((p) => p.day === "2026-11-20");
    expect(plan.map((p) => p.start)).toEqual(["17:00", "17:35"]);
    const full = [ev({ day: "2026-11-20", start: "16:00", end: "21:00" })];
    expect(planSessions(full, exams, today).some((p) => p.day === "2026-11-20")).toBe(false);
  });
});
