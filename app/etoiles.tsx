import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../src/api/client";
import { useStars } from "../src/api/hooks";
import type { StarPath } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { Coin } from "../src/components/Coin";
import { Mascot } from "../src/components/mascot/Mascot";
import { Button, ErrorBox, Loading, T } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { font, GUTTER, radius, size, space } from "../src/theme/tokens";

// « Chemin d'étoiles »: a month's path, from the bottom (start) to the top
// (50 stars). The scene is always night-coloured, in both themes, so its
// colours are set here (white text on dark grounds, ink text on the cards).

const SCENES: Record<StarPath["theme"]["id"], { bg: string; deco: string[] }> = {
  espace: { bg: "#17123F", deco: ["#6D3FD9", "#3D8BFD", "#FF8A6B"] },
  ocean: { bg: "#0B2E55", deco: ["#2C9BE0", "#2ED3C0", "#FFC94D"] },
  jungle: { bg: "#0F3324", deco: ["#22A85A", "#8FE3A8", "#FFC94D"] },
  nuit: { bg: "#141433", deco: ["#A98BFF", "#5AA2FF", "#FFC94D"] },
};
const INK = "#1F1A3D";
const CARD = "#E8ECFF";
const DONE = "#FFC94D";
const RAIL = "#7C86D9";
const ROW = 118;

function RewardArt({ step, item }: { step: StarPath["steps"][number]; item: string }) {
  if (step.reward.type === "item" || step.result?.item) {
    return <Mascot size={70} accessories={[step.result?.item ?? item]} />;
  }
  if (step.reward.type === "coins" || (step.result && step.result.coins)) {
    return (
      <View style={{ alignItems: "center", gap: 4 }}>
        <Coin size={40} />
        <T style={{ fontFamily: font.title, fontSize: size.md, color: INK }}>+{step.result?.coins ?? (step.reward.type === "coins" ? step.reward.coins : 0)}</T>
      </View>
    );
  }
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Ionicons name="gift" size={44} color="#C24F82" />
      <T style={{ fontFamily: font.textBold, fontSize: 12, color: INK }}>Surprise</T>
    </View>
  );
}

export default function StarsScreen() {
  const { lid } = useLid();
  const stars = useStars(lid);
  const [info, setInfo] = useState(false);
  const [fresh, setFresh] = useState<StarPath["fresh"]>([]);
  const p = stars.data;

  useEffect(() => {
    if (p?.fresh.length) setFresh(p.fresh);
  }, [p]);

  const scene = SCENES[p?.theme.id ?? "espace"];
  const steps = p ? [...p.steps].reverse() : [];
  const next = p?.steps.find((s) => !s.reached);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: scene.bg }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: GUTTER, paddingVertical: space.sm, gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T style={{ flex: 1, textAlign: "center", fontFamily: font.title, fontSize: size.lg, color: "#FFFFFF" }} numberOfLines={1}>
          {p?.theme.label ?? "Chemin d'étoiles"}
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Comment gagner des étoiles" hitSlop={12} onPress={() => setInfo(true)} style={{ width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" }}>
          <Ionicons name="information-circle" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {stars.isLoading ? <Loading /> : null}
      {stars.error ? (
        <View style={{ padding: GUTTER }}>
          <ErrorBox message={errorMessage(stars.error)} onRetry={() => stars.refetch()} />
        </View>
      ) : null}

      {p ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 60 }}>
          <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.lg, padding: space.md, gap: 4, marginBottom: space.lg }}>
            <T style={{ fontFamily: font.title, fontSize: size.xl, color: "#FFFFFF" }}>⭐ {p.stars} étoile{p.stars > 1 ? "s" : ""} ce mois-ci</T>
            <T style={{ color: "#DDE3FF", fontSize: size.sm }}>
              {next ? `Encore ${next.at - p.stars} pour le palier ${next.at}.` : `Chemin terminé ! Ton cadeau : ${p.theme.itemName}.`} Le chemin repart de zéro le 1er du mois.
            </T>
          </View>

          {steps.map((s, i) => {
            // The bubble with the current count sits just above the first step reached.
            const bubble = s.reached && (i === 0 || !steps[i - 1].reached);
            return (
              <View key={s.at}>
                {bubble ? (
                  <View style={{ flexDirection: "row", alignItems: "center", height: 44 }}>
                    <View style={{ width: 60, alignItems: "center" }}>
                      <View style={{ position: "absolute", top: 0, bottom: 0, width: 14, backgroundColor: DONE }} />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Ionicons name="star" size={18} color="#E0A100" />
                      <T style={{ fontFamily: font.title, fontSize: size.md, color: INK }}>{p.stars}</T>
                    </View>
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "center", height: ROW }}>
                  <View style={{ width: 60, alignItems: "center", alignSelf: "stretch" }}>
                    <View style={{ position: "absolute", top: 0, bottom: 0, width: 14, backgroundColor: s.reached ? DONE : RAIL }} />
                    <View style={{ position: "absolute", top: ROW / 2 - 2, width: 22, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF" }} />
                  </View>
                  <View accessible accessibilityLabel={`${s.at} étoiles${s.reached ? ", atteint" : ""}`} style={{ flex: 1, flexDirection: "row", alignItems: "center", height: ROW - 18, borderRadius: radius.lg, backgroundColor: s.reached ? DONE : CARD, paddingLeft: space.lg, paddingRight: space.sm, gap: space.md }}>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.title, fontSize: size.xl, lineHeight: 30, color: INK }}>{s.at}</T>
                      <T style={{ fontFamily: font.textBold, fontSize: size.sm, color: INK }}>étoiles</T>
                    </View>
                    <View style={{ width: 96, height: 84, borderRadius: radius.md, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                      <RewardArt step={s} item={p.theme.item} />
                      {s.result ? (
                        <View style={{ position: "absolute", top: -6, right: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: "#027C3E", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" }}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.md }}>
            <View style={{ width: 60, alignItems: "center" }}>
              <Ionicons name="flag" size={28} color={DONE} />
            </View>
            <T style={{ color: "#FFFFFF", fontFamily: font.textBold }}>Départ</T>
          </View>
        </ScrollView>
      ) : null}

      <BottomSheet open={info} onClose={() => setInfo(false)} title="Gagner des étoiles">
        {p ? (
          <View style={{ gap: space.sm }}>
            <T v="body">⭐ {p.rules.quiz} par quiz fini, +{p.rules.goodQuiz} si tu as 80 % ou plus</T>
            <T v="body">⭐ {p.rules.interro} par interro de Cervelle</T>
            <T v="body">⭐ {p.rules.day} par jour de révision, +{p.rules.week} pour 7 jours d'affilée</T>
            <T v="body">⭐ {p.rules.chest} quand tu ouvres le coffre des missions</T>
            <T v="body">⭐ {p.rules.win} par défi gagné, {p.rules.badge} par badge</T>
            <T v="small">
              Ce mois-ci : révisions {p.breakdown.revision}, régularité {p.breakdown.regularite}, missions {p.breakdown.missions}, défis et badges {p.breakdown.defis}.
            </T>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet open={fresh.length > 0} onClose={() => setFresh([])} title="Nouveaux paliers !">
        {fresh.map((f) => (
          <View key={f.at} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            {f.item ? <Mascot size={56} accessories={[f.item]} /> : <Coin size={36} />}
            <T v="bodyBold" style={{ flex: 1 }}>
              Palier {f.at} : {f.item ? `${f.itemName}, à mettre dans la boutique !` : `+${f.coins} pièces`}
            </T>
          </View>
        ))}
        <Button label="Super !" onPress={() => setFresh([])} />
      </BottomSheet>
    </SafeAreaView>
  );
}
