import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { errorMessage } from "../../src/api/client";
import { useMindMap } from "../../src/api/hooks";
import type { MindMap } from "../../src/api/types";
import { BottomSheet } from "../../src/components/bits";
import { Cascade } from "../../src/components/motion";
import { SpeakButton } from "../../src/components/VoiceButtons";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { useStopSpeakingOnLeave } from "../../src/lib/voice";
import { color, font, learnerColorOf, radius, space } from "../../src/theme/tokens";

// Carte mentale d'une leçon : la leçon au centre, les grandes idées autour.
// Toucher une branche : ses idées clés, lues à voix haute, et un mini-quiz
// de 3 questions sur ses notions.

const TINTS = ["ciel", "menthe", "corail", "violet", "soleil", "framboise"];
type Branch = MindMap["branches"][number];

function Diagram({ map, width, done, onPick }: { map: MindMap; width: number; done: (b: Branch) => boolean; onPick: (i: number) => void }) {
  const n = map.branches.length;
  const bubble = Math.min(124, width * 0.34);
  const h = Math.min(580, width * 1.6);
  const cx = width / 2;
  const cy = h / 2;
  const rx = (width - bubble) / 2 - 2;
  const ry = h / 2 - 40;
  // Pas de branche juste à gauche ou à droite du centre : elle le toucherait.
  const flat = Array.from({ length: n }, (_, i) => Math.abs(Math.sin((2 * Math.PI * i) / n - Math.PI / 2)) < 0.3).some(Boolean);
  const start = -Math.PI / 2 + (flat ? Math.PI / n : 0);
  const pos = map.branches.map((_, i) => {
    const a = start + (2 * Math.PI * i) / n;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  return (
    <View style={{ width, height: h }}>
      <Svg width={width} height={h} style={{ position: "absolute" }}>
        {pos.map((p, i) => (
          <Path key={i} d={`M ${cx} ${cy} Q ${(cx + p.x) / 2 + (p.y - cy) * 0.15} ${(cy + p.y) / 2 - (p.x - cx) * 0.15} ${p.x} ${p.y}`} stroke={learnerColorOf(TINTS[i % TINTS.length]).main} strokeWidth={5} strokeLinecap="round" fill="none" />
        ))}
      </Svg>
      <View style={{ position: "absolute", left: cx - 58, top: cy - 38, width: 116, minHeight: 76, borderRadius: 38, backgroundColor: color.brandFill, borderBottomWidth: 5, borderColor: color.brandEdge, alignItems: "center", justifyContent: "center", padding: space.sm }}>
        <T style={{ fontFamily: font.title, fontSize: 17, color: color.white, textAlign: "center" }} numberOfLines={3}>
          {map.centre}
        </T>
      </View>
      {map.branches.map((b, i) => {
        const t = learnerColorOf(TINTS[i % TINTS.length]);
        const p = pos[i];
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`${b.title}${done(b) ? ", maîtrisé" : ""}`}
            onPress={() => onPick(i)}
            style={({ pressed }) => ({ position: "absolute", left: p.x - bubble / 2, top: p.y - 34, width: bubble, minHeight: 68, borderRadius: radius.lg, backgroundColor: t.fill, borderBottomWidth: 5, borderColor: t.edge, alignItems: "center", justifyContent: "center", padding: space.sm, opacity: pressed ? 0.85 : 1 })}
          >
            <T style={{ fontFamily: font.textBold, fontSize: 15, color: color.white, textAlign: "center" }} numberOfLines={3}>
              {b.title}
            </T>
            {done(b) ? (
              <View style={{ position: "absolute", top: -8, right: -8, backgroundColor: color.card, borderRadius: 14 }}>
                <Ionicons name="checkmark-circle" size={26} color={color.green} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MindMapScreen() {
  useStopSpeakingOnLeave();
  const { revisionId } = useLocalSearchParams<{ revisionId: string }>();
  const { lid } = useLid();
  const q = useMindMap(lid, revisionId ?? "");
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<number | null>(null);
  const map = q.data?.map;
  const done = (b: Branch) => b.notionIds.length > 0 && b.notionIds.every((id) => q.data?.mastery[id] === "mastered");
  const branch = map && open !== null ? map.branches[open] : null;

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
        <>
          <T v="body">Touche une branche pour voir ses idées et te tester.</T>
          <Diagram map={map} width={Math.min(width - 40, 520)} done={done} onPick={setOpen} />
          {map.branches.map((b, i) => (
            <Cascade key={i} index={i}>
              <Card onPress={() => setOpen(i)} style={{ gap: 4, borderLeftWidth: 6, borderLeftColor: learnerColorOf(TINTS[i % TINTS.length]).main }}>
                <T v="bodyBold">{b.title}</T>
                {b.ideas.map((idea, k) => (
                  <T key={k} read v="body">
                    {"•"} {idea}
                  </T>
                ))}
              </Card>
            </Cascade>
          ))}
        </>
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
