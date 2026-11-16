import { DEFAULT_PREFS, examName, planReminders, safeRoute, type RemindersData } from "../reminders";

// Lundi 16 novembre 2026, 10 h (heure du téléphone).
const NOW = new Date(2026, 10, 16, 10, 0);
const empty: RemindersData = { exams: [], reviewNow: 0, reviewDue: [] };
const exam = { revisionId: "rev1", title: "Le système solaire", subject: "Histoire", examDate: "2026-11-20" };

describe("planReminders", () => {
  it("prévient 3 jours avant et la veille à 18 h, avec la révision express", () => {
    const plan = planReminders({ ...empty, exams: [exam] }, DEFAULT_PREFS, NOW);
    expect(plan.map((r) => [r.id, r.at])).toEqual([
      ["j3:rev1", new Date(2026, 10, 17, 17, 30)],
      ["veille:rev1", new Date(2026, 10, 19, 18, 0)],
    ]);
    expect(plan[0].body).toBe("L'interro d'histoire, c'est dans 3 jours. Une petite révision ?");
    expect(plan[1]).toMatchObject({ category: "veille", url: "/quiz?mode=express&revisionId=rev1" });
  });

  it("ne programme rien dans le passé", () => {
    const plan = planReminders({ ...empty, exams: [{ ...exam, examDate: "2026-11-17" }] }, DEFAULT_PREFS, NOW);
    expect(plan.map((r) => r.id)).toEqual(["veille:rev1"]);
    expect(planReminders({ ...empty, exams: [{ ...exam, examDate: "2026-11-16" }] }, DEFAULT_PREFS, NOW)).toEqual([]);
  });

  it("rappelle chaque jour les notions À revoir, sauf les jours d'un rappel d'interro", () => {
    const plan = planReminders({ exams: [exam], reviewNow: 2, reviewDue: [] }, DEFAULT_PREFS, NOW);
    const daily = plan.filter((r) => r.id.startsWith("revoir:")).map((r) => r.id);
    // 7 jours à partir d'aujourd'hui, sans le 17 (J-3) ni le 19 (veille).
    expect(daily).toEqual(["revoir:2026-11-16", "revoir:2026-11-18", "revoir:2026-11-20", "revoir:2026-11-21", "revoir:2026-11-22"]);
    expect(plan.find((r) => r.id === "revoir:2026-11-16")!.body).toBe("Tu as 2 notions à revoir. 5 minutes avec Cervelle ?");
  });

  it("compte les notions maîtrisées qui reviennent, à partir du jour où elles reviennent", () => {
    const due = new Date(2026, 10, 18, 9, 0).toISOString();
    const plan = planReminders({ ...empty, reviewDue: [due] }, DEFAULT_PREFS, NOW);
    expect(plan[0]).toMatchObject({ id: "revoir:2026-11-18", body: "Tu as 1 notion à revoir. 5 minutes avec Cervelle ?" });
    expect(plan).toHaveLength(5);
  });

  it("respecte les interrupteurs et l'heure choisie", () => {
    const data = { exams: [exam], reviewNow: 1, reviewDue: [] };
    expect(planReminders(data, { ...DEFAULT_PREFS, exams: false, review: false }, NOW)).toEqual([]);
    const late = planReminders(data, { ...DEFAULT_PREFS, exams: false, time: "19:05" }, NOW);
    expect(late[0].at).toEqual(new Date(2026, 10, 16, 19, 5));
  });
});

describe("examName", () => {
  it("accorde le nom de la matière", () => {
    expect(examName({ title: "", subject: "Mathématiques" })).toBe("l'interro de mathématiques");
    expect(examName({ title: "", subject: "Anglais" })).toBe("l'interro d'anglais");
    expect(examName({ title: "", subject: "SVT" })).toBe("l'interro de SVT");
    expect(examName({ title: "Les volcans", subject: "" })).toBe("l'interro sur « Les volcans »");
  });
});

describe("safeRoute", () => {
  it("n'ouvre que les écrans prévus", () => {
    expect(safeRoute("/revision/ck123")).toBe("/revision/ck123");
    expect(safeRoute("/quiz?mode=express&revisionId=ck123")).toBe("/quiz?mode=express&revisionId=ck123");
    expect(safeRoute("/quiz?mode=a_revoir")).toBe("/quiz?mode=a_revoir");
    expect(safeRoute("/parent")).toBeNull();
    expect(safeRoute("https://exemple.fr")).toBeNull();
    expect(safeRoute(42)).toBeNull();
  });
});
