import { ACCESSORIES, BRAIN, EYES, eyeShapes, FOLDS, INK_COLOR, VIEWBOX, type Shape } from "./geometry";
import { BRAIN_COLORS, WARDROBE, type Item } from "./wardrobe";

// Cervelle as a plain SVG string, dressed like in the app (widgets: Android
// draws an SVG string, not react-native-svg). Same drawing as Mascot.tsx.

const ITEMS: Record<string, Item> = { ...Object.fromEntries(Object.entries(ACCESSORIES).map(([k, v]) => [k, { layer: v.behindFace ? ("face" as const) : undefined, shapes: v.shapes }])), ...WARDROBE };
const STARS = [[70, 80, 2.5], [140, 72, 2], [52, 118, 2], [160, 120, 2.5], [108, 60, 2], [92, 150, 2], [130, 150, 1.8]] as const;

function shape(s: Shape): string {
  const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth ?? 4}" stroke-linejoin="round" stroke-linecap="round"` : "";
  switch (s.kind) {
    case "path":
      return `<path d="${s.d}" fill="${s.fill}"${stroke}/>`;
    case "circle":
      return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}"${stroke}/>`;
    case "ellipse":
      return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}"${stroke}/>`;
    case "rect":
      return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.rx}" fill="${s.fill}"${stroke}/>`;
  }
}

export function mascotSvgString(equipped: string[] = [], mood: "happy" | "sleep" = "happy"): string {
  const items = equipped.map((id) => ITEMS[id]).filter(Boolean);
  const tint = BRAIN_COLORS[equipped.find((id) => BRAIN_COLORS[id]) ?? "rose"];
  const layer = (l: Item["layer"]) => items.filter((a) => a.layer === l).flatMap((a) => a.shapes.map(shape)).join("");
  const fill = tint.gradient ? "url(#g)" : tint.fill;
  const defs = tint.gradient
    ? `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${tint.gradient.map((c, i) => `<stop offset="${i / (tint.gradient!.length - 1)}" stop-color="${c}"/>`).join("")}</linearGradient></defs>`
    : "";
  const eyes =
    mood === "sleep"
      ? EYES.map((e) => `<path d="M ${e.cx - 11} ${e.cy + 2} Q ${e.cx} ${e.cy + 10} ${e.cx + 11} ${e.cy + 2}" fill="none" stroke="${INK_COLOR}" stroke-width="4" stroke-linecap="round"/>`).join("")
      : EYES.flatMap((e) => eyeShapes(e).map(shape)).join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="214" viewBox="${VIEWBOX}">`,
    defs,
    layer("behind"),
    `<path d="${BRAIN}" fill="${fill}" stroke="${INK_COLOR}" stroke-width="5" stroke-linejoin="round"/>`,
    FOLDS.map((d) => `<path d="${d}" fill="none" stroke="${tint.folds}" stroke-width="4" stroke-linecap="round"/>`).join(""),
    tint.stars ? STARS.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF"/>`).join("") : "",
    layer("face"),
    eyes,
    `<ellipse cx="64" cy="131" rx="9" ry="5.5" fill="${tint.cheeks}" opacity="0.55"/><ellipse cx="140" cy="131" rx="9" ry="5.5" fill="${tint.cheeks}" opacity="0.55"/>`,
    `<path d="M 91 131 Q 102 143 113 131" fill="none" stroke="${INK_COLOR}" stroke-width="4.5" stroke-linecap="round"/>`,
    layer(undefined),
    `</svg>`,
  ].join("");
}
