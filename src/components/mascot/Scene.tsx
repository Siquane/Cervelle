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
  used = new Map<string, "ball" | "sky">();
  constructor(private prefix: string) {}
  ball(hex: string) {
    this.used.set(`b${hex.slice(1)}`, "ball");
    return `url(#${this.prefix}b${hex.slice(1)})`;
  }
  sky(hex: string) {
    this.used.set(`s${hex.slice(1)}`, "sky");
    return `url(#${this.prefix}s${hex.slice(1)})`;
  }
  defs() {
    return [...this.used].map(([key, kind]) => {
      const hex = `#${key.slice(1)}`;
      return kind === "ball" ? (
        <RadialGradient key={key} id={`${this.prefix}${key}`} cx="0.35" cy="0.28" r="0.85">
          <Stop offset="0" stopColor={shade(hex, 0.45)} />
          <Stop offset="0.45" stopColor={hex} />
          <Stop offset="1" stopColor={shade(hex, -0.22)} />
        </RadialGradient>
      ) : (
        <LinearGradient key={key} id={`${this.prefix}${key}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(hex, night(hex) ? 0.08 : 0.3)} />
          <Stop offset="1" stopColor={shade(hex, night(hex) ? -0.3 : -0.12)} />
        </LinearGradient>
      );
    });
  }
}

const STARS = [
  [14, 18], [40, 10], [66, 26], [150, 14], [178, 30], [190, 8], [24, 54], [172, 62], [120, 22], [92, 8],
] as const;

function Art({ id, p }: { id: DecorId; p: Paints }) {
  switch (id) {
    case "classe":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#FFF4DD")} />
          <Rect x={0} y={108} width={200} height={32} fill={p.ball("#D9A26A")} />
          <Rect x={30} y={18} width={140} height={66} rx={4} fill={p.ball("#2E6B4F")} stroke="#8A5A2B" strokeWidth={6} />
          <Path d="M 44 36 L 70 36 M 44 48 L 90 48 M 120 34 Q 130 24 140 34 Q 150 44 160 34" stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Rect x={150} y={84} width={14} height={4} rx={2} fill={p.ball("#FFFFFF")} />
        </>
      );
    case "bibliotheque":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#7A4E2D")} />
          {[22, 62, 102].map((y) => (
            <Rect key={y} x={0} y={y + 30} width={200} height={6} fill={p.ball("#5A3519")} />
          ))}
          {[22, 62, 102].flatMap((y, r) =>
            Array.from({ length: 14 }, (_, i) => {
              const w = 9 + ((i * 7 + r * 3) % 5);
              const x = 4 + i * 14 + ((r * 5) % 7);
              const h = 22 + ((i * 3 + r) % 8);
              const fills = ["#E5484D", "#3D8BFD", "#FFC23D", "#3DD486", "#A98BFF", "#FF8A6B"];
              return <Rect key={`${r}-${i}`} x={x} y={y + 30 - h} width={w} height={h} rx={1.5} fill={fills[(i + r * 2) % fills.length]} />;
            }),
          )}
        </>
      );
    case "plage":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#9ED8FF")} />
          <Circle cx={168} cy={28} r={16} fill={p.ball("#FFD45C")} />
          <Rect x={0} y={78} width={200} height={26} fill={p.ball("#2C9BE0")} />
          <Path d="M 0 84 Q 12 80 24 84 T 48 84 T 72 84 T 96 84 T 120 84 T 144 84 T 168 84 T 192 84 T 216 84" stroke="#DDF3FF" strokeWidth={2} fill="none" />
          <Path d="M 0 100 Q 100 90 200 100 L 200 140 L 0 140 Z" fill={p.ball("#F7DC94")} />
          <Path d="M 22 104 L 30 66" stroke="#8A5A2B" strokeWidth={4} />
          <Path d="M 30 66 Q 14 60 6 70 M 30 66 Q 44 56 54 66 M 30 66 Q 26 50 14 50 M 30 66 Q 40 48 52 52" stroke="#2E9E5B" strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      );
    case "foret":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#CFEFD9")} />
          <Rect x={0} y={108} width={200} height={32} fill={p.ball("#6CC27E")} />
          {[16, 44, 156, 184, 100].map((x, i) => (
            <Polygon key={x} points={`${x},${i === 4 ? 40 : 30 + (i % 2) * 12} ${x - 20},${104} ${x + 20},${104}`} fill={i % 2 ? "#2E9E5B" : "#1F7A45"} />
          ))}
          {[16, 44, 156, 184, 100].map((x) => (
            <Rect key={`t${x}`} x={x - 3} y={104} width={6} height={10} fill={p.ball("#8A5A2B")} />
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
          <Circle cx={166} cy={104} r={20} fill={p.ball("#FF8A6B")} />
          <Ellipse cx={166} cy={104} rx={32} ry={7} fill="none" stroke="#FFD45C" strokeWidth={3} />
          <Circle cx={30} cy={112} r={10} fill={p.ball("#8EC5FF")} />
        </>
      );
    case "neige":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#CFE6FA")} />
          <Path d="M 0 100 Q 50 80 100 98 T 200 92 L 200 140 L 0 140 Z" fill={p.ball("#FFFFFF")} />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y + 6} r={2.4} fill={p.ball("#FFFFFF")} />
          ))}
          <Polygon points="176,56 160,96 192,96" fill={p.ball("#2E7D5B")} />
          <Polygon points="176,46 164,74 188,74" fill={p.ball("#2E7D5B")} />
        </>
      );
    case "ile_tresor":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#8FD3F5")} />
          <Circle cx={30} cy={26} r={14} fill={p.ball("#FFD45C")} />
          <Rect x={0} y={70} width={200} height={70} fill={p.ball("#1E88C7")} />
          <Path d="M 0 78 Q 12 74 24 78 T 48 78 T 72 78 T 96 78 T 120 78 T 144 78 T 168 78 T 192 78 T 216 78" stroke="#DDF3FF" strokeWidth={2} fill="none" />
          <Ellipse cx={150} cy={104} rx={56} ry={18} fill={p.ball("#F7DC94")} />
          <Path d="M 168 100 L 174 62" stroke="#8A5A2B" strokeWidth={4} />
          <Path d="M 174 62 Q 158 56 150 66 M 174 62 Q 188 52 198 62 M 174 62 Q 170 46 158 46" stroke="#2E9E5B" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Rect x={124} y={92} width={22} height={14} rx={2} fill={p.ball("#A0652E")} stroke="#5A3519" strokeWidth={2} />
          <Rect x={124} y={88} width={22} height={6} rx={2} fill={p.ball("#C98F0E")} stroke="#5A3519" strokeWidth={2} />
          <Path d="M 30 96 L 40 96 L 36 104 L 22 104 Z" fill={p.ball("#8A5A2B")} />
          <Path d="M 32 96 L 32 80 L 42 92 Z" fill={p.ball("#FFFFFF")} />
          <Path d="M 176 104 L 184 112 M 184 104 L 176 112" stroke="#E5484D" strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "aurore":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill={p.sky("#0E1433")} />
          <Path d="M -10 50 C 30 20 60 70 100 40 C 140 10 170 60 210 30 L 210 60 C 170 90 140 40 100 70 C 60 100 30 50 -10 80 Z" fill={p.ball("#3DD486")} opacity={0.55} />
          <Path d="M -10 70 C 40 50 70 90 110 64 C 150 40 180 80 210 58 L 210 76 C 180 98 150 60 110 84 C 70 108 40 70 -10 90 Z" fill={p.ball("#A98BFF")} opacity={0.5} />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} fill={p.ball("#FFFFFF")} />
          ))}
          <Path d="M 0 118 L 40 100 L 80 116 L 130 96 L 200 116 L 200 140 L 0 140 Z" fill={p.ball("#1B2347")} />
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
      <Defs>{p.defs()}</Defs>
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

