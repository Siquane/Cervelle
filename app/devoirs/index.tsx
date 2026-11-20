import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useHomeworkList } from "../../src/api/hooks";
import type { Homework } from "../../src/api/types";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { PermissionDenied, pickPhotos } from "../../src/lib/files";
import { whenLabel } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

// « Aide aux devoirs » : photograph an exercise, then get hints one at a time.
// Cervelle checks the child's answer but never gives it.

export default function HomeworkHome() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const list = useHomeworkList(lid);
  const [picking, setPicking] = useState(false);

  const send = useMutation({
    mutationFn: (files: { data: string; mimeType: string }[]) => api.post<{ homework: Homework }>(`${learnerPath(lid)}/homework`, { files }),
    onSuccess: (r) => {
      qc.setQueryData(["homework", lid, r.homework.id], r.homework);
      qc.invalidateQueries({ queryKey: ["homework", lid] });
      router.push({ pathname: "/devoirs/[id]", params: { id: r.homework.id, lid } });
    },
  });

  async function take(source: "camera" | "library") {
    setPicking(true);
    try {
      const picked = await pickPhotos(source, 3);
      if (picked.length) send.mutate(picked.map(({ data, mimeType }) => ({ data, mimeType })));
    } catch (e) {
      Alert.alert(e instanceof PermissionDenied ? "Autorisation nécessaire" : "Photo non ajoutée", errorMessage(e));
    } finally {
      setPicking(false);
    }
  }

  return (
    <Page header={<TopBar title="Aide aux devoirs" />}>
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Mascot size={80} mood="happy" accessories={["lunettes"]} />
        <T v="body" style={{ flex: 1 }}>
          Prends ton exercice en photo. Je te donne des indices, un par un, et je vérifie ta réponse. C'est toi qui trouves !
        </T>
      </View>

      {send.isPending ? (
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Loading />
          <T v="body" style={{ textAlign: "center" }}>
            Je lis ton exercice… Ça prend environ 30 secondes.
          </T>
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          <Button icon="camera" label="Prendre l'exercice en photo" onPress={() => take("camera")} disabled={picking} />
          <Button small tone="white" icon="images" label="Choisir dans la galerie" onPress={() => take("library")} disabled={picking} />
        </View>
      )}
      {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}

      {list.isLoading ? <Loading /> : null}
      {list.error ? <ErrorBox message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
      {list.data?.length ? (
        <View style={{ gap: space.sm }}>
          <T v="h3">Mes derniers exercices</T>
          {list.data.map((h) => (
            <Pressable
              key={h.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/devoirs/[id]", params: { id: h.id, lid } })}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: color.card, borderWidth: 2, borderColor: color.line, opacity: pressed ? 0.85 : 1 })}
            >
              <Ionicons name={h.solved === h.questions.length ? "checkmark-circle" : "create"} size={28} color={h.solved === h.questions.length ? color.green : color.sky} />
              <View style={{ flex: 1 }}>
                <T v="bodyBold" numberOfLines={1}>
                  {h.subject || "Exercice"} · {h.questions[0]?.prompt}
                </T>
                <T v="small">
                  {whenLabel(h.createdAt.slice(0, 10))} · {h.solved}/{h.questions.length} trouvée{h.solved > 1 ? "s" : ""}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={22} color={color.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Page>
  );
}
