import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { ACCESSORIES, BRAIN, EYES, eyeShapes, FOLDS, INK_COLOR, VIEWBOX, type Shape } from "./geometry";

export type Mood = "happy" | "wow" | "sad" | "sleep";

function ShapeView({ s }: { s: Shape }) {
  const stroke = s.stroke ? { stroke: s.stroke, strokeWidth: s.strokeWidth ?? 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const } : {};
  switch (s.kind) {
    case "path":
      return <Path d={s.d} fill={s.fill} {...stroke} />;
    case "circle":
      return <Circle cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} {...stroke} />;
    case "ellipse":
      return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} {...stroke} />;
    case "rect":
      return <Rect x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} fill={s.fill} {...stroke} />;
  }
}

/** Cervelle, the mascot, with the accessories the child bought. */
export function Mascot({ size = 120, accessories = [], mood = "happy" }: { size?: number; accessories?: string[]; mood?: Mood }) {
  const acc = accessories.map((id) => ACCESSORIES[id]).filter(Boolean);
  return (
    <Svg width={size} height={size * (214 / 220)} viewBox={VIEWBOX} accessibilityLabel="Cervelle, la mascotte">
      <Path d={BRAIN} fill="#FF8FB1" stroke={INK_COLOR} strokeWidth={5} strokeLinejoin="round" />
      {FOLDS.map((d) => (
        <Path key={d} d={d} fill="none" stroke="#D63D6C" strokeWidth={4} strokeLinecap="round" />
      ))}
      {acc.filter((a) => a.behindFace).flatMap((a, i) => a.shapes.map((s, j) => <ShapeView key={`b${i}-${j}`} s={s} />))}
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
      <Ellipse cx={64} cy={131} rx={9} ry={5.5} fill="#FF5C8A" opacity={0.55} />
      <Ellipse cx={140} cy={131} rx={9} ry={5.5} fill="#FF5C8A" opacity={0.55} />
      {mood === "wow" ? (
        <Ellipse cx={102} cy={137} rx={8} ry={9} fill={INK_COLOR} />
      ) : mood === "sad" ? (
        <Path d="M 91 140 Q 102 130 113 140" fill="none" stroke={INK_COLOR} strokeWidth={4.5} strokeLinecap="round" />
      ) : (
        <Path d="M 91 131 Q 102 143 113 131" fill="none" stroke={INK_COLOR} strokeWidth={4.5} strokeLinecap="round" />
      )}
      {acc.filter((a) => !a.behindFace).flatMap((a, i) => a.shapes.map((s, j) => <ShapeView key={`f${i}-${j}`} s={s} />))}
    </Svg>
  );
}
