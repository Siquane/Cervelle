import { useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { keys, learnerPath, useAdvent, useQueryClient, useRefreshLearner } from "../src/api/hooks";
import type { Advent, AdventCell, AdventReward } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { Mascot } from "../src/components/mascot/Mascot";
import { SpeakButton } from "../src/components/VoiceButtons";
import { Button, ErrorBox, Loading, T } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { motionReduced, StarBurst } from "../src/components/motion";
import { font, GUTTER, radius, size, space } from "../src/theme/tokens";

// Calendrier de l'Avent : 24 cases, une révision ouvre la case du jour (deux
// révisions le même jour rattrapent une case oubliée). La scène est une nuit
// d'hiver dans les deux thèmes : ses couleurs sont fixées ici (texte blanc
// sur le fond sombre, encre sur les cases claires).

const NIGHT = "#102A43";
const SOFT = "#D9E6F5";
const INK = "#1F1A3D";
const GOLD = "#FFC94D";
// Portes fermées : rouge, vert, bleu nuit (texte blanc dessus : 4,5:1 et plus).
const DOORS = ["#B42A2F", "#1B7A4A", "#2D4F8A"];
const COLS = 4;

function RewardArt({ r, big = false }: { r: AdventReward; big?: boolean }) {
  if (r.type === "item" && r.item) return <Mascot size={big ? 130 : 56} accessories={[r.item]} />;
  if (r.type === "stars")
    return (
      <View style={{ alignItems: "center" }}>
        <Ionicons name="star" size={big ? 64 : 26} color="#E0A100" />
        <T style={{ fontFamily: font.title, fontSize: big ? size.xl : size.sm, color: INK }}>+{r.stars}</T>
      </View>
    );
  return (
    <View style={{ alignItems: "center" }}>
      <Ionicons name="trophy" size={big ? 60 : 26} color="#1B7A4A" />
      {big ? null : <T style={{ fontFamily: font.textBold, fontSize: 11, color: INK }}>Défi</T>}
    </View>
  );
}

function Door({ c, isToday, onPress }: { c: AdventCell; isToday: boolean; onPress: () => void }) {
  // Une case à ouvrir pivote comme une vraie porte avant de montrer la surprise.
  const swing = useRef(new Animated.Value(0)).current;
  const press = () => {
    if (!c.openable || motionReduced()) return onPress();
    Animated.timing(swing, { toValue: 1, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      onPress();
      swing.setValue(0);
    });
  };
  const bg = c.opened ? "#FFFFFF" : c.openable ? GOLD : DOORS[(c.day - 1) % DOORS.length];
  const label = c.opened
    ? `Case ${c.day}, ouverte`
    : c.openable
      ? `Case ${c.day}, à ouvrir`
      : c.arrived
        ? `Case ${c.day}, fermée : fais une révision pour l'ouvrir`
        : `Case ${c.day}, s'ouvre le ${c.day} décembre`;
  return (
    <Animated.View style={{ flex: 1, transform: [{ perspective: 600 }, { rotateY: swing.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-95deg"] }) }] }}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={press}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 0.82,
        borderRadius: radius.md,
        backgroundColor: bg,
        borderWidth: isToday ? 4 : 2,
        borderColor: isToday ? (c.openable ? "#FFFFFF" : GOLD) : "rgba(255,255,255,0.35)",
        alignItems: "center",
        justifyContent: "center",
        opacity: !c.arrived && !c.opened ? 0.55 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      {c.opened && c.reward ? (
        <>
          <RewardArt r={c.reward} />
          <T style={{ position: "absolute", top: 4, left: 7, fontFamily: font.textBold, fontSize: 12, color: INK }}>{c.day}</T>
        </>
      ) : (
        <>
          <T style={{ fontFamily: font.title, fontSize: 28, lineHeight: 34, color: c.openable ? INK : "#FFFFFF" }}>{c.day}</T>
          {c.openable ? (
            <Ionicons name="gift" size={20} color={INK} />
          ) : c.arrived ? (
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
          ) : null}
        </>
      )}
    </Pressable>
    </Animated.View>
  );
}

/** Ce qu'il faut faire maintenant, en une phrase. */
function statusOf(a: Advent): { title: string; text: string; revise: boolean } {
  const missed = a.cells.filter((c) => c.arrived && !c.opened);
  const todayCell = a.today ? a.cells[a.today - 1] : null;
  if (a.phase === "bientot") {
    return {
      title: `Plus que ${a.daysUntil} jour${a.daysUntil > 1 ? "s" : ""} !`,
      text: "Le calendrier commence le 1er décembre. Chaque jour, une petite révision ouvre la case du jour.",
      revise: false,
    };
  }
  if (todayCell && !todayCell.opened) {
    if (todayCell.openable) return { title: "Ta case du jour t'attend ! 🎁", text: `Touche la case ${todayCell.day} pour l'ouvrir.`, revise: false };
    return { title: "Une révision et ça s'ouvre !", text: "Fais une petite révision pour ouvrir la case du jour.", revise: true };
  }
  if (missed.length && a.keysLeft > 0) return { title: "Tu peux rattraper une case !", text: "Touche une case dorée pour l'ouvrir.", revise: false };
  if (missed.length) {
    return {
      title: a.phase === "rattrapage" ? "Rattrape tes cases" : "Une case oubliée ?",
      text: a.phase === "rattrapage" ? "Jusqu'au 6 janvier, chaque jour où tu révises ouvre une case oubliée. Fais deux révisions le même jour pour en ouvrir deux." : "Fais deux révisions le même jour : la deuxième ouvre une case oubliée.",
      revise: true,
    };
  }
  if (a.phase === "rattrapage") return { title: "Bravo, calendrier complet ! 🎄", text: "Tu as ouvert toutes les cases. Joyeuses fêtes !", revise: false };
  return { title: "Bravo, à demain ! 🎄", text: "Reviens demain pour ouvrir la case suivante.", revise: false };
}

export default function AdventScreen() {
  const { lid } = useLid();
  const advent = useAdvent(lid);
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const [shown, setShown] = useState<{ day: number; reward: AdventReward; fresh: boolean } | null>(null);
  const [info, setInfo] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const open = useMutation({
    mutationFn: (day: number) => api.post<{ opened: { day: number; reward: AdventReward }; advent: Advent }>(`${learnerPath(lid)}/advent/${day}/open`),
    onSuccess: (r) => {
      qc.setQueryData(keys.advent(lid), r.advent);
      // Étoiles (chemin) et accessoire porté tout de suite : l'accueil et la boutique se mettent à jour.
      refresh();
      setShown({ ...r.opened, fresh: true });
    },
    onError: (e) => setHint(errorMessage(e)),
  });
  const a = advent.data;

  const tap = (c: AdventCell) => {
    if (c.opened && c.reward) return setShown({ day: c.day, reward: c.reward, fresh: false });
    if (c.openable) return open.mutate(c.day);
    if (!c.arrived) return setHint(a?.phase === "bientot" ? "Patience : le calendrier commence le 1er décembre." : `Patience : cette case s'ouvre le ${c.day} décembre.`);
    setHint(a?.revisedToday ? "Fais encore une révision aujourd'hui pour ouvrir cette case." : "Fais une petite révision pour ouvrir cette case.");
  };

  const rows: AdventCell[][] = [];
  for (let i = 0; a && i < a.cells.length; i += COLS) rows.push(a.cells.slice(i, i + COLS));
  const st = a ? statusOf(a) : null;
  const opened = a?.cells.filter((c) => c.opened).length ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NIGHT }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: GUTTER, paddingVertical: space.sm, gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T style={{ flex: 1, textAlign: "center", fontFamily: font.title, fontSize: size.lg, color: "#FFFFFF" }} numberOfLines={1}>
          Calendrier de l'Avent
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Comment ça marche" hitSlop={12} onPress={() => setInfo(true)} style={{ width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" }}>
          <Ionicons name="information-circle" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {advent.isLoading ? <Loading /> : null}
      {advent.error ? (
        <View style={{ padding: GUTTER }}>
          <ErrorBox message={errorMessage(advent.error)} onRetry={() => advent.refetch()} />
        </View>
      ) : null}
      {advent.data === null ? (
        <View style={{ padding: GUTTER, alignItems: "center", gap: space.md }}>
          <Mascot size={120} accessories={["bonnet_noel"]} mood="sleep" />
          <T style={{ color: "#FFFFFF", textAlign: "center", fontFamily: font.textBold, fontSize: size.md }}>Le calendrier de l'Avent revient fin novembre.</T>
        </View>
      ) : null}

      {a && st ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 60, gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.lg, padding: space.md }}>
            <Mascot size={78} accessories={["bonnet_noel", "echarpe"]} />
            <View style={{ flex: 1, gap: 4 }}>
              <T style={{ fontFamily: font.title, fontSize: size.lg, color: "#FFFFFF" }}>{st.title}</T>
              <T style={{ color: SOFT, fontSize: size.sm }}>{st.text}</T>
              {a.phase !== "bientot" ? (
                <T style={{ color: GOLD, fontFamily: font.textBold, fontSize: size.sm }}>
                  {opened} case{opened > 1 ? "s" : ""} ouverte{opened > 1 ? "s" : ""} sur 24
                </T>
              ) : null}
            </View>
          </View>
          {st.revise ? <Button tone="sun" icon="book" label="Faire une révision" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} /> : null}

          <View style={{ gap: space.sm }}>
            {rows.map((row, i) => (
              <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
                {row.map((c) => (
                  <Door key={c.day} c={c} isToday={a.today === c.day} onPress={() => tap(c)} />
                ))}
              </View>
            ))}
          </View>
          <T style={{ color: SOFT, fontSize: size.sm, textAlign: "center" }}>Derrière les cases : des accessoires de Noël pour Cervelle, des étoiles et des défis.</T>
        </ScrollView>
      ) : null}

      <BottomSheet open={!!shown} onClose={() => setShown(null)} title={shown ? `Case ${shown.day}${shown.fresh ? " : surprise !" : ""}` : ""}>
        {shown ? (
          <View style={{ gap: space.md, alignItems: "center" }}>
            <View>
              <RewardArt r={shown.reward} big />
              {shown.fresh ? <StarBurst k={shown.day} now /> : null}
            </View>
            {shown.reward.type === "item" ? (
              <T v="bodyBold" style={{ textAlign: "center" }}>
                {shown.reward.itemName} pour Cervelle !{shown.fresh ? " Elle le porte déjà." : ""}
              </T>
            ) : shown.reward.type === "stars" ? (
              <T v="bodyBold" style={{ textAlign: "center" }}>
                +{shown.reward.stars} étoiles pour ton chemin d'étoiles !
              </T>
            ) : (
              <View style={{ gap: space.sm, alignSelf: "stretch" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <T v="h3" style={{ flex: 1 }}>
                    Défi du jour
                  </T>
                  <SpeakButton id={`avent-${shown.day}`} text={shown.reward.text ?? ""} />
                </View>
                <T read v="body">
                  {shown.reward.text}
                </T>
                <T v="small">Et +{shown.reward.stars} étoiles pour ton chemin d'étoiles.</T>
              </View>
            )}
            <Button label="Super !" onPress={() => setShown(null)} style={{ alignSelf: "stretch" }} />
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet open={!!hint} onClose={() => setHint(null)} title="Pas encore !">
        <T read v="body">
          {hint}
        </T>
        <Button tone="white" label="D'accord" onPress={() => setHint(null)} />
      </BottomSheet>

      <BottomSheet open={info} onClose={() => setInfo(false)} title="Comment ça marche ?">
        <View style={{ gap: space.sm }}>
          <T v="body">🎁 Du 1er au 24 décembre, une case par jour.</T>
          <T v="body">📚 Fais une petite révision : la case du jour s'ouvre.</T>
          <T v="body">🔁 Tu as oublié un jour ? Fais deux révisions le même jour : la deuxième ouvre une case oubliée.</T>
          <T v="body">⏳ Tu peux rattraper tes cases jusqu'au 6 janvier.</T>
          <T v="body">🎄 Derrière : 6 accessoires de Noël pour Cervelle, des étoiles pour ton chemin d'étoiles et des défis.</T>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
