import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useRefreshLearner, useRevision } from "../../src/api/hooks";
import type { QuizMode, RevisionDetail } from "../../src/api/types";
import { BottomSheet, MasteryHelp, MasteryTag, RevisionIcon } from "../../src/components/bits";
import { DateField } from "../../src/components/DateField";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, Segmented, T, TopBar } from "../../src/components/ui";
import { shortDate, whenLabel } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

function Step({ done, label, detail, onPress }: { done: boolean; label: string; detail: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: done ? color.greenFill : color.line, alignItems: "center", justifyContent: "center" }}>
        {done ? <Ionicons name="checkmark" size={22} color={color.white} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <T v="bodyBold">{label}</T>
        <T v="small">{detail}</T>
      </View>
      <Ionicons name="play-circle" size={32} color={color.brand} />
    </Pressable>
  );
}

function Progression({ r, lid }: { r: RevisionDetail; lid: string }) {
  const [open, setOpen] = useState<string | null>(r.notions[0]?.id ?? null);
  const play = (mode: QuizMode) => router.push({ pathname: "/quiz", params: { lid, revisionId: r.id, mode } });
  return (
    <>
      <Card style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.sm }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={r.progress} tint={color.teal} />
          </View>
          <T v="h3">{r.progress} %</T>
        </View>
        <Step done={r.steps.sheets} label="Fiches de révision" detail={r.steps.sheets ? "Lues" : `${r.sheets.length} fiches à lire`} onPress={() => router.push({ pathname: "/revision/sheets", params: { lid, id: r.id } })} />
        <Step done={r.steps.quizBest !== null} label="QCM" detail={r.steps.quizBest !== null ? `Meilleur score : ${r.steps.quizBest} %` : "10 questions rapides"} onPress={() => play("qcm")} />
        <Step done={r.steps.examBest !== null} label="Interro" detail={r.steps.examBest !== null ? `Meilleure note : ${Math.round(r.steps.examBest / 5)}/20` : "15 questions de tous types, notée sur 20"} onPress={() => play("interro")} />
        <Button tone="white" small icon="albums" label="Cartes mémoire" onPress={() => play("cartes")} style={{ marginTop: space.sm }} />
        <Button tone="white" small icon="flash" label="Révision express · 6 questions" onPress={() => play("express")} />
      </Card>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <T v="h2" style={{ flex: 1 }}>
          Ses connaissances
        </T>
        <MasteryHelp />
      </View>
      {r.notions.map((n) => (
        <Card key={n.id} style={{ gap: space.md }}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === n.id }} onPress={() => setOpen(open === n.id ? null : n.id)} style={{ gap: space.sm }}>
            <MasteryTag value={n.mastery} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <T v="h3" style={{ flex: 1 }}>
                {n.title}
              </T>
              <Ionicons name={open === n.id ? "chevron-up" : "chevron-down"} size={24} color={color.ink} />
            </View>
          </Pressable>
          {open === n.id
            ? n.children.map((c) => (
                <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, borderWidth: 2, borderColor: color.line, borderRadius: radius.md, padding: space.md }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="body">{c.title}</T>
                    {c.fromProgramme ? (
                      <T v="small" style={{ color: color.tealDark }}>
                        Ajouté : au programme, pas dans ton cours
                      </T>
                    ) : null}
                  </View>
                  <MasteryTag value={c.mastery} compact />
                </View>
              ))
            : null}
        </Card>
      ))}
    </>
  );
}

function SheetList({ r, lid }: { r: RevisionDetail; lid: string }) {
  return (
    <>
      {r.summary ? (
        <Card style={{ backgroundColor: color.skySoft, borderColor: color.skySoft }}>
          <T v="body">{r.summary}</T>
        </Card>
      ) : null}
      {r.sheets.map((s, i) => (
        <Card key={s.notionId} onPress={() => router.push({ pathname: "/revision/sheets", params: { lid, id: r.id, start: String(i) } })} style={{ gap: 4 }}>
          <T v="label">{s.parentTitle}</T>
          <T v="h3">{s.title}</T>
          <T v="body" numberOfLines={3} style={{ color: color.muted }}>
            {s.essentiel}
          </T>
        </Card>
      ))}
    </>
  );
}

export default function RevisionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lid } = useLid();
  const revision = useRevision(lid, id);
  const refresh = useRefreshLearner(lid);
  const [tab, setTab] = useState<"progress" | "sheets">("progress");
  const [menu, setMenu] = useState(false);

  const retry = useMutation({ mutationFn: () => api.post(`${learnerPath(lid)}/revisions/${id}/retry`), onSuccess: () => { revision.refetch(); refresh(); }, onError: (e) => Alert.alert("Révision", errorMessage(e)) });
  const remove = useMutation({ mutationFn: () => api.delete(`${learnerPath(lid)}/revisions/${id}`), onSuccess: () => { refresh(); router.back(); } });
  const setDate = useMutation({ mutationFn: (examDate: string | null) => api.patch(`${learnerPath(lid)}/revisions/${id}`, { examDate }), onSuccess: () => { revision.refetch(); refresh(); } });

  const r = revision.data;
  const menuButton = (
    <Pressable accessibilityRole="button" accessibilityLabel="Options" hitSlop={10} onPress={() => setMenu(true)}>
      <Ionicons name="ellipsis-horizontal" size={26} color={color.ink} />
    </Pressable>
  );

  return (
    <Page header={<TopBar right={r ? menuButton : null} />}>
      {revision.isLoading ? <Loading /> : null}
      {revision.error ? <ErrorBox message={errorMessage(revision.error)} onRetry={() => revision.refetch()} /> : null}
      {r?.status === "processing" ? (
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xxl }}>
          <Mascot size={150} mood="wow" accessories={["lunettes"]} />
          <T v="h3" style={{ textAlign: "center" }}>
            Cervelle lit ton cours…
          </T>
          <T v="body" style={{ textAlign: "center", color: color.muted }}>
            Il découpe les notions, écrit les fiches et prépare les questions. Environ une minute.
          </T>
          <ActivityIndicator size="large" color={color.brand} />
        </Card>
      ) : null}
      {r?.status === "failed" ? (
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Mascot size={120} mood="sad" />
          <T v="h3" style={{ textAlign: "center" }}>
            Oups, ça n'a pas marché
          </T>
          <T v="body" style={{ textAlign: "center" }}>
            {r.error}
          </T>
          <Button label="Réessayer" icon="refresh" loading={retry.isPending} onPress={() => retry.mutate()} />
          <Button tone="white" label="Reprendre les photos" icon="camera" onPress={() => { remove.mutate(); router.replace({ pathname: "/revision/new", params: { lid } }); }} />
        </Card>
      ) : null}
      {r?.status === "ready" ? (
        <>
          <View style={{ flexDirection: "row", gap: space.lg, alignItems: "center" }}>
            <RevisionIcon icon={r.icon} seed={r.id} size={84} />
            <View style={{ flex: 1, gap: space.sm }}>
              <T v="h2">{r.title}</T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                <Pill icon="calendar" text={r.examDate ? `Interro ${whenLabel(r.examDate)}` : shortDate(r.createdAt)} />
                <Pill icon="camera" text={`${r.photoCount} ${r.photoCount > 1 ? "pages" : "page"}`} />
                {r.subject ? <Pill icon="bookmark" text={r.subject} /> : null}
                {r.programme ? <Pill icon="school" text={`Programme : ${r.programme.chapter}`} /> : null}
              </View>
            </View>
          </View>
          <Segmented options={[{ key: "progress", label: "Progression" }, { key: "sheets", label: "Fiches" }]} value={tab} onChange={setTab} />
          {tab === "progress" ? <Progression r={r} lid={lid} /> : <SheetList r={r} lid={lid} />}
          <Button tone="white" icon="chatbubbles" label="Poser une question sur ce cours" onPress={() => router.push({ pathname: "/assistant", params: { lid, revisionId: r.id } })} />
        </>
      ) : null}

      <BottomSheet open={menu} onClose={() => setMenu(false)} title="Options">
        <DateField label="Date de l'interro" value={r?.examDate ?? null} onChange={(d) => setDate.mutate(d)} />
        <Button tone="white" icon="document-text" label="Envoyer l'interro corrigée" onPress={() => { setMenu(false); router.push({ pathname: "/exam/new", params: { lid, revisionId: id } }); }} />
        <Button
          tone="danger"
          icon="trash"
          label="Supprimer la révision"
          loading={remove.isPending}
          onPress={() =>
            Alert.alert("Supprimer la révision ?", "Les fiches, les questions et les progrès de cette révision seront effacés.", [
              { text: "Annuler", style: "cancel" },
              { text: "Supprimer", style: "destructive", onPress: () => { setMenu(false); remove.mutate(); } },
            ])
          }
        />
      </BottomSheet>
    </Page>
  );
}

function Pill({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: color.brandSoft, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Ionicons name={icon} size={15} color={color.brandDark} />
      <T v="small" style={{ color: color.brandDark }}>
        {text}
      </T>
    </View>
  );
}
