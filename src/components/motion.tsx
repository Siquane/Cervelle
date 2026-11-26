import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

// Petits effets de mouvement : le contenu qui glisse quand on change d'onglet,
// et les nombres qui défilent jusqu'à leur nouvelle valeur. Rien ne bouge si
// le téléphone demande moins d'animations (réglage d'accessibilité).

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => {
    reduceMotion = v;
  })
  .catch(() => undefined);
AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v) => {
  reduceMotion = v;
});
export const motionReduced = () => reduceMotion;

/**
 * Quand `k` change, le contenu arrive en glissant (depuis la droite si
 * `direction` vaut 1, depuis la gauche si -1) et en fondu.
 */
export function SlideIn({ k, direction = 1, children, style }: { k: string; direction?: 1 | -1; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  const dir = useRef(direction);
  dir.current = direction;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    p.setValue(0);
    Animated.timing(p, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [k]);
  const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [28 * dir.current, 0] });
  return <Animated.View style={[{ opacity: p, transform: [{ translateX }] }, style]}>{children}</Animated.View>;
}

/** Un nombre qui défile de sa valeur précédente à la nouvelle (`format` l'écrit). */
export function useCountUp(value: number, duration = 600): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || reduceMotion) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = start + (value - start) * eased;
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

/** 1 quand on avance vers un onglet plus à droite, -1 vers la gauche. */
export function useDirection(index: number): 1 | -1 {
  const prev = useRef(index);
  const dir = useRef<1 | -1>(1);
  if (index !== prev.current) {
    dir.current = index > prev.current ? 1 : -1;
    prev.current = index;
  }
  return dir.current;
}
