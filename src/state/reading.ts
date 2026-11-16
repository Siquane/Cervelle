import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { applyReading } from "../theme/tokens";

// « Police pour la dyslexie » : un réglage du téléphone (enfant ou parent).
// Les composants de texte s'abonnent à `dyslexia` pour se redessiner quand on le change.

const KEY = "cervelle.dyslexia";
const store = {
  get: (k: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.getItem(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.setItem(k, v)) : SecureStore.setItemAsync(k, v)),
};

interface ReadingState {
  dyslexia: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setDyslexia: (on: boolean) => Promise<void>;
}

export const useReading = create<ReadingState>((set) => ({
  dyslexia: false,
  loaded: false,
  load: async () => {
    const on = (await store.get(KEY).catch(() => null)) === "1";
    applyReading(on);
    set({ dyslexia: on, loaded: true });
  },
  setDyslexia: async (on) => {
    applyReading(on);
    set({ dyslexia: on });
    await store.set(KEY, on ? "1" : "0").catch(() => {});
  },
}));

/** À appeler dans un composant qui lit `font` : il se redessine quand la police change. */
export function useFontRefresh(): boolean {
  return useReading((s) => s.dyslexia);
}
