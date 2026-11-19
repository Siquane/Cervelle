import { useId } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { ACCESSORIES, BRAIN, EYES, eyeShapes, FOLDS, INK_COLOR, VIEWBOX, type Shape } from "./geometry";
import { BRAIN_COLORS, WARDROBE, type Item } from "./wardrobe";

const ITEMS: Record<string, Item> = { ...Object.fromEntries(Object.entries(ACCESSORIES).map(([k, v]) => [k, { layer: v.behindFace ? ("face" as const) : undefined, shapes: v.shapes }])), ...WARDROBE };

const STARS = [
  [70, 80, 2.5], [140, 72, 2], [52, 118, 2], [160, 120, 2.5], [108, 60, 2], [92, 150, 2], [130, 150, 1.8],
] as const;

export type Mood = "happy" | "wow" | "sad" | "sleep";

function ShapeView({ s }: { s: Shape }) {
  const paint = {
    fill: s.fill,
    opacity: s.opacity,
    ...(s.stroke ? { stroke: s.stroke, strokeWidth: s.strokeWidth ?? 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const } : {}),
  };
  switch (s.kind) {
    case "path":
      return <Path d={s.d} {...paint} />;
    case "circle":
      return <Circle cx={s.cx} cy={s.cy} r={s.r} {...paint} />;
    case "ellipse":
      return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...paint} />;
    case "rect":
      return <Rect x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} {...paint} />;
  }
}

/** Cervelle, the mascot, with the accessories the child bought. */
export function Mascot({ size = 120, accessories = [], mood = "happy" }: { size?: number; accessories?: string[]; mood?: Mood }) {
  const gid = `brain${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const items = accessories.map((id) => ITEMS[id]).filter(Boolean);
  const tint = BRAIN_COLORS[accessories.find((id) => BRAIN_COLORS[id]) ?? "rose"];
  const layer = (l: Item["layer"], tag: string) => items.filter((a) => a.layer === l).flatMap((a, i) => a.shapes.map((s, j) => <ShapeView key={`${tag}${i}-${j}`} s={s} />));
  return (
    <Svg width={size} height={size * (214 / 220)} viewBox={VIEWBOX} accessibilityLabel="Cervelle, la mascotte">
      {tint.gradient ? (
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            {tint.gradient.map((c, i) => (
              <Stop key={c + i} offset={i / (tint.gradient!.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
      ) : null}
      {layer("behind", "b")}
      <Path d={BRAIN} fill={tint.gradient ? `url(#${gid})` : tint.fill} stroke={INK_COLOR} strokeWidth={5} strokeLinejoin="round" />
      {FOLDS.map((d) => (
        <Path key={d} d={d} fill="none" stroke={tint.folds} strokeWidth={4} strokeLinecap="round" />
      ))}
      {tint.stars ? STARS.map(([cx, cy, r]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#FFFFFF" />) : null}
      {layer("face", "f")}
      {EYES.map((e) =>
        mood === "sleep" ? (
          <Path key={e.cx} d={`M ${e.cx - 11} ${e.cy + 2} Q ${e.cx} ${e.cy + 10} ${e.cx + 11} ${e.cy + 2}`} fill="none" stroke={INK_COLOR} strokeWidth={4} strokeLinecap="round" />
        ) : (
          <G key={e.cx}>
            {eyeShapes(e, mood === "wow").map((sh, j) => (
              <ShapeView key={j} s={sh} />
            ))}
          </G>
        ),
      )}
      <Ellipse cx={64} cy={131} rx={9} ry={5.5} fill={tint.cheeks} opacity={0.55} />
      <Ellipse cx={140} cy={131} rx={9} ry={5.5} fill={tint.cheeks} opacity={0.55} />
      {mood === "wow" ? (
        <Ellipse cx={102} cy={137} rx={8} ry={9} fill={INK_COLOR} />
      ) : mood === "sad" ? (
        <Path d="M 91 140 Q 102 130 113 140" fill="none" stroke={INK_COLOR} strokeWidth={4.5} strokeLinecap="round" />
      ) : (
        <Path d="M 91 131 Q 102 143 113 131" fill="none" stroke={INK_COLOR} strokeWidth={4.5} strokeLinecap="round" />
      )}
      {layer(undefined, "t")}
    </Svg>
  );
}
