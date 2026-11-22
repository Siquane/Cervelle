import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";
import { loadParentState, loadWidgetState, setWidgetStyle, widgetStyleOf, type StoredStyle } from "./data";
import { PARENT_WIDGET } from "./handler";
import { renderParentWidget, renderWidgetFor, WIDGET_STYLES } from "./views";

// S'ouvre quand on pose un widget Cervelle, ou quand on le règle (appui long →
// réglages) : on choisit son style. Écran à part de l'appli : couleurs écrites ici.

const SWATCH: Record<StoredStyle, { bg: string; fg: string; border: string; hint: string }> = {
  couleur: { bg: "#6D3FD9", fg: "#FFFFFF", border: "#6D3FD9", hint: "Un dégradé vif, comme Duolingo." },
  clair: { bg: "#FFFFFF", fg: "#1F1A3D", border: "#E3E6EF", hint: "Un fond blanc, discret." },
  sombre: { bg: "#141A2E", fg: "#EEF0FF", border: "#2A3150", hint: "Un fond bleu nuit, pour le mode sombre." },
};

export function WidgetConfigScreen({ widgetInfo, renderWidget, setResult }: WidgetConfigurationScreenProps) {
  const [current, setCurrent] = useState<StoredStyle>(widgetStyleOf(widgetInfo.widgetId));
  const [busy, setBusy] = useState(false);

  async function choose(style: StoredStyle) {
    if (busy) return;
    setBusy(true);
    setCurrent(style);
    setWidgetStyle(widgetInfo.widgetId, style);
    try {
      if (widgetInfo.widgetName === PARENT_WIDGET) renderWidget(renderParentWidget(await loadParentState(false), style));
      else renderWidget(renderWidgetFor(widgetInfo.widgetName, await loadWidgetState(false), widgetInfo, style));
    } finally {
      setResult("ok");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F6FB", padding: 24, justifyContent: "center", gap: 14 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#1F1A3D", textAlign: "center" }}>Style du widget</Text>
      <Text style={{ fontSize: 16, color: "#6B6889", textAlign: "center", marginBottom: 8 }}>Choisis comment il s'affiche sur ton écran d'accueil.</Text>
      {WIDGET_STYLES.map(({ key, label }) => {
        const sw = SWATCH[key];
        const on = current === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => void choose(key)}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: on ? "#BC0F54" : "#E3E6EF", opacity: pressed ? 0.85 : 1 })}
          >
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: sw.bg, borderWidth: 2, borderColor: sw.border, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22, color: sw.fg, fontWeight: "700" }}>🔥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F1A3D" }}>{label}</Text>
              <Text style={{ fontSize: 14, color: "#6B6889" }}>{sw.hint}</Text>
            </View>
            {on ? <Text style={{ fontSize: 20, color: "#BC0F54", fontWeight: "700" }}>✓</Text> : null}
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" onPress={() => setResult("ok")} style={{ alignSelf: "center", padding: 12 }}>
        <Text style={{ fontSize: 16, color: "#BC0F54", fontWeight: "700" }}>Garder « {WIDGET_STYLES.find((s) => s.key === current)?.label} »</Text>
      </Pressable>
    </View>
  );
}
