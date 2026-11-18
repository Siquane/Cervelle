import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { keys, useBadges } from "../src/api/hooks";
import type { Badges, BadgeSuccess, BadgeWindow } from "../src/api/types";
import { BottomSheet } from "../src/components/bits";
import { Coin } from "../src/components/Coin";
import { Medal, tierMetal, windowMetal, type Metal } from "../src/components/Medal";
import { Card, ErrorBox, Loading, Page, ProgressBar, T, TopBar } from "../src/components/ui";
import { duration, shortDate } from "../src/lib/format";
import { useLid } from "../src/lib/lid";
import { useSession } from "../src/state/session";
import { color, font, size, space } from "../src/theme/tokens";

const TIER_NAMES = ["Pas encore", "Bronze", "Argent", "Or"];

type Selected = { kind: "success"; b: BadgeSuccess } | { kind: "window"; b: BadgeWindow };

function Record({ r }: { r: Badges["records"][number] }) {
  const value = r.id === "temps" ? duration(r.value * 60) : String(r.value);
  return (
    <Card style={{ flex: 1, minWidth: "45%", gap: 2, padding: space.md }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color.sunSoft, alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
        <Ionicons name={r.icon as keyof typeof Ionicons.glyphMap} size={20} color={color.sunDark} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <T style={{ fontFamily: font.title, fontSize: size.xxl, lineHeight: 40, color: color.ink }}>{value}</T>
        {r.id !== "temps" ? <T v="small">{r.unit}</T> : null}
      </View>
      <T v="small">{r.label}</T>
    </Card>
  );
}

function Tile({ label, sub, metal, shape, icon, dot, onPress }: { label: string; sub: string; metal: Metal; shape: BadgeSuccess["shape"]; icon: string; dot: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${sub}${dot ? ", nouveau" : ""}`} onPress={onPress} style={({ pressed }) => ({ width: "33.333%", paddingHorizontal: 2, alignItems: "center", gap: 4, opacity: pressed ? 0.7 : 1 })}>
      <Medal shape={shape} metal={metal} icon={icon} size={92} dot={dot} />
      <T v="bodyBold" numberOfLines={2} style={{ textAlign: "center", fontSize: size.sm, lineHeight: 18 }}>
        {label}
      </T>
      <T v="small" numberOfLines={1} style={{ textAlign: "center", fontSize: 12 }}>
        {sub}
      </T>
    </Pressable>
  );
}

function Detail({ sel }: { sel: Selected }) {
  if (sel.kind === "success") {
    const b = sel.b;
    const prev = b.tier > 0 ? b.tiers[b.tier - 1] : 0;
    const pct = b.next ? ((b.value - prev) / (b.next.target - prev)) * 100 : 100;
    return (
      <View style={{ alignItems: "center", gap: space.md }}>
        <Medal shape={b.shape} metal={tierMetal(b.tier)} icon={b.icon} size={150} />
        <T v="h2" style={{ textAlign: "center" }}>
          {b.label}
        </T>
        <T v="label" style={{ color: b.tier ? color.sunDark : color.muted }}>
          {TIER_NAMES[b.tier]}
        </T>
        <T v="body" style={{ textAlign: "center" }}>
          {b.next ? b.next.describe : `${b.describe} Tu as tout gagné !`}
        </T>
        {b.next ? (
          <View style={{ alignSelf: "stretch", gap: 6 }}>
            <ProgressBar value={Math.max(4, pct)} tint={color.sun} />
            <T v="small" style={{ textAlign: "center" }}>
              {b.next.left}
            </T>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: space.md }}>
          {TIER_NAMES.slice(1).map((name, i) => (
            <View key={name} style={{ alignItems: "center", gap: 2, opacity: b.tier > i ? 1 : 0.5 }}>
              <T v="small" style={{ fontFamily: font.textBold, color: color.ink }}>
                {name} · {b.tiers[i]}
              </T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Coin size={14} />
                <T v="small">{b.coins[i]}</T>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }
  const w = sel.b;
  return (
    <View style={{ alignItems: "center", gap: space.md }}>
      <Medal shape={w.shape} metal={windowMetal(w)} icon={w.icon} size={150} />
      <T v="h2" style={{ textAlign: "center" }}>
        {w.label}
      </T>
      <T v="label" style={{ color: w.earned ? color.sunDark : color.muted }}>
        {w.earned ? "Gagné" : w.when === "soon" ? `À partir du ${shortDate(w.from)}` : `Jusqu'au ${shortDate(w.to)}`}
      </T>
      <T v="body" style={{ textAlign: "center" }}>
        {w.hint}
      </T>
      {!w.earned && w.needs > 1 ? (
        <View style={{ alignSelf: "stretch", gap: 6 }}>
          <ProgressBar value={Math.max(4, (w.days / w.needs) * 100)} tint={color.sun} />
          <T v="small" style={{ textAlign: "center" }}>
            {w.days} / {w.needs} jours
          </T>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Coin size={16} />
        <T v="bodyBold">{w.coins} pièces</T>
      </View>
    </View>
  );
}

export default function BadgesScreen() {
  const { lid } = useLid();
  const isChild = useSession((s) => s.session?.kind === "child");
  const badges = useBadges(lid);
  const qc = useQueryClient();
  const [sel, setSel] = useState<Selected | null>(null);
  const loaded = !!badges.data;

  // The red dots stay while the child looks at the page, and are gone next time.
  useEffect(() => {
    if (!loaded || !isChild) return;
    api.post(`/cervelle/learners/${lid}/badges/seen`).catch(() => undefined);
    return () => {
      qc.invalidateQueries({ queryKey: keys.badges(lid) });
    };
  }, [loaded, isChild, lid, qc]);

  const b = badges.data;
  const successes = b ? [...b.successes].sort((x, y) => y.tier - x.tier) : [];

  return (
    <Page header={<TopBar title="Tes badges" />}>
      {badges.isLoading ? <Loading /> : null}
      {badges.error ? <ErrorBox message={errorMessage(badges.error)} onRetry={() => badges.refetch()} /> : null}
      {b ? (
        <>
          {b.coinsEarned > 0 ? (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: color.sunSoft, borderColor: color.sun }}>
              <Coin size={30} />
              <T v="bodyBold" style={{ flex: 1 }}>
                Bravo ! Tes nouveaux badges te rapportent {b.coinsEarned} pièces.
              </T>
            </Card>
          ) : null}

          <T v="h2">Records</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
            {b.records.map((r) => (
              <Record key={r.id} r={r} />
            ))}
          </View>

          <T v="h2">Succès</T>
          <T v="small" style={{ marginTop: -space.sm }}>
            Chaque succès a trois niveaux : bronze, argent et or.
          </T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.lg }}>
            {successes.map((s) => (
              <Tile key={s.id} label={s.label} sub={s.next ? (s.tier ? `${TIER_NAMES[s.tier]} · ${s.value}/${s.next.target}` : `${s.value}/${s.next.target}`) : "Or"} metal={tierMetal(s.tier)} shape={s.shape} icon={s.icon} dot={s.isNew} onPress={() => setSel({ kind: "success", b: s })} />
            ))}
          </View>

          <T v="h2">Saisons et fêtes</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.lg }}>
            {b.windows.map((w) => (
              <Tile
                key={w.key}
                label={w.label}
                sub={w.earned ? "Gagné" : w.when === "soon" ? `Dès le ${shortDate(w.from)}` : w.needs > 1 ? `${w.days}/${w.needs} jours` : `Jusqu'au ${shortDate(w.to)}`}
                metal={windowMetal(w)}
                shape={w.shape}
                icon={w.icon}
                dot={w.isNew}
                onPress={() => setSel({ kind: "window", b: w })}
              />
            ))}
          </View>
        </>
      ) : null}

      <BottomSheet open={!!sel} onClose={() => setSel(null)} title="Badge">
        {sel ? <Detail sel={sel} /> : null}
      </BottomSheet>
    </Page>
  );
}

