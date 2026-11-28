import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../src/api/client";
import { useProgramme } from "../src/api/hooks";
import type { ProgrammeChapter } from "../src/api/types";
import { Chip } from "../src/components/Chip";
import { Mascot } from "../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { color, radius, space, themed } from "../src/theme/tokens";

const STATUS: Record<ProgrammeChapter["status"], { label: string; fg: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = themed(() => ({
  todo: { label: "Pas encore révisé", fg: color.muted, bg: color.chip, icon: "ellipse-outline" },
  started: { label: "Commencé", fg: color.skyDark, bg: color.skySoft, icon: "sync" },
  mastered: { label: "Bien révisé", fg: color.green, bg: color.greenSoft, icon: "checkmark-circle" },
}));

function ChapterCard({ c, lid, subject }: { c: ProgrammeChapter; lid: string; subject: string }) {
  const [open, setOpen] = useState(false);
  const st = STATUS[c.status];
  return (
    <Card onPress={() => setOpen(!open)} style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: st.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Ionicons name={st.icon} size={15} color={st.fg} />
        <T v="small" style={{ color: st.fg }}>
          {st.label}
        </T>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <T v="h3" style={{ flex: 1 }}>
          {c.title}
        </T>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={color.ink} />
      </View>
      {open ? (
        <View style={{ gap: space.md }}>
          <View style={{ gap: 6 }}>
            <T v="label">Ce qu'il faut savoir</T>
            {c.notions.map((n) => (
              <View key={n} style={{ flexDirection: "row", gap: space.sm }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color.brand, marginTop: 9 }} />
                <T v="body" style={{ flex: 1 }}>
                  {n}
                </T>
              </View>
            ))}
          </View>
          {c.competences?.length ? (
            <View style={{ gap: 6 }}>
              <T v="label">Ce que tu sauras faire</T>
              {c.competences.map((k) => (
                <View key={k} style={{ flexDirection: "row", gap: space.sm }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={color.teal} style={{ marginTop: 3 }} />
                  <T v="body" style={{ flex: 1 }}>
                    {k}
                  </T>
                </View>
              ))}
            </View>
          ) : null}
          {c.revisions.map((r) => (
            <Card key={r.id} onPress={() => router.push({ pathname: "/revision/[id]", params: { id: r.id, lid } })} style={{ gap: 6, backgroundColor: color.bg }}>
              <T v="bodyBold" numberOfLines={1}>
                {r.title}
              </T>
              <ProgressBar value={r.progress} tint={color.teal} height={8} />
            </Card>
          ))}
          <Button small tone="white" icon="camera" label={c.revisions.length ? "Ajouter un autre cours" : "Réviser ce chapitre"} onPress={() => router.push({ pathname: "/revision/new", params: { lid, subject } })} />
        </View>
      ) : null}
    </Card>
  );
}

export default function ProgrammeScreen() {
  const { lid } = useLid();
  const programme = useProgramme(lid);
  const [subject, setSubject] = useState<string | null>(null);
  const p = programme.data;
  const current = p?.subjects.find((s) => s.subject === subject) ?? p?.subjects[0];
  const done = current ? current.chapters.filter((c) => c.status !== "todo").length : 0;

  return (
    <Page header={<TopBar title={p?.available ? `Programme de ${p.grade}` : "Programme"} />}>
      {programme.isLoading ? <Loading /> : null}
      {programme.error ? <ErrorBox message={errorMessage(programme.error)} onRetry={() => programme.refetch()} /> : null}
      {p && !p.available ? (
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Mascot size={110} mood="wow" />
          <T v="body" style={{ textAlign: "center" }}>
            Le programme de {p.grade || "cette classe"} n'est pas encore dans Cervelle. Pour l'instant : du CM2 à la 3e. Les révisions restent calées sur le programme quand même.
          </T>
        </Card>
      ) : null}
      {p?.available && current ? (
        <>
          <T v="small">Programme officiel de l'Éducation nationale, année {p.schoolYear}.</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {p.subjects.map((s) => (
              <Chip key={s.subject} label={s.subject} on={s.subject === current.subject} onPress={() => setSubject(s.subject)} />
            ))}
          </ScrollView>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <T v="h2" style={{ flex: 1 }}>
                {current.subject}
              </T>
              <T v="bodyBold" style={{ color: color.tealDark }}>
                {done}/{current.chapters.length}
              </T>
            </View>
            <ProgressBar value={(done / current.chapters.length) * 100} tint={color.teal} />
            {current.cycleWide ? <T v="small">Ces thèmes sont répartis sur plusieurs années : ton professeur choisit l'ordre.</T> : null}
          </View>
          {current.chapters.map((c) => (
            <ChapterCard key={c.id} c={c} lid={lid} subject={current.subject} />
          ))}
          <T v="small" style={{ color: color.faint }}>
            Source : {current.source}.{current.verified ? "" : " Résumé par Cervelle : le texte officiel peut le dire un peu autrement."}
          </T>
        </>
      ) : null}
    </Page>
  );
}
