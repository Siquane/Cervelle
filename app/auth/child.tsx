import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputInstance } from "react-native";
import { router } from "expo-router";
import * as Device from "expo-constants";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Button, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { postWithRetry, useSession } from "../../src/state/session";
import type { Learner } from "../../src/api/types";
import { color, font, radius, space } from "../../src/theme/tokens";

export default function ChildCode() {
  const save = useSession((s) => s.save);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<TextInputInstance>(null);

  async function submit(value = code) {
    if (value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { status, data } = await postWithRetry("/cervelle/child/login", { code: value, deviceName: Device.default.deviceName ?? "" });
      if (status !== 201 || typeof data.token !== "string") throw new Error(typeof data.error === "string" ? data.error : "Ce code ne marche pas. Demande un nouveau code à tes parents.");
      await save({ kind: "child", token: data.token, learner: data.learner as Learner });
      router.replace("/child");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ce code ne marche pas. Demande un nouveau code à tes parents.");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page header={<TopBar title="Espace élève" />}>
      <View style={{ alignItems: "center", gap: space.sm }}>
        <Mascot size={120} mood="wow" />
        <T v="h2" style={{ textAlign: "center" }}>
          Entre ton code
        </T>
        <T v="body" style={{ textAlign: "center", color: color.muted }}>
          Demande à un parent de créer un code dans son espace Cervelle (Mes enfants → Connecter un téléphone).
        </T>
      </View>
      <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Code à 6 chiffres" style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={{ width: 46, height: 60, borderRadius: radius.md, borderWidth: 2, borderColor: code.length === i ? color.brand : color.line, backgroundColor: color.card, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: font.title, fontSize: 30, color: color.ink }}>{code[i] ?? ""}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(t) => {
          const digits = t.replace(/\D/g, "").slice(0, 6);
          setCode(digits);
          if (digits.length === 6) submit(digits);
        }}
        keyboardType="number-pad"
        autoFocus
        maxLength={6}
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
      {error ? <ErrorBox message={error} /> : null}
      <Button label="C'est parti !" icon="rocket" loading={busy} disabled={code.length !== 6} onPress={() => submit()} />
    </Page>
  );
}
