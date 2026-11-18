import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../../src/api/client";
import { keys, learnerPath, useDuels, useFriends, useQueryClient, useRevisions } from "../../../src/api/hooks";
import type { BoardRow, Duel } from "../../../src/api/types";
import { BottomSheet } from "../../../src/components/bits";
import { Mascot } from "../../../src/components/mascot/Mascot";
import { Button, Card, ErrorBox, Loading, ProgressBar, T } from "../../../src/components/ui";
import { duration } from "../../../src/lib/format";
import { useLid } from "../../../src/lib/lid";
import { color, font, GUTTER, learnerColorOf, onColor, radius, size, space } from "../../../src/theme/tokens";

const PODIUM = [
  { place: 2, height: 70, tint: "#C9CFDB" },
  { place: 1, height: 100, tint: "#FFC23D" },
  { place: 3, height: 50, tint: "#E8A27A" },
];

export default function FriendsTab() {
  const { lid, asParent } = useLid();
  const friends = useFriends(lid);
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [picked, setPicked] = useState<BoardRow | null>(null);
  const [duelFor, setDuelFor] = useState<BoardRow | null>(null);
  const duels = useDuels(lid);
  const revisions = useRevisions(lid);
  const startDuel = useMutation({
    mutationFn: ({ friendId, revisionId }: { friendId: string; revisionId: string }) => api.post<{ duel: { id: string } }>(`${learnerPath(lid)}/duels`, { friendId, revisionId }),
    onSuccess: (r) => {
      setDuelFor(null);
      qc.invalidateQueries({ queryKey: keys.duels(lid) });
      // The challenger plays first; the friend sees it in their list.
      router.push({ pathname: "/duel/[id]", params: { id: r.duel.id, lid } });
    },
    onError: (e) => Alert.alert("Défi impossible", errorMessage(e)),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: keys.friends(lid) });

  const add = useMutation({
    mutationFn: () => api.post<{ friendship: { name: string } }>(`${learnerPath(lid)}/friends`, { code }),
    onSuccess: (r) => {
      setCode("");
      refresh();
      Alert.alert("Demande envoyée", `Quand tes parents et ceux de ${r.friendship.name} auront dit oui, vous serez amis.`);
    },
    onError: (e) => Alert.alert("Demande non envoyée", errorMessage(e)),
  });
  const cheer = useMutation({
    mutationFn: (b: { toId: string; kind: string }) => api.post(`${learnerPath(lid)}/cheers`, b),
    onSuccess: () => {
      setPicked(null);
      Alert.alert("Envoyé !", "Ton encouragement est parti.");
    },
    onError: (e) => Alert.alert("Encouragement non envoyé", errorMessage(e)),
  });
  const challenge = useMutation({
    mutationFn: (toId: string) => api.post(`${learnerPath(lid)}/challenges`, { toId }),
    onSuccess: () => {
      setPicked(null);
      refresh();
      Alert.alert("Défi lancé !", "Qui travaillera le plus cette semaine ? Le gagnant remporte 20 pièces.");
    },
    onError: (e) => Alert.alert("Défi non lancé", errorMessage(e)),
  });
  const answer = useMutation({
    mutationFn: (b: { id: string; action: "accept" | "decline" }) => api.post(`${learnerPath(lid)}/challenges/${b.id}/${b.action}`),
    onSuccess: refresh,
    onError: (e) => Alert.alert("Réponse non envoyée", errorMessage(e)),
  });
  const unfriend = useMutation({
    mutationFn: (id: string) => api.delete(`${learnerPath(lid)}/friends/${id}`),
    onSuccess: () => {
      setPicked(null);
      refresh();
    },
  });

  // Cheers are marked as read once the child has seen them here.
  const cheersCount = friends.data?.cheers.length ?? 0;
  const [shownCheers, setShownCheers] = useState(friends.data?.cheers ?? []);
  useEffect(() => {
    if (cheersCount) setShownCheers(friends.data!.cheers);
  }, [cheersCount, friends.data]);
  useFocusEffect(
    useCallback(() => {
      if (!cheersCount || asParent) return;
      const id = setTimeout(() => api.post(`${learnerPath(lid)}/cheers/seen`).then(refresh).catch(() => {}), 1500);
      return () => clearTimeout(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cheersCount, asParent, lid]),
  );

  if (friends.isLoading) return <Loading />;
  if (friends.error || !friends.data) {
    return (
      <SafeAreaView style={{ flex: 1, padding: GUTTER }}>
        <ErrorBox message={errorMessage(friends.error)} onRetry={() => friends.refetch()} />
      </SafeAreaView>
    );
  }
  const f = friends.data;
  const top = PODIUM.map((p) => ({ ...p, row: f.board[p.place - 1] })).filter((p) => p.row);
  const incoming = f.challenges.filter((c) => c.status === "pending" && !c.sentByMe);
  const others = f.challenges.filter((c) => !(c.status === "pending" && !c.sentByMe));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: space.lg, paddingBottom: 40 }}>
        <T v="h2">Mes amis</T>

        {shownCheers.length ? (
          <Card style={{ gap: space.sm, backgroundColor: color.brandSoft, borderColor: color.brandSoft }}>
            {shownCheers.slice(0, 4).map((c) => (
              <T key={c.id} v="bodyBold">
                {c.emoji} {c.fromName} : {c.label}
              </T>
            ))}
          </Card>
        ) : null}

        {incoming.map((c) => (
          <Card key={c.id} style={{ gap: space.md, backgroundColor: color.sunSoft, borderColor: color.sun }}>
            <T v="bodyBold">⚔️ {c.other.name} te lance un défi : qui travaillera le plus cette semaine ?</T>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <Button small tone="sun" icon="checkmark" label="J'accepte" onPress={() => answer.mutate({ id: c.id, action: "accept" })} style={{ flex: 1 }} />
              <Button small tone="white" label="Non merci" onPress={() => answer.mutate({ id: c.id, action: "decline" })} style={{ flex: 1 }} />
            </View>
          </Card>
        ))}

        {duels.data?.length ? <DuelsCard duels={duels.data} lid={lid} canPlay={!asParent} /> : null}

        <Card style={{ gap: space.md }}>
          <T v="h3">Classement de la semaine</T>
          {f.board.length > 1 ? (
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: space.sm }}>
              {top.map(({ place, height, tint, row }) => (
                <Pressable key={place} accessibilityRole="button" accessibilityLabel={`${place}e : ${row!.name}, ${row!.weekMinutes} minutes`} onPress={() => !row!.me && setPicked(row!)} style={{ alignItems: "center", width: 96, gap: 4 }}>
                  <Mascot size={place === 1 ? 64 : 52} accessories={[...row!.equipped.filter((e) => e !== "couronne"), ...(place === 1 ? ["couronne"] : [])]} />
                  <T v="bodyBold" numberOfLines={1}>
                    {row!.me ? "Moi" : row!.name}
                  </T>
                  <T v="small">{duration(row!.weekMinutes * 60)}</T>
                  <View style={{ width: "100%", height, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, backgroundColor: tint, alignItems: "center", paddingTop: 6 }}>
                    <T style={{ fontFamily: font.title, fontSize: size.xl, color: onColor(tint) }}>{place}</T>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <T v="body" style={{ color: color.muted }}>
              Ajoute un ami avec son code : vous verrez qui travaille le plus chaque semaine.
            </T>
          )}
          {f.board.map((r, i) => {
            const c = learnerColorOf(r.color);
            return (
              <Pressable key={r.id} accessibilityRole="button" disabled={r.me} onPress={() => setPicked(r)} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 4, borderRadius: radius.md, backgroundColor: r.me ? c.soft : "transparent", paddingHorizontal: r.me ? 8 : 0 }}>
                <T v="bodyBold" style={{ width: 24, color: color.muted }}>
                  {i + 1}
                </T>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
                  <T v="bodyBold" style={{ color: c.dark }}>
                    {r.name.slice(0, 1).toUpperCase()}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="bodyBold" numberOfLines={1}>
                    {r.me ? `${r.name} (moi)` : r.name}
                  </T>
                  <T v="small">
                    Niv. {r.level}
                    {r.sibling ? " · famille" : ""}
                  </T>
                </View>
                <T v="bodyBold" style={{ color: c.dark, fontVariant: ["tabular-nums"] }}>
                  {duration(r.weekMinutes * 60)}
                </T>
              </Pressable>
            );
          })}
        </Card>

        {others.length ? (
          <Card style={{ gap: space.md }}>
            <T v="h3">Mes défis</T>
            {others.map((c) => {
              const total = Math.max(1, c.myMinutes + c.theirMinutes);
              return (
                <View key={c.id} style={{ gap: 6 }}>
                  <T v="bodyBold">
                    {c.status === "pending"
                      ? `En attente de ${c.other.name}`
                      : c.status === "active"
                        ? `Moi contre ${c.other.name}`
                        : c.result === "won"
                          ? `Gagné contre ${c.other.name} ! +${c.prize} pièces`
                          : c.result === "tie"
                            ? `Égalité avec ${c.other.name} : +${c.prize / 2} pièces chacun`
                            : c.result === "lost"
                              ? `${c.other.name} a gagné. Revanche ?`
                              : `Défi avec ${c.other.name} terminé`}
                  </T>
                  {c.status !== "pending" ? (
                    <>
                      <ProgressBar value={(c.myMinutes / total) * 100} tint={color.brand} track={color.skySoft} />
                      <View style={{ flexDirection: "row" }}>
                        <T v="small" style={{ flex: 1 }}>
                          Moi : {duration(c.myMinutes * 60)}
                        </T>
                        <T v="small">
                          {c.other.name} : {duration(c.theirMinutes * 60)}
                        </T>
                      </View>
                    </>
                  ) : null}
                </View>
              );
            })}
          </Card>
        ) : null}

        <Card style={{ gap: space.md }}>
          <T v="h3">Mon code d'ami</T>
          <T style={{ fontFamily: font.title, fontSize: 40, lineHeight: 48, letterSpacing: 6, color: color.brand, textAlign: "center" }} selectable>
            {f.code}
          </T>
          <T v="small" style={{ textAlign: "center" }}>
            Donne ce code à un copain ou une copine. Vos parents devront dire oui tous les deux.
          </T>
          <View style={{ gap: space.sm }}>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().slice(0, 6))}
              placeholder="Code de ton ami"
              placeholderTextColor={color.faint}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Code de ton ami"
              style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, paddingHorizontal: 16, fontFamily: font.textBlack, fontSize: size.lg, letterSpacing: 3, color: color.ink }}
            />
            <Button icon="person-add" label="Ajouter" disabled={code.length !== 6} loading={add.isPending} onPress={() => add.mutate()} />
          </View>
          {f.pending.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Ionicons name="hourglass" size={20} color={color.sunDark} />
              <T v="small" style={{ flex: 1 }}>
                {p.outgoing ? `Demande à ${p.name}` : `${p.name} veut être ton ami`} : en attente des parents
              </T>
            </View>
          ))}
        </Card>
      </ScrollView>

      <BottomSheet open={!!duelFor} onClose={() => setDuelFor(null)} title={`Défi quiz avec ${duelFor?.name ?? ""}`}>
        <T v="body">Choisis un de tes cours : vous aurez les mêmes 10 questions. Le meilleur score gagne 20 pièces.</T>
        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: space.sm }}>
          {(revisions.data ?? [])
            .filter((r) => r.status === "ready")
            .map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                disabled={startDuel.isPending}
                onPress={() => duelFor && startDuel.mutate({ friendId: duelFor.id, revisionId: r.id })}
                style={({ pressed }) => ({ minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, paddingHorizontal: space.md, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
              >
                <T v="bodyBold" numberOfLines={1}>
                  {r.title}
                </T>
                <T v="small">{r.subject}</T>
              </Pressable>
            ))}
          {revisions.data && !revisions.data.some((r) => r.status === "ready") ? <T v="small">Prends d'abord un cours en photo : le défi se fait sur ses questions.</T> : null}
        </ScrollView>
      </BottomSheet>

      <BottomSheet open={!!picked} onClose={() => setPicked(null)} title={picked?.name ?? ""}>
        <T v="bodyBold">Envoyer un encouragement</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {f.cheerKinds.map((k) => (
            <Pressable
              key={k.id}
              accessibilityRole="button"
              onPress={() => picked && cheer.mutate({ toId: picked.id, kind: k.id })}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, minHeight: 46, borderRadius: radius.pill, borderWidth: 2, borderColor: color.line, backgroundColor: color.card }}
            >
              <T v="body">{k.emoji}</T>
              <T v="bodyBold">{k.label}</T>
            </Pressable>
          ))}
        </View>
        {!asParent ? (
          <Button icon="flash" label="Défi quiz sur un de mes cours" onPress={() => { setDuelFor(picked); setPicked(null); }} />
        ) : null}
        <Button tone="sun" icon="trophy" label="Lancer un défi pour la semaine" loading={challenge.isPending} onPress={() => picked && challenge.mutate(picked.id)} />
        {picked?.friendshipId ? <Button tone="ghost" icon="person-remove" label="Retirer de mes amis" onPress={() => unfriend.mutate(picked.friendshipId!)} /> : null}
      </BottomSheet>
    </SafeAreaView>
  );
}

/** Quiz duels: to play first, then waiting, then finished. */
function DuelsCard({ duels, lid, canPlay }: { duels: Duel[]; lid: string; canPlay: boolean }) {
  const toPlay = duels.filter((d) => d.status === "open" && d.myScore === null);
  const rest = duels.filter((d) => !toPlay.includes(d)).slice(0, 5);
  return (
    <Card style={{ gap: space.md }}>
      <T v="h3">Défis quiz</T>
      {toPlay.map((d) => (
        <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: color.sunSoft, borderRadius: radius.md, padding: space.md }}>
          <Ionicons name="flash" size={24} color={color.sunDark} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold" numberOfLines={2}>
              {d.sentByMe ? `Ton défi « ${d.title} »` : `${d.friend.name} te défie : « ${d.title} »`}
            </T>
            <T v="small">{d.theyPlayed ? `${d.friend.name} a déjà joué` : "10 questions"}</T>
          </View>
          {canPlay ? <Button small tone="sun" label="Jouer" onPress={() => router.push({ pathname: "/duel/[id]", params: { id: d.id, lid } })} /> : null}
        </View>
      ))}
      {rest.map((d) => (
        <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <T v="body" style={{ width: 28, textAlign: "center" }}>
            {d.result === "won" ? "🏆" : d.result === "draw" ? "🤝" : d.result === "lost" ? "💪" : d.status === "expired" ? "⌛" : "⏳"}
          </T>
          <View style={{ flex: 1 }}>
            <T v="bodyBold" numberOfLines={1}>
              {d.title} · avec {d.friend.name}
            </T>
            <T v="small">
              {d.status === "open"
                ? `Toi : ${d.myScore}/${d.total} · en attente de ${d.friend.name}`
                : d.status === "expired"
                  ? "Terminé sans gagnant"
                  : `Toi : ${d.myScore}/${d.total} · ${d.friend.name} : ${d.theirScore}/${d.total}${d.result === "won" ? " · +20 pièces" : d.result === "draw" ? " · +10 pièces" : ""}`}
            </T>
          </View>
        </View>
      ))}
    </Card>
  );
}
