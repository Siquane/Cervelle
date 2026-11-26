import { create } from "zustand";
import * as SystemUI from "expo-system-ui";
import { applyScheme, color, scheme, type Scheme } from "../theme/tokens";

// Thème clair ou sombre (Réglages), sans redémarrer l'appli : les couleurs sont
// changées sur place (theme/tokens.ts, applyScheme), puis la racine redessine
// tous les écrans (app/_layout.tsx, clé `version`) et rouvre la page où on était.

interface ThemeState {
  scheme: Scheme;
  /** +1 à chaque changement : la racine s'en sert de clé pour tout redessiner. */
  version: number;
  /** La page à rouvrir une fois tout redessiné (les Réglages). */
  returnTo: string | null;
  setScheme: (next: Scheme, returnTo?: string) => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  scheme,
  version: 0,
  returnTo: null,
  setScheme: (next, returnTo) => {
    if (next === get().scheme) return;
    applyScheme(next);
    SystemUI.setBackgroundColorAsync(color.bg).catch(() => {});
    set((s) => ({ scheme: next, version: s.version + 1, returnTo: returnTo ?? null }));
  },
}));

/** Kept for the Réglages page: changes the theme right away. */
export function setScheme(next: Scheme, returnTo = "/reglages") {
  useTheme.getState().setScheme(next, returnTo);
}
