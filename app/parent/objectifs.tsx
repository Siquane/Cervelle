import { de } from "../../src/lib/format";
import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { keys, useGoals, useLearners } from "../../src/api/hooks";
import { Chip } from "../../src/components/Chip";
import { goalTitle, GoalRow } from "../../src/components/GoalCard";
import { Button, Card, ErrorBox, Loading, Page, Segmented, T, TopBar } from "../../src/components/ui";
import { useParentPrefs } from "../../src/state/parentPrefs";
import { color, font, learnerColorOf, radius, size, space } from "../../src/theme/tokens";

// The parent sets up to 3 goals with a real family reward. Reached → shown
// as won to the child, straight away.

const RANGE = { jours: { min: 1, max: 7, start: 5 }, etoiles: { min: 25, max: 500, start: 250, step: 25 } } as const;
const IDEAS = ["Une sortie au cinéma", "30 min d'écran en plus", "Choisir le dessert", "Une soirée jeux", "Inviter un copain"];

export default function Objectifs() {
  const learners = useLearners();
  const { learnerId, setLearner } = useParentPrefs();
  const selected = learners.data?.find((l) => l.id === learnerId) ?? learners.data?.[0] ?? null;
  const lid = selected?.id ?? "";
  const goals = useGoals(lid);
  const qc = useQueryClient();
  const tint = learnerColorOf(selected?.color ?? "violet");

  const [kind, setKind] = useState<"jours" | "etoiles">("jours");
  const [target, setTarget] = useState<number>(RANGE.jours.start);
  const [reward, setReward] = useState("");
  const step = kind === "etoiles" ? RANGE.etoiles.step : 1;

  const refresh = () => qc.invalidateQueries({ queryKey: keys.goals(lid) });
  const add = useMutation({
    mutationFn: () => api.post(`/cervelle/learners/${lid}/goals`, { kind, target, reward: reward.trim() }),
    onSuccess: () => {
      setReward("");
      refresh();
    },
    onError: (e) => Alert.alert("Objectif non enregistré", errorMessage(e)),
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/cervelle/learners/${lid}/goals/${id}`), onSuccess: refresh, onError: (e) => Alert.alert("Objectif non supprimé", errorMessage(e)) });

  const pickKind = (k: "jours" | "etoiles") => {
    setKind(k);
    setTarget(RANGE[k].start);
  };
  const full = (goals.data?.length ?? 0) >= 3;

  return (
    <Page header={<TopBar title={selected ? `Objectifs ${de(selected.name)}` : "Objectifs"} />}>
      {learners.data && learners.data.length > 1 && selected ? (
        <Segmented options={learners.data.map((l) => ({ key: l.id, label: l.name }))} value={selected.id} onChange={setLearner} tint={tint.fill} />
      ) : null}
      <T v="body">Fixe un objectif et une vraie récompense. Dès qu'il est atteint, {selected?.name ?? "ton enfant"} voit la récompense gagnée dans Cervelle.</T>

      {goals.isLoading || learners.isLoading ? <Loading /> : null}
      {goals.error ? <ErrorBox message={errorMessage(goals.error)} onRetry={() => goals.refetch()} /> : null}

      {goals.data?.map((g) => (
        <Card key={g.id} style={{ gap: space.sm, padding: space.sm }}>
          <GoalRow g={g} child={false} />
          <Button small tone="ghost" icon="trash" label="Supprimer" loading={remove.isPending && remove.variables === g.id} onPress={() => remove.mutate(g.id)} />
        </Card>
      ))}

      {full ? (
        <T v="small">3 objectifs au plus. Supprimes-en un pour en ajouter un autre.</T>
      ) : (
        <Card style={{ gap: space.md }}>
          <T v="h3">Nouvel objectif</T>
          <Segmented options={[{ key: "jours", label: "Jours de révision" }, { key: "etoiles", label: "Étoiles du mois" }]} value={kind} onChange={pickKind} tint={tint.fill} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, justifyContent: "center" }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Moins" disabled={target <= RANGE[kind].min} onPress={() => setTarget(Math.max(RANGE[kind].min, target - step))} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: color.line, alignItems: "center", justifyContent: "center", opacity: target <= RANGE[kind].min ? 0.4 : 1 }}>
              <Ionicons name="remove" size={24} color={color.ink} />
            </Pressable>
            <T style={{ fontFamily: font.title, fontSize: size.xxl, minWidth: 64, textAlign: "center", color: color.ink }}>{target}</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Plus" disabled={target >= RANGE[kind].max} onPress={() => setTarget(Math.min(RANGE[kind].max, target + step))} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: color.line, alignItems: "center", justifyContent: "center", opacity: target >= RANGE[kind].max ? 0.4 : 1 }}>
              <Ionicons name="add" size={24} color={color.ink} />
            </Pressable>
          </View>
          <T v="body" style={{ textAlign: "center" }}>
            {goalTitle({ kind, target, label: kind === "jours" ? "chaque semaine" : "chaque mois" })}
          </T>
          <T v="bodyBold">La récompense</T>
          <TextInput
            value={reward}
            onChangeText={(v) => setReward(v.slice(0, 80))}
            placeholder="Ex. une sortie au cinéma"
            placeholderTextColor={color.faint}
            accessibilityLabel="La récompense"
            style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, paddingHorizontal: 16, fontFamily: font.text, fontSize: size.md, color: color.ink }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {IDEAS.map((i) => (
              <Chip key={i} label={i} on={reward === i} onPress={() => setReward(i)} />
            ))}
          </View>
          <Button icon="flag" label="Ajouter l'objectif" disabled={!reward.trim() || !lid} loading={add.isPending} onPress={() => add.mutate()} />
        </Card>
      )}
    </Page>
  );
}
