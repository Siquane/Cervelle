import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import type { Mastery } from "../api/types";
import { color, font, radius, size, space } from "../theme/tokens";
import { Button, T } from "./ui";
import { Coin } from "./Coin";

export const MASTERY: Record<Mastery, { label: string; icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string; help: string }> = {
  new: { label: "En cours", icon: "sync", fg: color.skyDark, bg: color.skySoft, help: "Pas encore travaillée, ou seulement une fois. Continue les exercices !" },
  review: { label: "À revoir", icon: "alert-circle", fg: color.sunDark, bg: color.sunSoft, help: "Une erreur récente, ou il est temps de la revoir pour ne pas l'oublier." },
  mastered: { label: "Maîtrisé", icon: "checkmark-circle", fg: color.green, bg: color.greenSoft, help: "Réussie plusieurs fois, à des jours différents. Elle reviendra plus tard pour vérifier." },
};

export function MasteryTag({ value, compact }: { value: Mastery; compact?: boolean }) {
  const m = MASTERY[value];
  return (
    <View style={[s.tag, { backgroundColor: m.bg }]}>
      <Ionicons name={m.icon} size={compact ? 14 : 16} color={m.fg} />
      <Text style={[s.tagText, { fontFamily: font.textBlack, color: m.fg }, compact && { fontSize: size.xs }]}>{m.label}</Text>
    </View>
  );
}

/** The « ? » next to the labels, with what each one means. */
export function MasteryHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Que veulent dire les étiquettes ?" hitSlop={10} onPress={() => setOpen(true)}>
        <Ionicons name="help-circle-outline" size={26} color={color.muted} />
      </Pressable>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Que veulent dire les étiquettes ?">
        {(Object.keys(MASTERY) as Mastery[]).map((k) => (
          <View key={k} style={{ gap: space.xs }}>
            <MasteryTag value={k} />
            <T v="body">{MASTERY[k].help}</T>
          </View>
        ))}
        <Button label="Compris" onPress={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
      <View style={s.sheet}>
        <View style={s.grabber} />
        <T v="h2">{title}</T>
        {children}
      </View>
    </Modal>
  );
}

const ICON: Record<string, string> = {
  livre: "📘", plante: "🌱", planete: "🪐", couronne: "👑", globe: "🌍", calcul: "🔢", fiole: "🧪", atome: "⚛️", palette: "🎨",
  musique: "🎵", langue: "💬", plume: "🪶", sablier: "⏳", corps: "🫀", ballon: "⚽", ordinateur: "💻", carte: "🗺️", balance: "⚖️",
};
const TILE = [color.brandSoft, color.tealSoft, color.sunSoft, color.skySoft, "#EDE5FE", "#FFE7E0"];

export function RevisionIcon({ icon, size: px = 56, seed = "" }: { icon: string; size?: number; seed?: string }) {
  const bg = TILE[[...seed].reduce((n, c) => n + c.charCodeAt(0), 0) % TILE.length];
  return (
    <View style={{ width: px, height: px, borderRadius: px * 0.3, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: px * 0.5 }}>{ICON[icon] ?? "📘"}</Text>
    </View>
  );
}

/** Coins, streak… in a little rounded chip. */
export function Stat({ icon, value, tint, label }: { icon: keyof typeof Ionicons.glyphMap | "coin"; value: string | number; tint: string; label: string }) {
  return (
    <View style={s.stat} accessibilityLabel={`${label} : ${value}`}>
      {icon === "coin" ? <Coin /> : <Ionicons name={icon} size={20} color={tint} />}
      <Text style={[s.statText, { fontFamily: font.textBlack }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagText: { fontSize: size.sm },
  backdrop: { flex: 1, backgroundColor: "rgba(31,26,61,0.45)" },
  sheet: { backgroundColor: color.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, gap: space.lg },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: color.line },
  stat: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: color.card, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 2, borderColor: color.line },
  statText: { fontSize: size.md, color: color.ink },
});
