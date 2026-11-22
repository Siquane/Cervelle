import { useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { cardsKey, learnerPath, revisionKey, useRefreshLearner, useRevision } from "../../src/api/hooks";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { MAX_PAGES, PermissionDenied, pickPhotos, type PickedPage } from "../../src/lib/files";
import { useLid } from "../../src/lib/lid";
import { forgetOffline } from "../../src/lib/offline";
import { color, radius, space } from "../../src/theme/tokens";

// « Ajouter des pages » : more photos for a course already prepared. Cervelle
// prepares the fiches and questions again with every page, and keeps what the
// child has already learned.

export default function AddPages() {
  const { lid } = useLid();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const revision = useRevision(lid, id);
  const refresh = useRefreshLearner(lid);
  const [pages, setPages] = useState<PickedPage[]>([]);
  const [picking, setPicking] = useState(false);
  const already = revision.data?.photoCount ?? 0;
  const room = Math.max(0, MAX_PAGES - already - pages.length);

  async function add(source: "camera" | "library") {
    setPicking(true);
    try {
      const picked = await pickPhotos(source, room);
      setPages((p) => [...p, ...picked].slice(0, MAX_PAGES - already));
    } catch (e) {
      Alert.alert(e instanceof PermissionDenied ? "Autorisation nécessaire" : "Photo non ajoutée", errorMessage(e));
    } finally {
      setPicking(false);
    }
  }

  const send = useMutation({
    mutationFn: () => api.post(`${learnerPath(lid)}/revisions/${id}/pages`, { files: pages.map(({ data, mimeType }) => ({ data, mimeType })) }),
    onSuccess: () => {
      // The fiches change: the copies kept for offline are fetched again.
      forgetOffline(revisionKey(lid, id));
      forgetOffline(cardsKey(lid, id));
      refresh();
      void revision.refetch();
      router.back();
    },
  });

  return (
    <Page header={<TopBar title="Ajouter des pages" />}>
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Mascot size={80} mood="wow" />
        <T v="body" style={{ flex: 1 }}>
          Photographie les pages qui manquent. Je refais les fiches et les questions avec tout le cours, et je garde ce que tu as déjà appris.
        </T>
      </View>
      <T v="small">
        Ce cours a déjà {already} page{already > 1 ? "s" : ""}. Tu peux en ajouter {Math.max(0, MAX_PAGES - already)} au plus.
      </T>

      {pages.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {pages.map((p, i) => (
            <View key={`${p.uri}-${i}`} style={{ width: 96, height: 128, borderRadius: radius.md, overflow: "hidden", backgroundColor: color.card, borderWidth: 2, borderColor: color.line }}>
              <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} accessibilityLabel={`Nouvelle page ${i + 1}`} />
              <Pressable accessibilityRole="button" accessibilityLabel={`Retirer la page ${i + 1}`} onPress={() => setPages((all) => all.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, backgroundColor: color.white, borderRadius: 14 }}>
                <Ionicons name="close-circle" size={26} color={color.ink} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {room > 0 ? (
        <View style={{ gap: space.md }}>
          <Button tone={pages.length ? "white" : "brand"} icon="camera" label={pages.length ? "Photographier une autre page" : "Photographier une page"} onPress={() => add("camera")} disabled={picking} />
          <Button small tone="white" icon="images" label="Galerie" onPress={() => add("library")} disabled={picking} />
        </View>
      ) : (
        <T v="small">C'est le maximum de pages pour un cours.</T>
      )}

      {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}
      <Button label="Ajouter et refaire les fiches" icon="sparkles" disabled={!pages.length} loading={send.isPending} onPress={() => send.mutate()} />
      <T v="small" style={{ textAlign: "center" }}>
        Ça prend environ une minute. Tes anciennes fiches restent là si ça ne marche pas.
      </T>
    </Page>
  );
}
