import { useEffect } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { learnerPath, useQueryClient } from "../src/api/hooks";
import type { TeachQuizList } from "../src/api/types";
import { Card, ErrorBox, Loading, Page, T, TopBar } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { color, space } from "../src/theme/tokens";

// « Apprends-le à papa/maman » : les quiz envoyés aux parents et leurs
// réponses. Quand un parent se trompe, l'enfant voit la bonne réponse pour
// la lui expliquer : enseigner, c'est la meilleure façon de retenir.

export default function TeachScreen() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["teach", lid], enabled: !!lid, queryFn: () => api.get<TeachQuizList>(`${learnerPath(lid)}/teach`) });
  const seen = useMutation({
    mutationFn: () => api.post<void>(`${learnerPath(lid)}/teach/seen`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["teachUnseen", lid] }),
  });
  useEffect(() => {
    if (list.data?.unseen) seen.mutate();
  }, [list.data?.unseen]);

  return (
    <Page header={<TopBar title="Apprends-le à tes parents" />}>
      {list.isLoading ? <Loading /> : null}
      {list.error ? <ErrorBox message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
      {list.data && list.data.quizzes.length === 0 ? (
        <Card style={{ gap: space.sm }}>
          <T v="h3">Deviens le prof !</T>
          <T v="body">Ouvre une de tes révisions et touche « Apprends-le à papa/maman » : Cervelle envoie 5 questions à tes parents. Toi, tu gagnes {list.data.stars} étoiles quand ils ont répondu.</T>
        </Card>
      ) : null}
      {list.data?.quizzes.map((quiz) => (
        <Card key={quiz.id} style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Ionicons name={quiz.answered ? "checkmark-circle" : "time"} size={24} color={quiz.answered ? color.green : color.sky} />
            <T v="bodyBold" style={{ flex: 1 }} numberOfLines={2}>
              {quiz.revisionTitle}
            </T>
            {quiz.answered ? (
              <T v="bodyBold" style={{ color: color.brand }}>
                {quiz.score}/{quiz.total}
              </T>
            ) : null}
          </View>
          {!quiz.answered ? (
            <T v="small">Envoyé à tes parents. Tu gagneras {list.data!.stars} étoiles quand ils auront répondu.</T>
          ) : (
            <>
              <T v="small">
                {quiz.answeredByName ?? "Ton parent"} a répondu. +{list.data!.stars} étoiles pour toi !{" "}
                {quiz.score === quiz.total ? "Tu lui as bien appris ta leçon." : "Explique-lui les bonnes réponses :"}
              </T>
              {quiz.questions
                .filter((q) => q.correct === false)
                .map((q) => (
                  <View key={q.id} style={{ gap: 2, backgroundColor: color.sunSoft, borderRadius: 12, padding: space.md }}>
                    <T read v="bodyBold" style={{ color: color.onSun }}>
                      {q.prompt}
                    </T>
                    <T read v="small" style={{ color: color.onSun }}>
                      {quiz.answeredByName ?? "Ton parent"} a répondu : {q.given !== null && q.given !== undefined ? q.choices[q.given] : "—"}
                    </T>
                    <T read v="small" style={{ color: color.onSun }}>
                      La bonne réponse : {q.expected !== undefined ? q.choices[q.expected] : ""}
                    </T>
                    {q.explanation ? (
                      <T read v="small" style={{ color: color.onSun }}>
                        Pourquoi : {q.explanation}
                      </T>
                    ) : null}
                  </View>
                ))}
            </>
          )}
        </Card>
      ))}
    </Page>
  );
}
