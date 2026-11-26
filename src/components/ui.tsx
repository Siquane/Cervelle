import { ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleProp, StyleSheet, Text as RNText, TextProps, TextStyle, View, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { color, font, GUTTER, onColor, radius, reading, size, space, themed } from "../theme/tokens";
import { useFontRefresh } from "../state/reading";
import { Coin } from "./Coin";
import { withEmojis } from "./Emoji";

type Variant = "title" | "h2" | "h3" | "body" | "bodyBold" | "small" | "label";

/** Calculé à l'affichage : la police peut changer (Réglages → Police pour la dyslexie). */
function textStyle(v: Variant): TextStyle {
  const k = 1;
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

/** A text to READ (sheet, question, answer, explanation): the dyslexia font when the option is on. */
function readStyle(v: Variant): TextStyle | null {
  if (!reading.dyslexia) return null;
  const base = textStyle(v);
  const bold = v !== "body" && v !== "small";
  return {
    fontFamily: bold ? font.readBold : font.read,
    fontSize: Math.round((base.fontSize ?? size.md) * reading.sizeScale),
    lineHeight: Math.round((base.lineHeight ?? 24) * reading.lineScale),
    letterSpacing: 0,
  };
}

export function T({ v = "body", read = false, style, children, ...rest }: TextProps & { v?: Variant; read?: boolean; style?: StyleProp<TextStyle> }) {
  useFontRefresh();
  const st = [textStyle(v), read ? readStyle(v) : null, style];
  // Emojis become 3D images (Emoji.tsx), at the size of the letters.
  return (
    <RNText {...rest} style={st}>
      {withEmojis(children, StyleSheet.flatten(st)?.fontSize ?? size.md)}
    </RNText>
  );
}

/** A page: safe area, scroll, side gutter. */
/**
 * Keeps what is typed above the keyboard. On Android the app is drawn edge to
 * edge, so the window no longer shrinks for the keyboard by itself: the screen
 * makes room (padding) on both platforms.
 */
export function KeyboardSafe({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function Page({ children, scroll = true, header, footer, bg = color.bg }: { children: ReactNode; scroll?: boolean; header?: ReactNode; footer?: ReactNode; bg?: string }) {
  // Android draws the app under the phone's navigation buttons (edge to edge):
  // whatever sits at the bottom (footer, or the end of the page) gets that height too.
  const bottom = useSafeAreaInsets().bottom;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "left", "right"]}>
      {header}
      <KeyboardSafe>
        {scroll ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 40 + (footer ? 0 : bottom), gap: space.lg }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: GUTTER, paddingBottom: footer ? 0 : bottom }}>{children}</View>
        )}
        {footer ? <View style={{ paddingBottom: bottom }}>{footer}</View> : null}
      </KeyboardSafe>
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
const tones: Record<BtnTone, { bg: string; edge: string; fg: string }> = themed(() => ({
  brand: { bg: color.brandFill, edge: color.brandEdge, fg: color.white },
  teal: { bg: color.tealFill, edge: color.tealEdge, fg: color.white },
  sun: { bg: color.sun, edge: color.sunEdge, fg: color.onSun },
  sky: { bg: color.skyFill, edge: color.skyEdge, fg: color.white },
  // Outline: a destructive action should not shout like the main button.
  danger: { bg: color.card, edge: color.red, fg: color.red },
  white: { bg: color.card, edge: color.line, fg: color.ink },
  ghost: { bg: "transparent", edge: "transparent", fg: color.ink },
}));

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
          <RNText style={[styles.btnText, { fontFamily: font.textBlack }, small && { fontSize: size.sm }, { color: t.fg }]}>{withEmojis(label, small ? size.sm : size.md)}</RNText>
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

export const styles = themed(() => StyleSheet.create({
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
  // includeFontPadding: false — Android otherwise sizes the line from the font's bounding box.
  btnText: { fontSize: size.md, includeFontPadding: false },
  card: { backgroundColor: color.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 2, borderColor: color.line },
  segment: { flexDirection: "row", backgroundColor: color.chip, borderRadius: radius.lg, padding: 5, gap: 5 },
  segmentItem: { flex: 1, minHeight: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm },
  segmentText: { fontSize: size.md, includeFontPadding: false },
}));
