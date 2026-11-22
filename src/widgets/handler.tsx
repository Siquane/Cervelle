import { Platform } from "react-native";
import { requestWidgetUpdate, type WidgetTaskHandlerProps } from "react-native-android-widget";
import { forgetWidgetData, loadWidgetState, toggleFlip } from "./data";
import { renderWidgetFor, WIDGETS } from "./views";

// Appelé par Android (hors de l'appli) : widget ajouté, mise à jour toutes les
// 30 minutes, redimensionné, ou touché (« FLIP » retourne la carte du jour).
export async function widgetTaskHandler({ widgetInfo, widgetAction, clickAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === "WIDGET_DELETED") return;
  if (widgetAction === "WIDGET_CLICK" && clickAction === "FLIP") {
    const state = await loadWidgetState(false);
    if (state.kind === "ready") state.flipped = toggleFlip(state.data);
    renderWidget(renderWidgetFor(widgetInfo.widgetName, state, widgetInfo));
    return;
  }
  // Redimensionné : pas besoin de redemander au serveur.
  const state = await loadWidgetState(widgetAction !== "WIDGET_RESIZED");
  renderWidget(renderWidgetFor(widgetInfo.widgetName, state, widgetInfo));
}

let pending: Promise<void> | null = null;

/** Depuis l'appli : redessine tous les widgets posés (après une séance, en quittant l'appli…). */
export function refreshWidgets(): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  pending ??= (async () => {
    try {
      const state = await loadWidgetState(true);
      await Promise.all(WIDGETS.map((name) => requestWidgetUpdate({ widgetName: name, renderWidget: (info) => renderWidgetFor(name, state, info) }).catch(() => {})));
    } catch {
      // Un widget en retard n'est pas grave.
    } finally {
      pending = null;
    }
  })();
  return pending;
}

/** Déconnexion : les widgets oublient l'enfant. */
export async function clearWidgets() {
  if (Platform.OS !== "android") return;
  forgetWidgetData();
  await Promise.all(WIDGETS.map((name) => requestWidgetUpdate({ widgetName: name, renderWidget: () => renderWidgetFor(name, { kind: "signedOut" }) }).catch(() => {})));
}
