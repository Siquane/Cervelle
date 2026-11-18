import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from "react-native-svg";
import { DECORS, type DecorId } from "./wardrobe";

// A scene behind Cervelle (shop item, slot « decor »). Drawn in a 200 × 140
// box and stretched to fill; nothing important sits near the edges.

const STARS = [
  [14, 18], [40, 10], [66, 26], [150, 14], [178, 30], [190, 8], [24, 54], [172, 62], [120, 22], [92, 8],
] as const;

function Art({ id }: { id: DecorId }) {
  switch (id) {
    case "classe":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill="#FFF4DD" />
          <Rect x={0} y={108} width={200} height={32} fill="#D9A26A" />
          <Rect x={30} y={18} width={140} height={66} rx={4} fill="#2E6B4F" stroke="#8A5A2B" strokeWidth={6} />
          <Path d="M 44 36 L 70 36 M 44 48 L 90 48 M 120 34 Q 130 24 140 34 Q 150 44 160 34" stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Rect x={150} y={84} width={14} height={4} rx={2} fill="#FFFFFF" />
        </>
      );
    case "bibliotheque":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill="#7A4E2D" />
          {[22, 62, 102].map((y) => (
            <Rect key={y} x={0} y={y + 30} width={200} height={6} fill="#5A3519" />
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
          <Rect x={0} y={0} width={200} height={140} fill="#9ED8FF" />
          <Circle cx={168} cy={28} r={16} fill="#FFD45C" />
          <Rect x={0} y={78} width={200} height={26} fill="#2C9BE0" />
          <Path d="M 0 84 Q 12 80 24 84 T 48 84 T 72 84 T 96 84 T 120 84 T 144 84 T 168 84 T 192 84 T 216 84" stroke="#DDF3FF" strokeWidth={2} fill="none" />
          <Path d="M 0 100 Q 100 90 200 100 L 200 140 L 0 140 Z" fill="#F7DC94" />
          <Path d="M 22 104 L 30 66" stroke="#8A5A2B" strokeWidth={4} />
          <Path d="M 30 66 Q 14 60 6 70 M 30 66 Q 44 56 54 66 M 30 66 Q 26 50 14 50 M 30 66 Q 40 48 52 52" stroke="#2E9E5B" strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      );
    case "foret":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill="#CFEFD9" />
          <Rect x={0} y={108} width={200} height={32} fill="#6CC27E" />
          {[16, 44, 156, 184, 100].map((x, i) => (
            <Polygon key={x} points={`${x},${i === 4 ? 40 : 30 + (i % 2) * 12} ${x - 20},${104} ${x + 20},${104}`} fill={i % 2 ? "#2E9E5B" : "#1F7A45"} />
          ))}
          {[16, 44, 156, 184, 100].map((x) => (
            <Rect key={`t${x}`} x={x - 3} y={104} width={6} height={10} fill="#8A5A2B" />
          ))}
        </>
      );
    case "espace":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill="#141433" />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="#FFFFFF" />
          ))}
          <Circle cx={166} cy={104} r={20} fill="#FF8A6B" />
          <Ellipse cx={166} cy={104} rx={32} ry={7} fill="none" stroke="#FFD45C" strokeWidth={3} />
          <Circle cx={30} cy={112} r={10} fill="#8EC5FF" />
        </>
      );
    case "neige":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill="#CFE6FA" />
          <Path d="M 0 100 Q 50 80 100 98 T 200 92 L 200 140 L 0 140 Z" fill="#FFFFFF" />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y + 6} r={2.4} fill="#FFFFFF" />
          ))}
          <Polygon points="176,56 160,96 192,96" fill="#2E7D5B" />
          <Polygon points="176,46 164,74 188,74" fill="#2E7D5B" />
        </>
      );
    case "aurore":
      return (
        <>
          <Rect x={0} y={0} width={200} height={140} fill="#0E1433" />
          <Path d="M -10 50 C 30 20 60 70 100 40 C 140 10 170 60 210 30 L 210 60 C 170 90 140 40 100 70 C 60 100 30 50 -10 80 Z" fill="#3DD486" opacity={0.55} />
          <Path d="M -10 70 C 40 50 70 90 110 64 C 150 40 180 80 210 58 L 210 76 C 180 98 150 60 110 84 C 70 108 40 70 -10 90 Z" fill="#A98BFF" opacity={0.5} />
          {STARS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} fill="#FFFFFF" />
          ))}
          <Path d="M 0 118 L 40 100 L 80 116 L 130 96 L 200 116 L 200 140 L 0 140 Z" fill="#1B2347" />
        </>
      );
  }
}

/** Cervelle in front of their decor (or just Cervelle when there is none). */
export function Scene({ equipped, width, height, radius = 22, children }: { equipped: string[]; width: number | `${number}%`; height: number; radius?: number; children: ReactNode }) {
  const decor = equipped.find((id): id is DecorId => (DECORS as readonly string[]).includes(id));
  return (
    <View style={{ width, height, borderRadius: radius, overflow: "hidden", alignItems: "center", justifyContent: "flex-end" }}>
      {decor ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Svg width="100%" height="100%" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
            <Art id={decor} />
          </Svg>
        </View>
      ) : null}
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  );
}

export const decorOf = (equipped: string[]) => equipped.find((id) => (DECORS as readonly string[]).includes(id)) ?? null;
