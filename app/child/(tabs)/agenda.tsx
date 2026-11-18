import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../../src/api/client";
import { keys, learnerPath, useAgenda, useQueryClient } from "../../../src/api/hooks";
import { BottomSheet } from "../../../src/components/bits";
import { Button, Card, ErrorBox, Loading, T } from "../../../src/components/ui";
import { EVENT_KIND, countByDay, itemsForDay, type AgendaItem } from "../../../src/lib/agenda";
import { WEEKDAYS, WEEKDAYS_SHORT, addDays, dayNumber, weekOf } from "../../../src/lib/dates";
import { longDate, todayIso } from "../../../src/lib/format";
import { useLid } from "../../../src/lib/lid";
import { color, font, GUTTER, radius, size, space } from "../../../src/theme/tokens";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export default function AgendaTab() {
  const { lid, asParent } = useLid();
  const agenda = useAgenda(lid);
  const qc = useQueryClient();
  const today = todayIso();
  const [day, setDay] = useState(today);
  const [syncOpen, setSyncOpen] = useState(false);
  const week = weekOf(day);

  const sync = useMutation({
    mutationFn: (direction: "both" | "to_passerelle" | "from_passerelle") => api.post<{ pushed: number; pulled: number; removed: number }>(`${learnerPath(lid)}/agenda/sync`, { direction }),
    onSuccess: (r) => {
      setSyncOpen(false);
      qc.invalidateQueries({ queryKey: keys.agenda(lid) });
      Alert.alert("C'est à jour", `${r.pushed} ajouté${r.pushed > 1 ? "s" : ""} au planning de la famille, ${r.pulled} reçu${r.pulled > 1 ? "s" : ""} dans Cervelle${r.removed ? `, ${r.removed} retiré${r.removed > 1 ? "s" : ""}` : ""}.`);
    },
  });

  if (agenda.isLoading) return <Loading />;
  const data = agenda.data;
  const items = data ? itemsForDay(data.events, data.exams, day) : [];
  const counts = data ? countByDay(data.events, data.exams, week) : [];
  const [y, m] = day.split("-").map(Number);

  const open = (i: AgendaItem) => {
    if (i.type === "exam") router.push({ pathname: "/revision/[id]", params: { id: i.exam.id, lid } });
    else router.push({ pathname: "/agenda/event", params: { lid, id: i.event.id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: space.lg, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <T v="h2" style={{ flex: 1 }}>
            {MONTHS[m - 1].charAt(0).toUpperCase() + MONTHS[m - 1].slice(1)} {y}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Semaine d'avant" hitSlop={8} onPress={() => setDay(addDays(day, -7))}>
            <Ionicons name="chevron-back-circle" size={34} color={color.ink} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Semaine d'après" hitSlop={8} onPress={() => setDay(addDays(day, 7))}>
            <Ionicons name="chevron-forward-circle" size={34} color={color.ink} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 4 }} accessibilityRole="tablist">
          {week.map((d, i) => {
            const on = d === day;
            return (
              <Pressable
                key={d}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${WEEKDAYS[i]} ${dayNumber(d)}`}
                onPress={() => setDay(d)}
                style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.md, backgroundColor: on ? color.brandFill : d === today ? color.brandSoft : "transparent", gap: 2 }}
              >
                <T v="label" style={{ color: on ? color.white : color.muted, fontSize: 11 }}>
                  {WEEKDAYS_SHORT[i]}
                </T>
                <T style={{ fontFamily: font.title, fontSize: size.lg, lineHeight: 26, color: on ? color.white : color.ink }}>{dayNumber(d)}</T>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: counts[i] ? (on ? color.white : color.brand) : "transparent" }} />
              </Pressable>
            );
          })}
        </View>

        {agenda.error ? <ErrorBox message={errorMessage(agenda.error)} onRetry={() => agenda.refetch()} /> : null}

        <T v="h3">{day === today ? "Aujourd'hui" : longDate(day).replace(/^./, (c) => c.toUpperCase())}</T>
        {items.length === 0 ? (
          <Card style={{ alignItems: "center", gap: space.sm }}>
            <T v="body" style={{ textAlign: "center", color: color.muted }}>
              Rien de prévu ce jour-là.
            </T>
          </Card>
        ) : (
          items.map((i) => {
            const k = EVENT_KIND[i.type === "exam" ? "interro" : i.event.kind];
            return (
              <Pressable key={i.key} accessibilityRole="button" onPress={() => open(i)} style={({ pressed }) => [{ flexDirection: "row", borderRadius: radius.lg, backgroundColor: k.soft, opacity: pressed ? 0.85 : 1, overflow: "hidden" }]}>
                <View style={{ width: 8, backgroundColor: k.main }} />
                <View style={{ flex: 1, padding: space.md, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name={k.icon as keyof typeof Ionicons.glyphMap} size={16} color={k.main} />
                    <T v="small" style={{ color: k.main, fontFamily: font.textBlack }}>
                      {i.start ? `${i.start} – ${i.end}` : "Interro"} · {k.label}
                    </T>
                  </View>
                  <T v="bodyBold">{i.type === "exam" ? i.exam.title : i.event.title}</T>
                  {i.type === "event" && (i.event.room || i.event.source === "passerelle") ? (
                    <T v="small">
                      {[i.event.room ? `Salle ${i.event.room}` : "", i.event.source === "passerelle" ? "Planning familial" : ""].filter(Boolean).join(" · ")}
                    </T>
                  ) : null}
                  {i.type === "exam" ? <T v="small">Touche pour réviser</T> : null}
                </View>
              </Pressable>
            );
          })
        )}

        <Button icon="add" label="Ajouter à mon agenda" onPress={() => router.push({ pathname: "/agenda/event", params: { lid, day } })} />
        <Button tone="white" icon="camera" label="Importer mon emploi du temps" onPress={() => router.push({ pathname: "/agenda/import", params: { lid } })} />
        {asParent ? <Button tone="white" icon="sync" label="Synchroniser avec Passerelle" onPress={() => setSyncOpen(true)} /> : null}
      </ScrollView>

      <BottomSheet open={syncOpen} onClose={() => setSyncOpen(false)} title="Synchroniser avec Passerelle">
        {data?.canSync ? (
          <>
            <T v="body">L'agenda de Cervelle reste séparé. La synchronisation se fait seulement quand tu la demandes, et ne crée jamais de doublon.</T>
            {sync.error ? <ErrorBox message={errorMessage(sync.error)} /> : null}
            <Button icon="swap-vertical" label="Dans les deux sens" loading={sync.isPending} onPress={() => sync.mutate("both")} />
            <Button tone="white" icon="arrow-up" label="Cervelle → planning familial" disabled={sync.isPending} onPress={() => sync.mutate("to_passerelle")} />
            <Button tone="white" icon="arrow-down" label="Planning familial → Cervelle" disabled={sync.isPending} onPress={() => sync.mutate("from_passerelle")} />
          </>
        ) : (
          <>
            <T v="body">Relie d'abord ce profil à un membre de la famille : Mes enfants → le profil → « Membre de la famille dans Passerelle ».</T>
            <Button tone="white" label="Compris" onPress={() => setSyncOpen(false)} />
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
