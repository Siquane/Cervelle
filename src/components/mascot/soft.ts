import { ACCESSORIES, BRAIN, EYES, eyeShapes, FOLDS, INK_COLOR, VIEWBOX, type Shape } from "./geometry";
import { BRAIN_COLORS, WARDROBE, type Item } from "./wardrobe";

// Cervelle in the « 3D douce » style of the card album (Fluent Emoji 3D): no
// black outline, a light from the top left, soft gradients, a fine contour in
// a darker shade of each colour, and a shadow on the ground.
//
// One drawing, three renderers: the app (Mascot.tsx, react-native-svg), the
// Android widgets (svgString.ts) and the icon generator (scripts/mascot-svg.ts).
// So this file only builds a plain tree of SVG elements.

export type El = { tag: string; attrs: Record<string, string | number>; children?: El[] };
export type Mood = "happy" | "wow" | "sad" | "sleep";

const ITEMS: Record<string, Item> = {
  ...Object.fromEntries(Object.entries(ACCESSORIES).map(([k, v]) => [k, { layer: v.behindFace ? ("face" as const) : undefined, shapes: v.shapes }])),
  ...WARDROBE,
};

const STARS = [[70, 80, 2.5], [140, 72, 2], [52, 118, 2], [160, 120, 2.5], [108, 60, 2], [92, 150, 2], [130, 150, 1.8]] as const;

// ── Colours ──
const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
/** Mix towards white (t > 0) or black (t < 0). */
export const shade = (hex: string, t: number) => toHex(rgb(hex).map((v) => (t >= 0 ? v + (255 - v) * t : v * (1 + t))));
const isColor = (c?: string) => !!c && c.startsWith("#");

const el = (tag: string, attrs: El["attrs"], children?: El[]): El => ({ tag, attrs, children });
const stop = (offset: number, color: string, opacity = 1) => el("stop", { offset, stopColor: color, stopOpacity: opacity });

/** Collects the gradients a drawing needs, one per colour. */
class Paints {
  defs: El[] = [];
  private seen = new Set<string>();
  constructor(private prefix: string) {}
  private add(id: string, make: () => El) {
    const full = `${this.prefix}${id}`;
    if (!this.seen.has(full)) {
      this.seen.add(full);
      this.defs.push(make());
    }
    return `url(#${full})`;
  }
  /** A colour in volume: lighter at the top left, darker at the bottom right. */
  ball(hex: string) {
    const id = `b${hex.slice(1)}`;
    return this.add(id, () =>
      el("radialGradient", { id: `${this.prefix}${id}`, cx: 0.35, cy: 0.28, r: 0.85 }, [stop(0, shade(hex, 0.55)), stop(0.45, hex), stop(1, shade(hex, -0.28))]),
    );
  }
  /** A soft white spot (shine) or dark spot (shadow) that fades out. */
  glow(name: string, color: string, opacity: number) {
    return this.add(name, () => el("radialGradient", { id: `${this.prefix}${name}`, cx: 0.5, cy: 0.5, r: 0.5 }, [stop(0, color, opacity), stop(1, color, 0)]));
  }
  /** Transparent at the top, a little darker at the bottom: volume over a flat or striped colour. */
  veil() {
    return this.add("veil", () => el("linearGradient", { id: `${this.prefix}veil`, x1: 0, y1: 0, x2: 0.3, y2: 1 }, [stop(0, "#FFFFFF", 0.25), stop(0.5, "#FFFFFF", 0), stop(1, "#000000", 0.22)]));
  }
  linear(name: string, colors: string[]) {
    return this.add(name, () =>
      el("linearGradient", { id: `${this.prefix}${name}`, x1: 0, y1: 0, x2: 0.4, y2: 1 }, colors.map((c, i) => stop(i / (colors.length - 1), c))),
    );
  }
}

/** One accessory shape, in volume. Ink outlines become a fine contour in a darker shade of the shape's colour. */
function soft(s: Shape, p: Paints): El {
  const filled = isColor(s.fill);
  const a: El["attrs"] = {};
  // Plain white with no outline (sparkles, glints in the eyes) stays flat white.
  if (filled && s.fill.toUpperCase() === "#FFFFFF" && !s.stroke) a.fill = "#FFFFFF";
  else if (filled) a.fill = s.fill === INK_COLOR ? p.ball("#3A3170") : p.ball(s.fill);
  else a.fill = s.fill;
  if (s.stroke) {
    const w = s.strokeWidth ?? 4;
    if (filled && s.stroke === INK_COLOR) {
      a.stroke = shade(s.fill, -0.45);
      a.strokeOpacity = 0.6;
      a.strokeWidth = Math.min(w, 2.5);
    } else if (s.stroke === INK_COLOR) {
      // A line drawn in ink (antenna, snorkel, crayon tip…): a soft dark violet.
      a.stroke = "#2A2150";
      a.strokeOpacity = 0.85;
      a.strokeWidth = w;
    } else {
      a.stroke = s.stroke;
      a.strokeWidth = w;
    }
    a.strokeLinejoin = "round";
    a.strokeLinecap = "round";
  }
  switch (s.kind) {
    case "path":
      return el("path", { d: s.d, ...a });
    case "circle":
      return el("circle", { cx: s.cx, cy: s.cy, r: s.r, ...a });
    case "ellipse":
      return el("ellipse", { cx: s.cx, cy: s.cy, rx: s.rx, ry: s.ry, ...a });
    case "rect":
      return el("rect", { x: s.x, y: s.y, width: s.width, height: s.height, rx: s.rx, ...a });
  }
}

/** Cervelle dressed with `accessories`, as a tree of SVG elements (viewBox VIEWBOX). */
export function mascotTree(accessories: string[] = [], mood: Mood = "happy", prefix = "c", opts: { shadow?: boolean } = {}): El {
  const p = new Paints(prefix);
  const items = accessories.map((id) => ITEMS[id]).filter(Boolean);
  const tint = BRAIN_COLORS[accessories.find((id) => BRAIN_COLORS[id]) ?? "rose"];
  const layer = (l: Item["layer"]) => items.filter((it) => it.layer === l).flatMap((it) => it.shapes.map((s) => soft(s, p)));

  const brainFill = tint.gradient ? p.linear("brain", tint.gradient) : p.ball(tint.fill);
  const edge = shade(tint.folds, -0.1);
  const shine = p.glow("shine", "#FFFFFF", 0.85);
  const kids: El[] = [];

  if (opts.shadow !== false) kids.push(el("ellipse", { cx: 103, cy: 172, rx: 78, ry: 10, fill: p.glow("ground", "#3A1530", 0.28) }));
  kids.push(...layer("behind"));
  kids.push(el("path", { d: BRAIN, fill: brainFill, stroke: edge, strokeOpacity: 0.6, strokeWidth: 3, strokeLinejoin: "round" }));
  // A gradient-coloured brain (gold, rainbow, galaxy) gets its volume from a light/shadow veil on top.
  if (tint.gradient) kids.push(el("path", { d: BRAIN, fill: p.veil() }));
  for (const d of FOLDS) {
    kids.push(el("path", { d, fill: "none", stroke: tint.folds, strokeOpacity: 0.7, strokeWidth: 5, strokeLinecap: "round" }));
    kids.push(el("path", { d, transform: "translate(-1.5,-2)", fill: "none", stroke: "#FFFFFF", strokeOpacity: 0.45, strokeWidth: 2, strokeLinecap: "round" }));
  }
  kids.push(el("ellipse", { cx: 72, cy: 62, rx: 26, ry: 13, transform: "rotate(-25 72 62)", fill: shine }));
  kids.push(el("ellipse", { cx: 136, cy: 58, rx: 14, ry: 7, transform: "rotate(15 136 58)", fill: shine, opacity: 0.7 }));
  if (tint.stars) for (const [cx, cy, r] of STARS) kids.push(el("circle", { cx, cy, r, fill: "#FFFFFF" }));
  kids.push(...layer("face"));

  for (const e of EYES) {
    if (mood === "sleep") kids.push(el("path", { d: `M ${e.cx - 11} ${e.cy + 2} Q ${e.cx} ${e.cy + 10} ${e.cx + 11} ${e.cy + 2}`, fill: "none", stroke: "#2A2150", strokeWidth: 4, strokeLinecap: "round" }));
    else kids.push(...eyeShapes(e, mood === "wow").map((s) => soft(s, p)));
  }
  const cheek = p.glow(`cheek${tint.cheeks.slice(1)}`, tint.cheeks, 0.75);
  kids.push(el("ellipse", { cx: 64, cy: 131, rx: 13, ry: 8, fill: cheek }), el("ellipse", { cx: 140, cy: 131, rx: 13, ry: 8, fill: cheek }));
  if (mood === "wow") kids.push(el("ellipse", { cx: 102, cy: 137, rx: 8, ry: 9, fill: p.ball("#3A3170") }));
  else kids.push(el("path", { d: mood === "sad" ? "M 91 140 Q 102 130 113 140" : "M 91 131 Q 102 143 113 131", fill: "none", stroke: "#2A2150", strokeWidth: 4.5, strokeLinecap: "round" }));
  kids.push(...layer(undefined));

  return el("svg", { viewBox: VIEWBOX }, [el("defs", {}, p.defs), ...kids]);
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const ATTR: Record<string, string> = { viewBox: "viewBox" };
const TAG: Record<string, string> = { radialGradient: "radialGradient", linearGradient: "linearGradient" };

/** The tree as SVG text (widgets, icon generator). */
export function toSvgString(t: El, size?: { width: number | string; height: number | string }): string {
  const attrs = { ...(t.tag === "svg" ? { xmlns: "http://www.w3.org/2000/svg", ...(size ?? {}) } : {}), ...t.attrs };
  const a = Object.entries(attrs)
    .map(([k, v]) => ` ${ATTR[k] ?? kebab(k)}="${v}"`)
    .join("");
  const tag = TAG[t.tag] ?? t.tag;
  return t.children?.length ? `<${tag}${a}>${t.children.map((c) => toSvgString(c)).join("")}</${tag}>` : `<${tag}${a}/>`;
}
