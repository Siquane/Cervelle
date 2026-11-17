import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Cervelle's look: bright and friendly, readable by an 8-year-old and not
// childish for a high-schooler. Pink « brain » as the brand colour, ink-blue
// text, three label colours for the notions (sky / sun / green).
//
// Two themes. « dark » (default) borrows Passerelle's night-blue ground and
// slate cards, with Cervelle's pink turned neon and a soft halo. « light » is
// the original look. The palette is chosen once, synchronously, when this file
// loads (before any screen reads it); changing theme saves the choice and
// reloads the app (src/state/theme.ts), so values copied into constants at
// import time stay right.

const light = {
  bg: "#F3F6FB",
  card: "#FFFFFF",
  ink: "#1F1A3D",
  muted: "#6B6889",
  faint: "#9A98B3",
  line: "#E3E6EF",
  /** Background of segmented controls and neutral chips. */
  chip: "#E8EBF3",

  brand: "#FF5C8A",
  brandDark: "#D63D6C",
  brandSoft: "#FFE3EC",
  brandBrain: "#FF8FB1",

  teal: "#10B5A5",
  tealDark: "#0B8A7E",
  tealSoft: "#D7F5F1",
  sun: "#FFC23D",
  sunDark: "#C98F0E",
  sunSoft: "#FFF1CC",
  sky: "#3D8BFD",
  skyDark: "#1F66D1",
  skySoft: "#E1EDFF",
  green: "#22A85A",
  greenSoft: "#DDF6E6",
  red: "#E5484D",
  redDark: "#B42A2F",
  redSoft: "#FDE2E3",
  violet: "#6D3FD9",
  violetSoft: "#EDE5FE",
  corailSoft: "#FFE7E0",
  /** Text and icons on a coloured fill (buttons, selected chips). */
  white: "#FFFFFF",
  /** Neon halo around the main buttons (dark theme only). */
  glow: "transparent",
  /** Veil behind bottom sheets. */
  backdrop: "rgba(31,26,61,0.45)",
};

export type Palette = Record<keyof typeof light, string>;

const dark: Palette = {
  bg: "#0A0C1A",
  card: "#141A2E",
  ink: "#EEF0FF",
  muted: "#A7ACC9",
  faint: "#767C9C",
  line: "#252C47",
  chip: "#1D2440",

  brand: "#FF6F98",
  brandDark: "#B8345E",
  brandSoft: "#3A1830",
  brandBrain: "#FF8FB1",

  teal: "#2ED3C0",
  tealDark: "#12907F",
  tealSoft: "#0F3333",
  sun: "#FFC94D",
  sunDark: "#A87A12",
  sunSoft: "#372C12",
  sky: "#5AA2FF",
  skyDark: "#2C6FD0",
  skySoft: "#132649",
  green: "#3DD486",
  greenSoft: "#103425",
  red: "#FF5C6C",
  redDark: "#C23845",
  redSoft: "#3D1621",
  violet: "#A98BFF",
  violetSoft: "#272052",
  corailSoft: "#3A1F1A",
  white: "#FFFFFF",
  glow: "rgba(255,111,152,0.45)",
  backdrop: "rgba(2,3,10,0.7)",
};

export type Scheme = "dark" | "light";
const THEME_KEY = "cervelle.theme";

function storedScheme(): Scheme {
  try {
    const v = Platform.OS === "web" ? globalThis.localStorage?.getItem(THEME_KEY) : SecureStore.getItem(THEME_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export const scheme: Scheme = storedScheme();

/** The palette of the chosen theme. Set once at start-up (see above). */
export const color: Palette = scheme === "dark" ? { ...dark } : { ...light };

export function saveScheme(next: Scheme) {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(THEME_KEY, next);
    else SecureStore.setItem(THEME_KEY, next);
  } catch {
    // Nothing to do: the default (dark) stays.
  }
}

type LearnerTint = { main: string; dark: string; soft: string };

/** The colour each child picks for their profile. */
const learnerLight: Record<string, LearnerTint> = {
  violet: { main: "#8B5CF6", dark: "#6D3FD9", soft: "#EDE5FE" },
  corail: { main: "#FF7A59", dark: "#DB5937", soft: "#FFE7E0" },
  menthe: { main: "#10B5A5", dark: "#0B8A7E", soft: "#D7F5F1" },
  soleil: { main: "#F5A524", dark: "#C6820F", soft: "#FFF1CC" },
  ciel: { main: "#3D8BFD", dark: "#1F66D1", soft: "#E1EDFF" },
  framboise: { main: "#E0406F", dark: "#B42A55", soft: "#FFE3EC" },
};

// Same hues, a little brighter, on dark tinted grounds.
const learnerDark: Record<string, LearnerTint> = {
  violet: { main: "#9B72FF", dark: "#6D3FD9", soft: "#272052" },
  corail: { main: "#FF8A6B", dark: "#C9573A", soft: "#3A1F1A" },
  menthe: { main: "#2ED3C0", dark: "#12907F", soft: "#0F3333" },
  soleil: { main: "#FFB43D", dark: "#B97D10", soft: "#372C12" },
  ciel: { main: "#5AA2FF", dark: "#2C6FD0", soft: "#132649" },
  framboise: { main: "#FF5C8A", dark: "#B8345E", soft: "#3A1830" },
};

export const learnerColor: Record<string, LearnerTint> = scheme === "dark" ? learnerDark : learnerLight;

export const learnerColorOf = (c: string) => learnerColor[c] ?? learnerColor.violet;

// Titres : Outfit. Texte : Atkinson Hyperlegible (lettres qu'on ne confond pas : l, I, 1).
// Option « Police pour la dyslexie » (Réglages) : le texte passe en OpenDyslexic,
// les titres restent en Outfit.
const STANDARD = {
  title: "Outfit_700Bold",
  titleBold: "Outfit_600SemiBold",
  text: "AtkinsonHyperlegible_400Regular",
  textSemi: "AtkinsonHyperlegible_400Regular",
  textBold: "AtkinsonHyperlegible_700Bold",
  textBlack: "AtkinsonHyperlegible_700Bold",
};

const DYSLEXIA = { ...STANDARD, text: "OpenDyslexic", textSemi: "OpenDyslexic", textBold: "OpenDyslexic_Bold", textBlack: "OpenDyslexic_Bold" };

/** Modifié sur place par applyReading : toujours lire `font.x` au moment de l'affichage. */
export const font: Record<keyof typeof STANDARD, string> = { ...STANDARD };

/** OpenDyslexic est haute : les lignes de texte ont besoin de plus de place. */
export const reading = { dyslexia: false, lineScale: 1 };

export function applyReading(dyslexia: boolean) {
  Object.assign(font, dyslexia ? DYSLEXIA : STANDARD);
  reading.dyslexia = dyslexia;
  reading.lineScale = dyslexia ? 1.3 : 1;
}

export const size = { xs: 13, sm: 15, md: 17, lg: 20, xl: 26, xxl: 32 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
export const GUTTER = 20;
