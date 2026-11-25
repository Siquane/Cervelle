import { DEFAULT_PREFS, NUDGES, dailyNudge, examName, planReminders, safeRoute, type RemindersData } from "../reminders";

// Lundi 16 novembre 2026, 10 h (heure du téléphone).
const NOW = new Date(2026, 10, 16, 10, 0);
// Les petits mots du jour ont leurs propres tests : on les coupe ailleurs.
const PREFS = { ...DEFAULT_PREFS, daily: false };
const empty: RemindersData = { exams: [], reviewNow: 0, reviewDue: [] };
const exam = { revisionId: "rev1", title: "Le système solaire", subject: "Histoire", examDate: "2026-11-20" };

describe("planReminders", () => {
  it("prévient 3 jours avant et la veille à 18 h, avec la révision express", () => {
    const plan = planReminders({ ...empty, exams: [exam] }, PREFS, NOW);
    expect(plan.map((r) => [r.id, r.at])).toEqual([
      ["j3:rev1", new Date(2026, 10, 17, 17, 30)],
      ["veille:rev1", new Date(2026, 10, 19, 18, 0)],
    ]);
    expect(plan[0].body).toBe("L'interro d'histoire, c'est dans 3 jours. Une petite révision ?");
    expect(plan[1]).toMatchObject({ category: "veille", url: "/quiz?mode=express&revisionId=rev1" });
  });

  it("ne programme rien dans le passé", () => {
    const plan = planReminders({ ...empty, exams: [{ ...exam, examDate: "2026-11-17" }] }, PREFS, NOW);
    expect(plan.map((r) => r.id)).toEqual(["veille:rev1"]);
    expect(planReminders({ ...empty, exams: [{ ...exam, examDate: "2026-11-16" }] }, PREFS, NOW)).toEqual([]);
  });

  it("rappelle chaque jour les notions À revoir, sauf les jours d'un rappel d'interro", () => {
    const plan = planReminders({ exams: [exam], reviewNow: 2, reviewDue: [] }, PREFS, NOW);
    const daily = plan.filter((r) => r.id.startsWith("revoir:")).map((r) => r.id);
    // 7 jours à partir d'aujourd'hui, sans le 17 (J-3) ni le 19 (veille).
    expect(daily).toEqual(["revoir:2026-11-16", "revoir:2026-11-18", "revoir:2026-11-20", "revoir:2026-11-21", "revoir:2026-11-22"]);
    expect(plan.find((r) => r.id === "revoir:2026-11-16")!.body).toBe("Tu as 2 notions à revoir. 5 minutes avec Cervelle ?");
  });

  it("compte les notions maîtrisées qui reviennent, à partir du jour où elles reviennent", () => {
    const due = new Date(2026, 10, 18, 9, 0).toISOString();
    const plan = planReminders({ ...empty, reviewDue: [due] }, PREFS, NOW);
    expect(plan[0]).toMatchObject({ id: "revoir:2026-11-18", body: "Tu as 1 notion à revoir. 5 minutes avec Cervelle ?" });
    expect(plan).toHaveLength(5);
  });

  it("respecte les interrupteurs et l'heure choisie", () => {
    const data = { exams: [exam], reviewNow: 1, reviewDue: [] };
    expect(planReminders(data, { ...PREFS, exams: false, review: false }, NOW)).toEqual([]);
    const late = planReminders(data, { ...PREFS, exams: false, time: "19:05" }, NOW);
    expect(late[0].at).toEqual(new Date(2026, 10, 16, 19, 5));
  });
});

describe("petit mot du jour", () => {
  it("écrit chaque jour à partir de demain, sauf les jours qui ont déjà un rappel", () => {
    const plan = planReminders({ exams: [exam], reviewNow: 0, reviewDue: [] }, { ...DEFAULT_PREFS, review: false }, NOW);
    const days = plan.filter((r) => r.id.startsWith("coucou:")).map((r) => r.id);
    // Pas aujourd'hui (l'appli est ouverte), ni le 17 (J-3), ni le 19 (veille).
    expect(days).toEqual(["coucou:2026-11-18", "coucou:2026-11-20", "coucou:2026-11-21", "coucou:2026-11-22"]);
    const first = plan.find((r) => r.id === "coucou:2026-11-18")!;
    expect(first.at).toEqual(new Date(2026, 10, 18, 17, 30));
    expect(first.url).toBe("");
    expect(NUDGES).toContainEqual({ title: first.title, body: first.body });
  });

  it("ne double pas le rappel des notions à revoir", () => {
    const plan = planReminders({ ...empty, reviewNow: 3 }, DEFAULT_PREFS, NOW);
    expect(plan.filter((r) => r.id.startsWith("coucou:"))).toEqual([]);
  });

  it("change de mot d'un jour à l'autre et se coupe", () => {
    expect(dailyNudge(new Date(2026, 10, 18, 9))).toEqual(dailyNudge(new Date(2026, 10, 18, 20)));
    expect(dailyNudge(new Date(2026, 10, 18))).not.toEqual(dailyNudge(new Date(2026, 10, 19)));
    expect(planReminders(empty, { ...DEFAULT_PREFS, daily: false }, NOW)).toEqual([]);
  });

  it("parle du calendrier de l'Avent du 1er au 24 décembre", () => {
    expect(dailyNudge(new Date(2026, 11, 3)).title).toContain("Case 3");
    expect(dailyNudge(new Date(2026, 11, 25)).title).not.toContain("Case");
    expect(dailyNudge(new Date(2026, 10, 30)).title).not.toContain("Case");
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
