import { useStopSpeakingOnLeave } from "../src/lib/voice";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../src/api/client";
import { learnerPath, useRefreshLearner } from "../src/api/hooks";
import type { AnswerResult, Question, SessionResult } from "../src/api/types";
import { BossArt, BossFighter, bossName } from "../src/components/Boss";
import { QuestionView, type Answer } from "../src/components/QuestionView";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { color, space } from "../src/theme/tokens";

// Combat contre le boss de fin de chapitre. Chaque bonne réponse lui enlève un
// cœur. Une erreur ne fait pas perdre : on lit la bonne réponse et la question
// revient plus tard (trois essais au plus). Si une question résiste, le boss
// s'enfuit avec ce cœur : on revoit la leçon et on revient le battre.

const TRIES = 3;

export default function BossFight() {
  useStopSpeakingOnLeave();
  const { revisionId } = useLocalSearchParams<{ revisionId: string }>();
  const { lid } = useLid();
  const refresh = useRefreshLearner(lid);
  const quiz = useQuery({
    queryKey: ["quiz", lid, revisionId ?? "", "boss"],
    queryFn: () => api.get<{ questions: Question[] }>(`${learnerPath(lid)}/quiz?mode=boss&revisionId=${revisionId}`).then((r) => r.questions),
    staleTime: Infinity,
    gcTime: 0,
  });
  const [queue, setQueue] = useState<Question[] | null>(null);
  const [tries, setTries] = useState<Record<string, number>>({});
  const [hits, setHits] = useState(0);
  const [escaped, setEscaped] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<SessionResult | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (quiz.data && queue === null) setQueue(quiz.data);
  }, [quiz.data, queue]);

  const total = quiz.data?.length ?? 0;
  const hearts = total - hits - escaped;
  const q = queue?.[0];
  const over = queue !== null && queue.length === 0 && total > 0;

  const answer = useMutation({
    mutationFn: ({ q, a }: { q: Question; a: Answer }) => api.post<AnswerResult>(`${learnerPath(lid)}/answers`, { questionId: q.id, mode: "boss", answer: a }),
    onSuccess: (r, { q }) => {
      setResult(r);
      if (r.correct) setHits((h) => h + 1);
      setTries((t) => ({ ...t, [q.id]: (t[q.id] ?? 0) + 1 }));
    },
  });

  const next = () => {
    if (!queue || !q || !result) return;
    const rest = queue.slice(1);
    if (result.correct) setQueue(rest);
    else if ((tries[q.id] ?? 0) < TRIES) setQueue([...rest, q]);
    else {
      // Cette question résiste : le boss garde ce cœur.
      setEscaped((e) => e + 1);
      setQueue(rest);
    }
    setResult(null);
    answer.reset();
  };

  const finish = useMutation({
    mutationFn: () =>
      api.post<SessionResult & { boss: { won: boolean; first: boolean; coins: number; stars: number } | null }>(`${learnerPath(lid)}/sessions`, {
        revisionId,
        mode: "boss",
        seconds: Math.min(4 * 3600, Math.round((Date.now() - startedAt.current) / 1000)),
        correct: hits,
        total,
      }),
    onSuccess: (r) => {
      setSummary(r);
      refresh();
    },
  });
  useEffect(() => {
    if (over && !finish.isPending && !finish.isSuccess && !finish.isError) finish.mutate();
  }, [over, finish]);

  const title = "Combat de boss";
  if (quiz.isLoading || (quiz.data && queue === null)) return <Loading />;
  if (quiz.error) {
    return (
      <Page header={<TopBar title={title} />}>
        <ErrorBox message={errorMessage(quiz.error)} />
        <Button label="Retour" onPress={() => router.back()} />
      </Page>
    );
  }
  if (!revisionId || total === 0) {
    return (
      <Page header={<TopBar title={title} />}>
        <Card style={{ alignItems: "center", gap: space.md }}>
          <T v="h3" style={{ textAlign: "center" }}>
            Pas assez de questions pour un combat ici.
          </T>
          <Button label="Retour" onPress={() => router.back()} />
        </Card>
      </Page>
    );
  }

  if (over) {
    const won = hearts === 0;
    const boss = (finish.data as { boss?: { first: boolean; coins: number; stars: number } | null } | undefined)?.boss;
    return (
      <Page header={<TopBar title={title} />}>
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
          <BossArt revisionId={revisionId} size={150} beaten={won} />
          <T v="h2" style={{ textAlign: "center" }}>
            {won ? `${bossName(revisionId)} est battu ! 🏆` : `${bossName(revisionId)} s'est enfui !`}
          </T>
          <T v="body" style={{ textAlign: "center" }}>
            {won
              ? "Tu as montré que tu connais toute la leçon. Bravo pour ton travail !"
              : `Il lui reste ${hearts} cœur${hearts > 1 ? "s" : ""}. Relis les fiches des questions difficiles, puis reviens le battre : tu y es presque.`}
          </T>
          {won && boss?.first ? (
            <T v="bodyBold" style={{ color: color.sunDark, textAlign: "center" }}>
              Première victoire : +{boss.coins} pièces et +{boss.stars} étoiles !
            </T>
          ) : null}
          {finish.isPending ? <T v="small">Enregistrement…</T> : null}
          {finish.error ? <ErrorBox message={errorMessage(finish.error)} onRetry={() => finish.mutate()} /> : null}
        </Card>
        {!won ? <Button tone="white" icon="document-text" label="Relire les fiches" onPress={() => router.replace({ pathname: "/revision/sheets", params: { lid, id: revisionId } })} /> : null}
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
            <Button label={result.correct ? "Attaque suivante" : "Continuer"} icon="arrow-forward" onPress={next} />
          </View>
        ) : null
      }
    >
      <BossFighter revisionId={revisionId} hits={hits} hearts={hearts} total={total} />
      {q ? (
        <>
          <T v="label">{q.notionTitle}</T>
          <QuestionView q={q} mode="boss" locked={!!result || answer.isPending} verdict={result} onAnswer={(a) => answer.mutate({ q, a })} />
        </>
      ) : null}
      {answer.isPending ? <T v="small">Correction…</T> : null}
      {answer.error ? <ErrorBox message={errorMessage(answer.error)} onRetry={() => answer.reset()} /> : null}
      {result ? (
        <Card style={{ gap: space.sm, backgroundColor: result.correct ? color.greenSoft : color.sunSoft, borderColor: result.correct ? color.green : color.sunEdge }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Ionicons name={result.correct ? "flash" : "shield"} size={26} color={result.correct ? color.green : color.sunDark} />
            <T v="h3" style={{ flex: 1, color: result.correct ? color.green : color.sunDark }}>
              {result.correct ? "Touché ! Un cœur en moins." : "Le boss a paré ! Cette question reviendra."}
            </T>
          </View>
          {!result.correct ? <T read v="bodyBold">Réponse : {result.expected}</T> : null}
          {result.explanation ? <T read v="body">{result.explanation}</T> : null}
        </Card>
      ) : null}
    </Page>
  );
}
