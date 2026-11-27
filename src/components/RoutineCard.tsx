import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../api/client";
import { learnerPath, useQueryClient, useRefreshLearner } from "../api/hooks";
import { Card, T } from "./ui";
import { color, radius, space } from "../theme/tokens";

// Ma routine du matin (avant 14 h) ou du soir : les étapes réglées par un
// parent dans Passerelle, à cocher. Finie : 1 étoile pour le chemin d'étoiles.

type Kind = "matin" | "soir";
type Routines = { today: string; stars: number; routines: { kind: Kind; steps: { id: string; emoji: string; label: string }[]; checked: string[]; done: boolean; rewarded: boolean }[] };

export function RoutineCard({ lid }: { lid: string }) {
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const key = ["routines", lid];
  const q = useQuery({ queryKey: key, enabled: !!lid, queryFn: () => api.get<Routines>(`${learnerPath(lid)}/routines`) });
  const kind: Kind = new Date().getHours() < 14 ? "matin" : "soir";
  const tick = useMutation({
    mutationFn: (p: { stepId: string; on: boolean }) => api.post<Routines & { earned: number }>(`${learnerPath(lid)}/routines/${kind}/check`, p),
    onMutate: (p) => {
      // Coché tout de suite, sans attendre le réseau.
      const prev = qc.getQueryData<Routines>(key);
      if (prev) {
        qc.setQueryData<Routines>(key, {
          ...prev,
          routines: prev.routines.map((r) => (r.kind === kind ? { ...r, checked: p.on ? [...r.checked, p.stepId] : r.checked.filter((id) => id !== p.stepId) } : r)),
        });
      }
      return { prev };
    },
    onSuccess: (r) => {
      qc.setQueryData(key, r);
      if (r.earned) {
        refresh();
        Alert.alert(kind === "matin" ? "Routine du matin finie ! ☀️" : "Routine du soir finie ! 🌙", `+${r.earned} étoile pour ton chemin d'étoiles. Bravo !`);
      }
    },
    onError: (e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      Alert.alert("Oups, ce n'est pas enregistré", errorMessage(e));
    },
  });
  const r = q.data?.routines.find((x) => x.kind === kind);
  if (!r || r.steps.length === 0) return null;
  const left = r.steps.length - r.checked.length;
  return (
    <Card style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <T v="h3" style={{ flex: 1 }}>
          {kind === "matin" ? "☀️ Ma routine du matin" : "🌙 Ma routine du soir"}
        </T>
        <T v="bodyBold" style={{ color: r.checked.length === r.steps.length ? color.green : color.brand }}>
          {r.checked.length}/{r.steps.length}
        </T>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {r.steps.map((s) => {
          const on = r.checked.includes(s.id);
          return (
            <Pressable
              key={s.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={s.label}
              onPress={() => tick.mutate({ stepId: s.id, on: !on })}
              style={{ width: "30%", flexGrow: 1, alignItems: "center", gap: 4, paddingVertical: space.sm, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 2, borderColor: on ? color.green : color.line, backgroundColor: on ? color.greenSoft : color.card }}
            >
              <T style={{ fontSize: 28 }}>{s.emoji}</T>
              <T v="small" numberOfLines={2} style={{ textAlign: "center", color: on ? color.green : color.ink }}>
                {s.label}
              </T>
              {on ? <Ionicons name="checkmark-circle" size={18} color={color.green} style={{ position: "absolute", top: 4, right: 4 }} /> : null}
            </Pressable>
          );
        })}
      </View>
      <T v="small">{left > 0 ? `Encore ${left} étape${left > 1 ? "s" : ""} : ${r.rewarded ? "tu as déjà ton étoile aujourd'hui." : `+${q.data!.stars} étoile à la fin !`}` : "Routine finie, bravo !"}</T>
    </Card>
  );
}
