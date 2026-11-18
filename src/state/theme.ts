import { DevSettings, Platform } from "react-native";
import * as Updates from "expo-updates";
import { saveScheme, scheme, type Scheme } from "../theme/tokens";

// Thème clair ou sombre (Réglages). Le choix est enregistré sur le téléphone et
// lu au démarrage par theme/tokens.ts ; on recharge l'appli pour l'appliquer
// partout d'un coup.

export const currentScheme = (): Scheme => scheme;

export async function setScheme(next: Scheme) {
  if (next === scheme) return;
  saveScheme(next);
  if (Platform.OS === "web") {
    globalThis.location?.reload();
    return;
  }
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  await Updates.reloadAsync();
}
