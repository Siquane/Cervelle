// Cervelle's look: bright and friendly, readable by an 8-year-old and not
// childish for a high-schooler. Pink « brain » as the brand colour, ink-blue
// text, three label colours for the notions (sky / sun / green).

export const color = {
  bg: "#F3F6FB",
  card: "#FFFFFF",
  ink: "#1F1A3D",
  muted: "#6B6889",
  faint: "#9A98B3",
  line: "#E3E6EF",

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
  redSoft: "#FDE2E3",
  white: "#FFFFFF",
} as const;

/** The colour each child picks for their profile. */
export const learnerColor: Record<string, { main: string; dark: string; soft: string }> = {
  violet: { main: "#8B5CF6", dark: "#6D3FD9", soft: "#EDE5FE" },
  corail: { main: "#FF7A59", dark: "#DB5937", soft: "#FFE7E0" },
  menthe: { main: "#10B5A5", dark: "#0B8A7E", soft: "#D7F5F1" },
  soleil: { main: "#F5A524", dark: "#C6820F", soft: "#FFF1CC" },
  ciel: { main: "#3D8BFD", dark: "#1F66D1", soft: "#E1EDFF" },
  framboise: { main: "#E0406F", dark: "#B42A55", soft: "#FFE3EC" },
};

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
