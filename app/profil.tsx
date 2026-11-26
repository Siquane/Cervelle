import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { learnerPath, useHome, useRefreshLearner } from "../src/api/hooks";
import type { Learner } from "../src/api/types";
import { Mascot } from "../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { ANSWERS, DIM_LABEL, PROFILES, QUESTIONS, computeProfile, methodById, type Dim, type Method, type ProfileId } from "../src/lib/profile";
import { color, radius, space, themed } from "../src/theme/tokens";

const FAMILY_TINT: Record<Method["family"], { fg: string; bg: string }> = themed(() => ({
  Comprendre: { fg: color.skyDark, bg: color.skySoft },
  Apprendre: { fg: color.brandDark, bg: color.brandSoft },
  Réviser: { fg: color.sunDark, bg: color.sunSoft },
  "S'organiser": { fg: color.violet, bg: color.violetSoft },
  "Se concentrer": { fg: color.tealDark, bg: color.tealSoft },
}));

export default function StudyProfile() {
  const { lid } = useLid();
  const home = useHome(lid);
  const refresh = useRefreshLearner(lid);
  const [answers, setAnswers] = useState<number[] | null>(null);

  const save = useMutation({
    mutationFn: (a: number[]) => {
      const r = computeProfile(a);
      return api.put<{ learner: Learner }>(`${learnerPath(lid)}/study-profile`, { profile: r.profile, scores: r.scores, methods: r.methods.map((m) => `${m.id}:${m.fit}`) });
    },
    onSuccess: () => {
      setAnswers(null);
      refresh();
    },
  });

  if (home.isLoading || !home.data) return <Loading />;
  const stored = home.data.learner.studyProfile;

  // The questionnaire.
  if (answers) {
    const i = answers.length;
    const q = QUESTIONS[i];
    return (
      <Page header={<TopBar title="Quel élève es-tu ?" onBack={() => (i ? setAnswers(answers.slice(0, -1)) : setAnswers(null))} />}>
        <T v="label">
          Question {i + 1} sur {QUESTIONS.length}
        </T>
        <ProgressBar value={(i / QUESTIONS.length) * 100} />
        <Card style={{ minHeight: 140, justifyContent: "center" }}>
          <T v="h3" style={{ textAlign: "center" }}>
            {q.text}
          </T>
        </Card>
        {ANSWERS.map((a, k) => (
          <Button
            key={a}
            tone="white"
            label={a}
            onPress={() => {
              const next = [...answers, k];
              if (next.length === QUESTIONS.length) save.mutate(next);
              else setAnswers(next);
            }}
          />
        ))}
        {save.isPending ? <Loading /> : null}
        {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
      </Page>
    );
  }

  if (!stored) {
    return (
      <Page header={<TopBar title="Quel élève es-tu ?" />}>
        <View style={{ alignItems: "center", gap: space.md, paddingTop: space.xl }}>
          <Mascot size={150} accessories={["lunettes"]} mood="wow" />
          <T v="h2" style={{ textAlign: "center" }}>
            Découvre les méthodes faites pour toi
          </T>
          <T v="body" style={{ textAlign: "center", color: color.muted }}>
            10 phrases, tu dis si elles te ressemblent. Il n'y a pas de bonne ou de mauvaise réponse !
          </T>
        </View>
        <Button icon="play" label="Commencer" onPress={() => setAnswers([])} />
      </Page>
    );
  }

  const p = PROFILES[stored.profile as ProfileId] ?? PROFILES.hibou;
  const methods = stored.methods
    .map((s) => {
      const [id, fit] = s.split(":");
      const m = methodById(id);
      return m ? { m, fit: Number(fit) || 60 } : null;
    })
    .filter((x): x is { m: Method; fit: number } => !!x);

  const go = (m: Method) => {
    const params = { lid };
    if (m.route === "minuteur") router.navigate({ pathname: "/child/minuteur", params });
    else if (m.route === "agenda") router.navigate({ pathname: "/child/agenda", params });
    else if (m.route === "amis") router.navigate({ pathname: "/child/amis", params });
    else if (m.route === "todos") router.push({ pathname: "/todos", params });
    else if (m.route === "habits") router.push({ pathname: "/habits", params });
    else if (m.route === "quiz_revoir") router.push({ pathname: "/quiz", params: { ...params, mode: "a_revoir" } });
    else if (m.route === "quiz_cartes" || m.route === "revision") router.navigate({ pathname: "/child", params });
    else if (m.route === "assistant") router.push({ pathname: "/assistant", params: { ...params, q: "Je veux t'expliquer ma leçon avec mes mots. Pose-moi des questions." } });
  };

  return (
    <Page header={<TopBar title="Mon profil d'élève" />}>
      <Card style={{ alignItems: "center", gap: space.sm, backgroundColor: color.brandSoft, borderColor: color.brandSoft }}>
        <T style={{ fontSize: 56, lineHeight: 66 }}>{p.emoji}</T>
        <T v="h2">Tu es {p.name.toLowerCase()}</T>
        <T v="body" style={{ textAlign: "center" }}>
          {p.text}
        </T>
      </Card>

      <Card style={{ gap: space.md }}>
        <T v="h3">Ce qui est facile, ce qui l'est moins</T>
        {(Object.keys(DIM_LABEL) as Dim[]).map((d) => {
          const hard = stored.scores[d] ?? 0;
          return (
            <View key={d} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row" }}>
                <T v="bodyBold" style={{ flex: 1 }}>
                  {DIM_LABEL[d]}
                </T>
                <T v="small">{hard >= 60 ? "à travailler" : hard >= 35 ? "ça va" : "facile"}</T>
              </View>
              <ProgressBar value={Math.max(8, 100 - hard)} tint={hard >= 60 ? color.sun : hard >= 35 ? color.sky : color.green} />
            </View>
          );
        })}
      </Card>

      <T v="h2">Mes méthodes du moment</T>
      {methods.map(({ m, fit }) => {
        const tint = FAMILY_TINT[m.family];
        return (
          <Card key={m.id} style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: tint.bg }}>
                <T v="small" style={{ color: tint.fg }}>
                  {m.family}
                </T>
              </View>
              <View style={{ flex: 1 }} />
              <T v="small">Pour toi : {fit} %</T>
            </View>
            <T v="bodyBold">{m.title}</T>
            <T v="body">{m.how}</T>
            {m.route ? (
              <Pressable accessibilityRole="button" onPress={() => go(m)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <T v="bodyBold" style={{ color: color.brand }}>
                  Essayer
                </T>
                <Ionicons name="arrow-forward" size={18} color={color.brand} />
              </Pressable>
            ) : null}
          </Card>
        );
      })}
      <Button tone="white" icon="refresh" label="Refaire le test" onPress={() => setAnswers([])} />
    </Page>
  );
}
