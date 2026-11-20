import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useBrevet } from "../../src/api/hooks";
import type { BrevetKey, BrevetSujet } from "../../src/api/types";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { longDate, whenLabel } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, font, radius, size, space } from "../../src/theme/tokens";

// Mode Brevet : the countdown, then one card per written exam with a button
// for a new mock paper built from the child's own revisions.

const ICON: Record<BrevetKey, keyof typeof Ionicons.glyphMap> = { francais: "book", maths: "calculator", histoire: "earth", sciences: "flask" };

export default function Brevet() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const brevet = useBrevet(lid);
  const b = brevet.data;
  const create = useMutation({
    mutationFn: (subject: BrevetKey) => api.post<{ sujet: BrevetSujet }>(`${learnerPath(lid)}/brevet/sujets`, { subject }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevet", lid] }),
  });

  return (
    <Page header={<TopBar title="Mode Brevet" />}>
      {brevet.isLoading ? <Loading /> : null}
      {brevet.error ? <ErrorBox message={errorMessage(brevet.error)} onRetry={() => brevet.refetch()} /> : null}
      {b ? (
        <>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Mascot size={84} mood="wow" accessories={["lunettes"]} />
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontFamily: font.title, fontSize: size.xxl, lineHeight: 40, color: color.brand }}>J-{b.daysLeft}</T>
              <T v="bodyBold">avant les épreuves écrites</T>
              <T v="small">à partir du {longDate(b.date)}. Un sujet par semaine, et le jour J, tu sauras faire.</T>
            </View>
          </Card>

          <T v="h3">Les épreuves</T>
          {b.subjects.map((s) => (
            <Card key={s.key} style={{ gap: space.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <Ionicons name={ICON[s.key]} size={26} color={color.sky} />
                <View style={{ flex: 1 }}>
                  <T v="bodyBold">{s.label}</T>
                  <T v="small">
                    {s.revisions ? `Basé sur ${s.revisions} révision${s.revisions > 1 ? "s" : ""} et le programme de 3e` : "Basé sur le programme de 3e (pas encore de révision dans cette matière)"}
                  </T>
                </View>
              </View>
              <Button small tone="white" icon="document-text" label="Nouveau sujet type" loading={create.isPending && create.variables === s.key} disabled={create.isPending} onPress={() => create.mutate(s.key)} />
            </Card>
          ))}
          {create.error ? <ErrorBox message={errorMessage(create.error)} /> : null}

          {b.sujets.length ? (
            <View style={{ gap: space.sm }}>
              <T v="h3">Mes sujets</T>
              {b.sujets.map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  disabled={s.status === "processing"}
                  onPress={() => router.push({ pathname: "/brevet/[id]", params: { id: s.id, lid } })}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: color.card, borderWidth: 2, borderColor: color.line, opacity: pressed ? 0.85 : 1 })}
                >
                  <Ionicons name={s.status === "failed" ? "alert-circle" : s.status === "processing" ? "hourglass" : ICON[s.subject]} size={24} color={s.status === "failed" ? color.red : color.sky} />
                  <View style={{ flex: 1 }}>
                    <T v="bodyBold" numberOfLines={1}>
                      {s.title}
                    </T>
                    <T v="small">{s.status === "processing" ? "Cervelle écrit ton sujet… environ une minute" : s.status === "failed" ? s.error ?? "Pas réussi. Demande un nouveau sujet." : `${whenLabel(s.createdAt.slice(0, 10))} · ${s.minutes} min`}</T>
                  </View>
                  {s.status === "ready" ? <Ionicons name="chevron-forward" size={22} color={color.muted} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
