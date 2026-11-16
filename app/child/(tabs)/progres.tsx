import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../../src/api/client";
import { useHome, useStats } from "../../../src/api/hooks";
import { Button, Card, ErrorBox, Loading, T } from "../../../src/components/ui";
import { WEEKDAYS_LETTER, weekdayOf } from "../../../src/lib/dates";
import { duration } from "../../../src/lib/format";
import { useLid } from "../../../src/lib/lid";
import { PROFILES, type ProfileId } from "../../../src/lib/profile";
import { color, font, GUTTER, learnerColorOf, radius, size, space } from "../../../src/theme/tokens";

/** Darker squares for more minutes, like a garden that grows. */
function heatColor(minutes: number, main: string, soft: string) {
  if (minutes <= 0) return color.line;
  if (minutes < 15) return soft;
  if (minutes < 30) return `${main}88`;
  if (minutes < 60) return `${main}CC`;
  return main;
}

function Tile({ icon, value, label, tint }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string; tint: string }) {
  return (
    <Card style={{ flex: 1, minWidth: "45%", gap: 4, padding: space.md }}>
      <Ionicons name={icon} size={22} color={tint} />
      <T style={{ fontFamily: font.title, fontSize: size.xl, lineHeight: 32, color: color.ink }}>{value}</T>
      <T v="small">{label}</T>
    </Card>
  );
}

export default function ProgressTab() {
  const { lid } = useLid();
  const stats = useStats(lid);
  const home = useHome(lid);

  if (stats.isLoading) return <Loading />;
  if (stats.error || !stats.data) {
    return (
      <SafeAreaView style={{ flex: 1, padding: GUTTER }}>
        <ErrorBox message={errorMessage(stats.error)} onRetry={() => stats.refetch()} />
      </SafeAreaView>
    );
  }
  const s = stats.data;
  const tint = learnerColorOf(home.data?.learner.color ?? "violet");
  const maxWeek = Math.max(30, ...s.week.map((d) => d.minutes));
  // 12 columns (weeks) × 7 rows (days), oldest on the left.
  const first = weekdayOf(s.days[0].day);
  const cells = [...Array(first).fill(null), ...s.days];
  const columns = Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const maxSubject = Math.max(1, ...s.subjects.map((x) => x.minutes));
  const profile = home.data?.learner.studyProfile;
  const p = profile ? PROFILES[profile.profile as ProfileId] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: space.lg, paddingBottom: 40 }}>
        <T v="h2">Mes progrès</T>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          <Tile icon="time" tint={tint.main} value={duration(s.totals.weekMinutes * 60)} label="cette semaine" />
          <Tile icon="flame" tint="#FF7A1A" value={s.totals.streak} label={`jours d'affilée (record ${s.totals.bestStreak})`} />
          <Tile icon="checkmark-done" tint={color.green} value={s.totals.todosDone} label="tâches finies" />
          <Tile icon="bulb" tint={color.sunDark} value={s.totals.notionsMastered} label="notions maîtrisées" />
        </View>

        <Card style={{ gap: space.md }}>
          <T v="h3">Les 7 derniers jours</T>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 140, gap: space.sm }} accessibilityLabel={s.week.map((d) => `${d.minutes} minutes`).join(", ")}>
            {s.week.map((d) => (
              <View key={d.day} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <T v="small" style={{ fontSize: 11 }}>
                  {d.minutes ? d.minutes : ""}
                </T>
                <View style={{ width: "100%", height: Math.max(4, (d.minutes / maxWeek) * 100), borderRadius: 8, backgroundColor: d.minutes ? tint.main : color.line }} />
                <T v="label" style={{ fontSize: 11 }}>
                  {WEEKDAYS_LETTER[weekdayOf(d.day)]}
                </T>
              </View>
            ))}
          </View>
          <T v="small">En minutes de travail (révisions et minuteur).</T>
        </Card>

        <Card style={{ gap: space.md }}>
          <T v="h3">Mes 12 dernières semaines</T>
          <View style={{ flexDirection: "row", gap: 4, justifyContent: "center" }}>
            {columns.map((col, i) => (
              <View key={i} style={{ gap: 4 }}>
                {col.map((c, j) => (
                  <View key={j} style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: c ? heatColor(c.minutes, tint.main, tint.soft) : "transparent" }} />
                ))}
              </View>
            ))}
          </View>
          <T v="small">
            {s.totals.activeDays} jour{s.totals.activeDays > 1 ? "s" : ""} de travail sur 12 semaines. Plus c'est foncé, plus tu as travaillé.
          </T>
        </Card>

        {s.subjects.length ? (
          <Card style={{ gap: space.md }}>
            <T v="h3">Par matière (30 jours)</T>
            {s.subjects.map((x) => (
              <View key={x.subject} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row" }}>
                  <T v="bodyBold" style={{ flex: 1 }} numberOfLines={1}>
                    {x.subject}
                  </T>
                  <T v="small">{duration(x.minutes * 60)}</T>
                </View>
                <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: color.line }}>
                  <View style={{ height: 10, borderRadius: radius.pill, width: `${(x.minutes / maxSubject) * 100}%`, backgroundColor: tint.main }} />
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          <Tile icon="repeat" tint={color.teal} value={s.totals.habitChecks} label="habitudes cochées" />
          <Tile icon="journal" tint={color.sky} value={s.totals.journalDays} label="jours de journal" />
        </View>

        <Card onPress={() => router.push({ pathname: "/profil", params: { lid } })} style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: tint.soft, borderColor: tint.soft }}>
          <T style={{ fontSize: 40 }}>{p?.emoji ?? "🧠"}</T>
          <View style={{ flex: 1 }}>
            <T v="bodyBold">{p ? `Tu es ${p.name.toLowerCase()}` : "Quel élève es-tu ?"}</T>
            <T v="small">{p ? "Revois tes méthodes de travail" : "10 questions pour trouver les méthodes faites pour toi"}</T>
          </View>
          <Ionicons name="chevron-forward" size={24} color={tint.dark} />
        </Card>
        <Button tone="white" icon="journal" label="Mon journal de bord" onPress={() => router.push({ pathname: "/journal", params: { lid } })} />
      </ScrollView>
    </SafeAreaView>
  );
}
