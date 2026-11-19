// The shop's new items (server catalogue: Passerelle, server/src/lib/cervelle/shop.ts,
// same ids). Same coordinates as geometry.ts (viewBox -10 -24 220 214): the
// brain spans x 18–189, y 35–167, eyes at y 104.
//
// layer « behind »: drawn before the brain (capes, wings, rubber ring).
// layer « face »: under the eyes. Default: on top of everything.

import { shine, type Shape } from "./geometry";

const INK = "#1F1A3D";
const st = { stroke: INK, strokeWidth: 4 };

export type Item = { layer?: "behind" | "face"; shapes: Shape[] };

export const WARDROBE: Record<string, Item> = {
  // ── Tête ──
  bandeau: {
    shapes: [
      { kind: "path", d: "M 44 74 C 80 52 128 52 164 74 L 160 88 C 126 68 82 68 48 88 Z", fill: "#E5484D", ...st },
      { kind: "rect", x: 92, y: 60, width: 22, height: 14, rx: 3, fill: "#FFFFFF", ...st },
      shine("M 61.9 73.7 C 70.7 68.2 78.4 66 86.1 64.9", 5),
    ],
  },
  beret: {
    shapes: [
      { kind: "path", d: "M 52 62 C 50 30 156 26 158 58 C 150 70 66 72 52 62 Z", fill: "#3D3A66", ...st },
      { kind: "path", d: "M 104 30 L 108 18", fill: "none", ...st },
      shine("M 66.3 59.1 C 71.3 48.9 83.3 43.8 95.2 42.1", 5),
    ],
  },
  paille: {
    shapes: [
      { kind: "ellipse", cx: 103, cy: 58, rx: 76, ry: 13, fill: "#F2CF7A", ...st },
      { kind: "path", d: "M 66 56 C 66 22 140 22 140 56 Z", fill: "#F7DC94", ...st },
      { kind: "path", d: "M 67 48 C 90 54 116 54 139 48 L 140 56 C 116 62 90 62 66 56 Z", fill: "#E5484D", ...st },
      shine("M 91.6 46 C 92.7 40.5 97.1 37.2 102.6 36.1", 5),
    ],
  },
  antennes: {
    shapes: [
      { kind: "path", d: "M 84 48 C 80 30 72 18 64 8", fill: "none", ...st },
      { kind: "path", d: "M 122 48 C 126 30 134 18 142 8", fill: "none", ...st },
      { kind: "circle", cx: 63, cy: 6, r: 9, fill: "#3DD486", ...st },
      { kind: "circle", cx: 143, cy: 6, r: 9, fill: "#3DD486", ...st },
      shine("M 59 5 C 60 3 62 2 64 2", 3),
      shine("M 139 5 C 140 3 142 2 144 2", 3),
    ],
  },
  viking: {
    shapes: [
      { kind: "path", d: "M 58 60 C 30 52 24 26 30 10 C 40 30 52 38 66 42 Z", fill: "#FFF4D6", ...st },
      { kind: "path", d: "M 148 60 C 176 52 182 26 176 10 C 166 30 154 38 140 42 Z", fill: "#FFF4D6", ...st },
      { kind: "path", d: "M 56 66 C 56 18 150 18 150 66 Z", fill: "#A7ACC9", ...st },
      { kind: "rect", x: 52, y: 58, width: 102, height: 14, rx: 6, fill: "#C98F0E", ...st },
      shine("M 73.3 52.4 C 74.4 44.7 79.9 40.3 86.5 38.1", 5),
    ],
  },
  diplome: {
    shapes: [
      { kind: "path", d: "M 74 50 L 74 66 C 92 74 114 74 132 66 L 132 50 Z", fill: "#2B2560", ...st },
      { kind: "path", d: "M 103 22 L 168 44 L 103 64 L 38 44 Z", fill: "#3D3A66", ...st },
      { kind: "path", d: "M 103 44 L 150 54 L 150 82", fill: "none", stroke: "#FFC23D", strokeWidth: 4 },
      { kind: "circle", cx: 150, cy: 86, r: 6, fill: "#FFC23D", ...st },
      shine("M 60 44 L 100 30", 4),
    ],
  },
  bonnet_noel: {
    shapes: [
      { kind: "path", d: "M 60 62 C 66 22 120 8 150 26 C 168 38 176 56 178 70 L 160 66 C 150 50 140 46 132 46 C 140 54 144 60 146 66 Z", fill: "#E5484D", ...st },
      { kind: "circle", cx: 180, cy: 74, r: 11, fill: "#FFFFFF", ...st },
      { kind: "rect", x: 52, y: 56, width: 102, height: 18, rx: 9, fill: "#FFFFFF", ...st },
      shine("M 75.6 49.9 C 82.4 34.6 97.7 26.1 113 24.4", 5),
    ],
  },
  citrouille: {
    shapes: [
      { kind: "ellipse", cx: 103, cy: 40, rx: 44, ry: 26, fill: "#FF8A3D", ...st },
      { kind: "path", d: "M 88 18 C 84 34 84 50 88 64 M 118 18 C 122 34 122 50 118 64", fill: "none", stroke: "#C9571A", strokeWidth: 4 },
      { kind: "path", d: "M 100 16 C 100 8 104 2 112 0", fill: "none", stroke: "#2E7D32", strokeWidth: 6 },
      { kind: "path", d: "M 112 4 C 124 -2 132 6 126 12 C 120 10 116 8 112 4 Z", fill: "#3DD486", ...st },
      shine("M 66.3 37.7 C 68.3 31.7 74.3 27.7 80.3 25.7", 5),
    ],
  },
  lapin: {
    shapes: [
      { kind: "path", d: "M 72 54 C 54 20 56 -16 74 -18 C 92 -16 94 22 90 52 Z", fill: "#FFFFFF", ...st },
      { kind: "path", d: "M 116 52 C 112 22 114 -16 132 -18 C 150 -16 152 20 134 54 Z", fill: "#FFFFFF", ...st },
      { kind: "path", d: "M 74 44 C 66 22 68 -4 74 -8 C 80 -4 84 20 82 42 Z", fill: "#FFB3C9" },
      { kind: "path", d: "M 124 42 C 122 20 126 -4 132 -8 C 138 -4 140 22 132 44 Z", fill: "#FFB3C9" },
    ],
  },
  couronne_diamant: {
    shapes: [
      { kind: "path", d: "M 66 56 L 70 18 L 88 36 L 103 6 L 118 36 L 136 18 L 140 56 Z", fill: "#DDEBFF", ...st },
      { kind: "path", d: "M 98 40 L 103 30 L 108 40 L 103 48 Z", fill: "#3D8BFD", ...st },
      { kind: "circle", cx: 78, cy: 46, r: 5, fill: "#FF5C8A", ...st },
      { kind: "circle", cx: 128, cy: 46, r: 5, fill: "#3DD486", ...st },
      { kind: "path", d: "M 70 18 L 70 12 M 136 18 L 136 12 M 103 6 L 103 -2", fill: "none", stroke: "#FFFFFF", strokeWidth: 3 },
      shine("M 90 50 L 92 40", 4),
    ],
  },
  couronne_or: {
    shapes: [
      { kind: "path", d: "M 66 56 L 70 16 L 88 36 L 103 4 L 118 36 L 136 16 L 140 56 Z", fill: "#FFC23D", ...st },
      { kind: "path", d: "M 68 46 C 92 52 114 52 138 46 L 140 56 C 114 62 92 62 66 56 Z", fill: "#E0A21E", ...st },
      shine("M 74 40 L 74.7 30.2"),
      shine("M 100.9 30.4 L 102.9 18.4"),
      { kind: "circle", cx: 70, cy: 14, r: 6, fill: "#FFE58A", ...st },
      { kind: "circle", cx: 103, cy: 2, r: 6, fill: "#FFE58A", ...st },
      { kind: "circle", cx: 136, cy: 14, r: 6, fill: "#FFE58A", ...st },
      { kind: "circle", cx: 103, cy: 51, r: 5, fill: "#E5484D", ...st },
      { kind: "circle", cx: 83, cy: 51, r: 3.5, fill: "#3D8BFD", ...st },
      { kind: "circle", cx: 123, cy: 51, r: 3.5, fill: "#3D8BFD", ...st },
    ],
  },
  explorateur: {
    shapes: [
      { kind: "ellipse", cx: 103, cy: 58, rx: 70, ry: 12, fill: "#B8865A", ...st },
      { kind: "path", d: "M 64 56 C 62 24 144 24 142 56 Z", fill: "#D4A373", ...st },
      { kind: "path", d: "M 64 48 C 90 54 116 54 142 48 L 142 56 C 116 62 90 62 64 56 Z", fill: "#6B4423", ...st },
      shine("M 78 44 C 80 40 84 37 90 36", 4),
    ],
  },

  // Chemin d'étoiles (cadeaux du 50e palier)
  casque_astronaute: {
    shapes: [
      { kind: "path", d: "M 14 112 C 6 30 200 30 192 112", fill: "none", stroke: "#DDF3FF", strokeWidth: 10 },
      { kind: "path", d: "M 14 112 C 6 30 200 30 192 112", fill: "none", ...st },
      { kind: "rect", x: 8, y: 108, width: 190, height: 16, rx: 8, fill: "#E3E6EF", ...st },
      { kind: "path", d: "M 150 44 L 168 14", fill: "none", ...st },
      { kind: "circle", cx: 170, cy: 10, r: 7, fill: "#FF5C8A", ...st },
      shine("M 30 90 C 34 66 48 52 64 46", 6),
    ],
  },
  couronne_feuilles: {
    shapes: [
      ...[60, 76, 92, 114, 130, 146].map((x, i) => ({ kind: "ellipse" as const, cx: x, cy: 50 - Math.round(Math.sin(((i + 0.5) / 6) * Math.PI) * 12), rx: 11, ry: 7, fill: i % 2 ? "#3DD486" : "#22A85A", stroke: INK, strokeWidth: 3 })),
      { kind: "circle", cx: 103, cy: 34, r: 7, fill: "#FF5C8A", ...st },
    ],
  },

  // ── Visage ──
  paillettes: {
    layer: "face",
    shapes: [
      { kind: "path", d: "M 58 122 L 61 128 L 67 131 L 61 134 L 58 140 L 55 134 L 49 131 L 55 128 Z", fill: "#FFC23D", ...{ stroke: INK, strokeWidth: 2 } },
      { kind: "path", d: "M 146 122 L 149 128 L 155 131 L 149 134 L 146 140 L 143 134 L 137 131 L 143 128 Z", fill: "#FFC23D", ...{ stroke: INK, strokeWidth: 2 } },
      { kind: "circle", cx: 70, cy: 140, r: 3, fill: "#A98BFF" },
      { kind: "circle", cx: 134, cy: 140, r: 3, fill: "#A98BFF" },
    ],
  },
  moustache: {
    shapes: [{ kind: "path", d: "M 102 124 C 92 116 76 118 70 128 C 80 126 88 130 102 128 C 116 130 124 126 134 128 C 128 118 112 116 102 124 Z", fill: "#5A3A22", ...st }],
  },
  soleil: {
    shapes: [
      { kind: "path", d: "M 60 92 L 100 92 L 98 112 C 96 122 66 122 64 112 Z", fill: "#1F1A3D", ...st },
      { kind: "path", d: "M 106 92 L 146 92 L 142 112 C 140 122 110 122 108 112 Z", fill: "#1F1A3D", ...st },
      { kind: "path", d: "M 100 96 L 106 96", fill: "none", ...st },
      { kind: "path", d: "M 70 98 L 80 98", fill: "none", stroke: "#FFFFFF", strokeWidth: 3 },
      { kind: "path", d: "M 116 98 L 126 98", fill: "none", stroke: "#FFFFFF", strokeWidth: 3 },
    ],
  },
  monocle: {
    shapes: [
      { kind: "circle", cx: 122, cy: 104, r: 19, fill: "none", stroke: "#C98F0E", strokeWidth: 5 },
      { kind: "path", d: "M 136 118 C 146 132 150 146 146 160", fill: "none", stroke: "#C98F0E", strokeWidth: 2.5 },
      shine("M 112 96 C 114 92 118 90 122 90", 4),
    ],
  },
  chauve_souris: {
    layer: "face",
    shapes: [{ kind: "path", d: "M 102 92 C 90 84 70 82 50 92 C 58 96 60 104 56 112 C 70 108 80 116 84 122 C 92 114 98 112 102 114 C 106 112 112 114 120 122 C 124 116 134 108 148 112 C 144 104 146 96 154 92 C 134 82 114 84 102 92 Z", fill: "#3D3A66", ...st }, shine("M 62 98 C 76 94 88 94 98 96", 4)],
  },

  tuba: {
    shapes: [
      { kind: "path", d: "M 40 102 C 60 92 146 92 166 102", fill: "none", stroke: "#FF8A3D", strokeWidth: 8 },
      { kind: "rect", x: 56, y: 84, width: 94, height: 40, rx: 18, fill: "#8EC5FF", ...st },
      { kind: "rect", x: 64, y: 90, width: 78, height: 28, rx: 13, fill: "#C9E6FF", stroke: "#3D8BFD", strokeWidth: 3 },
      shine("M 72.1 100.1 C 76.1 96.1 82.1 95.1 90.1 95.1", 5),
      // The snorkel: a thick ink line, then the yellow inside it, with an orange tip.
      { kind: "path", d: "M 150 128 C 168 132 176 124 176 108 L 176 46", fill: "none", stroke: INK, strokeWidth: 14 },
      { kind: "path", d: "M 150 128 C 168 132 176 124 176 108 L 176 46", fill: "none", stroke: "#FFC23D", strokeWidth: 7 },
      { kind: "rect", x: 168, y: 32, width: 16, height: 16, rx: 5, fill: "#FF8A3D", ...st },
      shine("M 174 60 L 174 100", 3),
    ],
  },

  // ── Cou ──
  foulard: {
    shapes: [
      { kind: "path", d: "M 52 150 C 84 166 122 166 154 150 L 150 164 C 120 176 86 176 56 164 Z", fill: "#3D8BFD", ...st },
      { kind: "path", d: "M 92 168 L 103 196 L 114 168 Z", fill: "#3D8BFD", ...st },
      shine("M 66 160 C 80 165 94 167 106 167", 4),
    ],
  },
  cravate: {
    shapes: [
      { kind: "path", d: "M 95 156 L 111 156 L 108 166 L 98 166 Z", fill: "#6D3FD9", ...st },
      { kind: "path", d: "M 98 166 L 108 166 L 114 186 L 103 196 L 92 186 Z", fill: "#8B5CF6", ...st },
      shine("M 101.8 171.1 L 99.8 183.1", 3),
    ],
  },
  collier: {
    shapes: [
      ...[56, 72, 88, 103, 118, 134, 150].map((x, i) => ({ kind: "circle" as const, cx: x, cy: 158 + Math.round(Math.sin((i / 6) * Math.PI) * 10), r: 9, fill: ["#FF5C8A", "#FFC23D", "#A98BFF", "#FF8A6B", "#3DD486", "#FFC23D", "#FF5C8A"][i], stroke: INK, strokeWidth: 3 })),
    ],
  },
  medaille: {
    shapes: [
      { kind: "path", d: "M 84 150 L 96 178 M 122 150 L 110 178", fill: "none", stroke: "#3D8BFD", strokeWidth: 7 },
      { kind: "circle", cx: 103, cy: 184, r: 13, fill: "#FFC23D", ...st },
      { kind: "path", d: "M 103 177 L 105 182 L 110 182 L 106 186 L 108 191 L 103 188 L 98 191 L 100 186 L 96 182 L 101 182 Z", fill: "#FFF1B8" },
      shine("M 97.7 180.7 C 98.7 177.7 100.7 175.7 103.7 175.7", 3),
    ],
  },
  guirlande: {
    shapes: [
      { kind: "path", d: "M 40 146 C 76 170 130 170 166 146", fill: "none", stroke: "#2E7D32", strokeWidth: 9 },
      ...[52, 76, 103, 130, 154].map((x, i) => ({ kind: "circle" as const, cx: x, cy: [154, 163, 166, 163, 154][i], r: 6, fill: ["#E5484D", "#FFC23D", "#3D8BFD", "#E5484D", "#FFC23D"][i], stroke: INK, strokeWidth: 2.5 })),
    ],
  },

  // ── Tenue (derrière Cervelle) ──
  cape: {
    layer: "behind",
    shapes: [
      { kind: "path", d: "M 44 112 C 22 138 6 166 -4 184 C 18 192 34 180 50 188 C 70 196 86 184 103 190 C 120 184 136 196 156 188 C 172 180 188 192 210 184 C 200 166 184 138 162 112 Z", fill: "#E5484D", ...st },
      { kind: "path", d: "M 30 160 C 46 170 60 170 70 178 M 176 160 C 160 170 146 170 136 178", fill: "none", stroke: "#B42A2F", strokeWidth: 4 },
      shine("M 28 150 C 34 138 40 128 48 120", 6),
    ],
  },
  cape_etoiles: {
    layer: "behind",
    shapes: [
      { kind: "path", d: "M 44 112 C 22 138 6 166 -4 184 C 18 192 34 180 50 188 C 70 196 86 184 103 190 C 120 184 136 196 156 188 C 172 180 188 192 210 184 C 200 166 184 138 162 112 Z", fill: "#2B2560", ...st },
      ...[[24, 168], [62, 176], [120, 180], [168, 172], [196, 178], [92, 166]].map(([x, y]) => ({ kind: "circle" as const, cx: x, cy: y, r: 3, fill: "#FFC23D" })),
      shine("M 28 150 C 34 138 40 128 48 120", 6),
    ],
  },
  ailes_papillon: {
    layer: "behind",
    shapes: [
      { kind: "path", d: "M 40 96 C 0 40 -14 80 -4 112 C -14 140 10 168 40 130 Z", fill: "#A98BFF", ...st },
      { kind: "path", d: "M 166 96 C 206 40 220 80 210 112 C 220 140 196 168 166 130 Z", fill: "#A98BFF", ...st },
      { kind: "circle", cx: 10, cy: 92, r: 8, fill: "#FFC23D" },
      { kind: "circle", cx: 196, cy: 92, r: 8, fill: "#FFC23D" },
      { kind: "circle", cx: 14, cy: 132, r: 6, fill: "#FF5C8A" },
      { kind: "circle", cx: 192, cy: 132, r: 6, fill: "#FF5C8A" },
      shine("M 0 84 C 1 79 5 75 10 74", 3),
      shine("M 196 74 C 201 75 205 79 206 84", 3),
    ],
  },
  ailes_ange: {
    layer: "behind",
    shapes: [
      { kind: "path", d: "M 40 100 C 10 70 -10 60 -8 40 C 2 56 10 58 18 58 C 4 70 6 82 14 88 C 6 98 10 108 20 112 C 14 122 22 132 40 128 Z", fill: "#FFFFFF", ...st },
      { kind: "path", d: "M 166 100 C 196 70 216 60 214 40 C 204 56 196 58 188 58 C 202 70 200 82 192 88 C 200 98 196 108 186 112 C 192 122 184 132 166 128 Z", fill: "#FFFFFF", ...st },
      { kind: "ellipse", cx: 103, cy: 20, rx: 36, ry: 8, fill: "none", stroke: "#FFC23D", strokeWidth: 6 },
    ],
  },
  bouee: {
    layer: "behind",
    shapes: [
      // A thick ring: outer edge, then the darker inner side just under the brain.
      { kind: "ellipse", cx: 103, cy: 156, rx: 100, ry: 32, fill: "#FFC23D", ...st },
      { kind: "ellipse", cx: 103, cy: 150, rx: 64, ry: 12, fill: "#E0A21E", ...st },
      { kind: "path", d: "M 27.1 166.3 A 86 22 0 0 1 17.8 159.1", fill: "none", stroke: "#FF5C8A", strokeWidth: 20 },
      { kind: "path", d: "M 117.9 177.7 A 86 22 0 0 1 88.1 177.7", fill: "none", stroke: "#FF5C8A", strokeWidth: 20 },
      { kind: "path", d: "M 188.2 159.1 A 86 22 0 0 1 178.9 166.3", fill: "none", stroke: "#FF5C8A", strokeWidth: 20 },
      shine("M 30.4 147 C 38.1 139.3 50.2 134.9 62.3 133.8", 7),
      { kind: "circle", cx: 198, cy: 130, r: 15, fill: "#FFC23D", ...st },
      { kind: "circle", cx: 202, cy: 125, r: 2.8, fill: INK },
      { kind: "path", d: "M 210 130 L 222 133 L 210 137 Z", fill: "#FF8A3D", ...st },
    ],
  },

  // ── Dans la main (à droite) ──
  crayon: {
    shapes: [
      { kind: "rect", x: 178, y: 96, width: 14, height: 62, rx: 3, fill: "#FFC23D", ...st },
      { kind: "path", d: "M 178 158 L 185 176 L 192 158 Z", fill: "#F7DC94", ...st },
      { kind: "path", d: "M 183 170 L 185 176 L 187 170 Z", fill: INK },
      { kind: "rect", x: 178, y: 88, width: 14, height: 10, rx: 3, fill: "#FF8FB1", ...st },
      { kind: "path", d: "M 185 98 L 185 156", fill: "none", stroke: "#E0A21E", strokeWidth: 3 },
      shine("M 182 104 L 182 128", 3),
    ],
  },
  livre: {
    shapes: [
      { kind: "rect", x: 160, y: 120, width: 44, height: 56, rx: 4, fill: "#3D8BFD", ...st },
      { kind: "rect", x: 166, y: 130, width: 30, height: 8, rx: 2, fill: "#FFFFFF" },
      { kind: "path", d: "M 166 176 L 166 120", fill: "none", stroke: "#1F66D1", strokeWidth: 4 },
      shine("M 172 148 L 172 166", 3),
    ],
  },
  ballon: {
    shapes: [
      { kind: "path", d: "M 186 112 C 184 136 182 150 172 170", fill: "none", stroke: INK, strokeWidth: 2.5 },
      { kind: "ellipse", cx: 188, cy: 84, rx: 18, ry: 22, fill: "#E5484D", ...st },
      { kind: "path", d: "M 184 106 L 192 106 L 188 112 Z", fill: "#E5484D", ...st },
      { kind: "ellipse", cx: 182, cy: 76, rx: 4, ry: 7, fill: "#FFB3B5" },
    ],
  },
  loupe: {
    shapes: [
      { kind: "path", d: "M 186 140 L 200 176", fill: "none", stroke: "#6B4423", strokeWidth: 9 },
      { kind: "circle", cx: 178, cy: 124, r: 20, fill: "#DDF3FF", stroke: INK, strokeWidth: 5 },
      shine("M 166 122 C 166 117 169 113 174 111", 5),
    ],
  },
  baguette: {
    shapes: [
      { kind: "path", d: "M 170 176 L 196 110", fill: "none", stroke: INK, strokeWidth: 7 },
      { kind: "path", d: "M 196 92 L 200 102 L 210 104 L 202 110 L 204 120 L 196 114 L 188 120 L 190 110 L 182 104 L 192 102 Z", fill: "#FFC23D", ...st },
    ],
  },
  glace: {
    shapes: [
      { kind: "path", d: "M 174 118 L 186 176 L 198 118 Z", fill: "#E8B26A", ...st },
      { kind: "circle", cx: 186, cy: 106, r: 15, fill: "#FF8FB1", ...st },
      { kind: "circle", cx: 186, cy: 86, r: 12, fill: "#8FE3A8", ...st },
      shine("M 178.5 111.7 C 178.5 107.7 179.5 104.7 181.5 102.7", 4),
      shine("M 180 84 C 180 82 182 80 184 79", 3),
    ],
  },
  trophee: {
    shapes: [
      { kind: "path", d: "M 168 110 L 204 110 C 204 136 194 146 186 146 C 178 146 168 136 168 110 Z", fill: "#FFC23D", ...st },
      { kind: "path", d: "M 168 116 C 156 116 158 132 170 132 M 204 116 C 216 116 214 132 202 132", fill: "none", ...st },
      { kind: "rect", x: 181, y: 146, width: 10, height: 14, rx: 2, fill: "#C98F0E", ...st },
      { kind: "rect", x: 170, y: 160, width: 32, height: 12, rx: 3, fill: "#C98F0E", ...st },
      shine("M 176 116 C 176 126 178 134 182 138", 4),
    ],
  },
  appareil: {
    shapes: [
      { kind: "rect", x: 156, y: 128, width: 52, height: 36, rx: 6, fill: "#3D3A66", ...st },
      { kind: "rect", x: 166, y: 120, width: 16, height: 10, rx: 3, fill: "#3D3A66", ...st },
      { kind: "circle", cx: 182, cy: 146, r: 11, fill: "#5AA2FF", stroke: "#FFFFFF", strokeWidth: 3 },
      { kind: "circle", cx: 199, cy: 136, r: 3, fill: "#FFC23D" },
      shine("M 178.4 142.4 C 179.4 140.4 181.4 139.4 183.4 139.4", 3),
    ],
  },
};

/** Brain colours: fill (or a gradient, top to bottom), folds, cheeks. */
export interface BrainColor {
  fill: string;
  gradient?: string[];
  folds: string;
  cheeks: string;
  /** A few stars on the brain (galaxy). */
  stars?: boolean;
}

export const BRAIN_COLORS: Record<string, BrainColor> = {
  rose: { fill: "#FF8FB1", folds: "#D63D6C", cheeks: "#FF5C8A" },
  bleu: { fill: "#8EC5FF", folds: "#2C6FD0", cheeks: "#5AA2FF" },
  vert: { fill: "#8FE3A8", folds: "#1F9E57", cheeks: "#3DD486" },
  violet: { fill: "#C3A6FF", folds: "#6D3FD9", cheeks: "#A98BFF" },
  orange: { fill: "#FFB27A", folds: "#D9622B", cheeks: "#FF8A6B" },
  dore: { fill: "#FFD866", gradient: ["#FFF1B8", "#FFD45C", "#F2B425"], folds: "#B07A00", cheeks: "#F5A524" },
  arc_en_ciel: { fill: "#FFD866", gradient: ["#FF8FB1", "#FFD866", "#8FE3A8", "#8EC5FF", "#C3A6FF"], folds: "#6D3FD9", cheeks: "#FF5C8A" },
  galaxie: { fill: "#3B2F86", gradient: ["#6D3FD9", "#3B2F86", "#1F2A6B"], folds: "#A98BFF", cheeks: "#FF5C8A", stars: true },
};

export const DECORS = ["classe", "bibliotheque", "plage", "foret", "espace", "neige", "aurore"] as const;
export type DecorId = (typeof DECORS)[number];
