// Rappels de l'enfant, programmés sur son téléphone (notifications locales) :
//   - 3 jours avant une interro, à l'heure choisie par l'enfant ;
//   - la veille d'une interro, à 18 h, avec un bouton « Révision express » ;
//   - chaque jour à l'heure choisie, s'il reste des notions « À revoir » ;
//   - les jours suivants, un petit mot de Cervelle si l'enfant n'a pas ouvert
//     l'appli (chaque ouverture recalcule tout : le mot du jour n'existe plus).
// Le calcul est ici, sans dépendance à Expo, pour être testé.
// « Tes fiches sont prêtes » vient du serveur (notification push).

export interface RemindersData {
  exams: { revisionId: string; title: string; subject: string; examDate: string }[];
  /** Notions « À revoir » maintenant. */
  reviewNow: number;
  /** Moments (ISO) où des notions maîtrisées repasseront « À revoir ». */
  reviewDue: string[];
}

export interface ReminderPrefs {
  /** J-3 et veille d'interro. */
  exams: boolean;
  /** Rappel quotidien des notions « À revoir ». */
  review: boolean;
  /** Heure du rappel quotidien et du J-3, « HH:MM ». */
  time: string;
  /** « Tes fiches sont prêtes » (envoyé par le serveur). */
  ready: boolean;
  /** Petit mot quotidien si l'appli n'a pas été ouverte de la journée. */
  daily: boolean;
}

export const DEFAULT_PREFS: ReminderPrefs = { exams: true, review: true, time: "17:30", ready: true, daily: true };

export const EVE_HOUR = 18;
/** Jours à l'avance pour le rappel quotidien (le téléphone recalcule à chaque ouverture). */
export const REVIEW_DAYS = 7;
/** Bouton de la notification de la veille. */
export const EXPRESS_CATEGORY = "veille";
export const EXPRESS_ACTION = "express";

export interface PlannedReminder {
  id: string;
  at: Date;
  title: string;
  body: string;
  /** Écran ouvert par un appui (expo-router). */
  url: string;
  category?: typeof EXPRESS_CATEGORY;
  revisionId?: string;
}

function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map(Number);
  return { h: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 17, m: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 30 };
}

/** Jour « AAAA-MM-JJ » moins n jours, à l'heure donnée, en heure locale du téléphone. */
function localMoment(day: string, minusDays: number, h: number, m: number): Date {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(y, mo - 1, d - minusDays, h, m, 0, 0);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** « l'interro de maths », ou « l'interro sur Le système solaire » sans matière. */
export function examName(e: { title: string; subject: string }): string {
  let subject = e.subject.trim();
  if (subject) {
    // « Histoire » → « histoire », mais « SVT » reste en capitales.
    if (subject.length > 1 && subject[1] === subject[1].toLowerCase()) subject = subject[0].toLowerCase() + subject.slice(1);
    return /^[aeiouyhéèêàâîôû]/i.test(subject) ? `l'interro d'${subject}` : `l'interro de ${subject}`;
  }
  return e.title.trim() ? `l'interro sur « ${e.title.trim()} »` : "ton interro";
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function planReminders(data: RemindersData, prefs: ReminderPrefs, now: Date = new Date()): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  const { h, m } = parseTime(prefs.time);
  const examDays = new Set<string>();

  if (prefs.exams) {
    for (const e of data.exams) {
      const name = examName(e);
      const j3 = localMoment(e.examDate, 3, h, m);
      if (j3 > now) {
        out.push({ id: `j3:${e.revisionId}`, at: j3, title: "Interro dans 3 jours", body: `${capital(name)}, c'est dans 3 jours. Une petite révision ?`, url: `/revision/${e.revisionId}`, revisionId: e.revisionId });
        examDays.add(dayKey(j3));
      }
      const eve = localMoment(e.examDate, 1, EVE_HOUR, 0);
      if (eve > now) {
        out.push({
          id: `veille:${e.revisionId}`,
          at: eve,
          title: "Interro demain !",
          body: `${capital(name)}, c'est demain. 5 minutes de révision express ?`,
          url: `/quiz?mode=express&revisionId=${e.revisionId}`,
          category: EXPRESS_CATEGORY,
          revisionId: e.revisionId,
        });
        examDays.add(dayKey(eve));
      }
    }
  }

  if (prefs.review) {
    const due = data.reviewDue.map((s) => new Date(s).getTime()).filter(Number.isFinite);
    for (let i = 0; i < REVIEW_DAYS; i++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0, 0);
      // Pas deux rappels le même jour : celui de l'interro suffit.
      if (at <= now || examDays.has(dayKey(at))) continue;
      const count = data.reviewNow + due.filter((t) => t <= at.getTime()).length;
      if (count === 0) continue;
      out.push({
        id: `revoir:${dayKey(at)}`,
        at,
        title: "Des notions à revoir",
        body: count === 1 ? "Tu as 1 notion à revoir. 5 minutes avec Cervelle ?" : `Tu as ${count} notions à revoir. 5 minutes avec Cervelle ?`,
        url: "/quiz?mode=a_revoir",
      });
    }
  }

  if (prefs.daily) {
    const taken = new Set(out.map((r) => dayKey(r.at)));
    // À partir de demain : si l'enfant ouvre Cervelle aujourd'hui, tout est recalculé.
    for (let i = 1; i < REVIEW_DAYS; i++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0, 0);
      const key = dayKey(at);
      if (taken.has(key)) continue;
      const nudge = dailyNudge(at);
      out.push({ id: `coucou:${key}`, at, ...nudge, url: "" });
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Petits mots du jour : l'effort et la régularité, jamais la note. */
export const NUDGES: { title: string; body: string }[] = [
  { title: "⏰ C'est l'heure de Cervelle", body: "5 minutes aujourd'hui, et ta tête est prête pour la semaine ⭐" },
  { title: "🧠 Cervelle s'ennuie un peu…", body: "Elle t'attend pour une petite révision. On y va ?" },
  { title: "🔥 Garde ton rythme", body: "Un petit quiz chaque jour, c'est comme ça qu'on retient." },
  { title: "🌟 Une étoile t'attend", body: "Révise un peu et avance sur ton chemin d'étoiles." },
  { title: "🎯 Tes missions du jour", body: "Elles t'attendent. 5 minutes, et c'est fait !" },
  { title: "📚 Petit coucou de Cervelle", body: "Ce que tu revois aujourd'hui, tu t'en souviendras demain." },
  { title: "💪 Tu peux le faire", body: "Un petit pas chaque jour, et tu apprends plein de choses." },
];

/** Du 1er au 24 décembre : le calendrier de l'Avent. */
export function adventNudge(day: Date): { title: string; body: string } | null {
  if (day.getMonth() !== 11 || day.getDate() > 24) return null;
  return { title: `🎁 Case ${day.getDate()} du calendrier`, body: "Une petite révision et elle s'ouvre. Qu'est-ce qui se cache derrière ?" };
}

/** Le même jour donne toujours le même mot ; deux jours qui se suivent, deux mots différents. */
export function dailyNudge(day: Date): { title: string; body: string } {
  const advent = adventNudge(day);
  if (advent) return advent;
  const n = Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86_400_000);
  return NUDGES[((n % NUDGES.length) + NUDGES.length) % NUDGES.length];
}

// Seuls ces écrans peuvent être ouverts depuis une notification.
const ALLOWED = /^\/(apprends|revision\/[A-Za-z0-9_-]{1,40}|quiz\?mode=(a_revoir|express(&revisionId=[A-Za-z0-9_-]{1,40})?))$/;

export function safeRoute(url: unknown): string | null {
  return typeof url === "string" && ALLOWED.test(url) ? url : null;
}
