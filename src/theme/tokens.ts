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
//
// Contrast (WCAG 2.2): text 4.5:1 or more, icons and borders 3:1. Colours were
// set in OKLCH: same hue and chroma as the vivid colour, lightness lowered to
// a common step (text and fills ≈ 51 %, edges 44 %). The four hues form a
// double complementary on the colour wheel (pink ↔ teal, yellow ↔ blue); red
// is pushed towards orange so it never reads as the brand pink.

const light = {
  bg: "#F3F6FB",
  card: "#FFFFFF",
  ink: "#1F1A3D",
  muted: "#6B6889",
  faint: "#74728C",
  line: "#E3E6EF",
  /** Background of segmented controls and neutral chips. */
  chip: "#E8EBF3",

  brand: "#BC0F54",
  brandDark: "#9A0142",
  brandSoft: "#FFE3EC",
  brandBrain: "#FF8FB1",

  teal: "#02786D",
  tealDark: "#046057",
  tealSoft: "#D7F5F1",
  sun: "#FFC23D",
  sunDark: "#856000",
  sunSoft: "#FFF1CC",
  sky: "#0B61CF",
  skyDark: "#014DAA",
  skySoft: "#E1EDFF",
  green: "#027C3E",
  greenSoft: "#DDF6E6",
  red: "#BD1F1C",
  redDark: "#9E0209",
  redSoft: "#FDE2E3",
  violet: "#6D3FD9",
  violetSoft: "#EDE5FE",
  corailSoft: "#FFE7E0",
  /** Fills that carry white text or icons (buttons, badges, selected
   *  items), with the darker edge under them. White on each: 5.3:1 or more. */
  brandFill: "#BC0F54",
  brandEdge: "#9A0142",
  tealFill: "#02786D",
  tealEdge: "#046057",
  skyFill: "#0B61CF",
  skyEdge: "#014DAA",
  greenFill: "#027C3E",
  /** The yellow fill keeps its colour: dark text on it, and its own edge. */
  sunEdge: "#C98F0E",
  onSun: "#1F1A3D",
  /** A dark card that stands out (white text on it), in both themes. */
  inverse: "#1F1A3D",
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
  faint: "#858CAC",
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
  sunDark: "#BD8E30",
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
  // Bright colours are for text and icons on the night ground; white text
  // sits on the same deep fills as in the light theme.
  brandFill: "#BC0F54",
  brandEdge: "#9A0142",
  tealFill: "#02786D",
  tealEdge: "#046057",
  skyFill: "#0B61CF",
  skyEdge: "#014DAA",
  greenFill: "#027C3E",
  sunEdge: "#A87A12",
  onSun: "#1F1A3D",
  // Lighter than the cards and violet-tinted, so it still stands out at night.
  inverse: "#2B2560",
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

/** The theme in use. Changes live (applyScheme) — always read it at render time. */
export let scheme: Scheme = storedScheme();

/** The palette of the chosen theme. The same object for the whole life of the app: applyScheme fills it in again. */
export const color: Palette = scheme === "dark" ? { ...dark } : { ...light };

const refreshers: (() => void)[] = [];

/**
 * A value computed from the theme outside a component (a table of colours, a
 * StyleSheet…): built now, and built again in place when the theme changes, so
 * code that kept it sees the new colours.
 */
export function themed<T extends object>(build: () => T): T {
  const value = build();
  refreshers.push(() => {
    const next = build();
    if (Array.isArray(value)) value.splice(0, value.length, ...(next as unknown[]));
    else Object.assign(value, next);
  });
  return value;
}

/** Switches the theme without restarting the app: the palettes, then every themed() value. */
export function applyScheme(next: Scheme) {
  scheme = next;
  Object.assign(color, next === "dark" ? dark : light);
  Object.assign(learnerColor, next === "dark" ? learnerDark : learnerLight);
  for (const refresh of refreshers) refresh();
  saveScheme(next);
}

export function saveScheme(next: Scheme) {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(THEME_KEY, next);
    else SecureStore.setItem(THEME_KEY, next);
  } catch {
    // Nothing to do: the default (dark) stays.
  }
}

/**
 * main: the vivid colour (bars, rings, borders, icons).
 * dark: the same hue as text (4.5:1 or more on the card and on soft).
 * fill / edge: a ground for white text, and the darker line under it.
 * soft: a pale background.
 */
type LearnerTint = { main: string; dark: string; fill: string; edge: string; soft: string };

/** The colour each child picks for their profile. */
const learnerLight: Record<string, LearnerTint> = {
  violet: { main: "#8B5CF6", dark: "#723DD6", fill: "#723DD6", edge: "#5E1FBC", soft: "#EDE5FE" },
  corail: { main: "#FF7A59", dark: "#B43410", fill: "#B43410", edge: "#952300", soft: "#FFE7E0" },
  menthe: { main: "#10B5A5", dark: "#02786D", fill: "#02786D", edge: "#046057", soft: "#D7F5F1" },
  soleil: { main: "#F5A524", dark: "#8D5B00", fill: "#8D5B00", edge: "#724901", soft: "#FFF1CC" },
  ciel: { main: "#3D8BFD", dark: "#0B61CF", fill: "#0B61CF", edge: "#014DAA", soft: "#E1EDFF" },
  framboise: { main: "#E0406F", dark: "#BC1252", fill: "#BC1252", edge: "#9A0040", soft: "#FFE3EC" },
};

// Same hues, a little brighter, on dark tinted grounds. On the night ground
// the bright colour is the readable one, so it is also the text colour.
const learnerDark: Record<string, LearnerTint> = {
  violet: { main: "#9B72FF", dark: "#9E78FE", fill: "#723DD6", edge: "#5E1FBC", soft: "#272052" },
  corail: { main: "#FF8A6B", dark: "#FF8A6B", fill: "#B43410", edge: "#952300", soft: "#3A1F1A" },
  menthe: { main: "#2ED3C0", dark: "#2ED3C0", fill: "#02786D", edge: "#046057", soft: "#0F3333" },
  soleil: { main: "#FFB43D", dark: "#FFB43D", fill: "#8D5B00", edge: "#724901", soft: "#372C12" },
  ciel: { main: "#5AA2FF", dark: "#5AA2FF", fill: "#0B61CF", edge: "#014DAA", soft: "#132649" },
  framboise: { main: "#FF5C8A", dark: "#FF5C8A", fill: "#BC1252", edge: "#9A0040", soft: "#3A1830" },
};

export const learnerColor: Record<string, LearnerTint> = { ...(scheme === "dark" ? learnerDark : learnerLight) };

/** White or near-black, whichever reads best on the background `bg` (#RRGGBB). */
export function onColor(bg: string): string {
  const lin = (i: number) => {
    const v = parseInt(bg.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
  // Contrast with white is 1.05 / (y + 0.05); with #0A0C1A (y ≈ 0.0037) it is (y + 0.05) / 0.0537.
  return 1.05 / (y + 0.05) >= (y + 0.05) / 0.0537 ? "#FFFFFF" : "#0A0C1A";
}

export const learnerColorOf = (c: string) => learnerColor[c] ?? learnerColor.violet;

// Titres : Outfit. Texte : Atkinson Hyperlegible (lettres qu'on ne confond pas : l, I, 1).
// Option « Police pour la dyslexie » (Réglages) : seulement ce qu'on LIT (fiches,
// questions, réponses, explications : `font.read`, `<T read>`) passe en
// OpenDyslexic, 10 % plus petite (ses lettres sont plus grandes et très
// espacées). Boutons, menus et titres restent en Atkinson et Outfit.
const STANDARD = {
  title: "Outfit_700Bold",
  titleBold: "Outfit_600SemiBold",
  text: "AtkinsonHyperlegible_400Regular",
  textSemi: "AtkinsonHyperlegible_400Regular",
  textBold: "AtkinsonHyperlegible_700Bold",
  textBlack: "AtkinsonHyperlegible_700Bold",
  /** Texte à lire (fiches, questions…) : Atkinson, ou OpenDyslexic avec l'option. */
  read: "AtkinsonHyperlegible_400Regular",
  readBold: "AtkinsonHyperlegible_700Bold",
};

const DYSLEXIA = { ...STANDARD, read: "OpenDyslexic", readBold: "OpenDyslexic_Bold" };

/** Modifié sur place par applyReading : toujours lire `font.x` au moment de l'affichage. */
export const font: Record<keyof typeof STANDARD, string> = { ...STANDARD };

/**
 * Texte à lire avec l'option dyslexie : OpenDyslexic, 10 % plus petite (même
 * taille à l'œil), lignes un peu plus hautes (ses lettres montent plus haut).
 */
export const reading = { dyslexia: false, sizeScale: 1, lineScale: 1 };

export function applyReading(dyslexia: boolean) {
  Object.assign(font, dyslexia ? DYSLEXIA : STANDARD);
  reading.dyslexia = dyslexia;
  reading.sizeScale = dyslexia ? 0.9 : 1;
  reading.lineScale = dyslexia ? 1.15 : 1;
}

/** Taille d'un texte à lire (champ de réponse, choix…) : réduite avec l'option dyslexie. */
export const readSize = (n: number) => Math.round(n * reading.sizeScale);

export const size = { xs: 13, sm: 15, md: 17, lg: 20, xl: 26, xxl: 32 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
export const GUTTER = 20;
