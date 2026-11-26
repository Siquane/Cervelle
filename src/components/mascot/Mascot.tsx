import { createElement, memo, useId, useMemo, type ReactNode } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { mascotTree, type El, type Mood } from "./soft";

export type { Mood };

// react-native-svg component for each tag of the drawing (soft.ts).
const TAGS: Record<string, unknown> = { defs: Defs, g: G, path: Path, circle: Circle, ellipse: Ellipse, rect: Rect, radialGradient: RadialGradient, linearGradient: LinearGradient, stop: Stop };

function render(t: El, key: string): ReactNode {
  const C = TAGS[t.tag];
  if (!C) return null;
  return createElement(C as never, { key, ...t.attrs }, t.children?.map((c, i) => render(c, `${key}.${i}`)));
}

type MascotProps = { size?: number; accessories?: string[]; mood?: Mood; shadow?: boolean };

/**
 * Cervelle, the mascot, with the accessories the child bought. Memoised on the
 * accessories' content (callers often pass a fresh array): the shop, the podium
 * and the badges page draw many of them and re-render on every tap.
 */
export const Mascot = memo(
  MascotArt,
  (a, b) => a.size === b.size && a.mood === b.mood && a.shadow === b.shadow && (a.accessories ?? []).join("|") === (b.accessories ?? []).join("|"),
);

function MascotArt({ size = 120, accessories = [], mood = "happy", shadow = true }: MascotProps) {
  const prefix = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const key = accessories.join("|");
  const tree = useMemo(() => mascotTree(accessories, mood, prefix, { shadow }), [key, mood, prefix, shadow]);
  return (
    <Svg width={size} height={size * (214 / 220)} viewBox={String(tree.attrs.viewBox)} accessibilityLabel="Cervelle, la mascotte">
      {tree.children?.map((c, i) => render(c, String(i)))}
    </Svg>
  );
}
