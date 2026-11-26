import type { ReactNode } from "react";
import { View } from "react-native";
import { useId } from "react";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { shade } from "./soft";
import { DECORS, type DecorId } from "./wardrobe";

// A scene behind Cervelle (shop item, slot « decor »). Drawn in a 200 × 140
// box and stretched to fill; nothing important sits near the edges.
// Same « 3D douce » style as Cervelle (soft.ts): objects in volume, a sky that
// gets lighter towards the top.

/** A dark sky (space, aurora) stays dark: it only gets a little lighter at the top. */
const night = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16) < 200;

/** Gradients used by a decor, made on the fly, one per colour. */
class Paints {
  used = new Map<string, "ball" | "sky" | "halo">();
  constructor(readonly prefix: string) {}
  ball(hex: string) {
    this.used.set(`b${hex.slice(1)}`, "ball");
    return `url(#${this.prefix}b${hex.slice(1)})`;
  }
  sky(hex: string) {
    this.used.set(`s${hex.slice(1)}`, "sky");
    return `url(#${this.prefix}s${hex.slice(1)})`;
  }
  /** A soft glow (a sun's halo) or shadow that fades out at the edge. */
  halo(hex: string) {
    this.used.set(`h${hex.slice(1)}`, "halo");
    return `url(#${this.prefix}h${hex.slice(1)})`;
  }
  defs() {
    return [...this.used].map(([key, kind]) => {
      const hex = `#${key.slice(1)}`;
      if (kind === "halo")
        return (
          <RadialGradient key={key} id={`${this.prefix}${key}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={hex} stopOpacity={0.55} />
            <Stop offset="1" stopColor={hex} stopOpacity={0} />
          </RadialGradient>
        );
      return kind === "ball" ? (
        <RadialGradient key={key} id={`${this.prefix}${key}`} cx="0.35" cy="0.28" r="0.85">
          <Stop offset="0" stopColor={shade(hex, 0.6)} />
          <Stop offset="0.4" stopColor={hex} />
          <Stop offset="1" stopColor={shade(hex, -0.38)} />
        </RadialGradient>
      ) : (
        <LinearGradient key={key} id={`${this.prefix}${key}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(hex, night(hex) ? 0.12 : 0.45)} />
          <Stop offset="1" stopColor={shade(hex, night(hex) ? -0.4 : -0.2)} />
        </LinearGradient>
      );
    });
  }
}

const STARS = [
  [14, 18], [40, 10], [66, 26], [150, 14], [178, 30], [190, 8], [24, 54], [172, 62], [120, 22], [92, 8],
] as const;


/** A pine in three soft tiers, on a little trunk, with its shadow on the ground. */
function Pine({ x, base, h, color: c, p }: { x: number; base: number; h: number; color: string; p: Paints }) {
  const tiers = [0, 1, 2].map((k) => {
    const top = base - h + k * h * 0.26;
    const bottom = top + h * 0.42;
    const hw = h * (0.2 + k * 0.08);
    return `M ${x} ${top} C ${x + hw * 0.4} ${top + h * 0.12} ${x + hw * 0.8} ${bottom - h * 0.1} ${x + hw} ${bottom} Q ${x} ${bottom + h * 0.08} ${x - hw} ${bottom} C ${x - hw * 0.8} ${bottom - h * 0.1} ${x - hw * 0.4} ${top + h * 0.12} ${x} ${top} Z`;
  });
  const edge = { stroke: shade(c, -0.45), strokeOpacity: 0.6, strokeWidth: 1.5, strokeLinejoin: "round" as const };
  return (
    <>
      <Ellipse cx={x} cy={base + 2} rx={h * 0.36} ry={3.5} fill={p.halo("#1F5130")} />
      <Rect x={x - 2.5} y={base - h * 0.14} width={5} height={h * 0.16} rx={1.5} fill={p.ball("#8A5A2B")} {...edge} stroke={shade("#8A5A2B", -0.45)} />
      {tiers.map((d, k) => (
        <Path key={k} d={d} fill={p.ball(c)} {...edge} />
      ))}
    </>
  );
}

function Art({ id, p }: { id: DecorId; p: Paints }) {
  switch (id) {
    case "classe":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#FFF4DD")} />
          <Rect x={0} y={108} width={200} height={32} fill={p.ball("#D9A26A")} stroke={shade("#D9A26A", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={30} y={18} width={140} height={66} rx={4} fill={p.ball("#2E6B4F")} stroke="#8A5A2B" strokeWidth={6} />
          <Path d="M 44 36 L 70 36 M 44 48 L 90 48 M 120 34 Q 130 24 140 34 Q 150 44 160 34" stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Rect x={150} y={84} width={14} height={4} rx={2} fill={p.ball("#FFFFFF")} stroke={shade("#FFFFFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "bibliotheque":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#7A4E2D")} />
          {[22, 62, 102].map((y) => (
            <Rect key={y} x={0} y={y + 30} width={200} height={6} fill={p.ball("#5A3519")} stroke={shade("#5A3519", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          ))}
          {[22, 62, 102].flatMap((y, r) =>
            Array.from({ length: 14 }, (_, i) => {
              const w = 9 + ((i * 7 + r * 3) % 5);
              const x = 4 + i * 14 + ((r * 5) % 7);
              const h = 22 + ((i * 3 + r) % 8);
              const fills = ["#E5484D", "#3D8BFD", "#FFC23D", "#3DD486", "#A98BFF", "#FF8A6B"];
              return <Rect key={`${r}-${i}`} x={x} y={y + 30 - h} width={w} height={h} rx={1.5} fill={p.ball(fills[(i + r * 2) % fills.length])} stroke={shade(fills[(i + r * 2) % fills.length], -0.45)} strokeOpacity={0.6} strokeWidth={1} />;
            }),
          )}
        </>
      );
    case "plage":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#9ED8FF")} />
          <Circle cx={168} cy={28} r={32} fill={p.halo("#FFE89A")} />
          <Circle cx={168} cy={28} r={16} fill={p.ball("#FFD45C")} stroke={shade("#FFD45C", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={0} y={78} width={200} height={26} fill={p.ball("#2C9BE0")} stroke={shade("#2C9BE0", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 0 100 Q 100 90 200 100 L 200 140 L 0 140 Z" fill={p.ball("#F7DC94")} stroke={shade("#F7DC94", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 22 104 L 30 66" stroke="#8A5A2B" strokeWidth={4} />
          <Path d="M 30 66 Q 14 60 6 70 M 30 66 Q 44 56 54 66 M 30 66 Q 26 50 14 50 M 30 66 Q 40 48 52 52" stroke="#2E9E5B" strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      );
    case "foret":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#CFEFD9")} />
          <Rect x={0} y={108} width={200} height={32} fill={p.ball("#6CC27E")} stroke={shade("#6CC27E", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          {[
            [44, 100, 58, "#2E9E5B"],
            [16, 106, 70, "#1F7A45"],
            [184, 106, 70, "#1F7A45"],
            [158, 100, 58, "#2E9E5B"],
          ].map(([x, base, h, c]) => (
            <Pine key={x} x={x as number} base={base as number} h={h as number} color={c as string} p={p} />
          ))}
        </>
      );
    case "espace":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#141433")} />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={p.ball("#FFFFFF")} />
          ))}
          <Path d="M 134 104 A 32 7 0 0 1 198 104" fill="none" stroke="#E0A21E" strokeWidth={3} />
          <Circle cx={166} cy={104} r={20} fill={p.ball("#FF8A6B")} stroke={shade("#FF8A6B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 134 104 A 32 7 0 0 0 198 104" fill="none" stroke="#FFD45C" strokeWidth={3.5} strokeLinecap="round" />
          <Circle cx={30} cy={112} r={10} fill={p.ball("#8EC5FF")} stroke={shade("#8EC5FF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "neige":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#CFE6FA")} />
          <Path d="M 0 100 Q 50 80 100 98 T 200 92 L 200 140 L 0 140 Z" fill={p.ball("#FFFFFF")} stroke={shade("#FFFFFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y + 6} r={2.4} fill={p.ball("#FFFFFF")} />
          ))}
          <Pine x={176} base={98} h={56} color="#2E7D5B" p={p} />
          <Pine x={24} base={104} h={40} color="#3A8F68" p={p} />
        </>
      );
    case "ile_tresor":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#8FD3F5")} />
          <Circle cx={30} cy={26} r={28} fill={p.halo("#FFE89A")} />
          <Circle cx={30} cy={26} r={14} fill={p.ball("#FFD45C")} stroke={shade("#FFD45C", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={0} y={70} width={200} height={70} fill={p.ball("#1E88C7")} stroke={shade("#1E88C7", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={150} cy={104} rx={56} ry={18} fill={p.ball("#F7DC94")} stroke={shade("#F7DC94", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 150 102 L 156 64" stroke="#8A5A2B" strokeWidth={4} strokeLinecap="round" />
          <Path d="M 156 64 Q 140 58 132 68 M 156 64 Q 170 54 180 64 M 156 64 Q 152 48 140 48" stroke="#2E9E5B" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Rect x={168} y={94} width={22} height={14} rx={2} fill={p.ball("#A0652E")} stroke="#5A3519" strokeWidth={2} />
          <Rect x={168} y={90} width={22} height={6} rx={2} fill={p.ball("#C98F0E")} stroke="#5A3519" strokeWidth={2} />
          <Path d="M 30 96 L 40 96 L 36 104 L 22 104 Z" fill={p.ball("#8A5A2B")} stroke={shade("#8A5A2B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 32 96 L 32 80 L 42 92 Z" fill={p.ball("#FFFFFF")} stroke={shade("#FFFFFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 158 110 L 164 116 M 164 110 L 158 116" stroke="#E5484D" strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "fond_marin":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#1F7FD0")} />
          {[[20, 0, 40], [70, 0, 30], [130, 0, 36]].map(([x, , w]) => (
            <Path key={x} d={`M ${x} 0 L ${x + w} 0 L ${x + w + 30} 140 L ${x + 18} 140 Z`} fill="#FFFFFF" opacity={0.08} />
          ))}
          <Path d="M 0 116 Q 50 104 100 114 T 200 110 L 200 140 L 0 140 Z" fill={p.ball("#F2D28A")} stroke={shade("#F2D28A", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 18 132 C 10 118 24 108 16 94 C 10 84 22 76 18 64" fill="none" stroke="#2E9E5B" strokeWidth={6} strokeLinecap="round" />
          <Path d="M 30 134 C 24 122 36 114 30 102" fill="none" stroke="#3DD486" strokeWidth={5} strokeLinecap="round" />
          <Path d="M 186 132 C 194 118 180 108 188 94 C 194 84 182 76 186 66" fill="none" stroke="#2E9E5B" strokeWidth={6} strokeLinecap="round" />
          <Ellipse cx={34} cy={40} rx={12} ry={7} fill={p.ball("#FF8A3D")} stroke={shade("#FF8A3D", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 46 40 L 56 33 L 56 47 Z" fill={p.ball("#FF8A3D")} stroke={shade("#FF8A3D", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Circle cx={29} cy={38} r={1.8} fill="#1F1A3D" />
          <Ellipse cx={164} cy={56} rx={10} ry={6} fill={p.ball("#FFC23D")} stroke={shade("#FFC23D", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 154 56 L 146 50 L 146 62 Z" fill={p.ball("#FFC23D")} stroke={shade("#FFC23D", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Circle cx={169} cy={54} r={1.5} fill="#1F1A3D" />
          {[[150, 30, 3], [156, 20, 2.2], [152, 12, 1.6], [48, 78, 2.5], [44, 68, 1.8]].map(([x, y, r]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#FFFFFF" fillOpacity={0.25} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1} />
          ))}
          <Path d="M 168 122 L 172 112 L 176 122 L 186 118 L 178 126 L 182 134 L 172 130 L 162 134 L 166 126 L 158 118 Z" fill={p.ball("#FF6B8A")} stroke={shade("#FF6B8A", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "montagne":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#9ED8FF")} />
          <Path d="M -10 108 L 40 34 L 78 84 L 112 46 L 160 108 Z" fill={p.ball("#7C8FB8")} stroke={shade("#7C8FB8", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 120 108 L 168 28 L 214 108 Z" fill={p.ball("#6A7DA8")} stroke={shade("#6A7DA8", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 40 34 L 30 50 L 38 47 L 44 54 L 50 46 Z" fill={p.ball("#FFFFFF")} stroke={shade("#FFFFFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 112 46 L 103 58 L 111 56 L 116 62 L 121 56 Z" fill={p.ball("#FFFFFF")} stroke={shade("#FFFFFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 168 28 L 156 48 L 165 45 L 171 52 L 178 44 Z" fill={p.ball("#FFFFFF")} stroke={shade("#FFFFFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={0} y={104} width={200} height={36} fill={p.ball("#8BD17C")} stroke={shade("#8BD17C", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={36} cy={122} rx={30} ry={8} fill={p.ball("#4FA8E0")} stroke={shade("#4FA8E0", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Pine x={180} base={122} h={34} color="#2E9E5B" p={p} />
          <Pine x={166} base={126} h={26} color="#1F7A45" p={p} />
        </>
      );
    case "jungle":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#FFD9A8")} />
          {[[150, 14, 8], [160, 6, 6], [142, 4, 5]].map(([x, y, r]) => (
            <Circle key={x} cx={x} cy={y} r={r} fill={p.ball("#C9C3D6")} />
          ))}
          <Path d="M 112 96 L 140 30 L 160 30 L 190 96 Z" fill={p.ball("#8A5A3B")} stroke={shade("#8A5A3B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 140 30 L 160 30 L 156 40 L 150 36 L 144 42 Z" fill={p.ball("#FF6A2B")} stroke={shade("#FF6A2B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={0} y={96} width={200} height={44} fill={p.ball("#5FB36B")} stroke={shade("#5FB36B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={10} cy={60} rx={30} ry={11} transform="rotate(-35 10 60)" fill={p.ball("#2E9E5B")} stroke={shade("#2E9E5B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={18} cy={92} rx={30} ry={10} transform="rotate(-10 18 92)" fill={p.ball("#3DB86A")} stroke={shade("#3DB86A", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={6} cy={30} rx={26} ry={9} transform="rotate(-60 6 30)" fill={p.ball("#1F7A45")} stroke={shade("#1F7A45", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={196} cy={112} rx={24} ry={8} transform="rotate(20 196 112)" fill={p.ball("#2E9E5B")} stroke={shade("#2E9E5B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Ellipse cx={168} cy={126} rx={14} ry={3} fill={p.halo("#1F5130")} />
          <Path d="M 154 116 C 150 104 162 96 174 102 L 182 86 C 184 80 192 80 192 86 L 184 108 C 188 116 182 124 172 124 L 158 124 C 152 124 150 120 154 116 Z" fill={p.ball("#6CC27E")} stroke={shade("#6CC27E", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={158} y={120} width={6} height={8} rx={2} fill={p.ball("#4FA45F")} stroke={shade("#4FA45F", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={172} y={120} width={6} height={8} rx={2} fill={p.ball("#4FA45F")} stroke={shade("#4FA45F", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Circle cx={188} cy={84} r={1.5} fill="#1F1A3D" />
        </>
      );
    case "chateau":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#BFE3FF")} />
          {[[26, 24, 10], [38, 20, 12], [50, 26, 9], [96, 14, 7], [106, 12, 8]].map(([x, y, r]) => (
            <Circle key={x} cx={x} cy={y} r={r} fill={p.ball("#FFFFFF")} />
          ))}
          <Path d="M -10 112 Q 50 92 110 108 T 210 102 L 210 140 L -10 140 Z" fill={p.ball("#8FD38A")} stroke={shade("#8FD38A", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={136} y={70} width={50} height={44} fill={p.ball("#E8DCF5")} stroke={shade("#E8DCF5", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={128} y={54} width={16} height={60} rx={2} fill={p.ball("#DCCCF0")} stroke={shade("#DCCCF0", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={178} y={54} width={16} height={60} rx={2} fill={p.ball("#DCCCF0")} stroke={shade("#DCCCF0", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 126 54 L 136 34 L 146 54 Z" fill={p.ball("#A98BFF")} stroke={shade("#A98BFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 176 54 L 186 34 L 196 54 Z" fill={p.ball("#A98BFF")} stroke={shade("#A98BFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M 136 34 L 136 24 L 144 27 L 136 30" fill="none" stroke="#E5484D" strokeWidth={2} strokeLinejoin="round" />
          <Path d="M 186 34 L 186 24 L 194 27 L 186 30" fill="none" stroke="#FFC23D" strokeWidth={2} strokeLinejoin="round" />
          <Path d="M 154 114 L 154 98 Q 161 88 168 98 L 168 114 Z" fill={p.ball("#8A5A2B")} stroke={shade("#8A5A2B", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={133} y={66} width={6} height={9} rx={3} fill={p.ball("#5B4FD6")} stroke={shade("#5B4FD6", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Rect x={183} y={66} width={6} height={9} rx={3} fill={p.ball("#5B4FD6")} stroke={shade("#5B4FD6", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "aurore":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#0E1433")} />
          <Path d="M -10 50 C 30 20 60 70 100 40 C 140 10 170 60 210 30 L 210 60 C 170 90 140 40 100 70 C 60 100 30 50 -10 80 Z" fill={p.ball("#3DD486")} opacity={0.55} stroke={shade("#3DD486", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d="M -10 70 C 40 50 70 90 110 64 C 150 40 180 80 210 58 L 210 76 C 180 98 150 60 110 84 C 70 108 40 70 -10 90 Z" fill={p.ball("#A98BFF")} opacity={0.5} stroke={shade("#A98BFF", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} fill={p.ball("#FFFFFF")} />
          ))}
          <Path d="M 0 118 L 40 100 L 80 116 L 130 96 L 200 116 L 200 140 L 0 140 Z" fill={p.ball("#1B2347")} stroke={shade("#1B2347", -0.45)} strokeOpacity={0.6} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
  }
}

function DecorArt({ id }: { id: DecorId }) {
  const p = new Paints(`d${useId().replace(/[^a-zA-Z0-9]/g, "")}`);
  // Drawing the art first fills p with the gradients it needs.
  const shapes = Art({ id, p });
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      {shapes}
      {/* Light from the top left, darker corners: the same depth as the cards. */}
      <Rect x={0} y={0} width={200} height={140} fill={`url(#${p.prefix}vignette)`} />
      <Defs>
        {p.defs()}
        <RadialGradient id={`${p.prefix}vignette`} cx="0.35" cy="0.3" r="0.95">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.18} />
          <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#0B0A1F" stopOpacity={0.28} />
        </RadialGradient>
      </Defs>
    </Svg>
  );
}

/** Cervelle in front of their decor (or just Cervelle when there is none). */
export function Scene({ equipped, width, height, radius = 22, children }: { equipped: string[]; width: number | `${number}%`; height: number; radius?: number; children: ReactNode }) {
  const decor = equipped.find((id): id is DecorId => (DECORS as readonly string[]).includes(id));
  return (
    <View style={{ width, height, borderRadius: radius, overflow: "hidden", alignItems: "center", justifyContent: "flex-end" }}>
      {decor ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <DecorArt id={decor} />
        </View>
      ) : null}
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  );
}

