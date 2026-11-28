import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../src/api/client";
import { useMindMap } from "../../src/api/hooks";
import type { MindMap } from "../../src/api/types";
import { BottomSheet } from "../../src/components/bits";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Cascade } from "../../src/components/motion";
import { SpeakButton } from "../../src/components/VoiceButtons";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { useStopSpeakingOnLeave } from "../../src/lib/voice";
import { color, font, learnerColorOf, radius, space } from "../../src/theme/tokens";

// Carte mentale d'une leçon, en arbre de haut en bas (lisible sur un
// téléphone en hauteur, de 3 à 6 branches) : Cervelle tient la leçon en haut,
// chaque grande idée est une branche de couleur avec ses mots-clés en
// pastilles. Toucher une branche : ses idées lues à voix haute, et un
// mini-quiz de 3 questions sur ses notions.

const TINTS = ["ciel", "menthe", "corail", "violet", "soleil", "framboise"];
type Branch = MindMap["branches"][number];
const TRUNK = 6;
const TRUNK_X = 22;

function BranchRow({ b, i, last, done, onPress }: { b: Branch; i: number; last: boolean; done: boolean; onPress: () => void }) {
  const t = learnerColorOf(TINTS[i % TINTS.length]);
  return (
    <View style={{ flexDirection: "row" }}>
      {/* Le tronc et le petit rameau vers la branche. */}
      <View style={{ width: TRUNK_X + 18 }}>
        <View style={{ position: "absolute", left: TRUNK_X - TRUNK / 2, top: 0, bottom: last ? undefined : 0, height: last ? 30 : undefined, width: TRUNK, backgroundColor: color.line, borderBottomLeftRadius: last ? TRUNK : 0, borderBottomRightRadius: last ? TRUNK : 0 }} />
        <View style={{ position: "absolute", left: TRUNK_X, top: 24, width: 18, height: TRUNK, borderRadius: TRUNK / 2, backgroundColor: t.main }} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${b.title}${done ? ", maîtrisé" : ""}. ${b.ideas.join(", ")}`}
        accessibilityHint="Écouter et se tester"
        onPress={onPress}
        style={({ pressed }) => ({ flex: 1, gap: space.xs, paddingBottom: space.lg, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: space.xs, minHeight: 54, maxWidth: "100%", paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.lg, backgroundColor: t.fill, borderBottomWidth: 4, borderColor: t.edge }}>
          <T style={{ fontFamily: font.title, fontSize: 19, color: color.white, flexShrink: 1 }}>{b.title}</T>
          {done ? <Ionicons name="checkmark-circle" size={24} color={color.white} /> : <Ionicons name="volume-high" size={20} color={color.white} />}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
          {b.ideas.map((idea, k) => (
            <View key={k} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: t.soft, borderWidth: 2, borderColor: t.main }}>
              <T read style={{ fontFamily: font.textBold, fontSize: 15, color: color.ink }}>
                {idea}
              </T>
            </View>
          ))}
        </View>
      </Pressable>
    </View>
  );
}

export default function MindMapScreen() {
  useStopSpeakingOnLeave();
  const { revisionId } = useLocalSearchParams<{ revisionId: string }>();
  const { lid } = useLid();
  const q = useMindMap(lid, revisionId ?? "");
  const [open, setOpen] = useState<number | null>(null);
  const map = q.data?.map;
  const done = (b: Branch) => b.notionIds.length > 0 && b.notionIds.every((id) => q.data?.mastery[id] === "mastered");
  const branch = map && open !== null ? map.branches[open] : null;
  const mastered = map ? map.branches.filter(done).length : 0;

  return (
    <Page header={<TopBar title="Carte mentale" />}>
      {q.isLoading ? (
        <Card style={{ alignItems: "center", gap: space.md }}>
          <Loading />
          <T v="body" style={{ textAlign: "center" }}>
            Je dessine la carte de ta leçon… Ça prend environ 20 secondes, la première fois seulement.
          </T>
        </Card>
      ) : null}
      {q.error ? <ErrorBox message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
      {map ? (
        <View>
          {/* Cervelle tient la leçon, en haut de l'arbre. */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Mascot size={92} mood="happy" accessories={mastered === map.branches.length ? ["couronne_or"] : []} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ alignSelf: "flex-start", maxWidth: "100%", paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.lg, backgroundColor: color.brandFill, borderBottomWidth: 4, borderColor: color.brandEdge }}>
                <T style={{ fontFamily: font.title, fontSize: 21, color: color.white }}>{map.centre}</T>
              </View>
              <T v="small">
                {mastered ? `${mastered} branche${mastered > 1 ? "s" : ""} sur ${map.branches.length} maîtrisée${mastered > 1 ? "s" : ""}. ` : ""}Touche une branche pour l'écouter et te tester.
              </T>
            </View>
          </View>
          <View style={{ height: space.sm, marginLeft: TRUNK_X - TRUNK / 2, width: TRUNK, backgroundColor: color.line }} />
          {map.branches.map((b, i) => (
            <Cascade key={i} index={i}>
              <BranchRow b={b} i={i} last={i === map.branches.length - 1} done={done(b)} onPress={() => setOpen(i)} />
            </Cascade>
          ))}
        </View>
      ) : null}

      <BottomSheet open={!!branch} onClose={() => setOpen(null)} title={branch?.title ?? ""}>
        {branch ? (
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
              <View style={{ flex: 1, gap: space.xs }}>
                {branch.ideas.map((idea, k) => (
                  <T key={k} read v="body">
                    {"•"} {idea}
                  </T>
                ))}
              </View>
              <SpeakButton id={`map-${open}`} text={`${branch.title}. ${branch.ideas.join(". ")}`} />
            </View>
            {done(branch) ? (
              <T v="bodyBold" style={{ color: color.green }}>
                Tu as maîtrisé cette branche. Bravo pour ton travail !
              </T>
            ) : null}
            {branch.notionIds.length ? (
              <Button
                icon="help-circle"
                label="Mini-quiz · 3 questions"
                onPress={() => {
                  setOpen(null);
                  router.push({ pathname: "/quiz", params: { lid, revisionId, mode: "qcm", notionIds: branch.notionIds.join(",") } });
                }}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </Page>
  );
}
