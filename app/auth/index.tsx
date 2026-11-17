import { View } from "react-native";
import { router } from "expo-router";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, Page, T } from "../../src/components/ui";
import { color, space } from "../../src/theme/tokens";

export default function Welcome() {
  return (
    <Page>
      <View style={{ alignItems: "center", gap: space.md, paddingTop: 48 }}>
        <Mascot size={190} accessories={["lunettes"]} />
        <T v="title" style={{ fontSize: 44, lineHeight: 52, color: color.brand }}>
          Cervelle
        </T>
        <T v="body" style={{ textAlign: "center", color: color.muted, maxWidth: 320 }}>
          Prends ton cours en photo : Cervelle en fait des fiches et des quiz pour réviser.
        </T>
      </View>
      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Button label="Je suis élève" icon="school" onPress={() => router.push("/auth/child")} />
        <Button label="Je suis parent" icon="people" tone="white" onPress={() => router.push("/auth/parent")} />
      </View>
      <T v="small" style={{ textAlign: "center" }}>
        Les parents se connectent avec leur e-mail. Les élèves entrent le code donné par un parent.
      </T>
    </Page>
  );
}
