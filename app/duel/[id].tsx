import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useRefreshLearner } from "../../src/api/hooks";
import type { DuelQuestion, DuelResult } from "../../src/api/types";
import { Coin } from "../../src/components/Coin";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

// A quiz duel: the same 10 questions as the friend, answered one after the
// other without seeing the corrections, then sent all at once.

const VF = [
  { key: "vrai", label: "Vrai" },
  { key: "faux", label: "Faux" },
];

export default function DuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lid } = useLid();
  const refresh = useRefreshLearner(lid);
  const duel = useQuery({ queryKey: ["duel", lid, id], enabled: !!id, retry: false, queryFn: () => api.get<{ id: string; title: string; questions: DuelQuestion[] }>(`${learnerPath(lid)}/duels/${id}`) });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const send = useMutation({
    mutationFn: () => api.post<DuelResult>(`${learnerPath(lid)}/duels/${id}/answers`, { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) }),
    onSuccess: refresh,
  });

  const qs = duel.data?.questions ?? [];
  const q = qs[index];
  const r = send.data;

  const pick = (value: string) => {
    if (!q) return;
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (index + 1 < qs.length) setIndex(index + 1);
  };

  return (
    <Page header={<TopBar title={duel.data ? `Défi : ${duel.data.title}` : "Défi quiz"} />}>
      {duel.isLoading ? <Loading /> : null}
      {duel.error ? <ErrorBox message={errorMessage(duel.error)} /> : null}

      {r ? (
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
          <Mascot size={130} mood={r.result === "lost" ? "sad" : "wow"} />
          <T v="title" style={{ textAlign: "center" }}>
            {r.score}/{r.total}
          </T>
          <T v="h3" style={{ textAlign: "center" }}>
            {r.result === null ? "Bien joué ! Ton ami n'a pas encore joué." : r.result === "won" ? `Tu as gagné ! (${r.theirScore}/${r.total} pour ton ami)` : r.result === "draw" ? "Égalité !" : `Perdu de peu : ${r.theirScore}/${r.total} pour ton ami.`}
          </T>
          {r.coins ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Coin size={22} />
              <T v="bodyBold">+{r.coins} pièces</T>
            </View>
          ) : null}
          <Button label="Retour à mes amis" icon="people" onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
        </Card>
      ) : q ? (
        <>
          <ProgressBar value={(index / qs.length) * 100} tint={color.sun} />
          <T v="small">
            Question {index + 1} sur {qs.length} · les corrections arrivent à la fin
          </T>
          <Card style={{ gap: space.lg }}>
            <T v="h3">{q.prompt}</T>
            <View style={{ gap: space.sm }}>
              {(q.type === "qcm" ? q.choices.map((c, i) => ({ key: String(i), label: c })) : VF).map((c) => {
                const on = answers[q.id] === c.key;
                return (
                  <Pressable
                    key={c.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => pick(c.key)}
                    style={({ pressed }) => ({ minHeight: 56, borderRadius: radius.md, borderWidth: 2, borderColor: on ? color.brand : color.line, backgroundColor: on ? color.brandSoft : color.card, paddingHorizontal: space.lg, justifyContent: "center", opacity: pressed ? 0.8 : 1 })}
                  >
                    <T v="bodyBold">{c.label}</T>
                  </Pressable>
                );
              })}
            </View>
          </Card>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button tone="white" icon="arrow-back" label="Avant" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ flex: 1 }} />
            {index + 1 === qs.length ? (
              <Button tone="sun" icon="send" label="Envoyer" disabled={Object.keys(answers).length < qs.length} loading={send.isPending} onPress={() => send.mutate()} style={{ flex: 1.4 }} />
            ) : (
              <Button tone="white" icon="arrow-forward" label="Suivante" disabled={!answers[q.id]} onPress={() => setIndex(index + 1)} style={{ flex: 1.4 }} />
            )}
          </View>
          {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}
        </>
      ) : null}
    </Page>
  );
}
