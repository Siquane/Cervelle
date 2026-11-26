import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";

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

/** Un petit saut (agrandi puis remis) chaque fois que `k` change, mais pas au premier affichage. */
export function Pop({ k, children, scale = 1.25, style }: { k: string | number; children: ReactNode; scale?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(v, { toValue: scale, duration: 120, useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
    ]).start();
  }, [k]);
  return <Animated.View style={[{ transform: [{ scale: v }] }, style]}>{children}</Animated.View>;
}

/** Arrive en rebondissant (bonne réponse) ou en secouant doucement la tête (erreur). */
export function Reaction({ good, children, style }: { good: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: good ? 420 : 380, easing: Easing.linear, useNativeDriver: true }).start();
  }, [good]);
  const transform = good
    ? [{ scale: v.interpolate({ inputRange: [0, 0.45, 0.7, 1], outputRange: [0.85, 1.06, 0.98, 1] }) }]
    : [{ translateX: v.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -10, 9, -6, 3, 0] }) }];
  return <Animated.View style={[{ transform }, style]}>{children}</Animated.View>;
}

/** Une pluie d'étoiles qui part du centre quand `k` change (au premier affichage seulement avec `now`). */
export function StarBurst({ k, color = "#FFC23D", count = 10, now = false }: { k: string | number; color?: string; count?: number; /** Aussi au premier affichage. */ now?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!now) return;
    }
    if (reduceMotion) return;
    setOn(true);
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => setOn(false));
  }, [k]);
  if (!on) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = 60 + (i % 3) * 18;
        return (
          <Animated.Text
            key={i}
            style={{
              position: "absolute",
              fontSize: 16 + (i % 2) * 6,
              color,
              opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-8, Math.cos(a) * r - 8] }) },
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, Math.sin(a) * r - 10] }) },
                { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.2, 0.6] }) },
              ],
            }}
          >
            {"\u2605" /* étoile dessinée avec la police, pas un émoji */}
          </Animated.Text>
        );
      })}
    </View>
  );
}

/** « +5 » qui monte et s'efface au-dessus d'un compteur quand la valeur augmente. */
export function FloatUp({ value, color, style }: { value: number; color: string; style?: StyleProp<ViewStyle> }) {
  const prev = useRef(value);
  const [gain, setGain] = useState<{ n: number; id: number } | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (d <= 0 || reduceMotion) return;
    setGain({ n: d, id: Date.now() });
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setGain(null));
  }, [value]);
  if (!gain) return null;
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        { position: "absolute", top: -6, alignSelf: "center", fontWeight: "900", fontSize: 16, color },
        { opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -34] }) }] },
        style as object,
      ]}
    >
      +{gain.n}
    </Animated.Text>
  );
}

/** Apparaît en montant un peu, après `index` × 60 ms : les cartes arrivent en cascade. */
export function Cascade({ index, children, style }: { index: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(v, { toValue: 1, duration: 320, delay: Math.min(index, 8) * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }, style]}>{children}</Animated.View>;
}

/** Cervelle respire doucement ; `jump` qui change le fait sauter de joie. */
export function Alive({ jump = 0, children, style }: { jump?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const breath = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 260, easing: Easing.bounce, useNativeDriver: true }),
    ]).start();
  }, [jump]);
  return (
    <Animated.View
      style={[
        {
          transform: [
            { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
            { scaleY: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
            { scaleX: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.99] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Vrai pendant un clin d'œil (150 ms toutes les 3 à 6 s). */
export function useBlink(): boolean {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (reduceMotion) return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setClosed(true);
        t = setTimeout(() => {
          setClosed(false);
          next();
        }, 150);
      }, 3000 + Math.random() * 3000);
    };
    next();
    return () => clearTimeout(t);
  }, []);
  return closed;
}

/** Une barre qui se remplit jusqu'à `value` (0 à 100) à l'affichage et à chaque changement. */
export function useFill(value: number): Animated.Value {
  const v = useRef(new Animated.Value(reduceMotion ? value : 0)).current;
  useEffect(() => {
    if (reduceMotion) v.setValue(value);
    else Animated.timing(v, { toValue: value, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value]);
  return v;
}
