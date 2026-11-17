import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { useExams } from "../../src/api/hooks";
import { errorMessage } from "../../src/api/client";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { shortDate } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, space } from "../../src/theme/tokens";

export default function Exams() {
  const { lid } = useLid();
  const exams = useExams(lid);
  return (
    <Page header={<TopBar title="Interros corrigées" />}>
      <Button icon="camera" label="Envoyer une interro corrigée" onPress={() => router.push({ pathname: "/exam/new", params: { lid } })} />
      {exams.isLoading ? <Loading /> : null}
      {exams.error ? <ErrorBox message={errorMessage(exams.error)} onRetry={() => exams.refetch()} /> : null}
      {exams.data?.length === 0 ? <T v="body" style={{ color: color.muted }}>Pas encore d'interro corrigée. Prends ta copie en photo : Cervelle t'explique tes erreurs.</T> : null}
      {exams.data?.map((e) => (
        <Card key={e.id} onPress={() => router.push({ pathname: "/exam/[id]", params: { id: e.id, lid } })} style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
          <View style={{ width: 64, alignItems: "center" }}>
            {e.status === "processing" ? <ActivityIndicator color={color.brand} /> : <T v="h3" style={{ color: e.status === "failed" ? color.red : color.brand }}>{e.analysis?.note || "—"}</T>}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="bodyBold" numberOfLines={1}>
              {e.revisionTitle ?? "Interro"}
            </T>
            <T v="small" numberOfLines={2}>
              {e.status === "processing" ? "Analyse en cours…" : e.status === "failed" ? e.error : `Envoyée le ${shortDate(e.createdAt)}`}
            </T>
          </View>
        </Card>
      ))}
    </Page>
  );
}
