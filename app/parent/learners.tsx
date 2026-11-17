import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { useDevices, useLearners, useQueryClient, keys } from "../../src/api/hooks";
import type { Learner } from "../../src/api/types";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { LEVEL_LABEL, shortDate } from "../../src/lib/format";
import { color, font, learnerColorOf, radius, space } from "../../src/theme/tokens";

function Devices({ lid }: { lid: string }) {
  const devices = useDevices(lid);
  const qc = useQueryClient();
  const unlink = useMutation({
    mutationFn: (id: string) => api.delete(`/cervelle/learners/${lid}/devices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.devices(lid) }),
  });
  if (!devices.data?.length) return <T v="small">Aucun téléphone connecté. Crée un code et tape-le sur le téléphone de ton enfant.</T>;
  return (
    <View style={{ gap: space.sm }}>
      {devices.data.map((d) => (
        <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <T v="body" style={{ flex: 1 }} numberOfLines={1}>
            {d.name || "Téléphone"} · connecté le {shortDate(d.createdAt)}
          </T>
          <Button small tone="white" label="Déconnecter" onPress={() => unlink.mutate(d.id)} loading={unlink.isPending && unlink.variables === d.id} />
        </View>
      ))}
    </View>
  );
}

function LearnerCard({ l }: { l: Learner }) {
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const create = useMutation({
    mutationFn: () => api.post<{ code: string; expiresAt: string }>(`/cervelle/learners/${l.id}/code`),
    onSuccess: setCode,
    onError: (e) => Alert.alert("Code non créé", errorMessage(e)),
  });
  const tint = learnerColorOf(l.color);
  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: tint.soft, alignItems: "center", justifyContent: "center" }}>
          <Mascot size={46} accessories={l.equipped} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3">{l.name}</T>
          <T v="small">{[LEVEL_LABEL[l.level], l.grade].filter(Boolean).join(" · ")}</T>
        </View>
        <Button small tone="white" icon="create" label="Modifier" onPress={() => router.push({ pathname: "/parent/learner", params: { id: l.id } })} />
      </View>
      {code ? (
        <View style={{ backgroundColor: tint.soft, borderRadius: radius.md, padding: space.lg, gap: 4, alignItems: "center" }}>
          <T v="small">Sur le téléphone de {l.name} : « Je suis élève », puis ce code</T>
          <T style={{ fontFamily: font.title, fontSize: 40, lineHeight: 48, letterSpacing: 6, color: tint.dark }} selectable>
            {code.code}
          </T>
          <T v="small">Tape ce code sur le téléphone de ton enfant. Il marche 15 minutes, une seule fois.</T>
        </View>
      ) : (
        <Button tone="white" icon="phone-portrait" label="Connecter un téléphone" loading={create.isPending} onPress={() => create.mutate()} />
      )}
      <Devices lid={l.id} />
    </Card>
  );
}

export default function Learners() {
  const learners = useLearners();
  return (
    <Page header={<TopBar title="Mes enfants" />}>
      {learners.isLoading ? <Loading /> : null}
      {learners.error ? <ErrorBox message={errorMessage(learners.error)} onRetry={() => learners.refetch()} /> : null}
      {learners.data?.map((l) => <LearnerCard key={l.id} l={l} />)}
      <Button label="Ajouter un enfant" icon="person-add" onPress={() => router.push("/parent/learner")} />
      <T v="small" style={{ color: color.muted }}>
        Chaque enfant a son espace, ses révisions et sa mascotte. Tu peux tout voir et tout faire depuis ton espace parent.
      </T>
    </Page>
  );
}
