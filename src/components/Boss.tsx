import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { T } from "./ui";
import { color, font, space } from "../theme/tokens";

// Le boss de fin de chapitre : un petit monstre rigolo, jamais effrayant.
// Sa couleur et son nom viennent de la révision (le même boss à chaque fois).

const INK = "#1F1A3D";
const LOOKS = [
  { body: "#8B5CF6", belly: "#C4B5FD" },
  { body: "#10B5A5", belly: "#99E6DC" },
  { body: "#F97316", belly: "#FDBA74" },
  { body: "#3D8BFD", belly: "#A9CBFF" },
  { body: "#E5484D", belly: "#FFB3B5" },
];
const NAMES = ["Grobouille", "Zorglu", "Chipotin", "Tracassor", "Brouillamini", "Grognard"];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function bossName(revisionId: string): string {
  return NAMES[hash(revisionId) % NAMES.length];
}

export function BossArt({ revisionId, size = 160, beaten = false }: { revisionId: string; size?: number; beaten?: boolean }) {
  const look = LOOKS[hash(`${revisionId}·`) % LOOKS.length];
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 200 180">
      {/* Cornes */}
      <Path d="M 58 52 C 48 30 50 14 60 6 C 64 22 72 34 82 42 Z" fill="#FFF1B8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M 142 52 C 152 30 150 14 140 6 C 136 22 128 34 118 42 Z" fill="#FFF1B8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* Corps */}
      <Path d="M 30 120 C 20 70 60 34 100 34 C 140 34 180 70 170 120 C 164 156 136 172 100 172 C 64 172 36 156 30 120 Z" fill={look.body} stroke={INK} strokeWidth={5} />
      <Ellipse cx={100} cy={132} rx={44} ry={30} fill={look.belly} />
      {/* Bras */}
      {["M 34 112 C 16 104 10 90 14 80", "M 166 112 C 184 104 190 90 186 80"].map((d) => (
        <Path key={d} d={d} stroke={INK} strokeWidth={15} fill="none" strokeLinecap="round" />
      ))}
      {["M 34 112 C 16 104 10 90 14 80", "M 166 112 C 184 104 190 90 186 80"].map((d) => (
        <Path key={`${d}-in`} d={d} stroke={look.body} strokeWidth={8} fill="none" strokeLinecap="round" />
      ))}
      {beaten ? (
        <>
          {/* Yeux en spirale : il est sonné */}
          <Path d="M 70 84 m -10 0 a 10 10 0 1 0 20 0 a 6 6 0 1 0 -12 0" stroke={INK} strokeWidth={4} fill="none" />
          <Path d="M 130 84 m -10 0 a 10 10 0 1 0 20 0 a 6 6 0 1 0 -12 0" stroke={INK} strokeWidth={4} fill="none" />
          <Path d="M 82 116 Q 100 108 118 116" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Sourcils froncés, grands yeux */}
          <Path d="M 54 66 L 84 76" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <Path d="M 146 66 L 116 76" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={72} cy={88} r={12} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
          <Circle cx={128} cy={88} r={12} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
          <Circle cx={75} cy={90} r={5} fill={INK} />
          <Circle cx={125} cy={90} r={5} fill={INK} />
          {/* Bouche avec deux petites dents */}
          <Path d="M 80 112 Q 100 126 120 112" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M 88 116 L 91 124 L 94 118 Z M 106 118 L 109 124 L 112 116 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}

/** Le boss qui sursaute quand on le touche (`hits` augmente). */
export function BossFighter({ revisionId, hits, hearts, total }: { revisionId: string; hits: number; hearts: number; total: number }) {
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!hits) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [hits, shake]);
  return (
    <View style={{ alignItems: "center", gap: space.xs }}>
      <Animated.View style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }) }] }}>
        <BossArt revisionId={revisionId} size={130} beaten={hearts === 0} />
      </Animated.View>
      <T style={{ fontFamily: font.title, fontSize: 18, color: color.ink }}>{bossName(revisionId)}</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 2 }} accessible accessibilityLabel={`${hearts} cœurs sur ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <Ionicons key={i} name={i < hearts ? "heart" : "heart-outline"} size={20} color={i < hearts ? color.red : color.faint} />
        ))}
      </View>
    </View>
  );
}
