import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { api } from "../api/client";
import { useSession } from "../state/session";
import type { ParentWidgetData } from "./data";
import { refreshParentWidget } from "./handler";

/** Espace parent : met à jour le widget parent à l'ouverture et en quittant l'appli. */
export function useParentWidget() {
  const parent = useSession((s) => s.session?.kind === "parent");
  useEffect(() => {
    if (!parent || Platform.OS !== "android") return;
    const update = () => {
      api
        .get<ParentWidgetData>("/cervelle/widget/parent")
        .then(refreshParentWidget)
        .catch(() => {});
    };
    update();
    const sub = AppState.addEventListener("change", (s) => (s === "active" || s === "background") && update());
    return () => sub.remove();
  }, [parent]);
}
