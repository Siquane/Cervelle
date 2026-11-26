import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { errorMessage } from "../src/api/client";
import { useIslands, useRefreshLearner } from "../src/api/hooks";
import type { Island, TreasureMap } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { Coin } from "../src/components/Coin";
import { Mascot } from "../src/components/mascot/Mascot";
import { Button, ErrorBox, Loading, T } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { font, GUTTER, radius, size, space } from "../src/theme/tokens";

// Carte au trésor : une île par matière, couverte de brouillard. Chaque
// notion « Maîtrisé » dévoile un lieu (12 par île) ; une île explorée ouvre
// son coffre. La mer est la même dans les deux thèmes : couleurs fixées ici
// (texte blanc sur la mer, encre sur les cartes claires).

const SEA = "#0B4A6F";
const SOFT = "#D7ECF7";
const INK = "#1F1A3D";
const GOLD = "#FFC94D";

/** Les matières de chaque île, en mots d'enfant (serveur : src/lib/cervelle/islands.ts, même tri). */
const SUBJECTS: Record<Island["id"], string> = {
  maths: "les maths (calcul, géométrie…)",
  francais: "le français (lecture, grammaire, orthographe…)",
  histoire: "l'histoire, la géographie ou l'EMC",
  sciences: "les sciences (SVT, physique-chimie, technologie…)",
  langues: "les langues (anglais, espagnol, allemand…)",
  talents: "la musique, les arts ou le sport",
  mystere: "une autre matière, qui ne va sur aucune île",
};

const LOOK: Record<Island["id"], { emoji: string; green: string; dark: string }> = {
  maths: { emoji: "🔢", green: "#3DB46D", dark: "#1F7A45" },
  francais: { emoji: "📖", green: "#7BC96F", dark: "#3E8A35" },
  histoire: { emoji: "🏛️", green: "#B5A55A", dark: "#7A6A28" },
  sciences: { emoji: "🔬", green: "#2EC4A6", dark: "#14806B" },
  langues: { emoji: "🌍", green: "#6FB8E8", dark: "#2C76B0" },
  talents: { emoji: "🎨", green: "#D98BD0", dark: "#9A4C92" },
  mystere: { emoji: "❓", green: "#9C95C9", dark: "#5E5794" },
};

// 12 lieux sur l'île (viewBox 0 0 300 170), dans l'ordre de l'exploration.
const SPOTS: [number, number][] = [
  [70, 112], [92, 82], [124, 66], [158, 60], [192, 68], [222, 88],
  [232, 116], [206, 132], [172, 138], [138, 132], [110, 118], [150, 98],
];

function IslandArt({ island }: { island: Island }) {
  const look = LOOK[island.id];
  const path = SPOTS.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const done = SPOTS.slice(0, island.explored);
  const donePath = done.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 170">
      {/* L'île : sable, puis la végétation. */}
      <Path d="M 40 112 C 30 70 90 36 150 36 C 220 34 276 64 268 108 C 262 148 210 160 150 158 C 86 158 46 146 40 112 Z" fill="#F2D58C" />
      <Path d="M 58 110 C 52 78 100 50 150 50 C 210 48 252 72 248 106 C 244 136 204 146 150 146 C 96 146 62 136 58 110 Z" fill={look.green} />
      <Path d="M 90 96 C 100 80 120 76 130 86 M 176 80 C 186 70 204 72 210 84 M 120 126 C 130 116 146 118 152 128" stroke={look.dark} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* Le chemin des lieux. */}
      <Path d={path} stroke="rgba(255,255,255,0.55)" strokeWidth={3} strokeDasharray="6 6" fill="none" />
      {donePath ? <Path d={donePath} stroke={GOLD} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {SPOTS.map(([x, y], i) =>
        i < island.explored ? (
          <G key={i}>
            <Circle cx={x} cy={y} r={10} fill={GOLD} stroke={INK} strokeWidth={2.5} />
            <Path d={`M ${x - 3.5} ${y} L ${x - 1} ${y + 3} L ${x + 4} ${y - 3}`} stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </G>
        ) : (
          // Brouillard : un petit nuage.
          <G key={i} opacity={0.92}>
            <Circle cx={x - 7} cy={y + 2} r={8} fill="#FFFFFF" />
            <Circle cx={x + 1} cy={y - 3} r={10} fill="#FFFFFF" />
            <Circle cx={x + 9} cy={y + 2} r={8} fill="#FFFFFF" />
            <Ellipse cx={x + 1} cy={y + 5} rx={16} ry={5} fill="#FFFFFF" />
          </G>
        ),
      )}
      {/* Le trésor : un X au centre, un coffre ouvert quand l'île est explorée. */}
      {island.complete ? (
        <G>
          <Path d="M 136 104 L 164 104 L 162 120 L 138 120 Z" fill="#A0652E" stroke={INK} strokeWidth={2.5} />
          <Path d="M 136 104 L 140 90 L 160 90 L 164 104 Z" fill="#C98F0E" stroke={INK} strokeWidth={2.5} />
          <Circle cx={145} cy={98} r={3} fill={GOLD} />
          <Circle cx={154} cy={97} r={3} fill={GOLD} />
        </G>
      ) : null}
    </Svg>
  );
}

function IslandCard({ island, onPress }: { island: Island; onPress: () => void }) {
  const look = LOOK[island.id];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${island.name} : ${island.explored} lieux sur ${island.spots}${island.complete ? ", île explorée" : ""}`}
      onPress={onPress}
      style={({ pressed }) => ({ borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 2, borderColor: island.complete ? GOLD : "rgba(255,255,255,0.18)", padding: space.sm, opacity: pressed ? 0.9 : 1 })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.xs }}>
        <T style={{ fontSize: 22 }}>{look.emoji}</T>
        <T style={{ flex: 1, fontFamily: font.title, fontSize: size.lg, color: "#FFFFFF" }} numberOfLines={1}>
          {island.name}
        </T>
        <View style={{ backgroundColor: island.complete ? GOLD : "rgba(255,255,255,0.16)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
          <T style={{ fontFamily: font.textBold, fontSize: size.sm, color: island.complete ? INK : "#FFFFFF" }}>{island.complete ? "Explorée !" : `${island.explored}/${island.spots}`}</T>
        </View>
      </View>
      <View style={{ height: 156, marginTop: space.xs }}>
        <IslandArt island={island} />
      </View>
    </Pressable>
  );
}

export default function TreasureMapScreen() {
  const { lid } = useLid();
  const map = useIslands(lid);
  const refresh = useRefreshLearner(lid);
  const [open, setOpen] = useState<Island | null>(null);
  const [info, setInfo] = useState(false);
  const [fresh, setFresh] = useState<TreasureMap["fresh"]>([]);
  const m = map.data;

  useEffect(() => {
    if (m?.fresh.length) {
      setFresh(m.fresh);
      // Pièces et objets gagnés : l'accueil et la boutique se mettent à jour.
      refresh();
    }
  }, [m]);

  const found = m ? m.islands.reduce((n, i) => n + i.explored, 0) : 0;
  // Les îles les plus avancées d'abord, celles pas encore commencées ensuite.
  const islands = m ? [...m.islands].sort((a, b) => Number(b.explored > 0) - Number(a.explored > 0)) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SEA }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: GUTTER, paddingVertical: space.sm, gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T style={{ flex: 1, textAlign: "center", fontFamily: font.title, fontSize: size.lg, color: "#FFFFFF" }} numberOfLines={1}>
          Carte au trésor
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Comment ça marche" hitSlop={12} onPress={() => setInfo(true)} style={{ width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" }}>
          <Ionicons name="information-circle" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {map.isLoading ? <Loading /> : null}
      {map.error ? (
        <View style={{ padding: GUTTER }}>
          <ErrorBox message={errorMessage(map.error)} onRetry={() => map.refetch()} />
        </View>
      ) : null}

      {m ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 60, gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.lg, padding: space.md }}>
            <Mascot size={78} accessories={["chapeau_pirate", "loupe"]} />
            <View style={{ flex: 1, gap: 4 }}>
              <T style={{ fontFamily: font.title, fontSize: size.lg, color: "#FFFFFF" }}>
                {found ? `${found} lieu${found > 1 ? "x" : ""} découvert${found > 1 ? "s" : ""}` : "À l'aventure !"}
              </T>
              <T style={{ color: SOFT, fontSize: size.sm }}>Chaque notion « Maîtrisé » chasse un nuage. 12 lieux, et le coffre de l'île s'ouvre !</T>
              {m.completeCount ? (
                <T style={{ color: GOLD, fontFamily: font.textBold, fontSize: size.sm }}>
                  {m.completeCount} île{m.completeCount > 1 ? "s" : ""} explorée{m.completeCount > 1 ? "s" : ""}
                </T>
              ) : null}
            </View>
          </View>
          {islands.map((i) => (
            <IslandCard key={i.id} island={i} onPress={() => setOpen(i)} />
          ))}
        </ScrollView>
      ) : null}

      <BottomSheet open={!!open} onClose={() => setOpen(null)} title={open ? `${LOOK[open.id].emoji} ${open.name}` : ""}>
        {open ? (
          <View style={{ gap: space.sm }}>
            <T v="bodyBold">Matière : {SUBJECTS[open.id]}</T>
            {open.found.length ? (
              <>
                <T v="bodyBold">Ce que tu as appris ici :</T>
                <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 6 }}>
                  {open.found.map((f, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start" }}>
                      <Ionicons name="checkmark-circle" size={20} color="#027C3E" />
                      <T v="body" style={{ flex: 1 }}>
                        {f.title}
                        <T v="small"> · {f.revisionTitle}</T>
                      </T>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <T v="body">Cette île est encore dans le brouillard. Révise une leçon : chaque notion « Maîtrisé » dévoile un lieu.</T>
            )}
            <T v="small">
              {open.complete
                ? `Île explorée ! Tu as maîtrisé ${open.mastered} notion${open.mastered > 1 ? "s" : ""} ici.`
                : `Encore ${open.spots - open.explored} notion${open.spots - open.explored > 1 ? "s" : ""} à maîtriser pour ouvrir le coffre.`}
            </T>
            <Button tone="white" label="Fermer" onPress={() => setOpen(null)} />
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet open={fresh.length > 0} onClose={() => setFresh([])} title="Trésor trouvé ! 🏴‍☠️">
        <View style={{ gap: space.md }}>
          {fresh.map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              {f.item ? <Mascot size={60} accessories={f.kind === "decor" ? [] : [f.item]} /> : <Coin size={40} />}
              <T v="bodyBold" style={{ flex: 1 }}>
                {f.kind === "coffre"
                  ? `${f.islandName} explorée : +${f.coins} pièces${f.itemName ? ` et ${f.itemName} !` : " !"}`
                  : f.kind === "chapeau"
                    ? `Ta première île ! Voici le ${f.itemName} : Cervelle le porte déjà.`
                    : `${m?.decorAfter ?? 3} îles explorées : le décor « ${f.itemName} » est à toi !`}
              </T>
            </View>
          ))}
          <Button label="Super !" onPress={() => setFresh([])} />
        </View>
      </BottomSheet>

      <BottomSheet open={info} onClose={() => setInfo(false)} title="Comment ça marche ?">
        <View style={{ gap: space.sm }}>
          <T v="body">🏝️ Chaque matière est une île, cachée dans le brouillard.</T>
          <T v="body">☁️ Quand une notion devient « Maîtrisé », un nuage s'en va : tu découvres un lieu.</T>
          <T v="body">💰 12 lieux découverts : l'île est explorée, son coffre s'ouvre et tu gagnes le badge d'explorateur.</T>
          <T v="body">🏴‍☠️ Première île explorée : un chapeau de pirate pour Cervelle. Trois îles : le décor « Île au trésor ».</T>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
