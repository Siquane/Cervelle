import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { keys, learnerPath, useHabits, useQueryClient, useRefreshLearner } from "../src/api/hooks";
import type { Habit, Reward } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { Field } from "../src/components/Field";
import { DayPicker, celebrate } from "../src/components/organize";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../src/components/ui";
import { WEEKDAYS_LETTER, addDays, weekOf, weekdayOf } from "../src/lib/dates";
import { HABIT_EMOJIS, HABIT_IDEAS, habitRate, habitStreak } from "../src/lib/habits";
import { useLid } from "../src/lib/lid";
import { color, learnerColor, learnerColorOf, radius, size, space } from "../src/theme/tokens";

export default function Habits() {
  const { lid } = useLid();
  const habits = useHabits(lid);
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const [editing, setEditing] = useState<Habit | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📖");
  const [tint, setTint] = useState("ciel");
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);

  const reload = () => {
    qc.invalidateQueries({ queryKey: keys.habits(lid) });
    refresh();
  };
  const open = (h: Habit | "new", idea?: { title: string; emoji: string }) => {
    setEditing(h);
    setTitle(h === "new" ? (idea?.title ?? "") : h.title);
    setEmoji(h === "new" ? (idea?.emoji ?? "⭐") : h.emoji);
    setTint(h === "new" ? "ciel" : h.color);
    setDays(h === "new" ? [0, 1, 2, 3, 4, 5, 6] : h.days);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = { title: title.trim(), emoji, color: tint, days };
      return editing === "new" ? api.post(`${learnerPath(lid)}/habits`, body) : api.patch(`${learnerPath(lid)}/habits/${(editing as Habit).id}`, body);
    },
    onSuccess: () => {
      setEditing(null);
      reload();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${learnerPath(lid)}/habits/${id}`),
    onSuccess: () => {
      setEditing(null);
      reload();
    },
  });
  const tick = useMutation({
    mutationFn: (b: { id: string; day: string; on: boolean }) =>
      b.on ? api.delete<Reward>(`${learnerPath(lid)}/habits/${b.id}/check?day=${b.day}`) : api.post<Reward>(`${learnerPath(lid)}/habits/${b.id}/check`, { day: b.day }),
    onSuccess: (r) => {
      reload();
      celebrate({ coins: r.coins ?? 0, levelUp: r.levelUp });
    },
    onError: (e) => Alert.alert("Habitude", errorMessage(e)),
  });

  if (habits.isLoading || !habits.data) return <Loading />;
  const { today, habits: list } = habits.data;
  const week = weekOf(today);
  const yesterday = addDays(today, -1);
  const doneToday = list.filter((h) => h.days.includes(weekdayOf(today)) && h.checked.includes(today)).length;
  const plannedToday = list.filter((h) => h.days.includes(weekdayOf(today))).length;

  return (
    <Page header={<TopBar title="Mes habitudes" />}>
      {habits.error ? <ErrorBox message={errorMessage(habits.error)} /> : null}
      {plannedToday ? (
        <Card style={{ gap: space.sm, backgroundColor: color.tealSoft, borderColor: color.tealSoft }}>
          <T v="h3">
            Aujourd'hui : {doneToday}/{plannedToday}
          </T>
          <T v="small">Touche un rond pour cocher. Tu peux aussi cocher hier si tu as oublié.</T>
        </Card>
      ) : null}

      {list.map((h) => {
        const c = learnerColorOf(h.color);
        const streak = habitStreak(h.checked, h.days, today);
        return (
          <Card key={h.id} style={{ gap: space.md }}>
            <Pressable accessibilityRole="button" onPress={() => open(h)} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <T style={{ fontSize: 28 }}>{h.emoji}</T>
              <View style={{ flex: 1 }}>
                <T v="bodyBold">{h.title}</T>
                <T v="small">
                  {streak ? `🔥 ${streak} d'affilée · ` : ""}
                  {habitRate(h.checked, h.days, today, 30, h.since)} % {h.since > addDays(today, -29) ? "depuis le début" : "sur 30 jours"}
                </T>
              </View>
            </Pressable>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {week.map((d, i) => {
                const planned = h.days.includes(i);
                const on = h.checked.includes(d);
                // Today, or yesterday if forgotten (what the server accepts).
                const tickable = planned && (d === today || d === yesterday);
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: !tickable }}
                    accessibilityLabel={`${h.title}, ${WEEKDAYS_LETTER[i]}`}
                    disabled={!tickable}
                    onPress={() => tick.mutate({ id: h.id, day: d, on })}
                    style={{ alignItems: "center", gap: 4 }}
                  >
                    <T v="label" style={{ fontSize: 11, color: d === today ? color.ink : color.muted }}>
                      {WEEKDAYS_LETTER[i]}
                    </T>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: on ? c.fill : planned ? color.card : color.bg,
                        borderWidth: 2,
                        borderColor: on ? c.edge : planned ? (tickable ? c.main : color.line) : "transparent",
                      }}
                    >
                      {on ? <T style={{ color: color.white, fontSize: size.md }}>✓</T> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}

      {list.length === 0 ? (
        <>
          <T v="body">Une habitude, c'est un petit geste répété chaque jour. Choisis une idée ou crée la tienne :</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {HABIT_IDEAS.map((i) => (
              <Pressable key={i.title} accessibilityRole="button" onPress={() => open("new", i)} style={{ flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 14, minHeight: 46, borderRadius: radius.pill, borderWidth: 2, borderColor: color.line, backgroundColor: color.card }}>
                <T v="body">{i.emoji}</T>
                <T v="bodyBold">{i.title}</T>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <Button icon="add" label="Nouvelle habitude" onPress={() => open("new")} />

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Nouvelle habitude" : "Modifier l'habitude"}>
        <Field label="Laquelle ?" value={title} onChangeText={setTitle} placeholder="Lire 20 min" maxLength={40} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {HABIT_EMOJIS.map((e) => (
            <Pressable key={e} accessibilityRole="radio" accessibilityState={{ selected: emoji === e }} onPress={() => setEmoji(e)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: emoji === e ? color.brandSoft : color.bg, borderWidth: 2, borderColor: emoji === e ? color.brand : "transparent" }}>
              <T style={{ fontSize: 22 }}>{e}</T>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: space.md }}>
          {Object.entries(learnerColor).map(([k, c]) => (
            <Pressable key={k} accessibilityRole="radio" accessibilityState={{ selected: tint === k }} accessibilityLabel={k} onPress={() => setTint(k)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.main, borderWidth: 3, borderColor: tint === k ? color.ink : "transparent" }} />
          ))}
        </View>
        <T v="bodyBold">Quels jours ?</T>
        <DayPicker value={days} onChange={setDays} />
        {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
        <Button label="Enregistrer" icon="checkmark" disabled={!title.trim() || !days.length} loading={save.isPending} onPress={() => save.mutate()} />
        {editing && editing !== "new" ? <Button tone="ghost" icon="trash" label="Supprimer" onPress={() => remove.mutate(editing.id)} /> : null}
      </BottomSheet>
    </Page>
  );
}
