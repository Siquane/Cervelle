import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { learnerPath, useMental, useRefreshLearner } from "../src/api/hooks";
import type { MentalProblem, MentalState } from "../src/api/types";
import { Mascot } from "../src/components/mascot/Mascot";
import { Pop, Reaction, StarBurst } from "../src/components/motion";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { color, font, radius, space } from "../src/theme/tokens";

// Calcul mental : 10 calculs, un pavé de chiffres, un chrono. On se compare à
// soi-même (son record de temps) ; le niveau monte après 3 séries réussies.

type Answer = MentalProblem & { typed: string; right: boolean };

const right = (typed: string, answer: number) => {
  const t = typed.replace(",", ".").replace("−", "-");
  return /^-?\d+(\.\d+)?$/.test(t) && Math.abs(Number(t) - answer) < 1e-9;
};
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "−", "0", ","];

function Keypad({ onKey, onDelete, onOk, okDisabled, decimals }: { onKey: (k: string) => void; onDelete: () => void; onOk: () => void; okDisabled: boolean; decimals: boolean }) {
  const key = (label: string, onPress: () => void, opts: { off?: boolean; tone?: "ok" | "soft" } = {}) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label === "−" ? "moins" : label === "," ? "virgule" : label}
      disabled={opts.off}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 58,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: opts.tone === "ok" ? color.brandFill : color.card,
        borderWidth: 2,
        borderBottomWidth: pressed ? 2 : 5,
        borderColor: opts.tone === "ok" ? color.brandEdge : color.line,
        opacity: opts.off ? 0.35 : 1,
        marginTop: pressed ? 3 : 0,
      })}
    >
      <T style={{ fontFamily: font.title, fontSize: 26, color: opts.tone === "ok" ? color.white : color.ink }}>{label}</T>
    </Pressable>
  );
  return (
    <View style={{ gap: space.sm }}>
      {[0, 1, 2, 3].map((r) => (
        <View key={r} style={{ flexDirection: "row", gap: space.sm }}>
          {KEYS.slice(r * 3, r * 3 + 3).map((k) => key(k, () => onKey(k), { off: !decimals && (k === "," || k === "−") }))}
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Effacer" onPress={onDelete} style={{ flex: 1, height: 58, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: color.chip }}>
          <Ionicons name="backspace" size={28} color={color.ink} />
        </Pressable>
        <View style={{ flex: 2 }}>{key("OK", onOk, { off: okDisabled, tone: "ok" })}</View>
      </View>
    </View>
  );
}

function Intro({ s, onStart }: { s: MentalState; onStart: () => void }) {
  return (
    <>
      <Card style={{ alignItems: "center", gap: space.sm }}>
        <Mascot size={90} mood="happy" />
        <T v="label">Niveau {s.level}</T>
        <T v="h2" style={{ textAlign: "center" }}>
          {s.label}
        </T>
        {s.tables.length ? <T v="small">Tables à travailler : {s.tables.join(", ")}</T> : null}
        {s.record !== null ? <T v="bodyBold" style={{ color: color.teal }}>Ton record : {clock(s.record)}</T> : null}
      </Card>
      {s.toLevelUp ? (
        <Card style={{ gap: space.sm }}>
          <T v="bodyBold">Vers le niveau {s.level + 1}</T>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {Array.from({ length: s.toLevelUp }, (_, i) => (
              <View key={i} style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: i < s.streak ? color.green : color.line }} />
            ))}
          </View>
          <T v="small">
            Trouve au moins {s.goal} calculs sur 10, {s.toLevelUp} séries de suite, et tu passes au niveau suivant.
          </T>
        </Card>
      ) : (
        <T v="body">Tu es au plus haut niveau. Essaie de battre ton record !</T>
      )}
      <Button icon="flash" label="C'est parti !" onPress={onStart} />
    </>
  );
}

export default function MentalMath() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const q = useMental(lid);
  const [phase, setPhase] = useState<"intro" | "run" | "done">("intro");
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Answer | null>(null);
  const [seconds, setSeconds] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (phase !== "run") return;
    const t = setInterval(() => setSeconds(Math.round((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  const send = useMutation({
    mutationFn: (p: { level: number; answers: { prompt: string; answer: number; typed: string }[]; seconds: number }) =>
      api.post<{ correct: number; total: number; leveledUp: boolean; newRecord: boolean; stars: number; state: MentalState }>(`${learnerPath(lid)}/mental/runs`, p),
    onSuccess: (r) => {
      if (r.stars) refresh();
    },
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) {
    return (
      <Page header={<TopBar title="Calcul mental" />}>
        <ErrorBox message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      </Page>
    );
  }
  const s = q.data;
  const problems = s.problems;
  const decimals = s.level >= 7;

  const start = () => {
    setAnswers([]);
    setI(0);
    setTyped("");
    setFeedback(null);
    setSeconds(0);
    started.current = Date.now();
    setPhase("run");
  };

  const validate = () => {
    const p = problems[i];
    const a = { ...p, typed, right: right(typed, p.answer) };
    const all = [...answers, a];
    setAnswers(all);
    setFeedback(a);
    setTyped("");
    setTimeout(
      () => {
        setFeedback(null);
        if (i + 1 < problems.length) setI(i + 1);
        else {
          const total = Math.max(1, Math.round((Date.now() - started.current) / 1000));
          setSeconds(total);
          setPhase("done");
          send.mutate({ level: s.level, answers: all.map(({ prompt, answer, typed: t }) => ({ prompt, answer, typed: t })), seconds: total });
        }
      },
      a.right ? 450 : 1400,
    );
  };

  if (phase === "intro") {
    return (
      <Page header={<TopBar title="Calcul mental" />}>
        <Intro s={s} onStart={start} />
      </Page>
    );
  }

  if (phase === "done") {
    const r = send.data;
    const missed = answers.filter((a) => !a.right);
    return (
      <Page header={<TopBar title="Calcul mental" />}>
        <Card style={{ alignItems: "center", gap: space.sm, paddingVertical: space.xl }}>
          <Mascot size={100} mood="happy" />
          {send.isPending ? <Loading /> : null}
          {r?.leveledUp ? (
            <Pop k="up">
              <T v="h2" style={{ textAlign: "center", color: color.brand }}>
                Niveau {r.state.level} débloqué !
              </T>
            </Pop>
          ) : null}
          <T v="h2" style={{ textAlign: "center" }}>
            {answers.filter((a) => a.right).length} calculs trouvés en {clock(seconds)}
          </T>
          {r?.newRecord ? (
            <T v="bodyBold" style={{ color: color.teal }}>
              Nouveau record ! Tu vas plus vite qu'avant.
            </T>
          ) : null}
          {r?.stars ? (
            <T v="bodyBold" style={{ color: color.sunDark }}>
              +{r.stars} étoile pour ton entraînement du jour ⭐
            </T>
          ) : null}
          {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}
        </Card>
        {missed.length ? (
          <Card style={{ gap: space.xs }}>
            <T v="bodyBold">À retravailler</T>
            {missed.map((a) => (
              <T key={a.id} v="body">
                {a.prompt} = {String(a.answer).replace(".", ",")}
              </T>
            ))}
          </Card>
        ) : null}
        <Button
          icon="refresh"
          label="Une autre série"
          onPress={() => {
            send.reset();
            setPhase("intro");
            void qc.invalidateQueries({ queryKey: ["mental", lid] });
          }}
        />
        <Button tone="white" icon="checkmark" label="Terminer" onPress={() => router.back()} />
        {r?.leveledUp || r?.newRecord ? <StarBurst k="win" now /> : null}
      </Page>
    );
  }

  const p = problems[i];
  return (
    <Page header={<TopBar title={`Calcul ${i + 1} sur ${problems.length}`} right={<T v="bodyBold" style={{ paddingRight: space.md }}>{clock(seconds)}</T>} />}>
      <ProgressBar value={(i / problems.length) * 100} />
      <Reaction good={feedback?.right ?? true}>
        <Card style={{ alignItems: "center", gap: space.sm, paddingVertical: space.lg, backgroundColor: feedback ? (feedback.right ? color.greenSoft : color.sunSoft) : color.card }}>
          <T style={{ fontFamily: font.title, fontSize: 40, color: color.ink, textAlign: "center" }}>{p.prompt}</T>
          <T style={{ fontFamily: font.title, fontSize: 40, color: feedback ? (feedback.right ? color.green : color.sunDark) : color.brand, minHeight: 50 }}>
            {feedback ? (feedback.right ? "✓" : `= ${String(feedback.answer).replace(".", ",")}`) : `= ${typed || "?"}`}
          </T>
        </Card>
      </Reaction>
      <Keypad
        decimals={decimals}
        onKey={(k) => !feedback && typed.length < 8 && setTyped(k === "−" ? (typed.startsWith("−") ? typed.slice(1) : `−${typed}`) : k === "," && typed.includes(",") ? typed : typed + k)}
        onDelete={() => setTyped(typed.slice(0, -1))}
        onOk={validate}
        okDisabled={!typed || !!feedback}
      />
    </Page>
  );
}
