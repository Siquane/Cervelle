import { useId } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { BadgeShape, BadgeWindow } from "../api/types";
import { color, scheme } from "../theme/tokens";
import { Mascot } from "./mascot/Mascot";

// A badge: a metal medal (bronze, silver, gold, or a season's colours) with
// Cervelle in the middle and the badge's emblem in a tab at the bottom.
// Not earned yet: grey, and Cervelle sleeps.

export type Metal = "locked" | "bronze" | "argent" | "or" | "printemps" | "ete" | "automne" | "hiver" | "fete";

/** light, middle, dark: the gradient of the face and the rim. */
const METALS: Record<Exclude<Metal, "locked">, [string, string, string]> = {
  bronze: ["#FAD3B4", "#E39465", "#A9582B"],
  argent: ["#F7F8FB", "#C9CFDB", "#848DA3"],
  or: ["#FFF1B8", "#FFC94D", "#A87500"],
  printemps: ["#FFE1EC", "#F59BC0", "#C24F82"],
  ete: ["#FFF4BF", "#FFD45C", "#B06A00"],
  automne: ["#FFE0C2", "#F2954B", "#B5531B"],
  hiver: ["#E8F6FF", "#9CD3F5", "#4A8FC4"],
  fete: ["#EFE6FF", "#B79BFF", "#6D3FD9"],
};
const LOCKED: [string, string, string] = scheme === "dark" ? ["#3A4263", "#2A3150", "#1D2440"] : ["#F1F3F8", "#DADEE8", "#A9AEC2"];
const INK = "#1F1A3D";

/** A season's own colours, a holiday's violet; grey until earned. */
export const windowMetal = (w: BadgeWindow): Metal => (!w.earned ? "locked" : w.family === "fete" ? "fete" : (w.key.split(":")[1] as Metal));

export const tierMetal = (tier: number): Metal => (["locked", "bronze", "argent", "or"] as const)[Math.max(0, Math.min(3, tier))];

function star(): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 48 : 27;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(53 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function hexagon(): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return `${(50 + 47 * Math.cos(a)).toFixed(1)},${(50 + 47 * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

const PETALS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return { cx: 50 + 30 * Math.cos(a), cy: 50 + 30 * Math.sin(a) };
});

/** The shape, filled with `fill`; drawn twice (rim stroke, then face) for a clean outline. */
function ShapeArt({ shape, fill, stroke, strokeWidth = 0 }: { shape: BadgeShape; fill: string; stroke?: string; strokeWidth?: number }) {
  const p = { fill, stroke, strokeWidth, strokeLinejoin: "round" as const };
  switch (shape) {
    case "star":
      return <Polygon points={star()} {...p} />;
    case "hexagon":
      return <Polygon points={hexagon()} {...p} />;
    case "diamond":
      return <Polygon points="50,3 97,50 50,97 3,50" {...p} />;
    case "shield":
      return <Path d="M50 4 L88 15 V47 C88 71 71 87 50 96 C29 87 12 71 12 47 V15 Z" {...p} />;
    case "flower":
      return (
        <G>
          {PETALS.map((c, i) => (
            <Circle key={i} cx={c.cx} cy={c.cy} r={17} {...p} />
          ))}
          <Circle cx={50} cy={50} r={32} {...p} />
        </G>
      );
    default:
      return <Circle cx={50} cy={50} r={46} {...p} />;
  }
}

export function Medal({ shape, metal, icon, size = 96, dot = false }: { shape: BadgeShape; metal: Metal; icon: string; size?: number; dot?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [light, mid, dark] = metal === "locked" ? LOCKED : METALS[metal];
  const locked = metal === "locked";
  const tab = size * 0.27;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="-4 -4 108 108">
        <Defs>
          <LinearGradient id={`face${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={light} />
            <Stop offset="0.55" stopColor={mid} />
            <Stop offset="1" stopColor={dark} />
          </LinearGradient>
          <LinearGradient id={`inner${id}`} x1="1" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={light} />
            <Stop offset="1" stopColor={mid} />
          </LinearGradient>
        </Defs>
        {/* Rim: a thick ink outline, then the metal on top. */}
        <ShapeArt shape={shape} fill={INK} stroke={locked ? dark : INK} strokeWidth={8} />
        <ShapeArt shape={shape} fill={`url(#face${id})`} />
        <G transform="translate(50 50) scale(0.74) translate(-50 -50)">
          <ShapeArt shape={shape} fill={`url(#inner${id})`} stroke={dark} strokeWidth={3} />
        </G>
      </Svg>
      <View style={{ position: "absolute", left: 0, right: 0, top: size * 0.17, alignItems: "center", opacity: locked ? 0.55 : 1 }}>
        <Mascot size={size * 0.52} mood={locked ? "sleep" : metal === "or" ? "wow" : "happy"} />
      </View>
      <View
        style={{
          position: "absolute",
          left: (size - tab) / 2,
          bottom: size * 0.02,
          width: tab,
          height: tab,
          borderRadius: tab / 2,
          backgroundColor: locked ? LOCKED[1] : dark,
          borderWidth: 2,
          borderColor: locked ? LOCKED[2] : INK,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={tab * 0.58} color={locked ? color.faint : "#FFFFFF"} />
      </View>
      {dot ? <View style={{ position: "absolute", top: 0, right: 0, width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: color.red, borderWidth: 2, borderColor: color.bg }} /> : null}
    </View>
  );
}
