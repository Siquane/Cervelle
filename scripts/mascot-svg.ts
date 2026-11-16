import { ACCESSORIES, BRAIN, EYES, eyeShapes, FOLDS, INK_COLOR, VIEWBOX, type Shape } from "../src/components/mascot/geometry";

// The mascot as a plain SVG string (for the icon and splash generator).

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

export function mascotSvg(opts: { accessories?: string[]; viewBox?: string; body?: string } = {}): string {
  const acc = (opts.accessories ?? []).map((id) => ACCESSORIES[id]).filter(Boolean);
  const body = opts.body ?? "#FF8FB1";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="${opts.viewBox ?? VIEWBOX}">
<path d="${BRAIN}" fill="${body}" stroke="${INK_COLOR}" stroke-width="5" stroke-linejoin="round"/>
${FOLDS.map((d) => `<path d="${d}" fill="none" stroke="#D63D6C" stroke-width="4" stroke-linecap="round"/>`).join("")}
${acc.filter((a) => a.behindFace).flatMap((a) => a.shapes.map(shape)).join("")}
${EYES.flatMap((e) => eyeShapes(e).map(shape)).join("")}
<ellipse cx="64" cy="131" rx="9" ry="5.5" fill="#FF5C8A" opacity="0.55"/><ellipse cx="140" cy="131" rx="9" ry="5.5" fill="#FF5C8A" opacity="0.55"/>
<path d="M 91 131 Q 102 143 113 131" fill="none" stroke="${INK_COLOR}" stroke-width="4.5" stroke-linecap="round"/>
${acc.filter((a) => !a.behindFace).flatMap((a) => a.shapes.map(shape)).join("")}
</svg>`;
}
