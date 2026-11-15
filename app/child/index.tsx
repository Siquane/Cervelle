import { useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useHome, useRefreshLearner } from "../../src/api/hooks";
import { BottomSheet, RevisionIcon, Stat } from "../../src/components/bits";
import { Mascot } from "../../src/components/mascot/Mascot";
import { RevisionRow } from "../../src/components/RevisionRow";
import { Button, Card, ErrorBox, Loading, ProgressBar, T } from "../../src/components/ui";
import { whenLabel } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { useSession } from "../../src/state/session";
import { color, font, GUTTER, learnerColorOf, radius, size, space } from "../../src/theme/tokens";

export default function ChildHome() {
  const { lid, asParent } = useLid();
  const home = useHome(lid);
  const refresh = useRefreshLearner(lid);
  const signOut = useSession((s) => s.signOut);
  const [ask, setAsk] = useState("");
  const [menu, setMenu] = useState(false);
  const chest = useMutation({
    mutationFn: () => api.post<{ coins: number }>(`${learnerPath(lid)}/chest`),
    onSuccess: (r) => {
      refresh();
      Alert.alert("Coffre ouvert !", `+${r.coins} pièces. Bravo pour tes 3 missions !`);
    },
    onError: (e) => Alert.alert("Coffre", errorMessage(e)),
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: GUTTER, paddingTop: space.md }}>
        {asParent ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Retour à l'espace parent" hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={color.ink} />
          </Pressable>
        ) : null}
        <Stat icon="flame" tint={learner.streak ? "#FF7A1A" : color.faint} value={learner.streak} label="Jours d'affilée" />
        <Stat icon="coin" tint={color.sunDark} value={learner.coins} label="Pièces" />
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Menu" hitSlop={10} onPress={() => setMenu(true)}>
          <Ionicons name="ellipsis-horizontal-circle" size={34} color={color.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: space.lg, paddingBottom: 120 }}>
        <Card onPress={() => router.push({ pathname: "/child/shop", params: { lid } })} style={{ flexDirection: "row", alignItems: "center", gap: space.lg, backgroundColor: tint.soft, borderColor: tint.soft }}>
          <Mascot size={104} accessories={learner.equipped} mood={learner.streak ? "happy" : "wow"} />
          <View style={{ flex: 1, gap: 6 }}>
            <T v="h3">Salut {learner.name} !</T>
            <T v="small" style={{ color: tint.dark }}>
              Niveau {m.level} · {m.name}
            </T>
            <ProgressBar value={levelPct} tint={tint.main} track={color.white} />
            <T v="small">Touche pour habiller Cervelle</T>
          </View>
        </Card>

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
            <Button tone="sun" icon="gift" label={missions.done === missions.total ? `Ouvrir le coffre (+${missions.chestCoins})` : "Coffre : termine les 3 missions"} disabled={missions.done < missions.total} loading={chest.isPending} onPress={() => chest.mutate()} />
          )}
        </Card>

        {dueReview > 0 ? (
          <Card onPress={() => router.push({ pathname: "/quiz", params: { lid, mode: "a_revoir" } })} style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: color.sunSoft, borderColor: color.sun }}>
            <Ionicons name="alert-circle" size={30} color={color.sunDark} />
            <View style={{ flex: 1 }}>
              <T v="bodyBold">
                {dueReview} notion{dueReview > 1 ? "s" : ""} à revoir
              </T>
              <T v="small">Quelques questions pour ne pas les oublier</T>
            </View>
            <Ionicons name="play-circle" size={36} color={color.sunDark} />
          </Card>
        ) : null}

        <T v="h2">{nextExams.length ? "Révise pour ton prochain contrôle" : "Mes révisions"}</T>
        {featured.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
            {featured.map((r) => (
              <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/revision/[id]", params: { id: r.id, lid } })} style={({ pressed }) => [{ width: 170, borderRadius: radius.lg, backgroundColor: tint.main, borderBottomWidth: 5, borderColor: tint.dark, padding: space.lg, gap: space.sm, opacity: pressed ? 0.9 : 1 }]}>
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

        {revisions.length ? (
          <>
            <T v="h3">Toutes mes révisions</T>
            {revisions.map((r) => (
              <RevisionRow key={r.id} r={r} lid={lid} />
            ))}
          </>
        ) : null}

        <Card style={{ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: color.ink, borderColor: color.ink }}>
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
        <Button tone="white" icon="document-text" label="Mes interros analysées" onPress={() => router.push({ pathname: "/exam", params: { lid } })} />
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
        <Pressable accessibilityRole="button" accessibilityLabel="Ajouter une révision" onPress={() => router.push({ pathname: "/revision/new", params: { lid } })} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.brand, borderBottomWidth: 4, borderColor: color.brandDark, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={32} color={color.white} />
        </Pressable>
      </View>

      <BottomSheet open={menu} onClose={() => setMenu(false)} title="Menu">
        <Button tone="white" icon="shirt" label="Habiller Cervelle" onPress={() => { setMenu(false); router.push({ pathname: "/child/shop", params: { lid } }); }} />
        <Button tone="white" icon="chatbubbles" label="Poser une question" onPress={() => { setMenu(false); router.push({ pathname: "/assistant", params: { lid } }); }} />
        {asParent ? null : (
          <Button tone="white" icon="log-out" label="Délier ce téléphone" onPress={async () => { setMenu(false); await signOut(); router.replace("/auth"); }} />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
