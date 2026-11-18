import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { keys, learnerPath, useQueryClient, useRefreshLearner, useTodos } from "../src/api/hooks";
import type { Reward, Todo } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { DateField } from "../src/components/DateField";
import { Field } from "../src/components/Field";
import { Check, celebrate } from "../src/components/organize";
import { Button, Card, ErrorBox, Loading, Page, Segmented, T, TopBar } from "../src/components/ui";
import { whenLabel } from "../src/lib/format";
import { useLid } from "../src/lib/lid";
import { color, radius, space } from "../src/theme/tokens";

// The to-do list, sorted like the Eisenhower matrix but in a child's words.
const BOXES = [
  { key: "ui", urgent: true, important: true, title: "À faire tout de suite", hint: "Urgent et important", fg: color.red, bg: color.redSoft, icon: "flame" },
  { key: "i", urgent: false, important: true, title: "À prévoir", hint: "Important, pas urgent", fg: color.violet, bg: color.violetSoft, icon: "calendar" },
  { key: "u", urgent: true, important: false, title: "Vite fait", hint: "Urgent, pas important", fg: color.skyDark, bg: color.skySoft, icon: "flash" },
  { key: "n", urgent: false, important: false, title: "Plus tard", hint: "Ni urgent ni important", fg: color.green, bg: color.greenSoft, icon: "leaf" },
] as const;

export default function Todos() {
  const { lid } = useLid();
  const params = useLocalSearchParams<{ add?: string }>();
  const todos = useTodos(lid);
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const [view, setView] = useState<"matrix" | "list">("matrix");
  const [editing, setEditing] = useState<Todo | "new" | null>(params.add ? "new" : null);
  const [title, setTitle] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(true);
  const [dueDay, setDueDay] = useState<string | null>(null);

  const reload = () => qc.invalidateQueries({ queryKey: keys.todos(lid) });
  const open = (t: Todo | "new", box?: (typeof BOXES)[number]) => {
    setEditing(t);
    setTitle(t === "new" ? "" : t.title);
    setUrgent(t === "new" ? (box?.urgent ?? false) : t.urgent);
    setImportant(t === "new" ? (box?.important ?? true) : t.important);
    setDueDay(t === "new" ? null : t.dueDay);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = { title: title.trim(), urgent, important, dueDay };
      return editing === "new" ? api.post(`${learnerPath(lid)}/todos`, body) : api.patch(`${learnerPath(lid)}/todos/${(editing as Todo).id}`, body);
    },
    onSuccess: () => {
      setEditing(null);
      reload();
      refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${learnerPath(lid)}/todos/${id}`),
    onSuccess: () => {
      setEditing(null);
      reload();
    },
  });
  const tick = useMutation({
    mutationFn: (t: Todo) => api.patch<Reward>(`${learnerPath(lid)}/todos/${t.id}`, { done: !t.done }),
    onSuccess: (r) => {
      reload();
      refresh();
      celebrate(r, "Tâche finie !");
    },
    onError: (e) => Alert.alert("Tâche", errorMessage(e)),
  });

  if (todos.isLoading) return <Loading />;
  const all = todos.data ?? [];
  const open_ = all.filter((t) => !t.done);
  const done = all.filter((t) => t.done);

  const row = (t: Todo) => (
    <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Check on={t.done} label={t.title} onPress={() => tick.mutate(t)} />
      <Pressable accessibilityRole="button" onPress={() => open(t)} style={{ flex: 1 }}>
        <T v="body" numberOfLines={2} style={{ textDecorationLine: t.done ? "line-through" : "none", color: t.done ? color.muted : color.ink }}>
          {t.title}
        </T>
        {t.dueDay || t.createdBy === "parent" ? (
          <T v="small">{[t.dueDay ? `Pour ${whenLabel(t.dueDay)}` : "", t.createdBy === "parent" ? "ajoutée par un parent" : ""].filter(Boolean).join(" · ")}</T>
        ) : null}
      </Pressable>
    </View>
  );

  return (
    <Page header={<TopBar title="Mes tâches" />}>
      {todos.error ? <ErrorBox message={errorMessage(todos.error)} onRetry={() => todos.refetch()} /> : null}
      <Segmented options={[{ key: "matrix", label: "Matrice" }, { key: "list", label: "Liste" }]} value={view} onChange={setView} />
      {view === "matrix" ? (
        <>
          <T v="small">Range chaque tâche dans la bonne case. Commence toujours par la rouge !</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {BOXES.map((b) => {
              const items = open_.filter((t) => t.urgent === b.urgent && t.important === b.important);
              return (
                <View key={b.key} style={{ width: "48.5%", minHeight: 170, borderRadius: radius.lg, backgroundColor: b.bg, padding: space.md, gap: space.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name={b.icon} size={18} color={b.fg} />
                    <T v="bodyBold" style={{ color: b.fg, flex: 1 }} numberOfLines={2}>
                      {b.title}
                    </T>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Ajouter dans ${b.title}`} hitSlop={8} onPress={() => open("new", b)}>
                      <Ionicons name="add-circle" size={26} color={b.fg} />
                    </Pressable>
                  </View>
                  <T v="small" style={{ fontSize: 12 }}>
                    {b.hint}
                  </T>
                  {items.map((t) => (
                    <Pressable key={t.id} accessibilityRole="button" onPress={() => open(t)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: color.card, borderRadius: radius.sm, padding: 8 }}>
                      <Check on={t.done} label={t.title} tint={b.fg} onPress={() => tick.mutate(t)} />
                      <T v="small" numberOfLines={3} style={{ flex: 1, color: color.ink }}>
                        {t.title}
                      </T>
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <Card style={{ gap: space.md }}>{open_.length ? open_.map(row) : <T v="body">Rien à faire. Profite !</T>}</Card>
      )}
      <Button icon="add" label="Ajouter une tâche" onPress={() => open("new")} />
      {done.length ? (
        <>
          <T v="h3">Fini ces derniers jours</T>
          <Card style={{ gap: space.md }}>{done.map(row)}</Card>
        </>
      ) : null}

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Nouvelle tâche" : "Modifier la tâche"}>
        <Field label="Quoi ?" value={title} onChangeText={setTitle} placeholder="DM de SVT, apprendre la poésie…" maxLength={80} autoFocus={editing === "new"} />
        <Segmented options={[{ key: "y", label: "Urgent" }, { key: "n", label: "Pas urgent" }]} value={urgent ? "y" : "n"} onChange={(k) => setUrgent(k === "y")} tint={color.red} />
        <Segmented options={[{ key: "y", label: "Important" }, { key: "n", label: "Pas important" }]} value={important ? "y" : "n"} onChange={(k) => setImportant(k === "y")} tint={color.violet} />
        <DateField label="Pour quand ? (facultatif)" value={dueDay} onChange={setDueDay} />
        {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
        <Button label="Enregistrer" icon="checkmark" disabled={!title.trim()} loading={save.isPending} onPress={() => save.mutate()} />
        {editing && editing !== "new" ? <Button tone="ghost" icon="trash" label="Supprimer" onPress={() => remove.mutate(editing.id)} /> : null}
      </BottomSheet>
    </Page>
  );
}
