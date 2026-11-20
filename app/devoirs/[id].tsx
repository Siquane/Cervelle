import { useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useHomework } from "../../src/api/hooks";
import type { Homework } from "../../src/api/types";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { SpeakButton } from "../../src/components/VoiceButtons";
import { useLid } from "../../src/lib/lid";
import { color, font, radius, readSize, size, space } from "../../src/theme/tokens";

type Question = Homework["questions"][number];

function QuestionCard({ q, lid, id }: { q: Question; lid: string; id: string }) {
  const qc = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState<{ correct: boolean; message: string } | null>(null);
  const save = (h: Homework) => {
    qc.setQueryData(["homework", lid, id], h);
    qc.invalidateQueries({ queryKey: ["homework", lid], exact: true });
  };
  const hint = useMutation({ mutationFn: () => api.post<{ homework: Homework }>(`${learnerPath(lid)}/homework/${id}/hint`, { index: q.index }), onSuccess: (r) => save(r.homework) });
  const check = useMutation({
    mutationFn: () => api.post<{ correct: boolean; message: string; homework: Homework }>(`${learnerPath(lid)}/homework/${id}/check`, { index: q.index, answer: answer.trim() }),
    onSuccess: (r) => {
      setVerdict({ correct: r.correct, message: r.message });
      save(r.homework);
    },
  });

  return (
    <Card style={{ gap: space.md, borderColor: q.solved ? color.green : color.line }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
        <T read v="h3" style={{ flex: 1 }}>
          {q.prompt}
        </T>
        <SpeakButton id={`hw-${id}-${q.index}`} text={q.prompt} />
      </View>

      {q.hints.map((h, i) => (
        <View key={i} style={{ flexDirection: "row", gap: space.sm, backgroundColor: color.sunSoft, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="bulb" size={20} color={color.sunDark} />
          <T read v="body" style={{ flex: 1 }}>
            {h}
          </T>
        </View>
      ))}

      {q.solved ? (
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
          <Ionicons name="checkmark-circle" size={26} color={color.green} />
          <T v="bodyBold" style={{ flex: 1, color: color.green }}>
            {q.lastMessage || "Trouvé, bravo !"}
          </T>
        </View>
      ) : (
        <>
          {q.hintsLeft > 0 ? (
            <Button small tone="white" icon="bulb" label={q.hints.length ? "Un autre indice" : "Un indice"} loading={hint.isPending} onPress={() => hint.mutate()} />
          ) : (
            <T v="small">Tu as vu tous les indices. Essaie, puis demande à un adulte si tu bloques.</T>
          )}
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Ma réponse"
            placeholderTextColor={color.faint}
            accessibilityLabel={`Ma réponse à : ${q.prompt}`}
            multiline
            style={{ minHeight: 56, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: font.read, fontSize: readSize(size.md), color: color.ink }}
          />
          {verdict && !verdict.correct ? (
            <T read v="body" style={{ color: color.sunDark }}>
              {verdict.message}
            </T>
          ) : null}
          {hint.error || check.error ? <ErrorBox message={errorMessage(hint.error ?? check.error)} /> : null}
          <Button icon="checkmark" label="Vérifier ma réponse" disabled={!answer.trim()} loading={check.isPending} onPress={() => check.mutate()} />
        </>
      )}
    </Card>
  );
}

export default function HomeworkScreen() {
  const { lid } = useLid();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const hw = useHomework(lid, id);
  const h = hw.data;

  return (
    <Page header={<TopBar title={h?.subject || "Exercice"} />}>
      {hw.isLoading ? <Loading /> : null}
      {hw.error ? <ErrorBox message={errorMessage(hw.error)} onRetry={() => hw.refetch()} /> : null}
      {h ? (
        <>
          {h.instructions ? (
            <T read v="body" style={{ color: color.muted }}>
              {h.instructions}
            </T>
          ) : null}
          <T v="small">
            {h.solved}/{h.questions.length} question{h.questions.length > 1 ? "s" : ""} trouvée{h.solved > 1 ? "s" : ""}. Je ne donne jamais la réponse : je t'aide à la trouver.
          </T>
          {h.questions.map((q) => (
            <QuestionCard key={q.index} q={q} lid={lid} id={h.id} />
          ))}
        </>
      ) : null}
    </Page>
  );
}
