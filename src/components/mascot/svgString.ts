import { mascotTree, toSvgString } from "./soft";

// Cervelle as a plain SVG string, dressed like in the app (widgets: Android
// draws an SVG string, not react-native-svg). Same drawing as Mascot.tsx.

export function mascotSvgString(equipped: string[] = [], mood: "happy" | "sleep" = "happy"): string {
  return toSvgString(mascotTree(equipped, mood, "w"), { width: 220, height: 214 });
}
