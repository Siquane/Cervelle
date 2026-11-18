import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../src/api/client";
import { keys, useFriendRequests, useLearners, useOverview, useQueryClient } from "../../src/api/hooks";
import { LEVEL_LABEL } from "../../src/lib/format";
import { errorMessage } from "../../src/api/client";
import { MasteryTag } from "../../src/components/bits";
import { BottomSheet } from "../../src/components/bits";
import { Mascot } from "../../src/components/mascot/Mascot";
import { RevisionRow } from "../../src/components/RevisionRow";
import { Button, Card, ErrorBox, Loading, Page, Segmented, T } from "../../src/components/ui";
import { duration, longDate, MODE_LABEL, shortDate, whenLabel } from "../../src/lib/format";
import { useParentPrefs } from "../../src/state/parentPrefs";
import { useSession } from "../../src/state/session";
import { color, font, learnerColorOf, space } from "../../src/theme/tokens";

export default function ParentHome() {
  const learners = useLearners();
  const { learnerId, setLearner } = useParentPrefs();
  const selected = learners.data?.find((l) => l.id === learnerId) ?? learners.data?.[0] ?? null;
  const overview = useOverview(selected?.id ?? null);
  const [range, setRange] = useState<"total" | "30">("30");
  const [menu, setMenu] = useState(false);
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);

  useEffect(() => {
    if (selected && selected.id !== learnerId) setLearner(selected.id);
  }, [selected, learnerId, setLearner]);

  const requests = useFriendRequests();
  const qc = useQueryClient();
  const decide = useMutation({
    mutationFn: (b: { id: string; yes: boolean }) => (b.yes ? api.post(`/cervelle/friend-requests/${b.id}/approve`) : api.delete(`/cervelle/friend-requests/${b.id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.friendRequests }),
  });

  const tint = learnerColorOf(selected?.color ?? "violet");
  const o = overview.data;

  return (
    <Page>
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: space.lg }}>
        <T v="title" style={{ flex: 1 }}>
          Espace parent
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Menu" onPress={() => setMenu(true)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: color.brandFill, alignItems: "center", justifyContent: "center" }}>
          <T v="h3" style={{ color: color.white }}>
            {(session?.kind === "parent" ? session.name : "")?.slice(0, 1).toUpperCase() || "P"}
          </T>
        </Pressable>
      </View>

      {requests.data?.length ? (
        <Card style={{ gap: space.md, backgroundColor: color.sunSoft, borderColor: color.sun }}>
          <T v="h3">Demandes d'amis</T>
          <T v="small">Les amis voient seulement le prénom, la mascotte, le niveau et les minutes de travail de la semaine. Pas de messages libres.</T>
          {requests.data.map((r) => (
            <View key={r.id} style={{ gap: space.sm }}>
              <T v="body">
                {(() => {
                  const other = `${r.other.name} (${[LEVEL_LABEL[r.other.level] ?? r.other.level, r.other.grade].filter(Boolean).join(", ")})`;
                  const ask = r.outgoing ? `${r.child.name} veut devenir ami avec ${other}.` : `${other} veut devenir ami avec ${r.child.name}.`;
                  return `${ask} ${r.otherApproved ? "L'autre famille a déjà dit oui." : "L'autre famille doit aussi dire oui."}`;
                })()}
              </T>
              <View style={{ flexDirection: "row", gap: space.md }}>
                <Button small tone="teal" icon="checkmark" label="Accepter" disabled={decide.isPending} onPress={() => decide.mutate({ id: r.id, yes: true })} style={{ flex: 1 }} />
                <Button small tone="white" label="Refuser" disabled={decide.isPending} onPress={() => decide.mutate({ id: r.id, yes: false })} style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {learners.isLoading ? <Loading /> : null}
      {learners.error ? <ErrorBox message={errorMessage(learners.error)} onRetry={() => learners.refetch()} /> : null}

      {learners.data && learners.data.length === 0 ? (
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xxl }}>
          <Mascot size={130} />
          <T v="h3" style={{ textAlign: "center" }}>
            Ajoute ton premier enfant
          </T>
          <T v="body" style={{ textAlign: "center", color: color.muted }}>
            Un profil par enfant, avec sa classe : Cervelle adapte les fiches et les questions à son niveau.
          </T>
          <Button label="Ajouter un enfant" icon="person-add" onPress={() => router.push("/parent/learner")} />
        </Card>
      ) : null}

      {selected ? (
        <>
          {learners.data!.length > 1 ? (
            <Segmented options={learners.data!.map((l) => ({ key: l.id, label: l.name }))} value={selected.id} onChange={setLearner} tint={tint.fill} />
          ) : null}

          <Button label="Ajouter une révision" icon="camera" onPress={() => router.push({ pathname: "/revision/new", params: { lid: selected.id } })} style={{ minHeight: 72 }} />

          {overview.isLoading ? <Loading /> : null}
          {overview.error ? <ErrorBox message={errorMessage(overview.error)} onRetry={() => overview.refetch()} /> : null}

          {o ? (
            <>
              <T v="h2">Utilisation</T>
              <Segmented options={[{ key: "total", label: "Total" }, { key: "30", label: "30 derniers jours" }]} value={range} onChange={setRange} tint={tint.fill} />
              <Card style={{ alignItems: "center", gap: 4, paddingVertical: space.xl }}>
                <T v="small">Temps passé à réviser</T>
                <T style={{ fontFamily: font.title, fontSize: 48, lineHeight: 58, color: color.ink }}>{duration(range === "30" ? o.time.last30Seconds : o.time.totalSeconds)}</T>
                {range === "30" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name={o.time.changePercent >= 0 ? "arrow-up" : "arrow-down"} size={18} color={o.time.changePercent >= 0 ? color.green : color.red} />
                    <T v="bodyBold" style={{ color: o.time.changePercent >= 0 ? color.green : color.red }}>
                      {Math.abs(o.time.changePercent)} % par rapport aux 30 jours d'avant
                    </T>
                  </View>
                ) : (
                  <T v="small">{o.time.sessionsTotal} séances en tout</T>
                )}
              </Card>
              <T v="small" style={{ textAlign: "center" }}>
                {o.lastActiveAt ? `Dernière révision : ${longDate(o.lastActiveAt)}` : `${selected.name} n'a pas encore révisé.`}
                {o.learner.streak > 1 ? ` · ${o.learner.streak} jours d'affilée` : ""}
              </T>

              <T v="h2">Ses connaissances</T>
              <Card style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {(["mastered", "review", "new"] as const).map((k) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MasteryTag value={k} />
                    <T v="bodyBold" style={{ fontVariant: ["tabular-nums"] }}>
                      {o.notions[k]}
                    </T>
                  </View>
                ))}
              </Card>

              <T v="h2">Les prochaines interros</T>
              {o.upcoming.length === 0 ? (
                <T v="body" style={{ color: color.muted }}>
                  Aucune date prévue. Ajoute la date de l'interro dans une révision pour la voir ici.
                </T>
              ) : (
                o.upcoming.map((r) => (
                  <Card key={r.id} onPress={() => router.push({ pathname: "/revision/[id]", params: { id: r.id, lid: selected.id } })} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <View style={{ width: 56, alignItems: "center" }}>
                      <T v="h3" style={{ color: tint.dark }}>
                        {shortDate(r.examDate!)}
                      </T>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="bodyBold" numberOfLines={1}>
                        {r.title}
                      </T>
                      <T v="small">
                        {whenLabel(r.examDate!)} · prêt à {r.progress} %
                      </T>
                    </View>
                  </Card>
                ))
              )}

              <T v="h2">Révisions</T>
              {o.revisions.length === 0 ? (
                <T v="body" style={{ color: color.muted }}>
                  Pas encore de révision. Prends une leçon en photo avec le bouton en haut.
                </T>
              ) : (
                o.revisions.map((r) => <RevisionRow key={r.id} r={r} lid={selected.id} />)
              )}

              {o.recentSessions.length ? (
                <>
                  <T v="h2">Dernières séances</T>
                  <Card style={{ gap: space.md }}>
                    {o.recentSessions.map((s) => (
                      <View key={s.id} style={{ flexDirection: "row", gap: space.sm }}>
                        <T v="small" style={{ width: 64 }}>
                          {shortDate(s.createdAt)}
                        </T>
                        <T v="body" style={{ flex: 1 }} numberOfLines={1}>
                          {MODE_LABEL[s.mode] ?? s.mode}
                          {s.revisionTitle ? ` · ${s.revisionTitle}` : ""}
                        </T>
                        <T v="bodyBold" style={{ fontVariant: ["tabular-nums"] }}>
                          {s.total ? `${s.correct}/${s.total}` : duration(s.seconds)}
                        </T>
                      </View>
                    ))}
                  </Card>
                </>
              ) : null}

              <View style={{ gap: space.md }}>
                <Button tone="white" icon="school" label={`Programme de ${selected.grade || "l'année"}`} onPress={() => router.push({ pathname: "/programme", params: { lid: selected.id } })} />
                <Button tone="white" icon="document-text" label="Interros corrigées" onPress={() => router.push({ pathname: "/exam", params: { lid: selected.id } })} />
                <Button tone="white" icon="calendar" label={`Agenda de ${selected.name}`} onPress={() => router.push({ pathname: "/child/agenda", params: { lid: selected.id } })} />
                <Button tone="white" icon="checkbox" label="Tâches" onPress={() => router.push({ pathname: "/todos", params: { lid: selected.id } })} />
                <Button tone="white" icon="repeat" label="Habitudes" onPress={() => router.push({ pathname: "/habits", params: { lid: selected.id } })} />
                <Button tone="white" icon="journal" label="Journal de bord" onPress={() => router.push({ pathname: "/journal", params: { lid: selected.id } })} />
                <Button tone="white" icon="game-controller" label={`Ouvrir l'espace de ${selected.name}`} onPress={() => router.push({ pathname: "/child", params: { lid: selected.id } })} />
              </View>
            </>
          ) : null}
        </>
      ) : null}

      <BottomSheet open={menu} onClose={() => setMenu(false)} title={session?.kind === "parent" && session.name ? session.name : "Menu"}>
        <Button tone="white" icon="people" label="Mes enfants" onPress={() => { setMenu(false); router.push("/parent/learners"); }} />
        <Button tone="white" icon="settings" label="Réglages" onPress={() => { setMenu(false); router.push("/reglages"); }} />
        <Button tone="white" icon="log-out" label="Se déconnecter" onPress={async () => { setMenu(false); await signOut(); router.replace("/auth"); }} />
      </BottomSheet>
    </Page>
  );
}
