import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View, type ScrollViewInstance } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useRefreshLearner, useShop } from "../../src/api/hooks";
import type { ShopItem, ShopSlot } from "../../src/api/types";
import { BottomSheet, Stat } from "../../src/components/bits";
import { Chip } from "../../src/components/Chip";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Scene } from "../../src/components/mascot/Scene";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { shortDate } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, font, radius, size, space } from "../../src/theme/tokens";

const RAYONS: { slot: ShopSlot; label: string }[] = [
  { slot: "tete", label: "Tête" },
  { slot: "visage", label: "Visage" },
  { slot: "cou", label: "Cou" },
  { slot: "tenue", label: "Tenue" },
  { slot: "main", label: "Dans la main" },
  { slot: "couleur", label: "Couleurs" },
  { slot: "decor", label: "Décors" },
];

const KIND_ORDER = { normal: 0, saison: 1, legendaire: 2, badge: 3, chemin: 4 } as const;

const KIND_TAG: Record<Exclude<ShopItem["kind"], "normal">, { label: string; fg: string; bg: string }> = {
  saison: { label: "De saison", fg: color.sunDark, bg: color.sunSoft },
  legendaire: { label: "Légendaire", fg: color.violet, bg: color.violetSoft },
  badge: { label: "Badge", fg: color.teal, bg: color.tealSoft },
  chemin: { label: "Chemin d'étoiles", fg: color.sky, bg: color.skySoft },
};

/** What Cervelle wears with `item` tried on (it takes its slot's place). */
function wearWith(equipped: string[], items: ShopItem[], item: ShopItem | null): string[] {
  if (!item) return equipped;
  const slotOf = (id: string) => items.find((i) => i.id === id)?.slot;
  return [...equipped.filter((id) => slotOf(id) !== item.slot), item.id];
}

/** « 12-01 » → the next 1 December (for « Revient le … »). */
function nextDate(md: string): string {
  const now = new Date();
  let y = now.getFullYear();
  const d = `${y}-${md}`;
  if (d < now.toISOString().slice(0, 10)) y += 1;
  return shortDate(`${y}-${md}`);
}

function ItemCard({ item, tried, onTry, coins, busy, onBuy, onWear }: { item: ShopItem; tried: boolean; onTry: () => void; coins: number; busy: boolean; onBuy: () => void; onWear: () => void }) {
  const tag = item.kind === "normal" ? null : KIND_TAG[item.kind];
  const preview = item.slot === "decor" ? null : [item.id];
  let action: React.ReactNode;
  if (item.owned) {
    action = <Button small tone={item.equipped ? "teal" : "white"} icon={item.equipped ? "checkmark" : "shirt"} label={item.equipped ? "Porté" : "Mettre"} loading={busy} disabled={item.equipped && item.id === "rose"} onPress={onWear} />;
  } else if (item.kind === "badge") {
    action = (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40 }}>
        <Ionicons name="lock-closed" size={14} color={color.muted} />
        <T v="small" numberOfLines={2} style={{ flexShrink: 1, textAlign: "center", fontSize: 12 }}>
          Badge « {item.badge} »
        </T>
      </View>
    );
  } else if (item.kind === "chemin") {
    action = (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40 }}>
        <Ionicons name="star" size={14} color={color.sunDark} />
        <T v="small" numberOfLines={2} style={{ flexShrink: 1, textAlign: "center", fontSize: 12 }}>
          Au bout du chemin d'étoiles
        </T>
      </View>
    );
  } else if (!item.onSale && item.season) {
    action = (
      <T v="small" style={{ minHeight: 40, textAlignVertical: "center", textAlign: "center", fontSize: 12 }}>
        Revient le {nextDate(item.season[0])}
      </T>
    );
  } else {
    action = <Button small tone="sun" label={`${item.price}`} icon="coin" disabled={coins < item.price} loading={busy} onPress={onBuy} />;
  }
  return (
    <View style={{ width: "48%", alignItems: "center", gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: color.card, borderWidth: 2, borderColor: tried ? color.brand : item.equipped ? color.teal : color.line }}>
      {tag ? (
        <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: tag.bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, zIndex: 2 }}>
          <T v="small" style={{ color: tag.fg, fontFamily: font.textBold, fontSize: 11 }}>
            {tag.label}
          </T>
        </View>
      ) : null}
      {/* Touching the picture or the name tries the item on; the button below buys or wears it. */}
      <Pressable accessibilityRole="button" accessibilityLabel={`Essayer : ${item.name}`} onPress={onTry} style={{ alignSelf: "stretch", alignItems: "center", gap: space.sm }}>
        {preview ? (
          <Mascot size={86} accessories={preview} />
        ) : (
          <Scene equipped={[item.id]} width="100%" height={84} radius={radius.md}>
            <Mascot size={62} />
          </Scene>
        )}
        <T v="bodyBold" style={{ textAlign: "center", fontSize: size.sm, lineHeight: 19 }} numberOfLines={2}>
          {item.name}
        </T>
      </Pressable>
      {action}
    </View>
  );
}

/**
 * The shelves (Tête, Visage…) in a row that scrolls sideways. Round arrows on
 * the edges show there is more to see, and scroll when touched.
 */
function RayonRow({ slot, onPick }: { slot: ShopSlot; onPick: (s: ShopSlot) => void }) {
  const ref = useRef<ScrollViewInstance>(null);
  const [x, setX] = useState(0);
  const [view, setView] = useState(0);
  const [content, setContent] = useState(0);
  const more = content - view - x > 4;
  const back = x > 4;
  const arrow = (side: "left" | "right") => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={side === "right" ? "Voir les autres rayons" : "Revenir aux premiers rayons"}
      hitSlop={8}
      onPress={() => ref.current?.scrollTo({ x: side === "right" ? Math.min(x + view * 0.7, content - view) : Math.max(0, x - view * 0.7), animated: true })}
      style={{ position: "absolute", top: 0, bottom: 0, [side]: 0, justifyContent: "center" }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color.brandSoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: color.bg }}>
        <Ionicons name={side === "right" ? "chevron-forward" : "chevron-back"} size={22} color={color.brand} />
      </View>
    </Pressable>
  );
  return (
    <View onLayout={(e) => setView(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.sm, paddingRight: 44 }}
        onContentSizeChange={(w) => setContent(w)}
        onScroll={(e) => setX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={32}
      >
        {RAYONS.map((r) => (
          <Chip key={r.slot} label={r.label} on={slot === r.slot} onPress={() => onPick(r.slot)} />
        ))}
      </ScrollView>
      {back ? arrow("left") : null}
      {more ? arrow("right") : null}
    </View>
  );
}

export default function Shop() {
  const { lid } = useLid();
  const shop = useShop(lid);
  const refresh = useRefreshLearner(lid);
  const [slot, setSlot] = useState<ShopSlot>("tete");
  const [trying, setTrying] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const onError = (e: unknown) => Alert.alert("Pas possible pour l'instant", errorMessage(e));
  const act = useMutation({
    mutationFn: ({ item, action }: { item: ShopItem; action: "buy" | "on" | "off" }) =>
      action === "buy" ? api.post(`${learnerPath(lid)}/shop/${item.id}/buy`) : api.post(`${learnerPath(lid)}/shop/${item.id}/equip`, { on: action === "on" }),
    onSuccess: () => {
      setTrying(null);
      refresh();
    },
    onError,
  });
  const outfit = useMutation({
    mutationFn: ({ n, save }: { n: number; save: boolean }) => (save ? api.put(`${learnerPath(lid)}/shop/outfits/${n}`, {}) : api.post(`${learnerPath(lid)}/shop/outfits/${n}/wear`)),
    onSuccess: () => {
      setSaveOpen(false);
      setTrying(null);
      refresh();
    },
    onError,
  });

  const data = shop.data;
  const items = data?.items ?? [];
  const equipped = items.filter((i) => i.equipped && i.id !== "rose").map((i) => i.id);
  const tried = items.find((i) => i.id === trying) ?? null;
  const wearing = wearWith(equipped, items, tried);
  const shelf = items.filter((i) => i.slot === slot).sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.price - b.price);
  const busyId = act.isPending ? act.variables?.item.id : null;

  return (
    <Page header={<TopBar title="Habiller Cervelle" right={data ? <Stat icon="coin" tint={color.sunDark} value={data.coins} label="Pièces" /> : null} />}>
      {shop.isLoading ? <Loading /> : null}
      {shop.error ? <ErrorBox message={errorMessage(shop.error)} onRetry={() => shop.refetch()} /> : null}
      {data ? (
        <>
          {/* Cabine d'essayage */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <Scene equipped={wearing} width="100%" height={210} radius={0}>
              <View style={{ paddingBottom: space.sm }}>
                <Mascot size={180} accessories={wearing} mood={tried ? "wow" : "happy"} />
              </View>
            </Scene>
            <View style={{ padding: space.md, gap: space.sm }}>
              {tried ? (
                <>
                  <T v="bodyBold" style={{ textAlign: "center" }}>
                    Essai : {tried.name}
                  </T>
                  <View style={{ flexDirection: "row", gap: space.sm }}>
                    <Button small tone="white" icon="close" label="Enlever" onPress={() => setTrying(null)} style={{ flex: 1 }} />
                    {tried.owned ? (
                      <Button small icon="shirt" label="Garder" loading={act.isPending} onPress={() => act.mutate({ item: tried, action: "on" })} style={{ flex: 1.3 }} />
                    ) : tried.kind !== "badge" && tried.kind !== "chemin" && tried.onSale ? (
                      <Button small tone="sun" icon="coin" label={`Acheter · ${tried.price}`} disabled={data.coins < tried.price} loading={act.isPending} onPress={() => act.mutate({ item: tried, action: "buy" })} style={{ flex: 1.3 }} />
                    ) : null}
                  </View>
                  {!tried.owned && tried.kind !== "badge" && tried.onSale && data.coins < tried.price ? (
                    <T v="small" style={{ textAlign: "center" }}>
                      Encore {tried.price - data.coins} pièces à gagner.
                    </T>
                  ) : null}
                </>
              ) : (
                <T v="small" style={{ textAlign: "center" }}>
                  Touche un objet pour l'essayer sur Cervelle.
                </T>
              )}
            </View>
          </Card>

          {/* Tenues enregistrées */}
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <T v="h3" style={{ flex: 1 }}>
                Mes tenues
              </T>
              <Button small tone="white" icon="bookmark" label="Enregistrer" onPress={() => setSaveOpen(true)} />
            </View>
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {data.outfits.map((o, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={o ? `Mettre la tenue ${i + 1}` : `Tenue ${i + 1}, vide`}
                  disabled={!o || outfit.isPending}
                  onPress={() => outfit.mutate({ n: i + 1, save: false })}
                  style={({ pressed }) => ({ flex: 1, alignItems: "center", gap: 2, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, opacity: pressed ? 0.7 : 1 })}
                >
                  {o ? <Mascot size={58} accessories={o} /> : <Ionicons name="add-circle-outline" size={40} color={color.faint} style={{ marginVertical: 8 }} />}
                  <T v="small" style={{ fontFamily: font.textBold, color: color.ink }}>
                    Tenue {i + 1}
                  </T>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Rayons */}
          <RayonRow slot={slot} onPick={setSlot} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.md }}>
            {shelf.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                tried={trying === item.id}
                coins={data.coins}
                busy={busyId === item.id}
                onTry={() => setTrying(trying === item.id ? null : item.id)}
                onBuy={() => act.mutate({ item, action: "buy" })}
                onWear={() => act.mutate({ item, action: item.equipped ? "off" : "on" })}
              />
            ))}
          </View>
          <T v="small" style={{ textAlign: "center" }}>
            Un objet par endroit. Les objets de saison reviennent chaque année ; ceux des badges se gagnent dans « Tes badges ».
          </T>
        </>
      ) : null}

      <BottomSheet open={saveOpen} onClose={() => setSaveOpen(false)} title="Enregistrer la tenue">
        <T v="body">Cervelle porte cette tenue. Où la ranger ?</T>
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {[1, 2, 3].map((n) => (
            <Button key={n} tone={data?.outfits[n - 1] ? "white" : "brand"} label={`Tenue ${n}`} loading={outfit.isPending && outfit.variables?.n === n} onPress={() => outfit.mutate({ n, save: true })} style={{ flex: 1 }} />
          ))}
        </View>
        <T v="small">Une tenue déjà enregistrée est remplacée.</T>
      </BottomSheet>
    </Page>
  );
}
