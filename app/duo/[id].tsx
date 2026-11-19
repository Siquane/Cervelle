import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useHome } from "../../src/api/hooks";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, font, radius, size, space } from "../../src/theme/tokens";
import { de } from "../../src/lib/format";

// « Révision à deux » on one phone: two players answer in turn, the phone
// checks each answer and shows the explanation, the best score wins. Nothing
// is sent back: the other player's answers don't touch the child's progress.

type Q = { id: string; type: "qcm" | "vrai_faux"; prompt: string; choices: string[]; answer: string; explanation: string };
type Phase = "names" | "handoff" | "question" | "feedback" | "end";

const VF = [
  { key: "vrai", label: "Vrai" },
  { key: "faux", label: "Faux" },
];

export default function Duo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lid } = useLid();
  const home = useHome(lid);
  const data = useQuery({ queryKey: ["duo", lid, id], enabled: !!id, retry: false, staleTime: Infinity, queryFn: () => api.get<{ title: string; questions: Q[] }>(`${learnerPath(lid)}/revisions/${id}/duo`) });
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [phase, setPhase] = useState<Phase>("names");
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [picked, setPicked] = useState<string | null>(null);

  const qs = data.data?.questions ?? [];
  // Each player gets the same number of questions.
  const total = qs.length - (qs.length % 2);
  const q = qs[index];
  const player = index % 2;
  const me = names[0] || home.data?.learner.name || "Joueur 1";
  const who = [me, names[1] || "Joueur 2"];

  const answer = (key: string) => {
    if (!q || picked) return;
    setPicked(key);
    if (key === q.answer.trim().toLowerCase()) setScores((s) => (player === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
    setPhase("feedback");
  };
  const next = () => {
    setPicked(null);
    if (index + 1 >= total) return setPhase("end");
    setIndex(index + 1);
    setPhase("handoff");
  };
  const restart = () => {
    setIndex(0);
    setScores([0, 0]);
    setPicked(null);
    setPhase("handoff");
    void data.refetch();
  };

  const right = q && picked ? picked === q.answer.trim().toLowerCase() : false;
  const expected = q ? (q.type === "qcm" ? q.choices[Number(q.answer)] : q.answer === "vrai" ? "Vrai" : "Faux") : "";

  return (
    <Page header={<TopBar title={data.data ? `À deux : ${data.data.title}` : "Révision à deux"} />}>
      {data.isLoading ? <Loading /> : null}
      {data.error ? <ErrorBox message={errorMessage(data.error)} /> : null}

      {data.data && phase !== "names" && phase !== "end" ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {[0, 1].map((p) => (
            <View key={p} style={{ flex: 1, alignItems: "center", padding: space.sm, borderRadius: radius.md, borderWidth: 2, borderColor: player === p ? color.brand : color.line, backgroundColor: color.card }}>
              <T v="small" numberOfLines={1}>
                {who[p]}
              </T>
              <T style={{ fontFamily: font.title, fontSize: size.xl, lineHeight: 30, color: color.ink }}>{scores[p]}</T>
            </View>
          ))}
        </View>
      ) : null}

      {data.data && phase === "names" ? (
        <Card style={{ gap: space.md }}>
          <View style={{ alignItems: "center" }}>
            <Mascot size={110} mood="wow" />
          </View>
          <T v="body">Révisez à deux sur ce téléphone : chacun répond à son tour et on s'explique les réponses. {total} questions en tout.</T>
          {[0, 1].map((p) => (
            <TextInput
              key={p}
              value={names[p]}
              onChangeText={(v) => setNames((n) => (p === 0 ? [v.slice(0, 20), n[1]] : [n[0], v.slice(0, 20)]))}
              placeholder={p === 0 ? `Joueur 1 (${home.data?.learner.name ?? "toi"})` : "Prénom du joueur 2"}
              placeholderTextColor={color.faint}
              accessibilityLabel={p === 0 ? "Prénom du joueur 1" : "Prénom du joueur 2"}
              style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, paddingHorizontal: 16, fontFamily: font.text, fontSize: size.md, color: color.ink }}
            />
          ))}
          <Button icon="people" label="C'est parti" disabled={!names[1].trim()} onPress={() => setPhase("handoff")} />
        </Card>
      ) : null}

      {phase === "handoff" && q ? (
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
          <T v="small">
            Question {index + 1} sur {total}
          </T>
          <T v="h2" style={{ textAlign: "center" }}>
            Au tour {de(who[player])} !
          </T>
          <T v="body" style={{ textAlign: "center" }}>
            Passe-lui le téléphone.
          </T>
          <Button icon="eye" label="Voir la question" onPress={() => setPhase("question")} style={{ alignSelf: "stretch" }} />
        </Card>
      ) : null}

      {(phase === "question" || phase === "feedback") && q ? (
        <Card style={{ gap: space.lg }}>
          <T v="label" style={{ color: color.brand }}>
            {who[player]}
          </T>
          <T read v="h3">{q.prompt}</T>
          <View style={{ gap: space.sm }}>
            {(q.type === "qcm" ? q.choices.map((c, i) => ({ key: String(i), label: c })) : VF).map((c) => {
              const isAnswer = c.key === q.answer.trim().toLowerCase();
              const isPicked = picked === c.key;
              const border = phase === "feedback" ? (isAnswer ? color.green : isPicked ? color.red : color.line) : color.line;
              return (
                <Pressable key={c.key} accessibilityRole="button" disabled={phase === "feedback"} onPress={() => answer(c.key)} style={({ pressed }) => ({ minHeight: 56, borderRadius: radius.md, borderWidth: 2, borderColor: border, backgroundColor: phase === "feedback" && isAnswer ? color.greenSoft : color.card, paddingHorizontal: space.lg, justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
                  <T read v="bodyBold">{c.label}</T>
                </Pressable>
              );
            })}
          </View>
          {phase === "feedback" ? (
            <View style={{ gap: space.sm }}>
              <T v="h3" style={{ color: right ? color.green : color.red }}>
                {right ? "Bravo, +1 point !" : `Raté. La bonne réponse : ${expected}`}
              </T>
              {q.explanation ? <T read v="body">{q.explanation}</T> : null}
              <Button icon="arrow-forward" label={index + 1 >= total ? "Voir le résultat" : `Au tour ${de(who[1 - player])}`} onPress={next} />
            </View>
          ) : null}
        </Card>
      ) : null}

      {phase === "end" ? (
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
          <Mascot size={130} mood="wow" accessories={["couronne"]} />
          <T v="title" style={{ textAlign: "center" }}>
            Bien révisé à deux !
          </T>
          <T v="h3">
            {who[0]} {scores[0]} – {scores[1]} {who[1]}
          </T>
          <Button icon="refresh" label="Rejouer" onPress={restart} style={{ alignSelf: "stretch" }} />
          <Button tone="white" icon="arrow-back" label="Retour à la révision" onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
        </Card>
      ) : null}
    </Page>
  );
}
