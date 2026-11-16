import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { RevisionCard } from "../api/types";
import { shortDate, whenLabel } from "../lib/format";
import { color, space } from "../theme/tokens";
import { RevisionIcon } from "./bits";
import { Card, ProgressBar, T } from "./ui";

export function RevisionRow({ r, lid }: { r: RevisionCard; lid: string }) {
  return (
    <Card onPress={() => router.push({ pathname: "/revision/[id]", params: { id: r.id, lid } })} style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
      <RevisionIcon icon={r.icon} seed={r.id} size={52} />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <T v="bodyBold" numberOfLines={2}>
          {r.status === "processing" && !r.title ? "Nouvelle révision" : r.title || "Révision"}
        </T>
        {r.status === "processing" ? (
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <ActivityIndicator size="small" color={color.brand} />
            <T v="small">Cervelle prépare les fiches…</T>
          </View>
        ) : r.status === "failed" ? (
          <T v="small" style={{ color: color.red }} numberOfLines={2}>
            {r.error ?? "La préparation a échoué."}
          </T>
        ) : (
          <>
            <T v="small" numberOfLines={1}>
              {[r.subject, r.examDate ? `interro ${whenLabel(r.examDate)}` : `ajoutée le ${shortDate(r.createdAt)}`].filter(Boolean).join(" · ")}
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <ProgressBar value={r.progress} height={8} tint={color.teal} />
              </View>
              <T v="small" style={{ fontVariant: ["tabular-nums"] }}>
                {r.progress} %
              </T>
            </View>
          </>
        )}
      </View>
      <Ionicons name="chevron-forward" size={22} color={color.faint} />
    </Card>
  );
}
