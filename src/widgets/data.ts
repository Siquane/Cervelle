import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import { API_URL } from "../state/session";

// Ce qu'affichent les widgets de l'écran d'accueil (Android). Le widget vit
// hors de l'appli : il lit la session enregistrée, demande au serveur, et
// garde la dernière réponse pour rester affiché sans connexion.

export interface WidgetData {
  /** Jour « AAAA-MM-JJ » de la réponse (heure de Paris). */
  day: string;
  name: string;
  streak: number;
  studiedToday: boolean;
  /** Lundi → dimanche (absent d'un ancien cache). */
  week?: { day: string; done: boolean; today: boolean }[];
  equipped: string[];
  missions: { done: number; total: number; chestOpened: boolean };
  stars: { total: number; end: number };
  exam: { revisionId: string; title: string; subject: string; examDate: string; daysLeft: number; mastered: number; notions: number; progress: number } | null;
  card: { front: string; back: string; revisionId: string; title: string } | null;
  /** Absents d'un ancien cache : lire avec `?.`. */
  timer?: { focus: number; weekMinutes: number };
  friends?: { cheers: number; lastCheer: { fromName: string; emoji: string } | null; invites: number; challenge: { otherName: string; myMinutes: number; theirMinutes: number } | null };
}

/** Ce que le widget sait : rien (pas connecté en enfant), ou les dernières données. */
export type WidgetState = { kind: "signedOut" } | { kind: "ready"; data: WidgetData; flipped: boolean };

const SESSION_KEY = "cervelle.session";
const cache = () => new File(Paths.document, "widget.json");
const flipFile = () => new File(Paths.document, "widget-flip.json");

export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function childToken(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    const s = raw ? (JSON.parse(raw) as { kind?: string; token?: string }) : null;
    return s?.kind === "child" && s.token ? s.token : null;
  } catch {
    return null;
  }
}

function readCache(): WidgetData | null {
  try {
    const f = cache();
    return f.exists ? (JSON.parse(f.textSync()) as WidgetData) : null;
  } catch {
    return null;
  }
}

/** Une donnée d'hier ne dit rien d'aujourd'hui : série à confirmer, missions à zéro. */
export function forToday(data: WidgetData, today = localDay()): WidgetData {
  if (data.day === today) return data;
  const monday = data.week?.[0]?.day;
  const sameWeek = !!monday && daysBetween(monday, today) >= 0 && daysBetween(monday, today) < 7;
  const week = sameWeek ? data.week!.map((d) => ({ ...d, today: d.day === today })) : undefined;
  return { ...data, week, studiedToday: false, missions: { ...data.missions, done: 0, chestOpened: false }, exam: data.exam && { ...data.exam, daysLeft: daysBetween(today, data.exam.examDate) } };
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** La carte mémoire : face visible tant que l'enfant ne l'a pas retournée aujourd'hui. */
function readFlipped(data: WidgetData): boolean {
  try {
    const f = flipFile();
    if (!f.exists) return false;
    const saved = JSON.parse(f.textSync()) as { day?: string; front?: string; flipped?: boolean };
    return saved.day === localDay() && saved.front === data.card?.front && !!saved.flipped;
  } catch {
    return false;
  }
}

export function toggleFlip(data: WidgetData): boolean {
  const flipped = !readFlipped(data);
  try {
    flipFile().write(JSON.stringify({ day: localDay(), front: data.card?.front ?? "", flipped }));
  } catch {
    // Pas grave : la carte se retournera quand même à l'écran.
  }
  return flipped;
}

/** Demande au serveur (sinon garde le cache) ; `fresh: false` lit seulement le cache. */
export async function loadWidgetState(fresh = true): Promise<WidgetState> {
  const token = await childToken();
  if (!token) return { kind: "signedOut" };
  let data = readCache();
  if (fresh || !data) {
    try {
      const res = await fetch(`${API_URL}/cervelle/learners/me/widget`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return { kind: "signedOut" };
      if (res.ok) {
        data = (await res.json()) as WidgetData;
        try {
          cache().write(JSON.stringify(data));
        } catch {
          // Le cache n'est qu'un secours.
        }
      }
    } catch {
      // Hors connexion : on garde le cache.
    }
  }
  if (!data) return { kind: "signedOut" };
  data = forToday(data);
  return { kind: "ready", data, flipped: readFlipped(data) };
}

/** Déconnexion : le widget oublie tout. */
export function forgetWidgetData() {
  for (const f of [cache(), flipFile()]) {
    try {
      if (f.exists) f.delete();
    } catch {
      // rien
    }
  }
}

// ── Widget parent : chaque enfant, sur le téléphone du parent ──

export interface ParentWidgetData {
  day: string;
  children: { id: string; name: string; streak: number; studiedToday: boolean; equipped: string[]; exam: WidgetData["exam"] }[];
}

export type ParentWidgetState = { kind: "signedOut" } | { kind: "ready"; data: ParentWidgetData };

const parentCache = () => new File(Paths.document, "widget-parent.json");

export function saveParentData(data: ParentWidgetData) {
  try {
    parentCache().write(JSON.stringify(data));
  } catch {
    // Le cache n'est qu'un secours.
  }
}

/** Ce qui date d'hier ne dit rien d'aujourd'hui. */
function parentForToday(data: ParentWidgetData, today = localDay()): ParentWidgetData {
  if (data.day === today) return data;
  return { ...data, children: data.children.map((c) => ({ ...c, studiedToday: false, exam: c.exam && { ...c.exam, daysLeft: daysBetween(today, c.exam.examDate) } })) };
}

/**
 * Hors de l'appli, le widget n'essaie que le jeton d'accès déjà enregistré :
 * le renouveler ici pourrait déconnecter l'appli (un jeton de renouvellement
 * ne sert qu'une fois). L'appli met le widget à jour à chaque ouverture.
 */
export async function loadParentState(fresh = true): Promise<ParentWidgetState> {
  let session: { kind?: string; accessToken?: string } | null = null;
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    session = raw ? JSON.parse(raw) : null;
  } catch {
    session = null;
  }
  if (session?.kind !== "parent" || !session.accessToken) return { kind: "signedOut" };
  let data: ParentWidgetData | null = null;
  try {
    const f = parentCache();
    data = f.exists ? (JSON.parse(f.textSync()) as ParentWidgetData) : null;
  } catch {
    data = null;
  }
  if (fresh) {
    try {
      const res = await fetch(`${API_URL}/cervelle/widget/parent`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (res.ok) {
        data = (await res.json()) as ParentWidgetData;
        saveParentData(data);
      }
    } catch {
      // Hors connexion : on garde le cache.
    }
  }
  return data ? { kind: "ready", data: parentForToday(data) } : { kind: "signedOut" };
}

export function forgetParentData() {
  try {
    const f = parentCache();
    if (f.exists) f.delete();
  } catch {
    // rien
  }
}

// ── Style de chaque widget posé (couleur, clair, sombre), choisi en le posant ──

export type StoredStyle = "couleur" | "clair" | "sombre";
const stylesFile = () => new File(Paths.document, "widget-styles.json");

function readStyles(): Record<string, StoredStyle> {
  try {
    const f = stylesFile();
    return f.exists ? (JSON.parse(f.textSync()) as Record<string, StoredStyle>) : {};
  } catch {
    return {};
  }
}

export function widgetStyleOf(widgetId: number): StoredStyle {
  const s = readStyles()[String(widgetId)];
  return s === "clair" || s === "sombre" ? s : "couleur";
}

export function setWidgetStyle(widgetId: number, style: StoredStyle) {
  try {
    stylesFile().write(JSON.stringify({ ...readStyles(), [String(widgetId)]: style }));
  } catch {
    // Pas grave : le widget restera en couleur.
  }
}
