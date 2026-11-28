import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useMental } from "../../src/api/hooks";
import type { MentalState } from "../../src/api/types";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, font, radius, size, space } from "../../src/theme/tokens";

// Calcul mental, côté parent : le niveau (il monte tout seul, mais on peut le
// changer) et les tables à travailler en priorité.

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{ minWidth: 52, minHeight: 44, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: on ? color.brandFill : color.chip }}
    >
      <T style={{ fontFamily: font.textBold, fontSize: size.sm, color: on ? color.white : color.ink }}>{label}</T>
    </Pressable>
  );
}

export default function ParentMental() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const q = useMental(lid);
  const [level, setLevel] = useState<number | null>(null);
  const [tables, setTables] = useState<number[]>([]);

  useEffect(() => {
    if (q.data) {
      setLevel(q.data.level);
      setTables(q.data.tables);
    }
  }, [q.data?.level, q.data?.tables.join(",")]);

  const save = useMutation({
    mutationFn: (body: { level?: number | null; tables: number[] }) => api.put<MentalState>(`${learnerPath(lid)}/mental`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mental", lid] });
      router.back();
    },
  });

  if (q.isLoading) return <Loading />;
  if (!q.data) {
    return (
      <Page header={<TopBar title="Calcul mental" />}>
        <ErrorBox message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      </Page>
    );
  }
  const s = q.data;

  return (
    <Page header={<TopBar title="Calcul mental" />}>
      <T v="body">Le niveau monte tout seul après 3 séries réussies de suite. Tu peux aussi le choisir.</T>
      <Card style={{ gap: space.sm }}>
        <T v="h3">Niveau</T>
        {s.levels.map((l) => (
          <Pressable
            key={l.level}
            accessibilityRole="radio"
            accessibilityState={{ checked: level === l.level }}
            onPress={() => setLevel(l.level)}
            style={{ flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.sm, borderRadius: radius.md, borderWidth: 2, borderColor: level === l.level ? color.brand : color.line, backgroundColor: level === l.level ? color.brandSoft : color.card }}
          >
            <T style={{ fontFamily: font.title, fontSize: 18, width: 28, color: color.brand }}>{l.level}</T>
            <T v="body" style={{ flex: 1 }}>
              {l.label}
            </T>
          </Pressable>
        ))}
        <Button small tone="ghost" label="Revenir au niveau de sa classe" onPress={() => save.mutate({ level: null, tables })} />
      </Card>
      <Card style={{ gap: space.sm }}>
        <T v="h3">Tables à travailler</T>
        <T v="small">La moitié des calculs porte sur ces tables. Rien de coché : les calculs du niveau.</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
          {Array.from({ length: 11 }, (_, i) => i + 2).map((t) => (
            <Chip key={t} on={tables.includes(t)} label={`× ${t}`} onPress={() => setTables(tables.includes(t) ? tables.filter((x) => x !== t) : [...tables, t])} />
          ))}
        </View>
      </Card>
      {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
      <Button icon="checkmark" label="Enregistrer" loading={save.isPending} onPress={() => save.mutate({ level: level ?? undefined, tables })} />
    </Page>
  );
}
