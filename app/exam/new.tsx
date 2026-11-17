import { useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { keys, learnerPath, useRevisions } from "../../src/api/hooks";
import { Chip } from "../../src/components/Chip";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { MAX_PAGES, pickPhotos, type PickedPage } from "../../src/lib/files";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

export default function NewExam() {
  const { lid } = useLid();
  const params = useLocalSearchParams<{ revisionId?: string }>();
  const revisions = useRevisions(lid);
  const [pages, setPages] = useState<PickedPage[]>([]);
  const [revisionId, setRevisionId] = useState<string | null>(params.revisionId ?? null);
  const qc = useQueryClient();

  async function add(source: "camera" | "library") {
    try {
      const picked = await pickPhotos(source, MAX_PAGES - pages.length);
      setPages((p) => [...p, ...picked].slice(0, MAX_PAGES));
    } catch (e) {
      Alert.alert("Photo non ajoutée", errorMessage(e));
    }
  }

  const send = useMutation({
    mutationFn: () => api.post<{ examReview: { id: string } }>(`${learnerPath(lid)}/exam-reviews`, { files: pages.map(({ data, mimeType }) => ({ data, mimeType })), revisionId }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: keys.exams(lid) });
      router.replace({ pathname: "/exam/[id]", params: { id: r.examReview.id, lid } });
    },
  });

  const ready = revisions.data?.filter((r) => r.status === "ready") ?? [];

  return (
    <Page header={<TopBar title="Interro corrigée" />}>
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Mascot size={80} accessories={["lunettes"]} />
        <T v="body" style={{ flex: 1 }}>
          Photographie ta copie avec les corrections du professeur. Cervelle t'explique chaque erreur.
        </T>
      </View>
      {pages.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {pages.map((p, i) => (
            <View key={`${p.uri}-${i}`} style={{ width: 96, height: 128, borderRadius: radius.md, overflow: "hidden", borderWidth: 2, borderColor: color.line }}>
              <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} accessibilityLabel={`Page ${i + 1}`} />
              <Pressable accessibilityRole="button" accessibilityLabel={`Retirer la page ${i + 1}`} onPress={() => setPages((all) => all.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, backgroundColor: color.white, borderRadius: 14 }}>
                <Ionicons name="close-circle" size={26} color={color.ink} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Button tone={pages.length ? "white" : "brand"} icon="camera" label="Photo" onPress={() => add("camera")} style={{ flex: 1 }} />
        <Button tone="white" icon="images" label="Galerie" onPress={() => add("library")} style={{ flex: 1 }} />
      </View>
      {ready.length ? (
        <View style={{ gap: space.sm }}>
          <T v="bodyBold">Sur quelle révision ? (facultatif)</T>
          <T v="small">Les notions ratées repasseront en « À revoir ».</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            <Chip label="Aucune" on={revisionId === null} onPress={() => setRevisionId(null)} />
            {ready.map((r) => (
              <Chip key={r.id} label={r.title} on={revisionId === r.id} onPress={() => setRevisionId(r.id)} />
            ))}
          </View>
        </View>
      ) : null}
      {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}
      <Button icon="sparkles" label="Analyser ma copie" disabled={!pages.length} loading={send.isPending} onPress={() => send.mutate()} />
    </Page>
  );
}
