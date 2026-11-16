import { useEffect, useState } from "react";
import { Alert, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../../src/api/client";
import { learnerPath, useHome, useRefreshLearner, useRevisions, useStats, useTodos } from "../../../src/api/hooks";
import type { FocusResult, Learner } from "../../../src/api/types";
import { BottomSheet } from "../../../src/components/bits";
import { Chip } from "../../../src/components/Chip";
import { Mascot } from "../../../src/components/mascot/Mascot";
import { celebrate } from "../../../src/components/organize";
import { Button, Card, Loading, T } from "../../../src/components/ui";
import { useLid } from "../../../src/lib/lid";
import { leftOf, mmss, useTimer } from "../../../src/state/timer";
import { color, font, GUTTER, radius, size, space } from "../../../src/theme/tokens";

const FOCUS_CHOICES = [10, 15, 20, 25, 30, 45];
const PAUSE_CHOICES = [3, 5, 10, 15];
const RING = 260;
const STROKE = 18;

function Ring({ progress, tint }: { progress: number; tint: string }) {
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={RING} height={RING} style={{ position: "absolute" }}>
      <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={color.line} strokeWidth={STROKE} fill={color.card} />
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={r}
        stroke={tint}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
        transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
      />
    </Svg>
  );
}

export default function TimerTab() {
  const { lid } = useLid();
  const home = useHome(lid);
  const todos = useTodos(lid);
  const revisions = useRevisions(lid);
  const stats = useStats(lid);
  const refresh = useRefreshLearner(lid);
  const t = useTimer();
  const [, setNow] = useState(0);
  const [settings, setSettings] = useState(false);

  // Re-draw every half second while it runs.
  useEffect(() => {
    if (!t.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [t.running]);

  const prefs = useMutation({
    mutationFn: (b: { focus: number; pause: number }) => api.patch<{ learner: Learner }>(`${learnerPath(lid)}/timer`, b),
    onSuccess: () => refresh(),
    onError: (e) => Alert.alert("Minuteur", errorMessage(e)),
  });
  const finish = useMutation({
    mutationFn: (body: { seconds: number; label: string; revisionId: string | null; todoId: string | null }) => api.post<FocusResult>(`${learnerPath(lid)}/focus`, body),
    onSuccess: (r) => {
      refresh();
      if (!r.counted) Alert.alert("Séance enregistrée", "Moins de 5 minutes : elle ne compte pas encore pour ta série. Tu feras mieux la prochaine fois !");
      else celebrate(r, "Séance terminée !");
    },
    onError: (e) => Alert.alert("Minuteur", errorMessage(e)),
  });

  if (home.isLoading || !home.data) return <Loading />;
  const timer = home.data.learner.timer;
  const left = t.phase === "idle" ? timer.focus * 60_000 : leftOf(t);
  const progress = t.phase === "idle" ? 1 : t.lengthMs ? left / t.lengthMs : 0;
  const tint = t.phase === "pause" ? color.teal : color.brand;
  const todayMinutes = stats.data?.week.at(-1)?.minutes ?? 0;
  const openTodos = (todos.data ?? []).filter((x) => !x.done).slice(0, 4);
  const ready = (revisions.data ?? []).filter((r) => r.status === "ready").slice(0, 4);

  const stop = () => {
    const target = t.target;
    const worked = useTimer.getState().stop();
    if (worked >= 60) finish.mutate({ seconds: worked, label: target.label, revisionId: target.revisionId, todoId: target.todoId });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: space.lg, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <T v="h2" style={{ flex: 1 }}>
            Minuteur
          </T>
          <Button small tone="white" icon="options" label={`${timer.focus} / ${timer.pause} min`} onPress={() => setSettings(true)} disabled={t.phase !== "idle"} />
        </View>

        <View style={{ alignItems: "center", justifyContent: "center", height: RING }}>
          <Ring progress={progress} tint={tint} />
          <T v="label" style={{ color: tint }}>
            {t.phase === "pause" ? "Pause" : t.phase === "focus" ? (t.running ? "Concentration" : "En pause") : "Prêt ?"}
          </T>
          <T style={{ fontFamily: font.title, fontSize: 60, lineHeight: 72, color: color.ink, fontVariant: ["tabular-nums"] }} accessibilityLiveRegion="polite">
            {mmss(left)}
          </T>
          {t.target.label ? (
            <T v="small" numberOfLines={1} style={{ maxWidth: RING - 60 }}>
              {t.target.label}
            </T>
          ) : null}
        </View>

        {t.phase === "idle" ? (
          <Button label={`C'est parti pour ${timer.focus} min`} icon="play" onPress={() => t.startFocus(timer.focus)} style={{ minHeight: 64 }} />
        ) : (
          <View style={{ flexDirection: "row", gap: space.md }}>
            {t.running ? (
              <Button tone="white" icon="pause" label="Pause" onPress={t.pause} style={{ flex: 1 }} />
            ) : (
              <Button icon="play" label="Reprendre" onPress={t.resume} style={{ flex: 1 }} />
            )}
            <Button tone="white" icon="stop" label={t.phase === "pause" ? "Fin de pause" : "Terminer"} loading={finish.isPending} onPress={stop} style={{ flex: 1 }} />
          </View>
        )}

        {t.phase === "idle" ? (
          <Card style={{ gap: space.md }}>
            <T v="h3">Sur quoi tu travailles ?</T>
            <TextInput
              value={t.target.label}
              onChangeText={(label) => t.setTarget({ label: label.slice(0, 80), todoId: null, revisionId: null })}
              placeholder="Exo 3 de physique, poésie…"
              placeholderTextColor={color.faint}
              accessibilityLabel="Sur quoi tu travailles"
              style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, paddingHorizontal: 16, fontFamily: font.textSemi, fontSize: size.md, color: color.ink }}
            />
            {openTodos.length || ready.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {openTodos.map((x) => (
                  <Chip key={x.id} label={x.title} on={t.target.todoId === x.id} onPress={() => t.setTarget({ label: x.title, todoId: x.id, revisionId: null })} />
                ))}
                {ready.map((r) => (
                  <Chip key={r.id} label={`📘 ${r.title}`} on={t.target.revisionId === r.id} onPress={() => t.setTarget({ label: r.title, revisionId: r.id, todoId: null })} />
                ))}
              </View>
            ) : null}
          </Card>
        ) : null}

        <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: color.sunSoft, borderColor: color.sunSoft }}>
          <Mascot size={70} accessories={home.data.learner.equipped} mood={todayMinutes ? "happy" : "wow"} />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="bodyBold">{todayMinutes ? `${todayMinutes} min de travail aujourd'hui` : "Pas encore travaillé aujourd'hui"}</T>
            <T v="small">1 pièce toutes les 5 minutes. Dès 5 minutes, ta série de jours compte !</T>
          </View>
        </Card>
      </ScrollView>

      <BottomSheet open={settings} onClose={() => setSettings(false)} title="Réglages du minuteur">
        <T v="bodyBold">Temps de travail</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {FOCUS_CHOICES.map((m) => (
            <Chip key={m} label={`${m} min`} on={timer.focus === m} onPress={() => prefs.mutate({ focus: m, pause: timer.pause })} />
          ))}
        </View>
        <T v="bodyBold">Pause</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {PAUSE_CHOICES.map((m) => (
            <Chip key={m} label={`${m} min`} on={timer.pause === m} onPress={() => prefs.mutate({ focus: timer.focus, pause: m })} />
          ))}
        </View>
        <Button label="C'est bon" onPress={() => setSettings(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}
