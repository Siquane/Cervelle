import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { api } from "../api/client";
import { useSession } from "../state/session";
import { clearWidgets, refreshWidgets } from "../widgets/handler";
import { DEFAULT_PREFS, EXPRESS_ACTION, EXPRESS_CATEGORY, planReminders, safeRoute, type ReminderPrefs, type RemindersData } from "./reminders";

// Notifications de l'ENFANT, seulement sur son propre téléphone (session
// « enfant ») : un parent qui ouvre l'espace d'un enfant ne reçoit rien.
//   - rappels datés : programmés ici (voir reminders.ts), recalculés à chaque
//     ouverture de l'appli et après chaque séance ;
//   - « Tes fiches sont prêtes » : envoyé par le serveur, il faut le jeton
//     Expo du téléphone (et Firebase dans l'APK).

/** Même nom que CERVELLE_CHANNEL côté serveur. */
export const CHANNEL = "revisions";
const PREFS_KEY = "cervelle.reminders";
const ASKED_KEY = "cervelle.notifAsked";

const store = {
  get: (k: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.getItem(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.setItem(k, v)) : SecureStore.setItemAsync(k, v)),
};

interface PrefsState {
  prefs: ReminderPrefs;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<ReminderPrefs>) => Promise<void>;
}

export const useReminderPrefs = create<PrefsState>((set, get) => ({
  prefs: DEFAULT_PREFS,
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    let prefs = DEFAULT_PREFS;
    try {
      const raw = await store.get(PREFS_KEY);
      if (raw) prefs = { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ReminderPrefs>) };
    } catch {
      prefs = DEFAULT_PREFS;
    }
    set({ prefs, loaded: true });
  },
  update: async (patch) => {
    const prefs = { ...get().prefs, ...patch };
    set({ prefs });
    await store.set(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
    void syncNotifications();
  },
}));

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

const isChild = () => useSession.getState().session?.kind === "child";

export async function notificationsAllowed(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Demande l'autorisation ; `force` = l'enfant a touché un interrupteur (sinon une seule fois). */
export async function askPermission(force = false): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!force && (await store.get(ASKED_KEY))) return false;
  await store.set(ASKED_KEY, "1").catch(() => {});
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function setupChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Révisions et interros", importance: Notifications.AndroidImportance.HIGH });
  await Notifications.setNotificationCategoryAsync(EXPRESS_CATEGORY, [{ identifier: EXPRESS_ACTION, buttonTitle: "Révision express", options: { opensAppToForeground: true } }]);
}

/** Jeton Expo → serveur. Sans Firebase dans l'APK, Expo n'en donne pas : on n'envoie rien. */
async function registerPush(ready: boolean, allowed: boolean) {
  let token: string | null = null;
  if (allowed) {
    try {
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    } catch {
      return;
    }
  }
  await api.put("/cervelle/child/push", { token, readyAlert: ready }).catch(() => {});
}

let running: Promise<void> | null = null;
let again = false;

/** Recalcule tous les rappels et met à jour le jeton. Appels simultanés regroupés. */
export function syncNotifications(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function syncOnce() {
  if (Platform.OS === "web" || !isChild()) return;
  void refreshWidgets();
  await useReminderPrefs.getState().load();
  const { prefs } = useReminderPrefs.getState();
  const allowed = await notificationsAllowed();
  await setupChannel().catch(() => {});
  await registerPush(prefs.ready, allowed);
  if (!allowed) {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    return;
  }
  let data: RemindersData;
  try {
    data = await api.get<RemindersData>("/cervelle/learners/me/reminders");
  } catch {
    return; // Hors connexion : on garde les rappels déjà programmés.
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of planReminders(data, prefs)) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body, data: { url: r.url, revisionId: r.revisionId ?? null }, sound: "default", ...(r.category ? { categoryIdentifier: r.category } : {}) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL },
    });
  }
}

/** Déconnexion : plus aucun rappel sur ce téléphone. */
export async function clearNotifications() {
  if (Platform.OS === "web") return;
  void clearWidgets().catch(() => {});
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

function openFrom(response: Notifications.NotificationResponse | null, lid: string) {
  if (!response) return;
  const data = response.notification.request.content.data as { url?: unknown; revisionId?: unknown } | undefined;
  let url = safeRoute(data?.url);
  if (response.actionIdentifier === EXPRESS_ACTION && typeof data?.revisionId === "string") url = safeRoute(`/quiz?mode=express&revisionId=${data.revisionId}`);
  if (!url) return;
  const [pathname, query = ""] = url.split("?");
  const params: Record<string, string> = { lid };
  for (const pair of query.split("&").filter(Boolean)) {
    const [k, v = ""] = pair.split("=");
    params[k] = v;
  }
  router.push({ pathname: pathname as never, params });
  Notifications.clearLastNotificationResponse();
}

/** Dans l'espace élève : autorisation, programmation, et ouverture de l'écran au toucher. */
export function useChildNotifications(lid: string) {
  const child = useSession((s) => s.session?.kind === "child");
  useEffect(() => {
    if (!child || Platform.OS === "web") return;
    askPermission().finally(() => void syncNotifications());
    openFrom(Notifications.getLastNotificationResponse(), lid);
    const tap = Notifications.addNotificationResponseReceivedListener((r) => openFrom(r, lid));
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void syncNotifications();
      // En quittant l'appli : les widgets montrent ce qui vient d'être fait.
      else if (s === "background") void refreshWidgets();
    });
    return () => {
      tap.remove();
      sub.remove();
    };
  }, [child, lid]);
}

// ── Parent : « Le bilan de la semaine est prêt », chaque dimanche à 18 h ──

const WEEKLY_ID = "cervelle-weekly-report";

/** Dans l'espace parent : programme le rappel hebdo (une seule fois, répété par le système) et ouvre le bilan au toucher. */
export function useParentWeeklyReminder() {
  const parent = useSession((s) => s.session?.kind === "parent");
  useEffect(() => {
    if (!parent || Platform.OS === "web") return;
    (async () => {
      if (!(await askPermission())) return;
      await setupChannel().catch(() => {});
      const planned = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      if (planned.some((n) => n.identifier === WEEKLY_ID)) return;
      await Notifications.scheduleNotificationAsync({
        identifier: WEEKLY_ID,
        content: { title: "Le bilan de la semaine est prêt", body: "Temps de révision, notions à revoir, interros à venir : jette un œil.", data: { url: "/parent/bilan" }, sound: "default" },
        // weekday : 1 = dimanche (calendrier du système).
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 18, minute: 0, channelId: CHANNEL },
      });
    })().catch(() => {});
    const open = (r: Notifications.NotificationResponse | null) => {
      const url = (r?.notification.request.content.data as { url?: unknown } | undefined)?.url;
      if (url !== "/parent/bilan") return;
      router.push("/parent/bilan");
      Notifications.clearLastNotificationResponse();
    };
    open(Notifications.getLastNotificationResponse());
    const tap = Notifications.addNotificationResponseReceivedListener(open);
    return () => tap.remove();
  }, [parent]);
}
