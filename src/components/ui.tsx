import { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, Text as RNText, TextProps, TextStyle, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { color, font, GUTTER, onColor, radius, reading, size, space } from "../theme/tokens";
import { useFontRefresh } from "../state/reading";
import { Coin } from "./Coin";

type Variant = "title" | "h2" | "h3" | "body" | "bodyBold" | "small" | "label";

/** Calculé à l'affichage : la police peut changer (Réglages → Police pour la dyslexie). */
function textStyle(v: Variant): TextStyle {
  const k = reading.lineScale;
  switch (v) {
    case "title":
      return { fontFamily: font.title, fontSize: size.xxl, lineHeight: 40, color: color.ink };
    case "h2":
      return { fontFamily: font.title, fontSize: size.xl, lineHeight: 34, color: color.ink };
    case "h3":
      return { fontFamily: font.titleBold, fontSize: size.lg, lineHeight: 26, color: color.ink };
    case "body":
      return { fontFamily: font.text, fontSize: size.md, lineHeight: Math.round(24 * k), color: color.ink };
    case "bodyBold":
      return { fontFamily: font.textBold, fontSize: size.md, lineHeight: Math.round(24 * k), color: color.ink };
    case "small":
      return { fontFamily: font.textSemi, fontSize: size.sm, lineHeight: Math.round(20 * k), color: color.muted };
    case "label":
      return { fontFamily: font.textBlack, fontSize: size.xs, lineHeight: Math.round(18 * k), color: color.muted, letterSpacing: 0.6, textTransform: "uppercase" };
  }
}

export function T({ v = "body", style, ...rest }: TextProps & { v?: Variant; style?: StyleProp<TextStyle> }) {
  useFontRefresh();
  return <RNText {...rest} style={[textStyle(v), style]} />;
}

/** A page: safe area, scroll, side gutter. */
export function Page({ children, scroll = true, header, footer, bg = color.bg }: { children: ReactNode; scroll?: boolean; header?: ReactNode; footer?: ReactNode; bg?: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "left", "right"]}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 40, gap: space.lg }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: GUTTER }}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function TopBar({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={12}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
        style={styles.iconBtn}
      >
        <Ionicons name="chevron-back" size={26} color={color.ink} />
      </Pressable>
      <T v="h3" numberOfLines={1} style={{ flex: 1, textAlign: "center" }}>
        {title ?? ""}
      </T>
      <View style={{ minWidth: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

type BtnTone = "brand" | "teal" | "sun" | "sky" | "ghost" | "danger" | "white";
const tones: Record<BtnTone, { bg: string; edge: string; fg: string }> = {
  brand: { bg: color.brandFill, edge: color.brandEdge, fg: color.white },
  teal: { bg: color.tealFill, edge: color.tealEdge, fg: color.white },
  sun: { bg: color.sun, edge: color.sunEdge, fg: color.onSun },
  sky: { bg: color.skyFill, edge: color.skyEdge, fg: color.white },
  // Outline: a destructive action should not shout like the main button.
  danger: { bg: color.card, edge: color.red, fg: color.red },
  white: { bg: color.card, edge: color.line, fg: color.ink },
  ghost: { bg: "transparent", edge: "transparent", fg: color.ink },
};

/** A chunky button that sinks when pressed. */
export function Button({
  label,
  onPress,
  tone = "brand",
  icon,
  loading,
  disabled,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  tone?: BtnTone;
  icon?: keyof typeof Ionicons.glyphMap | "coin";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  useFontRefresh();
  const t = tones[tone];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: t.bg, borderColor: t.edge, borderBottomWidth: tone === "ghost" ? 0 : pressed && !off ? 2 : 5, opacity: off && !loading ? 0.5 : 1, marginTop: pressed && !off && tone !== "ghost" ? 3 : 0 },
        // Dark theme: the pink button glows a little, like Passerelle's neon.
        tone === "brand" && !off ? { boxShadow: `0 0 16px ${color.glow}` } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <>
          {icon === "coin" ? <Coin size={small ? 18 : 22} /> : icon ? <Ionicons name={icon} size={small ? 18 : 22} color={t.fg} /> : null}
          <RNText style={[styles.btnText, { fontFamily: font.textBlack }, small && { fontSize: size.sm }, { color: t.fg }]}>{label}</RNText>
        </>
      )}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ value, tint = color.brand, track = color.line, height = 12 }: { value: number; tint?: string; track?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height, backgroundColor: track, borderRadius: radius.pill, overflow: "hidden" }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: tint, borderRadius: radius.pill }} />
    </View>
  );
}

/** Two or more choices side by side (a child's name, a time range…). */
export function Segmented<K extends string>({ options, value, onChange, tint = color.brandFill }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; tint?: string }) {
  useFontRefresh();
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.segmentItem, on && { backgroundColor: tint }]}>
            <RNText numberOfLines={1} style={[styles.segmentText, { fontFamily: font.textBlack, color: on ? onColor(tint) : color.muted }]}>
              {o.label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <ActivityIndicator size="large" color={color.brand} />
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ gap: space.md, alignItems: "flex-start", backgroundColor: color.redSoft, borderColor: color.redSoft }}>
      <T v="bodyBold" style={{ color: color.red }}>
        {message}
      </T>
      {onRetry ? <Button small tone="white" label="Réessayer" icon="refresh" onPress={onRetry} /> : null}
    </Card>
  );
}

export const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: GUTTER - 6, paddingVertical: space.sm, gap: space.sm },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  btn: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  btnSmall: { minHeight: 44, paddingHorizontal: space.lg, borderRadius: radius.sm },
  btnText: { fontSize: size.md },
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 2, borderColor: color.line },
  segment: { flexDirection: "row", backgroundColor: color.chip, borderRadius: radius.lg, padding: 5, gap: 5 },
  segmentItem: { flex: 1, minHeight: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm },
  segmentText: { fontSize: size.md },
});
