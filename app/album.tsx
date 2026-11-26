import { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../src/api/client";
import { useAlbum, useRefreshLearner } from "../src/api/hooks";
import type { Album, AlbumCard, CardRarity } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { SpeakButton } from "../src/components/VoiceButtons";
import { Button, Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../src/components/ui";
import { CARD_IMAGES } from "../src/lib/cardImages";
import { useLid } from "../src/lib/lid";
import { color, font, radius, size, space, themed } from "../src/theme/tokens";

// Album de cartes « Animaux du monde » : une carte par notion « Maîtrisé ».
// Les cartes pas encore trouvées sont des ombres. Toucher une carte montre son
// fait étonnant, qu'on peut écouter.

const RARITY: Record<CardRarity, { label: string; fg: string; bg: string; edge: string }> = themed(() => ({
  commune: { label: "Commune", fg: color.teal, bg: color.tealSoft, edge: color.line },
  rare: { label: "Rare", fg: color.sky, bg: color.skySoft, edge: color.sky },
  legendaire: { label: "Légendaire ✨", fg: color.sunDark, bg: color.sunSoft, edge: color.sunEdge },
}));
const FILTERS: { key: CardRarity | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "commune", label: "Communes" },
  { key: "rare", label: "Rares" },
  { key: "legendaire", label: "Légendaires" },
];

function RarityTag({ rarity }: { rarity: CardRarity }) {
  const r = RARITY[rarity];
  return (
    <View style={{ alignSelf: "center", backgroundColor: r.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <T style={{ fontFamily: font.textBold, fontSize: 12, color: r.fg }}>{r.label}</T>
    </View>
  );
}

function CardTile({ card, onPress }: { card: AlbumCard; onPress: () => void }) {
  const owned = card.count > 0;
  const r = RARITY[card.rarity];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={owned ? `${card.name}, carte ${r.label.toLowerCase()}` : "Carte pas encore trouvée"}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        gap: 4,
        paddingVertical: space.sm,
        paddingHorizontal: 4,
        borderRadius: radius.md,
        backgroundColor: owned ? color.card : color.chip,
        borderWidth: owned && card.rarity !== "commune" ? 3 : 2,
        borderColor: owned ? r.edge : color.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Pas encore trouvée : l'ombre de l'animal. */}
      <Image source={CARD_IMAGES[card.id]} style={{ width: 64, height: 64, tintColor: owned ? undefined : color.faint, opacity: owned ? 1 : 0.35 }} resizeMode="contain" />
      <T numberOfLines={1} style={{ fontFamily: font.textBold, fontSize: 13, color: owned ? color.ink : color.faint }}>
        {owned ? card.name : "???"}
      </T>
      {card.count > 1 ? (
        <View style={{ position: "absolute", top: 4, right: 4, backgroundColor: color.brandFill, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 }}>
          <T style={{ fontFamily: font.textBold, fontSize: 11, color: color.white }}>×{card.count}</T>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Une carte en grand : dessin, nom, rareté, fait étonnant. */
function BigCard({ card }: { card: Omit<AlbumCard, "count"> }) {
  const r = RARITY[card.rarity];
  return (
    <View style={{ alignItems: "center", gap: space.sm, borderRadius: radius.lg, borderWidth: 3, borderColor: r.edge, backgroundColor: r.bg, padding: space.lg }}>
      <Image source={CARD_IMAGES[card.id]} style={{ width: 140, height: 140 }} resizeMode="contain" accessibilityIgnoresInvertColors />
      <T v="h2">{card.name}</T>
      <RarityTag rarity={card.rarity} />
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start" }}>
        <T read v="body" style={{ flex: 1, textAlign: "center" }}>
          {card.fact}
        </T>
        <SpeakButton id={`card-${card.id}`} text={`${card.name}. ${card.fact}`} />
      </View>
    </View>
  );
}

export default function AlbumScreen() {
  const { lid } = useLid();
  const album = useAlbum(lid);
  const refresh = useRefreshLearner(lid);
  const [filter, setFilter] = useState<CardRarity | "all">("all");
  const [shown, setShown] = useState<AlbumCard | null>(null);
  const [fresh, setFresh] = useState<Album["fresh"]>([]);
  const [step, setStep] = useState(0);
  const a = album.data;

  useEffect(() => {
    if (a?.fresh.length) {
      setFresh(a.fresh);
      setStep(0);
      // Doublons → pièces, et plus de cartes en attente sur l'accueil.
      refresh();
    }
  }, [a]);

  const cards = a ? a.cards.filter((c) => filter === "all" || c.rarity === filter) : [];
  const rows: AlbumCard[][] = [];
  for (let i = 0; i < cards.length; i += 3) rows.push(cards.slice(i, i + 3));
  const current = fresh[step];

  return (
    <Page header={<TopBar title="Mon album" />}>
      {album.isLoading ? <Loading /> : null}
      {album.error ? <ErrorBox message={errorMessage(album.error)} onRetry={() => album.refetch()} /> : null}
      {a ? (
        <>
          <Card style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Ionicons name="albums" size={26} color={color.brand} />
              <T v="h3" style={{ flex: 1 }}>
                Animaux du monde
              </T>
              <T v="bodyBold" style={{ color: color.brand }}>
                {a.collected}/{a.total}
              </T>
            </View>
            <ProgressBar value={(a.collected / a.total) * 100} tint={color.brandBrain} track={color.line} />
            <T v="small">Chaque notion « Maîtrisé » te donne une carte. Une carte que tu as déjà se change en pièces.</T>
          </Card>

          <View style={{ flexDirection: "row", gap: space.xs, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === f.key }}
                onPress={() => setFilter(f.key)}
                style={{ paddingHorizontal: 14, minHeight: 40, justifyContent: "center", borderRadius: radius.pill, backgroundColor: filter === f.key ? color.brandFill : color.chip }}
              >
                <T style={{ fontFamily: font.textBold, fontSize: size.sm, color: filter === f.key ? color.white : color.ink }}>{f.label}</T>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: space.sm }}>
            {rows.map((row, i) => (
              <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
                {row.map((c) => (
                  <CardTile key={c.id} card={c} onPress={() => setShown(c)} />
                ))}
                {row.length < 3 ? Array.from({ length: 3 - row.length }, (_, k) => <View key={`v${k}`} style={{ flex: 1 }} />) : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      <BottomSheet open={!!shown} onClose={() => setShown(null)} title={shown && shown.count > 0 ? "Ta carte" : "Pas encore trouvée"}>
        {shown ? (
          shown.count > 0 ? (
            <View style={{ gap: space.md }}>
              <BigCard card={shown} />
              {shown.count > 1 ? <T v="small">Tu l'as trouvée {shown.count} fois.</T> : null}
            </View>
          ) : (
            <View style={{ gap: space.md, alignItems: "center" }}>
              <Image source={CARD_IMAGES[shown.id]} style={{ width: 110, height: 110, tintColor: color.faint, opacity: 0.35 }} resizeMode="contain" />
              <T v="body" style={{ textAlign: "center" }}>
                Une carte {RARITY[shown.rarity].label.replace(" ✨", "").toLowerCase()} t'attend. Maîtrise des notions pour la trouver !
              </T>
            </View>
          )
        ) : null}
      </BottomSheet>

      <BottomSheet open={!!current} onClose={() => setFresh([])} title={fresh.length > 1 ? `Nouvelle carte ${step + 1}/${fresh.length} !` : "Nouvelle carte !"}>
        {current ? (
          <View style={{ gap: space.md }}>
            <BigCard card={current} />
            {current.duplicate ? (
              <T v="bodyBold" style={{ textAlign: "center", color: color.sunDark }}>
                Déjà dans ton album : +{current.coins} pièces !
              </T>
            ) : null}
            <Button label={step + 1 < fresh.length ? "Carte suivante" : "Ranger dans l'album"} icon={step + 1 < fresh.length ? "arrow-forward" : "checkmark"} onPress={() => (step + 1 < fresh.length ? setStep(step + 1) : setFresh([]))} />
          </View>
        ) : null}
      </BottomSheet>
    </Page>
  );
}
