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
  { cx: 82, cy: 101 },
  { cx: 122, cy: 101 },
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

/** Accessory drawings, keyed by shop item id. `behindFace` ones go under the eyes. */
export type Shape =
  | { kind: "path"; d: string; fill: string; stroke?: string; strokeWidth?: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string; stroke?: string; strokeWidth?: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number; fill: string; stroke?: string; strokeWidth?: number };

const INK = "#1F1A3D";

export const ACCESSORIES: Record<string, { behindFace?: boolean; shapes: Shape[] }> = {
  casquette: {
    shapes: [
      { kind: "path", d: "M 60 66 C 62 28 144 28 146 66 Z", fill: "#10B5A5", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 132 60 C 152 56 176 60 182 70 C 164 74 144 72 128 68 Z", fill: "#0B8A7E", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 103, cy: 35, r: 5, fill: "#FFC23D", stroke: INK, strokeWidth: 3 },
    ],
  },
  couronne: {
    shapes: [{ kind: "path", d: "M 70 54 L 74 20 L 90 38 L 103 12 L 116 38 L 132 20 L 136 54 Z", fill: "#FFC23D", stroke: INK, strokeWidth: 4 }],
  },
  toque: {
    shapes: [
      { kind: "circle", cx: 84, cy: 34, r: 18, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 122, cy: 34, r: 18, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 103, cy: 24, r: 20, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
      { kind: "rect", x: 72, y: 42, width: 62, height: 22, rx: 5, fill: "#FFFFFF", stroke: INK, strokeWidth: 4 },
    ],
  },
  sorcier: {
    shapes: [
      { kind: "path", d: "M 66 56 L 116 -18 L 140 56 Z", fill: "#8B5CF6", stroke: INK, strokeWidth: 4 },
      { kind: "ellipse", cx: 103, cy: 56, rx: 54, ry: 9, fill: "#6D3FD9", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 112, cy: 22, r: 4, fill: "#FFC23D" },
      { kind: "circle", cx: 98, cy: 40, r: 3, fill: "#FFC23D" },
    ],
  },
  casque: {
    shapes: [
      { kind: "path", d: "M 30 106 C 26 22 180 22 176 106", fill: "none", stroke: INK, strokeWidth: 8 },
      { kind: "rect", x: 16, y: 92, width: 22, height: 38, rx: 9, fill: "#3D8BFD", stroke: INK, strokeWidth: 4 },
      { kind: "rect", x: 168, y: 92, width: 22, height: 38, rx: 9, fill: "#3D8BFD", stroke: INK, strokeWidth: 4 },
    ],
  },
  lunettes: {
    shapes: [
      { kind: "circle", cx: 82, cy: 101, r: 19, fill: "none", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 122, cy: 101, r: 19, fill: "none", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 101 99 C 102 96 102 96 103 99", fill: "none", stroke: INK, strokeWidth: 4 },
    ],
  },
  masque: {
    behindFace: true,
    shapes: [{ kind: "path", d: "M 50 91 C 72 81 134 81 156 91 L 152 117 C 132 109 74 109 54 117 Z", fill: "#E5484D", stroke: INK, strokeWidth: 4 }],
  },
  noeud: {
    shapes: [
      { kind: "path", d: "M 103 163 L 80 150 L 80 176 Z", fill: "#E5484D", stroke: INK, strokeWidth: 4 },
      { kind: "path", d: "M 103 163 L 126 150 L 126 176 Z", fill: "#E5484D", stroke: INK, strokeWidth: 4 },
      { kind: "circle", cx: 103, cy: 163, r: 6, fill: "#B42A55", stroke: INK, strokeWidth: 3 },
    ],
  },
  echarpe: {
    shapes: [
      { kind: "path", d: "M 46 148 C 80 166 126 166 160 148 L 162 162 C 126 180 80 180 44 162 Z", fill: "#FFC23D", stroke: INK, strokeWidth: 4 },
      { kind: "rect", x: 128, y: 162, width: 16, height: 26, rx: 4, fill: "#FFC23D", stroke: INK, strokeWidth: 4 },
    ],
  },
};

export const INK_COLOR = INK;
