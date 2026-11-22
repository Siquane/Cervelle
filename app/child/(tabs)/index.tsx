import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../../src/api/client";
import { keys, learnerPath, useAgenda, useHabits, useHome, useQueryClient, useRefreshLearner, useStars, useGoals, useTodos } from "../../../src/api/hooks";
import type { Reward, Todo } from "../../../src/api/types";
import { Check, Section, celebrate } from "../../../src/components/organize";
import { EVENT_KIND, itemsForDay } from "../../../src/lib/agenda";
import { planSessions } from "../../../src/lib/plan";
import { weekdayOf } from "../../../src/lib/dates";
import { todayIso } from "../../../src/lib/format";
import { BottomSheet, RevisionIcon, Stat } from "../../../src/components/bits";
import { GoalRow } from "../../../src/components/GoalCard";
import { Mascot } from "../../../src/components/mascot/Mascot";
import { Scene } from "../../../src/components/mascot/Scene";
import { RevisionRow } from "../../../src/components/RevisionRow";
import { Button, KeyboardSafe, Card, ErrorBox, Loading, ProgressBar, T } from "../../../src/components/ui";
import { daysUntil, whenLabel } from "../../../src/lib/format";
import { useLid } from "../../../src/lib/lid";
import { flushOutbox, useOffline } from "../../../src/lib/offline";
import { keepOffline } from "../../../src/lib/keepOffline";
import { useSession } from "../../../src/state/session";
import { color, font, GUTTER, learnerColorOf, radius, size, space } from "../../../src/theme/tokens";

export default function ChildHome() {
  const { lid, asParent } = useLid();
  const stars = useStars(lid);
  const goals = useGoals(lid);
  const home = useHome(lid);
  const offline = useOffline((st) => st.offline);
  // Back online: send what was done offline, then keep every ready revision on the phone.
  useEffect(() => {
    if (!home.data || offline) return;
    const ids = home.data.revisions.filter((r) => r.status === "ready").map((r) => r.id);
    void flushOutbox((path, body) => api.post(path, body)).then(() => keepOffline(lid, ids));
  }, [home.data, offline, lid]);
  const refresh = useRefreshLearner(lid);
  const signOut = useSession((s) => s.signOut);
  const [ask, setAsk] = useState("");
  const [menu, setMenu] = useState(false);
  const [allRevisions, setAllRevisions] = useState(false);
  const agenda = useAgenda(lid);
  const todos = useTodos(lid);
  const habits = useHabits(lid);
  const qc = useQueryClient();
  const afterReward = (r: Reward) => {
    refresh();
    qc.invalidateQueries({ queryKey: keys.todos(lid) });
    qc.invalidateQueries({ queryKey: keys.habits(lid) });
    celebrate(r);
  };
  const tick = useMutation({
    mutationFn: (t: Todo) => api.patch<Reward>(`${learnerPath(lid)}/todos/${t.id}`, { done: !t.done }),
    onSuccess: afterReward,
    onError: (e) => Alert.alert("Tâche non enregistrée", errorMessage(e)),
  });
  const habitTick = useMutation({
    mutationFn: (h: { id: string; on: boolean }) =>
      h.on ? api.delete<Reward>(`${learnerPath(lid)}/habits/${h.id}/check?day=${habits.data?.today ?? todayIso()}`) : api.post<Reward>(`${learnerPath(lid)}/habits/${h.id}/check`, {}),
    onSuccess: (r) => afterReward({ ...r, coins: r.coins ?? 0 }),
    onError: (e) => Alert.alert("Habitude non enregistrée", errorMessage(e)),
  });
  const chest = useMutation({
    mutationFn: () => api.post<{ coins: number }>(`${learnerPath(lid)}/chest`),
    onSuccess: (r) => {
      refresh();
      Alert.alert("Coffre ouvert !", `+${r.coins} pièces. Bravo pour tes missions !`);
    },
    onError: (e) => Alert.alert("Coffre pas encore ouvert", errorMessage(e)),
  });

  if (home.isLoading) return <Loading />;
  if (home.error || !home.data) {
    return (
      <SafeAreaView style={{ flex: 1, padding: GUTTER }}>
        <ErrorBox message={errorMessage(home.error)} onRetry={() => home.refetch()} />
      </SafeAreaView>
    );
  }
  const { learner, missions, revisions, dueReview } = home.data;
  const tint = learnerColorOf(learner.color);
  const m = learner.mascot;
  const levelPct = m.nextLevelXp ? ((m.xp - m.levelXp) / (m.nextLevelXp - m.levelXp)) * 100 : 100;
  const ready = revisions.filter((r) => r.status === "ready");
  const nextExams = ready.filter((r) => r.examDate).sort((a, b) => a.examDate!.localeCompare(b.examDate!));
  const featured = (nextExams.length ? nextExams : ready).slice(0, 4);
  // An interro in the next 3 days goes to the top, with a quick quiz.
  const urgentExam = nextExams.find((r) => {
    const d = daysUntil(r.examDate!.slice(0, 10));
    return d >= 0 && d <= 3;
  });
  const today = habits.data?.today ?? todayIso();
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const todayItems = agenda.data ? itemsForDay([...agenda.data.events, ...planSessions(agenda.data.events, agenda.data.exams, today, learner.level)], agenda.data.exams, today).filter((i) => i.end === null || i.end >= nowHHMM).slice(0, 3) : [];
  const rank = (t: Todo) => (t.urgent && t.important ? 0 : t.important ? 1 : t.urgent ? 2 : 3);
  const openTodos = (todos.data ?? []).filter((t) => !t.done).sort((a, b) => rank(a) - rank(b) || (a.dueDay ?? "9").localeCompare(b.dueDay ?? "9")).slice(0, 4);
  const todayHabits = (habits.data?.habits ?? []).filter((h) => h.days.includes(weekdayOf(today)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: GUTTER, paddingTop: space.md }}>
        {asParent ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Retour à l'espace parent" hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={color.ink} />
          </Pressable>
        ) : null}
        <Stat icon="flame" tint={learner.streak ? "#FF7A1A" : color.faint} value={learner.streak} label="Jours d'affilée" />
        <Stat icon="coin" tint={color.sunDark} value={learner.coins} label="Pièces" />
        <Pressable accessibilityRole="button" accessibilityLabel="Chemin d'étoiles" onPress={() => router.push({ pathname: "/etoiles", params: { lid } })}>
          <Stat icon="star" tint="#E0A100" value={stars.data?.stars ?? "…"} label="Étoiles" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Menu" hitSlop={10} onPress={() => setMenu(true)}>
          <Ionicons name="ellipsis-horizontal-circle" size={34} color={color.ink} />
        </Pressable>
      </View>

      <KeyboardSafe>
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: space.lg, paddingBottom: 120 }}>
        {offline ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: color.skySoft, borderRadius: radius.md, padding: space.md }}>
            <Ionicons name="cloud-offline" size={22} color={color.sky} />
            <T v="small" style={{ flex: 1, color: color.ink }}>
              Pas de réseau : tu revois les fiches et les cartes gardées sur ton téléphone.
            </T>
          </View>
        ) : null}
        <Card onPress={() => router.push({ pathname: "/child/shop", params: { lid } })} style={{ flexDirection: "row", alignItems: "center", gap: space.lg, backgroundColor: tint.soft, borderColor: tint.soft }}>
          <Scene equipped={learner.equipped} width={112} height={112} radius={18}>
            <Mascot size={104} accessories={learner.equipped} mood={learner.streak ? "happy" : "wow"} />
          </Scene>
          <View style={{ flex: 1, gap: 6 }}>
            <T v="h3">Salut {learner.name} !</T>
            <T v="small" style={{ color: tint.dark }}>
              Niveau {m.level} · {m.name}
            </T>
            <ProgressBar value={levelPct} tint={tint.main} track={color.line} />
            <T v="small">Touche pour habiller Cervelle</T>
          </View>
        </Card>

        {goals.data?.length ? (
          <Card style={{ gap: space.sm }}>
            <T v="h3">Mes objectifs</T>
            {goals.data.map((g) => (
              <GoalRow key={g.id} g={g} child />
            ))}
          </Card>
        ) : null}

        {urgentExam || dueReview > 0 ? (
          <Card style={{ gap: space.md, borderColor: color.brand }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Ionicons name="alarm" size={24} color={color.brand} />
              <T v="h3" style={{ flex: 1 }}>
                À faire maintenant
              </T>
            </View>
            {urgentExam ? (
              <View style={{ gap: space.sm }}>
                <T v="body">
                  <T v="bodyBold">Interro {whenLabel(urgentExam.examDate!)}</T> : {urgentExam.title}
                </T>
                <Button icon="flash" label="Révision express" onPress={() => router.push({ pathname: "/quiz", params: { lid, revisionId: urgentExam.id, mode: "express" } })} />
              </View>
            ) : null}
            {dueReview > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/quiz", params: { lid, mode: "a_revoir" } })} style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: color.sunSoft, borderRadius: radius.md, padding: space.md }}>
                <Ionicons name="alert-circle" size={28} color={color.sunDark} />
                <View style={{ flex: 1 }}>
                  <T v="bodyBold">
                    {dueReview} notion{dueReview > 1 ? "s" : ""} à revoir
                  </T>
                  <T v="small">Quelques questions pour ne pas les oublier</T>
                </View>
                <Ionicons name="play-circle" size={36} color={color.sunDark} />
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        <T v="h2">{nextExams.length ? "Révise pour ta prochaine interro" : "Mes révisions"}</T>
        {featured.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
            {featured.map((r) => (
              <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/revision/[id]", params: { id: r.id, lid } })} style={({ pressed }) => [{ width: 170, borderRadius: radius.lg, backgroundColor: tint.fill, borderBottomWidth: 5, borderColor: tint.edge, padding: space.lg, gap: space.sm, opacity: pressed ? 0.9 : 1 }]}>
                <RevisionIcon icon={r.icon} seed={r.id} size={64} />
                <T v="bodyBold" numberOfLines={2} style={{ color: color.white, minHeight: 48 }}>
                  {r.title}
                </T>
                <T v="small" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {r.examDate ? `Interro ${whenLabel(r.examDate)}` : r.subject}
                </T>
                <ProgressBar value={r.progress} tint={color.white} track="rgba(255,255,255,0.3)" height={8} />
                <T v="bodyBold" style={{ color: color.white, fontSize: size.sm }}>
                  {r.progress} %
                </T>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Card style={{ alignItems: "center", gap: space.md }}>
            <T v="body" style={{ textAlign: "center" }}>
              Prends ta leçon en photo : Cervelle prépare des fiches et des quiz en une minute.
            </T>
            <Button label="Ajouter une révision" icon="camera" onPress={() => router.push({ pathname: "/revision/new", params: { lid } })} />
          </Card>
        )}


        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <T v="h3" style={{ flex: 1 }}>
              Missions du jour
            </T>
            <T v="bodyBold" style={{ color: tint.dark }}>
              {missions.done}/{missions.total}
            </T>
          </View>
          {missions.list.map((mi) => (
            <View key={mi.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Ionicons name={mi.done ? "checkmark-circle" : "ellipse-outline"} size={24} color={mi.done ? color.green : color.faint} />
              <T v="body" style={{ flex: 1, textDecorationLine: mi.done ? "line-through" : "none", color: mi.done ? color.muted : color.ink }}>
                {mi.label}
              </T>
              {mi.progress && !mi.done ? <T v="small">{mi.progress}</T> : null}
            </View>
          ))}
          {missions.chestOpened ? (
            <T v="small">Coffre ouvert aujourd'hui. Reviens demain pour de nouvelles missions !</T>
          ) : (
            <Button tone="sun" icon="gift" label={missions.done === missions.total ? `Ouvrir le coffre (+${missions.chestCoins})` : "Termine tes missions pour ouvrir le coffre"} disabled={missions.done < missions.total} loading={chest.isPending} onPress={() => chest.mutate()} />
          )}
        </Card>

        <Card style={{ gap: space.md }}>
          <Section title="Aujourd'hui" action="Agenda" onAction={() => router.navigate({ pathname: "/child/agenda", params: { lid } })} />
          {todayItems.length === 0 ? (
            <T v="small">{agenda.data?.events.length ? "Plus rien de prévu aujourd'hui." : "Ajoute ton emploi du temps dans l'onglet Agenda."}</T>
          ) : (
            todayItems.map((i) => {
              const k = EVENT_KIND[i.type === "exam" ? "interro" : i.event.kind];
              return (
                <View key={i.key} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <View style={{ width: 6, alignSelf: "stretch", borderRadius: 3, backgroundColor: k.main }} />
                  <T v="bodyBold" style={{ width: 56, fontVariant: ["tabular-nums"] }}>
                    {i.start ?? "Interro"}
                  </T>
                  <T v="body" numberOfLines={1} style={{ flex: 1 }}>
                    {i.type === "exam" ? i.exam.title : i.event.title}
                  </T>
                </View>
              );
            })
          )}
        </Card>

        <Card style={{ gap: space.md }}>
          <Section title="Mes tâches" action="Tout voir" onAction={() => router.push({ pathname: "/todos", params: { lid } })} />
          {openTodos.length === 0 ? (
            <T v="small">Rien à faire ! Ajoute tes devoirs pour ne rien oublier.</T>
          ) : (
            openTodos.map((t) => (
              <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Check on={t.done} label={t.title} onPress={() => tick.mutate(t)} />
                <T v="body" numberOfLines={2} style={{ flex: 1 }}>
                  {t.title}
                </T>
                {t.urgent && t.important ? <Ionicons name="flame" size={18} color={color.red} accessibilityLabel="Urgent et important" /> : null}
              </View>
            ))
          )}
          <Button small tone="white" icon="add" label="Ajouter une tâche" onPress={() => router.push({ pathname: "/todos", params: { lid, add: "1" } })} />
        </Card>

        <Card style={{ gap: space.md }}>
          <Section title="Mes habitudes" action="Mes habitudes" onAction={() => router.push({ pathname: "/habits", params: { lid } })} />
          {todayHabits.length === 0 ? (
            <T v="small">Crée une habitude (lire, dormir assez, sport…) et coche-la chaque jour.</T>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {todayHabits.map((h) => {
                const on = h.checked.includes(today);
                const c = learnerColorOf(h.color);
                return (
                  <Pressable
                    key={h.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={h.title}
                    onPress={() => habitTick.mutate({ id: h.id, on })}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, minHeight: 44, borderRadius: radius.pill, borderWidth: 2, borderColor: on ? c.main : color.line, backgroundColor: on ? c.soft : color.card }}
                  >
                    <T v="body">{h.emoji}</T>
                    <T v="bodyBold" style={{ color: on ? c.dark : color.ink }}>
                      {h.title}
                    </T>
                    {on ? <Ionicons name="checkmark" size={18} color={c.dark} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        {revisions.length ? (
          <>
            <T v="h3">Toutes mes révisions</T>
            {(allRevisions ? revisions : revisions.slice(0, 3)).map((r) => (
              <RevisionRow key={r.id} r={r} lid={lid} />
            ))}
            {revisions.length > 3 ? (
              <Pressable
                onPress={() => setAllRevisions((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded: allRevisions }}
                accessibilityLabel={allRevisions ? "Voir moins de révisions" : `Voir les ${revisions.length - 3} autres révisions`}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs, paddingVertical: space.sm }}
              >
                <T v="bodyBold" style={{ color: color.brand }}>
                  {allRevisions ? "Voir moins" : `Voir les ${revisions.length - 3} autres`}
                </T>
                <Ionicons name={allRevisions ? "chevron-up" : "chevron-down"} size={22} color={color.brand} />
              </Pressable>
            ) : null}
          </>
        ) : null}

        <Card style={{ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: color.inverse, borderColor: color.inverse }}>
          <View style={{ flex: 1, gap: space.sm }}>
            <T v="h3" style={{ color: color.white }}>
              Tu as ton interro corrigée ?
            </T>
            <T v="small" style={{ color: "rgba(255,255,255,0.8)" }}>
              Envoie-la à Cervelle : il t'explique tes erreurs.
            </T>
            <Button small tone="white" icon="camera" label="Envoyer" onPress={() => router.push({ pathname: "/exam/new", params: { lid } })} style={{ alignSelf: "flex-start" }} />
          </View>
          <Mascot size={86} accessories={["lunettes"]} />
        </Card>
        <Button tone="white" icon="school" label="Mon programme de l'année" onPress={() => router.push({ pathname: "/programme", params: { lid } })} />
        <Button tone="white" icon="bulb" label="Aide aux devoirs" onPress={() => router.push({ pathname: "/devoirs", params: { lid } })} />
        {/^(3|troisi)/i.test(learner.grade.trim()) ? <Button tone="white" icon="ribbon" label="Mode Brevet" onPress={() => router.push({ pathname: "/brevet", params: { lid } })} /> : null}
        <Button tone="white" icon="document-text" label="Mes interros corrigées" onPress={() => router.push({ pathname: "/exam", params: { lid } })} />
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: space.sm, paddingBottom: space.lg, backgroundColor: color.bg, flexDirection: "row", gap: space.sm, alignItems: "center" }}>
        <TextInput
          value={ask}
          onChangeText={setAsk}
          placeholder="Aide-moi à…"
          placeholderTextColor={color.faint}
          accessibilityLabel="Poser une question à Cervelle"
          returnKeyType="send"
          onSubmitEditing={() => {
            router.push({ pathname: "/assistant", params: { lid, q: ask } });
            setAsk("");
          }}
          style={{ flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 16, fontFamily: font.textSemi, fontSize: size.md, color: color.ink }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une révision" onPress={() => router.push({ pathname: "/revision/new", params: { lid } })} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.brandFill, borderBottomWidth: 4, borderColor: color.brandEdge, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={32} color={color.white} />
        </Pressable>
      </View>

      </KeyboardSafe>
      <BottomSheet open={menu} onClose={() => setMenu(false)} title="Menu">
        <Button tone="white" icon="shirt" label="Habiller Cervelle" onPress={() => { setMenu(false); router.push({ pathname: "/child/shop", params: { lid } }); }} />
        <Button tone="white" icon="chatbubbles" label="Poser une question à Cervelle" onPress={() => { setMenu(false); router.push({ pathname: "/assistant", params: { lid } }); }} />
        <Button tone="white" icon="journal" label="Journal de bord" onPress={() => { setMenu(false); router.push({ pathname: "/journal", params: { lid } }); }} />
        <Button tone="white" icon="bulb" label="Quel élève es-tu ?" onPress={() => { setMenu(false); router.push({ pathname: "/profil", params: { lid } }); }} />
        <Button tone="white" icon="settings" label="Réglages" onPress={() => { setMenu(false); router.push("/reglages"); }} />
        {asParent ? null : (
          <Button tone="white" icon="log-out" label="Déconnecter ce téléphone" onPress={async () => { setMenu(false); await signOut(); router.replace("/auth"); }} />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
