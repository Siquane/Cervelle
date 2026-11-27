import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../../src/api/client";
import { useBadges, useHome, useStars, useStats } from "../../../src/api/hooks";
import { Medal, tierMetal, windowMetal } from "../../../src/components/Medal";
import { Button, Card, ErrorBox, Loading, ProgressBar, T } from "../../../src/components/ui";
import { WEEKDAYS_LETTER, weekdayOf } from "../../../src/lib/dates";
import { duration } from "../../../src/lib/format";
import { useLid } from "../../../src/lib/lid";
import { PROFILES, type ProfileId } from "../../../src/lib/profile";
import { color, font, GUTTER, learnerColorOf, radius, size, space } from "../../../src/theme/tokens";

/** The latest badges, with the red dots, and a way to the full page. */
function BadgesPreview({ lid }: { lid: string }) {
  const badges = useBadges(lid);
  const b = badges.data;
  if (!b) return null;
  const earned = [
    ...b.windows.filter((w) => w.earned).map((w) => ({ key: w.key, shape: w.shape, icon: w.icon, metal: windowMetal(w), dot: w.isNew })),
    ...b.successes.filter((x) => x.tier > 0).sort((x, y) => Number(y.isNew) - Number(x.isNew) || y.tier - x.tier).map((x) => ({ key: x.id, shape: x.shape, icon: x.icon, metal: tierMetal(x.tier), dot: x.isNew })),
  ];
  const shown = [...earned.filter((e) => e.dot), ...earned.filter((e) => !e.dot)].slice(0, 4);
  return (
    <Card onPress={() => router.push({ pathname: "/badges", params: { lid } })} style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <T v="h3" style={{ flex: 1 }}>
          Mes badges
        </T>
        {b.newCount > 0 ? (
          <View style={{ backgroundColor: color.brandFill, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 }}>
            <T v="small" style={{ color: color.white, fontFamily: font.textBold }}>
              {b.newCount} nouveau{b.newCount > 1 ? "x" : ""}
            </T>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={22} color={color.muted} />
      </View>
      {shown.length ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {shown.map((e) => (
            <Medal key={e.key} shape={e.shape} metal={e.metal} icon={e.icon} size={68} dot={e.dot} />
          ))}
          {Array.from({ length: 4 - shown.length }, (_, i) => (
            <View key={i} style={{ width: 68 }} />
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <Medal shape="star" metal="locked" icon="camera" size={60} />
          <T v="body" style={{ flex: 1 }}>
            Prends une leçon en photo pour gagner ton premier badge.
          </T>
        </View>
      )}
      {b.coinsEarned > 0 ? (
        <T v="bodyBold" style={{ color: color.sunDark }}>
          +{b.coinsEarned} pièces gagnées avec tes badges !
        </T>
      ) : null}
    </Card>
  );
}

/** This month's star path: count, next reward, a way to the full path. */
function StarsPreview({ lid }: { lid: string }) {
  const stars = useStars(lid);
  const p = stars.data;
  if (!p) return null;
  const next = p.steps.find((s) => !s.reached);
  const prev = [...p.steps].reverse().find((s) => s.reached)?.at ?? 0;
  return (
    <Card onPress={() => router.push({ pathname: "/etoiles", params: { lid } })} style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Ionicons name="star" size={22} color="#E0A100" />
        <T v="h3" style={{ flex: 1 }}>
          Chemin d'étoiles
        </T>
        <T v="bodyBold">{p.stars}</T>
        <Ionicons name="chevron-forward" size={22} color={color.muted} />
      </View>
      <ProgressBar value={next ? ((p.stars - prev) / (next.at - prev)) * 100 : 100} tint={color.sun} />
      <T v="small">{next ? `Encore ${next.at - p.stars} étoile${next.at - p.stars > 1 ? "s" : ""} pour le palier ${next.at}` : `Chemin terminé : ${p.theme.itemName} gagné !`}</T>
    </Card>
  );
}

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

        <BadgesPreview lid={lid} />
        <StarsPreview lid={lid} />

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
