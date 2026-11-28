import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useDictations, useRefreshLearner } from "../../src/api/hooks";
import type { Dictation } from "../../src/api/types";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Reaction, StarBurst } from "../../src/components/motion";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { speak, stopSpeaking, useSpeaking, useStopSpeakingOnLeave } from "../../src/lib/voice";
import { color, font, radius, size, space } from "../../src/theme/tokens";

// Une dictée, phrase par phrase : on écoute (lentement), on écrit, on valide.
// La phrase s'affiche seulement après, avec les mots à revoir en couleur.

const WORD = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*'?/gu;

/** La phrase, les mots à revoir surlignés. */
function Corrected({ text, missed }: { text: string; missed: string[] }) {
  const wrong = new Set(missed.map((w) => w.toLocaleLowerCase("fr")));
  const parts: { s: string; bad: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    if (m.index! > last) parts.push({ s: text.slice(last, m.index), bad: false });
    parts.push({ s: m[0], bad: wrong.has(m[0].toLocaleLowerCase("fr")) });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ s: text.slice(last), bad: false });
  return (
    <T read v="body" style={{ fontSize: size.lg, lineHeight: 32 }}>
      {parts.map((p, i) =>
        p.bad ? (
          <T key={i} v="body" style={{ fontSize: size.lg, fontFamily: font.textBold, color: color.sunDark, backgroundColor: color.sunSoft, textDecorationLine: "underline" }}>
            {p.s}
          </T>
        ) : (
          p.s
        ),
      )}
    </T>
  );
}

export default function DictationRun() {
  useStopSpeakingOnLeave();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lid } = useLid();
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const list = useDictations(lid);
  const [local, setLocal] = useState<Dictation | null>(null);
  const d = local ?? list.data?.dictations.find((x) => x.id === id) ?? null;
  const [step, setStep] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [stars, setStars] = useState(0);
  const speaking = useSpeaking();

  // On reprend à la première phrase pas encore écrite.
  useEffect(() => {
    if (d && step === null) {
      const i = d.sentences.findIndex((x) => x.typed === null);
      setStep(i === -1 ? d.sentences.length : i);
    }
  }, [d, step]);

  const answer = useMutation({
    mutationFn: (p: { index: number; typed: string }) => api.post<{ dictation: Dictation; stars: number }>(`${learnerPath(lid)}/dictations/${id}/answer`, p),
    onSuccess: (r) => {
      setLocal(r.dictation);
      if (r.stars) {
        setStars(r.stars);
        refresh();
      }
      qc.invalidateQueries({ queryKey: ["dictations", lid] });
    },
  });

  if (list.isLoading && !d) return <Loading />;
  if (!d || step === null) {
    return (
      <Page header={<TopBar title="Dictée" />}>
        {list.error ? <ErrorBox message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : <T v="body">Cette dictée n'existe plus.</T>}
      </Page>
    );
  }

  const total = d.sentences.length;
  const finished = step >= total;

  if (finished) {
    return (
      <Page header={<TopBar title="Dictée" />}>
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
          <Mascot size={110} mood="happy" />
          <T v="h2" style={{ textAlign: "center" }}>
            Tu as écrit toute la dictée !
          </T>
          {stars ? (
            <T v="bodyBold" style={{ color: color.sunDark }}>
              +{stars} étoiles pour ton travail ⭐
            </T>
          ) : null}
          {d.toReview.length ? (
            <>
              <T v="body" style={{ textAlign: "center" }}>
                Les mots à revoir :
              </T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, justifyContent: "center" }}>
                {d.toReview.map((w) => (
                  <View key={w} style={{ backgroundColor: color.sunSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <T v="bodyBold" style={{ color: color.sunDark }}>
                      {w}
                    </T>
                  </View>
                ))}
              </View>
              <T v="small" style={{ textAlign: "center" }}>
                Copie-les deux fois dans ton cahier, puis refais une dictée avec ces mots.
              </T>
            </>
          ) : (
            <T v="body" style={{ textAlign: "center" }}>
              Tous les mots sont bien écrits. Bravo pour ton travail !
            </T>
          )}
        </Card>
        {d.sentences.map((s) => (
          <Card key={s.index} style={{ gap: space.xs }}>
            <Corrected text={s.text} missed={s.missed} />
          </Card>
        ))}
        <Button label="Terminer" icon="checkmark" onPress={() => router.back()} />
        {stars ? <StarBurst k="done" now /> : null}
      </Page>
    );
  }

  const s = d.sentences[step];
  const checked = s.typed !== null && !answer.isPending;
  const sentKey = `dictee-${d.id}-${step}`;

  return (
    <Page
      header={<TopBar title={`Phrase ${step + 1} sur ${total}`} />}
      footer={
        <View style={{ padding: 20 }}>
          {checked ? (
            <Button
              label={step + 1 < total ? "Phrase suivante" : "Voir ma dictée"}
              icon="arrow-forward"
              onPress={() => {
                stopSpeaking();
                setTyped("");
                setStep(step + 1);
              }}
            />
          ) : (
            <Button label="Valider" icon="checkmark" disabled={!typed.trim()} loading={answer.isPending} onPress={() => answer.mutate({ index: step, typed })} />
          )}
        </View>
      }
    >
      <ProgressBar value={(step / total) * 100} />
      <Card style={{ alignItems: "center", gap: space.md }}>
        <Button
          icon={speaking === sentKey ? "stop-circle" : "volume-high"}
          label={speaking === sentKey ? "Arrêter" : s.typed === null && !typed ? "Écouter la phrase" : "Réécouter"}
          onPress={() => (speaking === sentKey ? stopSpeaking() : speak(sentKey, s.text, { slow: true }))}
        />
        <T v="small" style={{ textAlign: "center" }}>
          {s.words} mots. Tu peux l'écouter autant de fois que tu veux.
        </T>
      </Card>

      {checked ? (
        <Reaction good={s.missed.length === 0}>
          <Card style={{ gap: space.sm, backgroundColor: s.missed.length ? color.sunSoft : color.greenSoft, borderColor: s.missed.length ? color.sunEdge : color.green }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Ionicons name={s.missed.length ? "search" : "checkmark-circle"} size={26} color={s.missed.length ? color.sunDark : color.green} />
              <T v="h3" style={{ flex: 1, color: s.missed.length ? color.sunDark : color.green }}>
                {s.missed.length ? `${s.missed.length} mot${s.missed.length > 1 ? "s" : ""} à revoir` : "Tous les mots sont justes !"}
              </T>
            </View>
            <Corrected text={s.text} missed={s.missed} />
            <T v="small">Tu as écrit : {s.typed}</T>
          </Card>
        </Reaction>
      ) : (
        <TextInput
          value={typed}
          onChangeText={setTyped}
          multiline
          autoFocus
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="sentences"
          accessibilityLabel="Écris la phrase"
          placeholder="Écris la phrase ici"
          placeholderTextColor={color.faint}
          style={{ minHeight: 130, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, padding: 16, textAlignVertical: "top", fontFamily: font.textSemi, fontSize: size.lg, color: color.ink }}
        />
      )}
      {answer.error ? <ErrorBox message={errorMessage(answer.error)} onRetry={() => answer.reset()} /> : null}
    </Page>
  );
}
