import { useRef, useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { learnerPath, useRefreshLearner, useRevision } from "../../src/api/hooks";
import type { SessionResult } from "../../src/api/types";
import { Button, Card, Loading, Page, ProgressBar, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

export default function Sheets() {
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const { lid } = useLid();
  const revision = useRevision(lid, id);
  const refresh = useRefreshLearner(lid);
  const [index, setIndex] = useState(Number(start ?? 0) || 0);
  const startedAt = useRef(Date.now());
  const finish = useMutation({
    mutationFn: () => api.post<SessionResult>(`${learnerPath(lid)}/sessions`, { revisionId: id, mode: "fiches", seconds: Math.round((Date.now() - startedAt.current) / 1000) }),
    onSuccess: (r) => {
      refresh();
      router.back();
      if (r.session.coins) Alert.alert("Fiches lues !", `+${r.session.coins} pièces. Maintenant, teste-toi avec le QCM.`);
    },
    onError: () => router.back(),
  });

  const sheets = revision.data?.sheets ?? [];
  const s = sheets[index];
  if (revision.isLoading) return <Loading />;
  if (!s) return <Page header={<TopBar title="Fiches" />}><T v="body">Pas de fiche pour cette révision. Fais le QCM pour t'entraîner.</T></Page>;
  const last = index === sheets.length - 1;

  return (
    <Page
      header={<TopBar title={`Fiche ${index + 1}/${sheets.length}`} />}
      footer={
        <View style={{ flexDirection: "row", gap: space.md, padding: 20 }}>
          <Button tone="white" icon="arrow-back" label="Avant" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ flex: 1 }} />
          {last ? (
            <Button icon="checkmark" label="J'ai fini" loading={finish.isPending} onPress={() => finish.mutate()} style={{ flex: 1.4 }} />
          ) : (
            <Button icon="arrow-forward" label="Suivante" onPress={() => setIndex(index + 1)} style={{ flex: 1.4 }} />
          )}
        </View>
      }
    >
      <ProgressBar value={((index + 1) / sheets.length) * 100} tint={color.teal} height={8} />
      <View style={{ gap: 2 }}>
        <T v="label">{s.parentTitle}</T>
        <T v="h2">{s.title}</T>
      </View>
      {s.fromProgramme ? (
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center", backgroundColor: color.tealSoft, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="school" size={20} color={color.tealDark} />
          <T v="small" style={{ flex: 1, color: color.tealDark }}>
            Cette fiche n'était pas dans ton cours, mais elle est au programme de ta classe.
          </T>
        </View>
      ) : null}
      <Card style={{ backgroundColor: color.skySoft, borderColor: color.skySoft }}>
        <T v="bodyBold">{s.essentiel}</T>
      </Card>
      {s.points.length ? (
        <View style={{ gap: space.sm }}>
          {s.points.map((p, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.brand, marginTop: 9 }} />
              <T v="body" style={{ flex: 1 }}>
                {p}
              </T>
            </View>
          ))}
        </View>
      ) : null}
      {s.vocabulaire.length ? (
        <Card style={{ gap: space.md }}>
          <T v="label">Vocabulaire</T>
          {s.vocabulaire.map((v) => (
            <View key={v.terme} style={{ gap: 2 }}>
              <T v="bodyBold" style={{ color: color.brandDark }}>
                {v.terme}
              </T>
              <T v="body">{v.definition}</T>
            </View>
          ))}
        </Card>
      ) : null}
      {s.exemple ? (
        <View style={{ gap: 4 }}>
          <T v="label">Exemple</T>
          <T v="body">{s.exemple}</T>
        </View>
      ) : null}
      {s.retenir ? (
        <View style={{ backgroundColor: color.sunSoft, borderRadius: radius.lg, padding: space.lg, borderWidth: 2, borderColor: color.sun, gap: 4 }}>
          <T v="label" style={{ color: color.sunDark }}>
            À retenir
          </T>
          <T v="h3">{s.retenir}</T>
        </View>
      ) : null}
    </Page>
  );
}
