import { useStopSpeakingOnLeave } from "../src/lib/voice";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../src/api/client";
import { cardsKey, learnerPath, useRefreshLearner } from "../src/api/hooks";
import type { AnswerResult, Question, QuizMode, SessionResult } from "../src/api/types";
import { MasteryTag } from "../src/components/bits";
import { Mascot } from "../src/components/mascot/Mascot";
import { Reaction, StarBurst } from "../src/components/motion";
import { QuestionView, type Answer } from "../src/components/QuestionView";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../src/components/ui";
import { MODE_LABEL } from "../src/lib/format";
import { useLid } from "../src/lib/lid";
import { isNetworkError, queueOffline, withOffline } from "../src/lib/offline";
import { syncNotifications } from "../src/lib/notifications";
import { color, font, space } from "../src/theme/tokens";

function Feedback({ r, mode }: { r: AnswerResult; mode: string }) {
  const selfGraded = mode === "cartes";
  return (
    <Reaction good={r.correct}>
    <Card style={{ gap: space.sm, backgroundColor: r.correct ? color.greenSoft : color.redSoft, borderColor: r.correct ? color.green : color.red }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Ionicons name={r.correct ? "checkmark-circle" : "close-circle"} size={28} color={r.correct ? color.green : color.red} />
        <T v="h3" style={{ flex: 1, color: r.correct ? color.green : color.red }}>
          {r.correct ? (selfGraded ? "Super !" : "Bonne réponse !") : selfGraded ? "On la reverra" : "Pas tout à fait"}
        </T>
        {r.coins ? <T v="bodyBold" style={{ color: color.sunDark }}>+{r.coins} 🪙</T> : null}
      </View>
      {!r.correct && !selfGraded ? <T read v="bodyBold">Réponse : {r.expected}</T> : null}
      {r.comment ? <T read v="body">{r.comment}</T> : null}
      {r.explanation ? <T read v="body">{r.explanation}</T> : null}
      <MasteryTag value={r.mastery} compact />
    </Card>
    {r.correct ? <StarBurst k={r.expected} now /> : null}
    </Reaction>
  );
}

export default function Quiz() {
  useStopSpeakingOnLeave();
  const { mode = "qcm", revisionId } = useLocalSearchParams<{ mode?: QuizMode; revisionId?: string }>();
  const { lid } = useLid();
  const refresh = useRefreshLearner(lid);
  const quiz = useQuery({
    queryKey: ["quiz", lid, revisionId ?? "", mode],
    queryFn: () => {
      const get = () => api.get<{ questions: Question[] }>(`${learnerPath(lid)}/quiz?mode=${mode}${revisionId ? `&revisionId=${revisionId}` : ""}`).then((r) => r.questions);
      // Memory cards of a revision also work offline (kept by the home screen).
      return mode === "cartes" && revisionId ? withOffline(cardsKey(lid, revisionId), get) : get();
    },
    staleTime: Infinity,
    gcTime: 0,
  });
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, coins: 0 });
  const [summary, setSummary] = useState<SessionResult | null>(null);
  const startedAt = useRef(Date.now());

  const answer = useMutation({
    mutationFn: async ({ q, a }: { q: Question; a: Answer }): Promise<AnswerResult> => {
      const body = { questionId: q.id, mode, answer: a };
      try {
        return await api.post<AnswerResult>(`${learnerPath(lid)}/answers`, body);
      } catch (e) {
        // Offline, a memory card is graded by the child: keep the answer for later.
        if (mode !== "cartes" || !isNetworkError(e)) throw e;
        queueOffline(`${learnerPath(lid)}/answers`, body);
        const correct = a === "su";
        return { correct, expected: "", explanation: "", comment: "", mastery: correct ? "mastered" : "review", coins: 0, xp: 0, levelUp: null };
      }
    },
    onSuccess: (r) => {
      setResult(r);
      setScore((s) => ({ correct: s.correct + (r.correct ? 1 : 0), total: s.total + 1, coins: s.coins + r.coins }));
    },
  });
  const finish = useMutation({
    mutationFn: async (): Promise<SessionResult | null> => {
      const body = {
        revisionId: revisionId ?? null,
        mode,
        seconds: Math.min(4 * 3600, Math.round((Date.now() - startedAt.current) / 1000)),
        correct: score.correct,
        total: score.total,
      };
      try {
        return await api.post<SessionResult>(`${learnerPath(lid)}/sessions`, body);
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        // Offline: the session counts when the network is back.
        queueOffline(`${learnerPath(lid)}/sessions`, body);
        return null;
      }
    },
    onSuccess: (r) => {
      setSummary(r);
      refresh();
      // Les notions « À revoir » ont changé : rappels recalculés (téléphone de l'enfant seulement).
      void syncNotifications();
    },
  });

  const questions = quiz.data ?? [];
  const q = questions[index];
  const done = questions.length > 0 && index >= questions.length;

  useEffect(() => {
    if (done && !finish.isPending && !finish.isSuccess && !finish.isError) finish.mutate();
  }, [done, finish]);

  const title = MODE_LABEL[mode] ?? "Quiz";

  if (quiz.isLoading) return <Loading />;
  if (quiz.error) return <Page header={<TopBar title={title} />}><ErrorBox message={errorMessage(quiz.error)} onRetry={() => quiz.refetch()} /></Page>;
  if (questions.length === 0) {
    return (
      <Page header={<TopBar title={title} />}>
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Mascot size={120} />
          <T v="h3" style={{ textAlign: "center" }}>
            {mode === "a_revoir" ? "Rien à revoir pour l'instant !" : "Pas de question de ce type ici. Essaie un autre exercice."}
          </T>
          <Button label="Retour" onPress={() => router.back()} />
        </Card>
      </Page>
    );
  }

  if (done) {
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    // Learning first: what is understood and what is left to review; the mark comes second, small.
    const left = score.total - score.correct;
    const great = left === 0;
    return (
      <Page header={<TopBar title={title} />}>
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
          <Mascot size={160} mood={great ? "wow" : "happy"} accessories={summary?.learner.equipped ?? []} />
          <T v="h2" style={{ textAlign: "center" }}>
            {great ? "Tout est compris, bravo !" : "Bien travaillé !"}
          </T>
          <T v="body" style={{ textAlign: "center" }}>
            Tu as travaillé {score.total} question{score.total > 1 ? "s" : ""}.{" "}
            {great ? "Tu sais tout ce qui était demandé." : `Il te reste ${left} question${left > 1 ? "s" : ""} à revoir : c'est comme ça qu'on apprend.`}
          </T>
          <T v="small">
            {score.correct} réponse{score.correct > 1 ? "s" : ""} juste{score.correct > 1 ? "s" : ""} sur {score.total}
            {mode === "interro" ? ` · ${Math.round(pct / 5)}/20` : ""}
          </T>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <T v="bodyBold" style={{ color: color.sunDark }}>
              +{score.coins + (summary?.session.coins ?? 0)} pièces
            </T>
            {summary?.streakIncreased ? <T v="bodyBold" style={{ color: color.sunDark }}>🔥 {summary.learner.streak} jour{summary.learner.streak > 1 ? "s" : ""} d'affilée</T> : null}
          </View>
          {finish.isPending ? <T v="small">Enregistrement…</T> : null}
          {finish.error ? <ErrorBox message={errorMessage(finish.error)} onRetry={() => finish.mutate()} /> : null}
        </Card>
        {score.correct < score.total ? <Button tone="sun" icon="refresh" label="Revoir mes erreurs" onPress={() => router.replace({ pathname: "/quiz", params: { lid, mode: "a_revoir" } })} /> : null}
        <Button label="Terminer" icon="checkmark" onPress={() => router.back()} />
      </Page>
    );
  }

  return (
    <Page
      header={<TopBar title={title} />}
      footer={
        result ? (
          <View style={{ padding: 20 }}>
            <Button label={index + 1 === questions.length ? "Voir mon score" : "Continuer"} icon="arrow-forward" onPress={() => { setResult(null); answer.reset(); setIndex(index + 1); }} />
          </View>
        ) : null
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={(index / questions.length) * 100} tint={color.brand} />
        </View>
        <T v="bodyBold" style={{ fontVariant: ["tabular-nums"] }}>
          {index + 1}/{questions.length}
        </T>
      </View>
      <T v="label">{q.notionTitle}</T>
      <QuestionView q={q} mode={mode} locked={!!result || answer.isPending} verdict={result} onAnswer={(a) => answer.mutate({ q, a })} />
      {answer.isPending ? <T v="small">Correction…</T> : null}
      {answer.error ? <ErrorBox message={errorMessage(answer.error)} onRetry={() => answer.reset()} /> : null}
      {result ? <Feedback r={result} mode={mode} /> : null}
    </Page>
  );
}
