import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../src/api/client";
import { useLearners, useWeekly } from "../../src/api/hooks";
import { Card, ErrorBox, Loading, Page, Segmented, T, TopBar } from "../../src/components/ui";
import { WEEKDAYS_LETTER, addDays, mondayOf } from "../../src/lib/dates";
import { duration, shortDate, todayIso, whenLabel } from "../../src/lib/format";
import { useParentPrefs } from "../../src/state/parentPrefs";
import { color, font, learnerColorOf, radius, size, space } from "../../src/theme/tokens";

/** One number with its label, and how it compares (optional). */
function Figure({ value, label, note }: { value: string; label: string; note?: { text: string; good: boolean } | null }) {
  return (
    <Card style={{ flex: 1, minWidth: "45%", gap: 2, padding: space.md }}>
      <T style={{ fontFamily: font.title, fontSize: size.xl, lineHeight: 32, color: color.ink }}>{value}</T>
      <T v="small">{label}</T>
      {note ? (
        <T v="small" style={{ color: note.good ? color.green : color.sunDark, fontFamily: font.textBold }}>
          {note.text}
        </T>
      ) : null}
    </Card>
  );
}

export default function Bilan() {
  const learners = useLearners();
  const { learnerId, setLearner } = useParentPrefs();
  const selected = learners.data?.find((l) => l.id === learnerId) ?? learners.data?.[0] ?? null;
  const thisMonday = mondayOf(todayIso());
  const [monday, setMonday] = useState(thisMonday);
  const weekly = useWeekly(selected?.id ?? "", monday);
  const tint = learnerColorOf(selected?.color ?? "violet");
  const w = weekly.data;

  const diff = w ? w.minutes - w.minutesBefore : 0;
  const maxDay = Math.max(20, ...(w?.perDay.map((d) => d.minutes) ?? [0]));
  const weekLabel = monday === thisMonday ? "Cette semaine" : monday === addDays(thisMonday, -7) ? "La semaine dernière" : `Semaine du ${shortDate(monday)}`;

  return (
    <Page header={<TopBar title="Bilan de la semaine" />}>
      {learners.data && learners.data.length > 1 && selected ? (
        <Segmented options={learners.data.map((l) => ({ key: l.id, label: l.name }))} value={selected.id} onChange={setLearner} tint={tint.fill} />
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Semaine d'avant" onPress={() => setMonday(addDays(monday, -7))} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={26} color={color.ink} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <T v="h3">{weekLabel}</T>
          <T v="small">
            du {shortDate(monday)} au {shortDate(addDays(monday, 6))}
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Semaine d'après" disabled={monday >= thisMonday} onPress={() => setMonday(addDays(monday, 7))} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: monday >= thisMonday ? 0.3 : 1 }}>
          <Ionicons name="chevron-forward" size={26} color={color.ink} />
        </Pressable>
      </View>

      {weekly.isLoading || learners.isLoading ? <Loading /> : null}
      {weekly.error ? <ErrorBox message={errorMessage(weekly.error)} onRetry={() => weekly.refetch()} /> : null}

      {w ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
            <Figure
              value={duration(w.minutes * 60)}
              label="de travail"
              note={w.minutesBefore || w.minutes ? { text: diff === 0 ? "comme la semaine d'avant" : `${diff > 0 ? "+" : "−"}${duration(Math.abs(diff) * 60)} par rapport à la semaine d'avant`, good: diff >= 0 } : null}
            />
            <Figure value={`${w.activeDays}/7`} label="jours de travail" />
            <Figure value={w.quizAverage === null ? "—" : `${w.quizAverage} %`} label={`de bonnes réponses (${w.quizzes} quiz)`} />
            <Figure value={String(w.mastered)} label={w.mastered > 1 ? "notions maîtrisées" : "notion maîtrisée"} />
          </View>

          <Card style={{ gap: space.md }}>
            <T v="h3">Jour par jour</T>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 120 }}>
              {w.perDay.map((d, i) => (
                <View key={d.day} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  <T v="small" style={{ fontSize: 11 }}>
                    {d.minutes || ""}
                  </T>
                  <View style={{ width: "100%", height: Math.max(4, (d.minutes / maxDay) * 80), borderRadius: 6, backgroundColor: d.minutes ? tint.main : color.line }} />
                  <T v="label" style={{ fontSize: 11 }}>
                    {WEEKDAYS_LETTER[i]}
                  </T>
                </View>
              ))}
            </View>
            <T v="small">En minutes : révisions et minuteur.</T>
          </Card>

          {w.subjects.length ? (
            <Card style={{ gap: space.sm }}>
              <T v="h3">Par matière</T>
              {w.subjects.map((s) => (
                <View key={s.subject} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <T v="body" style={{ flex: 1 }} numberOfLines={1}>
                    {s.subject}
                  </T>
                  <T v="bodyBold">{duration(s.minutes * 60)}</T>
                </View>
              ))}
            </Card>
          ) : null}

          <Card style={{ gap: space.sm }}>
            <T v="h3">Interros à venir</T>
            {w.exams.length ? (
              w.exams.map((e) => (
                <Pressable key={e.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/revision/[id]", params: { id: e.id, lid: selected!.id } })} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 44 }}>
                  <View style={{ flex: 1 }}>
                    <T v="bodyBold" numberOfLines={1}>
                      {e.title}
                    </T>
                    <T v="small">
                      {whenLabel(e.day)} · {e.examBest !== null ? "interro de Cervelle déjà faite" : e.quizBest !== null ? "déjà entraîné en QCM" : "pas encore entraîné"}
                    </T>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={color.muted} />
                </Pressable>
              ))
            ) : (
              <T v="small">Aucune interro dans les deux semaines.</T>
            )}
          </Card>

          <Card style={{ gap: space.sm }}>
            <T v="h3">À revoir en priorité</T>
            {w.toReview.length ? (
              w.toReview.map((n, i) => (
                <View key={`${n.revisionId}-${i}`} style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.sun }} />
                  <T v="body" style={{ flex: 1 }}>
                    {n.title} <T v="small">({n.revision})</T>
                  </T>
                </View>
              ))
            ) : (
              <T v="small">Rien à revoir pour l'instant.</T>
            )}
          </Card>

          {w.badges.length ? (
            <Card style={{ gap: space.sm, backgroundColor: color.sunSoft, borderColor: color.sunSoft }}>
              <T v="h3">Badges gagnés</T>
              {w.badges.map((b) => (
                <View key={b.key} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Ionicons name="ribbon" size={20} color={color.sunDark} />
                  <T v="body">{b.label}</T>
                </View>
              ))}
            </Card>
          ) : null}

          <View style={{ backgroundColor: tint.soft, borderRadius: radius.lg, padding: space.lg }}>
            <T v="body">
              {w.minutes === 0
                ? `${w.name} n'a pas révisé avec Cervelle cette semaine. Un petit quiz ensemble pour relancer ?`
                : diff >= 0
                  ? `Bravo à ${w.name} : la régularité paie. Une interro arrive ? Propose-lui la révision express la veille.`
                  : `${w.name} a moins travaillé que la semaine d'avant. Les notions « à revoir » sont un bon point de départ.`}
            </T>
          </View>
        </>
      ) : null}
    </Page>
  );
}
