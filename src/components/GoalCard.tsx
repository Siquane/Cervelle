import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Goal } from "../api/types";
import { color, font, radius, space } from "../theme/tokens";
import { ProgressBar, T } from "./ui";

/** « 5 jours de révision cette semaine » / « 30 étoiles ce mois-ci ». */
export const goalTitle = (g: Pick<Goal, "kind" | "target" | "label">) =>
  g.kind === "jours" ? `${g.target} jour${g.target > 1 ? "s" : ""} de révision ${g.label}` : `${g.target} étoiles ${g.label}`;

/** One goal: what to do, how far along, and the family reward. */
export function GoalRow({ g, child }: { g: Goal; child: boolean }) {
  return (
    <View style={{ gap: 6, padding: space.md, borderRadius: radius.md, backgroundColor: g.reached ? color.greenSoft : color.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Ionicons name={g.reached ? "trophy" : g.kind === "jours" ? "calendar" : "star"} size={20} color={g.reached ? color.green : g.kind === "jours" ? color.sky : color.sunDark} />
        <T v="bodyBold" style={{ flex: 1 }}>
          {goalTitle(g)}
        </T>
        <T v="bodyBold" style={{ fontVariant: ["tabular-nums"] }}>
          {g.current}/{g.target}
        </T>
      </View>
      <ProgressBar value={(g.current / g.target) * 100} tint={g.reached ? color.green : color.sun} height={8} />
      <T v="small" style={g.reached ? { color: color.green, fontFamily: font.textBold } : undefined}>
        {g.reached ? (child ? `Bravo ! Tu as gagné : ${g.reward} 🎉` : `Objectif atteint : ${g.reward} est gagné !`) : `🎁 ${g.reward}`}
        {g.wins > (g.reached ? 1 : 0) ? ` · déjà gagné ${g.wins - (g.reached ? 1 : 0)} fois avant` : ""}
      </T>
    </View>
  );
}
