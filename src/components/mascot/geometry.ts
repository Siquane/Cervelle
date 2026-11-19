// Shapes of Cervelle, the mascot: a round pink brain with big kawaii eyes.
// One source for the app (react-native-svg) and for the icon/splash
// generator (scripts/make-assets.ts). viewBox: -10 -24 220 214.

export const VIEWBOX = "-10 -24 220 214";

export const BRAIN =
  "M 40 140 C 20 136 18 108 35 98 C 26 77 46 57 66 62 C 70 41 96 35 108 50 C 122 35 151 41 152 62 C 173 59 186 82 174 98 C 189 112 181 139 160 140 C 156 159 132 165 118 154 C 108 167 86 167 78 154 C 62 165 40 159 40 140 Z";

export const FOLDS = [
  "M 104 53 C 98 66 110 76 103 90",
  "M 48 102 C 56 93 66 96 63 106",
  "M 156 98 C 148 90 138 94 141 104",
  "M 70 70 C 78 64 86 70 81 78",
  "M 134 68 C 127 63 119 69 124 77",
  "M 52 132 C 58 138 64 136 66 142",
  "M 152 130 C 146 137 140 135 138 141",
];

export const EYES = [
  { cx: 82, cy: 104 },
  { cx: 122, cy: 104 },
];

/**
 * One kawaii eye: a single dark oval, a violet glint at the bottom and three
 * white sparkles. `big` (mood « wow ») scales it up a little. Shared by the
 * app and the icon generator.
 */
export function eyeShapes(e: { cx: number; cy: number }, big = false): Shape[] {
  const k = big ? 1.15 : 1;
  const x = (d: number) => e.cx + d * k;
  const y = (d: number) => e.cy + d * k;
  return [
    { kind: "ellipse", cx: x(0), cy: y(1), rx: 11 * k, ry: 14 * k, fill: INK },
    { kind: "ellipse", cx: x(0), cy: y(7.5), rx: 7 * k, ry: 4.5 * k, fill: "#5B4FD6" },
    { kind: "ellipse", cx: x(2.8), cy: y(-4.5), rx: 4.8 * k, ry: 5.3 * k, fill: "#FFFFFF" },
    { kind: "circle", cx: x(-4.4), cy: y(3.8), r: 2 * k, fill: "#FFFFFF" },
    { kind: "circle", cx: x(4.4), cy: y(6.4), r: 1.2 * k, fill: "#FFFFFF" },
  ];
}

/**
 * Accessory drawings, keyed by shop item id. `behindFace` ones go under the eyes.
 * `opacity` is for shines and soft shadows.
 */
type Paint = { fill: string; stroke?: string; strokeWidth?: number; opacity?: number };
export type Shape =
  | ({ kind: "path"; d: string } & Paint)
  | ({ kind: "circle"; cx: number; cy: number; r: number } & Paint)
  | ({ kind: "ellipse"; cx: number; cy: number; rx: number; ry: number } & Paint)
  | ({ kind: "rect"; x: number; y: number; width: number; height: number; rx: number } & Paint);

/** A white highlight stroke, the same « shine » as in the eyes. */
export const shine = (d: string, w = 6): Shape => ({ kind: "path", d, fill: "none", stroke: "#FFFFFF", strokeWidth: w, opacity: 0.8 });

const INK = "#1F1A3D";

export const ACCESSORIES: Record<string, { behindFace?: boolean; shapes: Shape[] }> = {
  casquette: {
    shapes: [
      { kind: "path", d: "M 50 62 C 46 10 160 6 158 62 C 126 54 82 54 50 62 Z", fill: "#10B5A5", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 104 18 C 100 30 100 44 102 56", fill: "none", stroke: "#0B8A7E", strokeWidth: 3 },
      { kind: "path", d: "M 146 54 C 170 42 200 50 204 68 C 186 80 156 74 136 64 Z", fill: "#0B8A7E", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 152 60 C 170 56 188 60 196 66", fill: "none", stroke: "#08665C", strokeWidth: 3 },
      shine("M 69.9 50 C 71.6 39.8 81.8 31.3 93.7 28.7"),
      shine("M 153.9 64.8 C 167.9 61.8 179.9 62.8 187.9 68.8", 4),
      { kind: "circle", cx: 104, cy: 12, r: 6, fill: "#FFC23D", stroke: INK, strokeWidth: 3 },
    ],
  },

  couronne: {
    shapes: [{ kind: "path", d: "M 70 54 L 74 20 L 90 38 L 103 12 L 116 38 L 132 20 L 136 54 Z", fill: "#FFC23D", stroke: INK, strokeWidth: 4 }, shine("M 79.3 46.3 L 79.3 35.1"), shine("M 101 37 L 103 25", 5)],
  },
  toque: {
    shapes: [
      { kind: "circle", cx: 84, cy: 34, r: 18, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 122, cy: 34, r: 18, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 103, cy: 24, r: 20, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      { kind: "rect", x: 72, y: 42, width: 62, height: 22, rx: 5, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      shine("M 90 30 C 90 24 94 20 100 19", 5),
      shine("M 96.7 18.7 C 98.7 13.7 104.7 10.7 110.7 11.7", 5),
    ],
  },
  sorcier: {
    shapes: [
      { kind: "path", d: "M 66 56 L 116 -18 L 140 56 Z", fill: "#8B5CF6", stroke: INK, strokeWidth: 4 },
      { kind: "ellipse", cx: 103, cy: 56, rx: 54, ry: 9, fill: "#6D3FD9", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 112, cy: 22, r: 4, fill: "#FFC23D" },
      { kind: "circle", cx: 98, cy: 40, r: 3, fill: "#FFC23D" },
      shine("M 92 40 L 108 4", 5),
    ],
  },
  casque: {
    shapes: [
      { kind: "path", d: "M 30 106 C 26 22 180 22 176 106", fill: "none", stroke: INK, strokeWidth: 8 },
      { kind: "rect", x: 16, y: 92, width: 22, height: 38, rx: 9, fill: "#3D8BFD", stroke: INK, strokeWidth: 4 },
      { kind: "rect", x: 168, y: 92, width: 22, height: 38, rx: 9, fill: "#3D8BFD", stroke: INK, strokeWidth: 4 },
      shine("M 22 100 L 22 120", 5),
      shine("M 174 100 L 174 120", 5),
    ],
  },
  lunettes: {
    shapes: [
      { kind: "circle", cx: 82, cy: 104, r: 19, fill: "none", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 122, cy: 104, r: 19, fill: "none", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 101 102 C 102 99 102 99 103 102", fill: "none", stroke: INK, strokeWidth: 4 },
      shine("M 72 96 C 74 92 78 90 82 90", 4),
      shine("M 112 96 C 114 92 118 90 122 90", 4),
    ],
  },
  masque: {
    behindFace: true,
    shapes: [{ kind: "path", d: "M 50 94 C 72 84 134 84 156 94 L 152 120 C 132 112 74 112 54 120 Z", fill: "#E5484D", stroke: INK, strokeWidth: 4 }, shine("M 63.9 100.6 C 81.9 94.6 101.9 92.6 121.9 92.6", 5)],
  },
  noeud: {
    shapes: [
      { kind: "path", d: "M 103 163 L 80 150 L 80 176 Z", fill: "#E5484D", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 103 163 L 126 150 L 126 176 Z", fill: "#E5484D", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 103, cy: 163, r: 6, fill: "#B42A55", stroke: INK, strokeWidth: 3 },
      shine("M 86.4 159.6 L 86.4 166.2", 4),
      shine("M 120.9 159.1 L 120.9 165.7", 4),
    ],
  },
  echarpe: {
    shapes: [
      { kind: "path", d: "M 46 148 C 80 166 126 166 160 148 L 162 162 C 126 180 80 180 44 162 Z", fill: "#FFC23D", stroke: INK, strokeWidth: 4 },
      { kind: "rect", x: 128, y: 162, width: 16, height: 26, rx: 4, fill: "#FFC23D", stroke: INK, strokeWidth: 4 },
      shine("M 50.6 157.1 C 68.6 165.1 88.6 169.1 106.6 169.1", 5),
    ],
  },
};

export const INK_COLOR = INK;
