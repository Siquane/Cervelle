import { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../src/api/client";
import { useAiUsage } from "../../src/api/hooks";
import type { UsageKind } from "../../src/api/types";
import { Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { color, font, size, space } from "../../src/theme/tokens";

// « Ce que coûte l'IA » : what Cervelle's AI calls really cost this month, to
// set the app's price on real numbers. Older calls (before the meter) count
// but have no cost: the average uses only the measured ones.

const KIND_LABEL: Record<UsageKind, string> = {
  revision: "Révisions préparées",
  exam: "Interros corrigées",
  assistant: "Questions à Cervelle",
  grading: "Réponses courtes corrigées",
  timetable: "Emplois du temps lus",
  homework: "Aide aux devoirs",
  brevet: "Sujets de Brevet",
};

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const shiftMonth = (m: string, n: number) => {
  const d = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const dollars = (n: number) => `${n < 0.1 && n > 0 ? n.toFixed(3) : n.toFixed(2)} $`.replace(".", ",");

export default function AiCost() {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const usage = useAiUsage(month);
  const u = usage.data;

  return (
    <Page header={<TopBar title="Ce que coûte l'IA" />}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mois d'avant" onPress={() => setMonth(shiftMonth(month, -1))} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={26} color={color.ink} />
        </Pressable>
        <T v="h3" style={{ flex: 1, textAlign: "center" }}>
          {monthLabel(month)}
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Mois d'après" disabled={month >= thisMonth} onPress={() => setMonth(shiftMonth(month, 1))} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: month >= thisMonth ? 0.3 : 1 }}>
          <Ionicons name="chevron-forward" size={26} color={color.ink} />
        </Pressable>
      </View>

      {usage.isLoading ? <Loading /> : null}
      {usage.error ? <ErrorBox message={errorMessage(usage.error)} onRetry={() => usage.refetch()} /> : null}

      {u ? (
        <>
          <Card style={{ gap: 4 }}>
            <T style={{ fontFamily: font.title, fontSize: size.xxl, lineHeight: 44, color: color.ink }}>{dollars(u.total)}</T>
            <T v="small">payés à l'IA ce mois-ci pour toute la famille (prix de l'API, en dollars)</T>
          </Card>

          {u.byKind.length === 0 ? <T v="body">Pas encore d'appel à l'IA ce mois-ci.</T> : null}

          {u.byKind.length ? (
            <Card style={{ gap: space.md }}>
              <T v="h3">Par usage</T>
              {u.byKind.map((k) => (
                <View key={k.kind} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View style={{ flex: 1 }}>
                    <T v="bodyBold">{KIND_LABEL[k.kind] ?? k.kind}</T>
                    <T v="small">
                      {k.calls} fois{k.average !== null ? ` · ${dollars(k.average)} en moyenne` : ""}
                      {k.measured < k.calls ? ` · ${k.calls - k.measured} sans coût connu` : ""}
                    </T>
                  </View>
                  <T v="bodyBold" style={{ fontVariant: ["tabular-nums"] }}>
                    {dollars(k.cost)}
                  </T>
                </View>
              ))}
            </Card>
          ) : null}

          {u.byLearner.length > 1 ? (
            <Card style={{ gap: space.md }}>
              <T v="h3">Par enfant</T>
              {u.byLearner.map((l) => (
                <View key={l.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <T v="bodyBold" style={{ flex: 1 }}>
                    {l.name}
                  </T>
                  <T v="small">{l.calls} appels</T>
                  <T v="bodyBold" style={{ fontVariant: ["tabular-nums"] }}>
                    {dollars(l.cost)}
                  </T>
                </View>
              ))}
            </Card>
          ) : null}

          <T v="small">
            Les appels faits avant la mise à jour comptent dans le nombre, mais leur coût est inconnu. La moyenne n'utilise que les appels mesurés.
          </T>
        </>
      ) : null}
    </Page>
  );
}
