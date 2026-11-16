import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { keys, learnerPath, useExam } from "../../src/api/hooks";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, font, space } from "../../src/theme/tokens";

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lid } = useLid();
  const exam = useExam(lid, id);
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.delete(`${learnerPath(lid)}/exam-reviews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.exams(lid) });
      router.back();
    },
  });
  const e = exam.data;
  const a = e?.analysis;

  return (
    <Page header={<TopBar title="Analyse de l'interro" />}>
      {exam.isLoading ? <Loading /> : null}
      {exam.error ? <ErrorBox message={errorMessage(exam.error)} onRetry={() => exam.refetch()} /> : null}
      {e?.status === "processing" ? (
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xxl }}>
          <Mascot size={140} accessories={["lunettes"]} mood="wow" />
          <T v="h3">Cervelle lit ta copie…</T>
          <ActivityIndicator size="large" color={color.brand} />
        </Card>
      ) : null}
      {e?.status === "failed" ? (
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Mascot size={110} mood="sad" />
          <T v="body" style={{ textAlign: "center" }}>
            {e.error}
          </T>
          <Button label="Renvoyer des photos" icon="camera" onPress={() => { remove.mutate(); router.replace({ pathname: "/exam/new", params: { lid } }); }} />
        </Card>
      ) : null}
      {a ? (
        <>
          <Card style={{ alignItems: "center", gap: space.sm, backgroundColor: color.brandSoft, borderColor: color.brandSoft }}>
            {a.note ? <T style={{ fontFamily: font.title, fontSize: 48, lineHeight: 58, color: color.brandDark }}>{a.note}</T> : null}
            {e?.revisionTitle ? <T v="bodyBold">{e.revisionTitle}</T> : null}
            <T v="body" style={{ textAlign: "center" }}>
              {a.resume}
            </T>
          </Card>
          {a.points_forts.length ? (
            <Card style={{ gap: space.sm }}>
              <T v="label" style={{ color: color.green }}>
                Ce que tu as réussi
              </T>
              {a.points_forts.map((p, i) => (
                <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
                  <Ionicons name="checkmark-circle" size={22} color={color.green} />
                  <T v="body" style={{ flex: 1 }}>
                    {p}
                  </T>
                </View>
              ))}
            </Card>
          ) : null}
          {a.erreurs.length ? <T v="h2">Tes erreurs expliquées</T> : null}
          {a.erreurs.map((er, i) => (
            <Card key={i} style={{ gap: space.sm }}>
              <T v="bodyBold">{er.question}</T>
              <View style={{ flexDirection: "row", gap: space.sm }}>
                <Ionicons name="close-circle" size={20} color={color.red} />
                <T v="body" style={{ flex: 1, color: color.red }}>
                  {er.reponse_eleve}
                </T>
              </View>
              <View style={{ flexDirection: "row", gap: space.sm }}>
                <Ionicons name="checkmark-circle" size={20} color={color.green} />
                <T v="bodyBold" style={{ flex: 1, color: color.green }}>
                  {er.correction}
                </T>
              </View>
              <T v="body">{er.explication}</T>
            </Card>
          ))}
          {a.conseils.length ? (
            <Card style={{ gap: space.sm, backgroundColor: color.sunSoft, borderColor: color.sun }}>
              <T v="label" style={{ color: color.sunDark }}>
                Pour la prochaine fois
              </T>
              {a.conseils.map((c, i) => (
                <T key={i} v="body">
                  • {c}
                </T>
              ))}
            </Card>
          ) : null}
          {e?.revisionId ? <Button tone="sun" icon="refresh" label="Revoir les notions ratées" onPress={() => router.push({ pathname: "/quiz", params: { lid, mode: "a_revoir" } })} /> : null}
          <Button tone="white" icon="chatbubbles" label="Demander une explication" onPress={() => router.push({ pathname: "/assistant", params: { lid, revisionId: e?.revisionId ?? undefined } })} />
        </>
      ) : null}
    </Page>
  );
}
