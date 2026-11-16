import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { keys, learnerPath, useJournal, useQueryClient, useRefreshLearner } from "../src/api/hooks";
import { Field } from "../src/components/Field";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../src/components/ui";
import { longDate } from "../src/lib/format";
import { useLid } from "../src/lib/lid";
import { color, radius, space } from "../src/theme/tokens";

const MOODS = [
  { v: 1, emoji: "😣", label: "Pas bien" },
  { v: 2, emoji: "😕", label: "Bof" },
  { v: 3, emoji: "🙂", label: "Ça va" },
  { v: 4, emoji: "😀", label: "Bien" },
  { v: 5, emoji: "🤩", label: "Super" },
];

export default function Journal() {
  const { lid, asParent } = useLid();
  const journal = useJournal(lid);
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const today = journal.data?.today;
  const existing = journal.data?.entries.find((e) => e.day === today);
  const [mood, setMood] = useState(0);
  const [learned, setLearned] = useState("");
  const [proud, setProud] = useState("");
  const [hard, setHard] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setMood(existing.mood);
    setLearned(existing.learned);
    setProud(existing.proud);
    setHard(existing.hard);
  }, [existing]);

  const save = useMutation({
    mutationFn: () => api.put(`${learnerPath(lid)}/journal/${today}`, { mood, learned, proud, hard }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: keys.journal(lid) });
      refresh();
    },
  });

  if (journal.isLoading || !journal.data) return <Loading />;
  const past = journal.data.entries.filter((e) => e.day !== today);

  return (
    <Page header={<TopBar title="Journal de bord" />}>
      <Card style={{ gap: space.lg }}>
        <T v="h3">Comment s'est passée ta journée ?</T>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {MOODS.map((m) => (
            <Pressable
              key={m.v}
              accessibilityRole="radio"
              accessibilityState={{ selected: mood === m.v }}
              accessibilityLabel={m.label}
              onPress={() => {
                setMood(m.v);
                setSaved(false);
              }}
              style={{ alignItems: "center", gap: 2, padding: 6, borderRadius: radius.md, backgroundColor: mood === m.v ? color.brandSoft : "transparent" }}
            >
              <T style={{ fontSize: 34, lineHeight: 42 }}>{m.emoji}</T>
              <T v="small" style={{ fontSize: 12 }}>
                {m.label}
              </T>
            </Pressable>
          ))}
        </View>
        <Field label="Ce que j'ai appris" value={learned} onChangeText={(v) => (setLearned(v), setSaved(false))} placeholder="Les fractions, le passé composé…" multiline maxLength={500} />
        <Field label="Ce dont je suis fier" value={proud} onChangeText={(v) => (setProud(v), setSaved(false))} placeholder="J'ai fini mon exposé !" multiline maxLength={500} />
        <Field label="Ce qui était difficile" value={hard} onChangeText={(v) => (setHard(v), setSaved(false))} placeholder="Je n'ai pas compris l'exercice 4" multiline maxLength={500} />
        {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
        <Button label={saved ? "Enregistré !" : "Enregistrer"} icon={saved ? "checkmark-done" : "checkmark"} disabled={!mood} loading={save.isPending} onPress={() => save.mutate()} />
        {asParent ? null : <T v="small">Tes parents peuvent lire ton journal.</T>}
      </Card>

      {past.length ? <T v="h3">Les jours d'avant</T> : null}
      {past.map((e) => (
        <Card key={e.day} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <T style={{ fontSize: 24 }}>{MOODS[e.mood - 1]?.emoji}</T>
            <T v="bodyBold" style={{ flex: 1 }}>
              {longDate(e.day).replace(/^./, (c) => c.toUpperCase())}
            </T>
          </View>
          {e.learned ? <T v="body">📚 {e.learned}</T> : null}
          {e.proud ? <T v="body">⭐ {e.proud}</T> : null}
          {e.hard ? <T v="body">🧗 {e.hard}</T> : null}
        </Card>
      ))}
    </Page>
  );
}
