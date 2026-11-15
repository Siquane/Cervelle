import { useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useRefreshLearner } from "../../src/api/hooks";
import { DateField } from "../../src/components/DateField";
import { Field } from "../../src/components/Field";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { MAX_PAGES, PermissionDenied, pickPdf, pickPhotos, type PickedPage } from "../../src/lib/files";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

export default function NewRevision() {
  const { lid } = useLid();
  const refresh = useRefreshLearner(lid);
  const [pages, setPages] = useState<PickedPage[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  async function add(source: "camera" | "library" | "pdf") {
    setPicking(true);
    try {
      if (source === "pdf") {
        const pdf = await pickPdf();
        if (pdf) setPages([pdf]);
      } else {
        const picked = await pickPhotos(source, MAX_PAGES - pages.length);
        setPages((p) => [...p.filter((x) => x.mimeType !== "application/pdf"), ...picked].slice(0, MAX_PAGES));
      }
    } catch (e) {
      Alert.alert(e instanceof PermissionDenied ? "Autorisation" : "Fichier", errorMessage(e));
    } finally {
      setPicking(false);
    }
  }

  const send = useMutation({
    mutationFn: () =>
      api.post<{ revision: { id: string } }>(`${learnerPath(lid)}/revisions`, {
        files: pages.map(({ data, mimeType }) => ({ data, mimeType })),
        title: title.trim(),
        subject: subject.trim(),
        examDate,
      }),
    onSuccess: (r) => {
      refresh();
      router.replace({ pathname: "/revision/[id]", params: { id: r.revision.id, lid } });
    },
  });

  const isPdf = pages[0]?.mimeType === "application/pdf";

  return (
    <Page header={<TopBar title="Nouvelle révision" />}>
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Mascot size={80} mood="wow" />
        <T v="body" style={{ flex: 1 }}>
          Photographie chaque page de la leçon, bien à plat et avec de la lumière. Jusqu'à {MAX_PAGES} pages.
        </T>
      </View>

      {pages.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {pages.map((p, i) => (
            <View key={`${p.uri}-${i}`} style={{ width: 96, height: 128, borderRadius: radius.md, overflow: "hidden", backgroundColor: color.card, borderWidth: 2, borderColor: color.line, alignItems: "center", justifyContent: "center" }}>
              {p.mimeType === "application/pdf" ? (
                <View style={{ alignItems: "center", gap: 4, padding: 6 }}>
                  <Ionicons name="document-text" size={36} color={color.brand} />
                  <T v="small" numberOfLines={2} style={{ textAlign: "center" }}>
                    {p.name}
                  </T>
                </View>
              ) : (
                <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} accessibilityLabel={`Page ${i + 1}`} />
              )}
              <Pressable accessibilityRole="button" accessibilityLabel={`Retirer la page ${i + 1}`} onPress={() => setPages((all) => all.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, backgroundColor: color.white, borderRadius: 14 }}>
                <Ionicons name="close-circle" size={26} color={color.ink} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {!isPdf && pages.length < MAX_PAGES ? (
        <View style={{ gap: space.md }}>
          <Button tone={pages.length ? "white" : "brand"} icon="camera" label={pages.length ? "Photographier une autre page" : "Prendre la leçon en photo"} onPress={() => add("camera")} disabled={picking} />
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button small tone="white" icon="images" label="Galerie" onPress={() => add("library")} disabled={picking} style={{ flex: 1 }} />
            <Button small tone="white" icon="document" label="PDF" onPress={() => add("pdf")} disabled={picking} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}

      <Card style={{ gap: space.lg }}>
        <Field label="Titre (facultatif)" value={title} onChangeText={setTitle} placeholder="Cervelle le trouve tout seul" maxLength={120} />
        <Field label="Matière (facultatif)" value={subject} onChangeText={setSubject} placeholder="Histoire, SVT, Anglais…" maxLength={60} />
        <DateField label="Date de l'interro (facultatif)" value={examDate} onChange={setExamDate} />
      </Card>

      {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}
      <Button label="Préparer mes fiches et mes quiz" icon="sparkles" disabled={!pages.length} loading={send.isPending} onPress={() => send.mutate()} />
      <T v="small" style={{ textAlign: "center" }}>
        Ça prend environ une minute. Tu peux fermer l'écran : la révision apparaîtra quand elle sera prête.
      </T>
    </Page>
  );
}
