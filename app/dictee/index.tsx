import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useDictations } from "../../src/api/hooks";
import type { Dictation } from "../../src/api/types";
import { Field } from "../../src/components/Field";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { PermissionDenied, pickPhotos } from "../../src/lib/files";
import { whenLabel } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

// Dictée : l'enfant photographie (ou écrit) sa liste de mots de la semaine ;
// Cervelle en fait des phrases, les lit lentement, et montre les mots à revoir.

export default function DictationHome() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const list = useDictations(lid);
  const [typing, setTyping] = useState(false);
  const [words, setWords] = useState("");
  const [picking, setPicking] = useState(false);

  const create = useMutation({
    mutationFn: (body: { files?: { data: string; mimeType: string }[]; words?: string[] }) => api.post<{ dictation: Dictation }>(`${learnerPath(lid)}/dictations`, body),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["dictations", lid] });
      setWords("");
      setTyping(false);
      router.push({ pathname: "/dictee/[id]", params: { id: r.dictation.id, lid } });
    },
  });

  async function photo(source: "camera" | "library") {
    setPicking(true);
    try {
      const picked = await pickPhotos(source, 2);
      if (picked.length) create.mutate({ files: picked.map(({ data, mimeType }) => ({ data, mimeType })) });
    } catch (e) {
      Alert.alert(e instanceof PermissionDenied ? "Autorisation nécessaire" : "Oups, la photo n'est pas ajoutée", errorMessage(e));
    } finally {
      setPicking(false);
    }
  }

  const typed = words.split(/[,;\n]/).map((w) => w.trim()).filter(Boolean);

  return (
    <Page header={<TopBar title="Dictée" />}>
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Mascot size={80} mood="happy" />
        <T v="body" style={{ flex: 1 }}>
          Montre-moi ta liste de mots de la semaine. J'en fais une dictée et je te la lis, doucement. Tu écris, et je te montre les mots à revoir.
        </T>
      </View>

      {create.isPending ? (
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Loading />
          <T v="body" style={{ textAlign: "center" }}>
            Je prépare ta dictée… Ça prend environ 20 secondes.
          </T>
        </Card>
      ) : typing ? (
        <Card style={{ gap: space.md }}>
          <Field label="Tes mots" hint="Un mot par ligne, ou séparés par des virgules." value={words} onChangeText={setWords} multiline autoCapitalize="none" autoCorrect={false} spellCheck={false} />
          <Button icon="sparkles" label="Faire ma dictée" disabled={typed.length < 2} onPress={() => create.mutate({ words: typed })} />
          <Button small tone="ghost" label="Annuler" onPress={() => setTyping(false)} />
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          <Button icon="camera" label="Prendre ma liste en photo" onPress={() => photo("camera")} disabled={picking} />
          <Button small tone="white" icon="images" label="Choisir dans la galerie" onPress={() => photo("library")} disabled={picking} />
          <Button small tone="white" icon="create" label="Écrire mes mots" onPress={() => setTyping(true)} />
        </View>
      )}
      {create.error ? <ErrorBox message={errorMessage(create.error)} /> : null}

      {list.isLoading ? <Loading /> : null}
      {list.error ? <ErrorBox message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
      {list.data?.dictations.length ? (
        <View style={{ gap: space.sm }}>
          <T v="h3">Mes dictées</T>
          {list.data.dictations.map((d) => (
            <View key={d.id} style={{ gap: space.xs, padding: space.md, borderRadius: radius.lg, backgroundColor: color.card, borderWidth: 2, borderColor: color.line }}>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/dictee/[id]", params: { id: d.id, lid } })} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <Ionicons name={d.finished ? "checkmark-circle" : "create"} size={28} color={d.finished ? color.green : color.sky} />
                <View style={{ flex: 1 }}>
                  <T v="bodyBold" numberOfLines={1}>
                    {d.words.slice(0, 4).join(", ")}
                    {d.words.length > 4 ? "…" : ""}
                  </T>
                  <T v="small">
                    {whenLabel(d.createdAt.slice(0, 10))} · {d.finished ? (d.toReview.length ? `${d.toReview.length} mot${d.toReview.length > 1 ? "s" : ""} à revoir` : "Tout est juste !") : "À finir"}
                  </T>
                </View>
                <Ionicons name="chevron-forward" size={22} color={color.muted} />
              </Pressable>
              {d.finished && d.toReview.length ? (
                <Button small tone="sun" icon="refresh" label="Nouvelle dictée avec ces mots" loading={create.isPending} onPress={() => create.mutate({ words: d.toReview.length >= 2 ? d.toReview : [...d.toReview, ...d.words.filter((w) => !d.toReview.includes(w)).slice(0, 2)] })} />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Page>
  );
}
