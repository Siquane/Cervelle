import { Alert, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../../src/api/client";
import { learnerPath, useHome, useRefreshLearner, useShop } from "../../src/api/hooks";
import type { ShopItem } from "../../src/api/types";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Stat } from "../../src/components/bits";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../../src/components/ui";
import { useLid } from "../../src/lib/lid";
import { color, learnerColorOf, space } from "../../src/theme/tokens";

const SLOT: Record<ShopItem["slot"], string> = { tete: "Tête", visage: "Visage", cou: "Cou" };

export default function Shop() {
  const { lid } = useLid();
  const shop = useShop(lid);
  const home = useHome(lid);
  const refresh = useRefreshLearner(lid);
  const act = useMutation({
    mutationFn: ({ item, action }: { item: ShopItem; action: "buy" | "on" | "off" }) =>
      action === "buy" ? api.post(`${learnerPath(lid)}/shop/${item.id}/buy`) : api.post(`${learnerPath(lid)}/shop/${item.id}/equip`, { on: action === "on" }),
    onSuccess: refresh,
    onError: (e) => Alert.alert("Achat impossible", errorMessage(e)),
  });

  const learner = home.data?.learner;
  const tint = learnerColorOf(learner?.color ?? "violet");
  const equipped = shop.data?.items.filter((i) => i.equipped).map((i) => i.id) ?? [];

  return (
    <Page header={<TopBar title="Habiller Cervelle" right={shop.data ? <Stat icon="coin" tint={color.sunDark} value={shop.data.coins} label="Pièces" /> : null} />}>
      <Card style={{ alignItems: "center", gap: space.sm, backgroundColor: tint.soft, borderColor: tint.soft }}>
        <Mascot size={180} accessories={equipped} />
        {learner ? (
          <T v="bodyBold" style={{ color: tint.dark }}>
            Niveau {learner.mascot.level} · {learner.mascot.name}
          </T>
        ) : null}
        <T v="small" style={{ textAlign: "center" }}>
          Gagne des pièces en répondant juste, en finissant un quiz et en ouvrant le coffre des missions.
        </T>
      </Card>
      {shop.isLoading ? <Loading /> : null}
      {shop.error ? <ErrorBox message={errorMessage(shop.error)} onRetry={() => shop.refetch()} /> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {shop.data?.items.map((item) => {
          const busy = act.isPending && act.variables?.item.id === item.id;
          const canBuy = (shop.data?.coins ?? 0) >= item.price;
          return (
            <Card key={item.id} style={{ width: "47%", flexGrow: 1, alignItems: "center", gap: space.sm, borderColor: item.equipped ? tint.main : color.line }}>
              <Mascot size={86} accessories={[item.id]} />
              <T v="bodyBold" style={{ textAlign: "center" }} numberOfLines={2}>
                {item.name}
              </T>
              <T v="small">{SLOT[item.slot]}</T>
              {item.owned ? (
                <Button small tone={item.equipped ? "teal" : "white"} icon={item.equipped ? "checkmark" : "shirt"} label={item.equipped ? "Porté" : "Mettre"} loading={busy} onPress={() => act.mutate({ item, action: item.equipped ? "off" : "on" })} />
              ) : (
                <Button small tone="sun" label={`${item.price}`} icon="coin" disabled={!canBuy} loading={busy} onPress={() => act.mutate({ item, action: "buy" })} />
              )}
            </Card>
          );
        })}
      </View>
      {shop.data && !shop.data.items.some((i) => i.owned) ? (
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
          <Ionicons name="information-circle" size={20} color={color.muted} />
          <T v="small" style={{ flex: 1 }}>
            Un accessoire par endroit : un chapeau remplace l'autre.
          </T>
        </View>
      ) : null}
    </Page>
  );
}
