import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../src/api/client";
import { useBrevetSujet } from "../../src/api/hooks";
import type { BrevetSujet } from "../../src/api/types";
import { Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

// A mock paper: work on paper first, then reveal each question's correction.

type Question = BrevetSujet["exercises"][number]["questions"][number];

function QuestionBlock({ q, n }: { q: Question; n: number }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <T v="bodyBold" style={{ color: color.sky }}>
          {n}.
        </T>
        <T read v="body" style={{ flex: 1 }}>
          {q.prompt}
        </T>
        <T v="small">{q.points} pts</T>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 6 }}>
        <Ionicons name={open ? "eye-off" : "eye"} size={20} color={color.teal} />
        <T v="bodyBold" style={{ color: color.teal }}>
          {open ? "Cacher le corrigé" : "Voir le corrigé"}
        </T>
      </Pressable>
      {open ? (
        <View style={{ gap: space.sm, backgroundColor: color.tealSoft, borderRadius: radius.md, padding: space.md }}>
          <T read v="body">
            {q.correction}
          </T>
          {q.advice ? (
            <T v="small" style={{ color: color.ink }}>
              Méthode : {q.advice}
            </T>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function BrevetPaper() {
  const { lid } = useLid();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const sujet = useBrevetSujet(lid, id);
  const s = sujet.data;

  return (
    <Page header={<TopBar title={s?.label ?? "Sujet type"} />}>
      {sujet.isLoading ? <Loading /> : null}
      {sujet.error ? <ErrorBox message={errorMessage(sujet.error)} onRetry={() => sujet.refetch()} /> : null}
      {s?.status === "processing" ? <Loading /> : null}
      {s?.status === "failed" ? <ErrorBox message={s.error ?? "Le sujet n'a pas pu être préparé."} /> : null}
      {s?.status === "ready" ? (
        <>
          <T v="h2">{s.title}</T>
          <T v="small">
            Durée : {s.minutes} min. Fais-le sur une feuille, puis compare avec le corrigé, question par question. Ce qui compte : comprendre ce qu'on attend.
          </T>
          {s.exercises.map((e, i) => (
            <Card key={i} style={{ gap: space.md }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
                <T v="h3" style={{ flex: 1 }}>
                  {e.title}
                </T>
                <T v="small">{e.points} pts</T>
              </View>
              {e.documents ? (
                <View style={{ backgroundColor: color.bg, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: color.line }}>
                  <T read v="body">
                    {e.documents}
                  </T>
                </View>
              ) : null}
              {e.questions.map((q, j) => (
                <QuestionBlock key={j} q={q} n={j + 1} />
              ))}
            </Card>
          ))}
        </>
      ) : null}
    </Page>
  );
}
