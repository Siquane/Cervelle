import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { learnerPath, useRevision } from "../src/api/hooks";
import { Mascot } from "../src/components/mascot/Mascot";
import { ErrorBox, T, TopBar } from "../src/components/ui";
import { useLid } from "../src/lib/lid";
import { color, font, GUTTER, radius, size, space } from "../src/theme/tokens";

type Turn = { role: "user" | "assistant"; text: string };

const IDEAS = ["Explique-moi la notion la plus difficile", "Pose-moi 3 questions pour voir si j'ai compris", "Donne-moi une astuce pour retenir"];

export default function Assistant() {
  const { revisionId, q } = useLocalSearchParams<{ revisionId?: string; q?: string }>();
  const { lid } = useLid();
  const revision = useRevision(lid, revisionId ?? "");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const scroll = useRef<ScrollViewInstance>(null);

  const ask = useMutation({
    mutationFn: (history: Turn[]) => api.post<{ reply: string }>(`${learnerPath(lid)}/assistant`, { revisionId: revisionId ?? null, messages: history }),
    onSuccess: (r, history) => setTurns([...history, { role: "assistant", text: r.reply }]),
  });

  function send(value: string) {
    const v = value.trim();
    if (!v || ask.isPending) return;
    const history = [...turns, { role: "user" as const, text: v }];
    setTurns(history);
    setText("");
    ask.mutate(history);
  }

  useEffect(() => {
    if (q?.trim()) send(q);
    // Only the question typed on the home screen, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [turns, ask.isPending]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }} edges={["top", "left", "right", "bottom"]}>
      <TopBar title="Aide-moi à…" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md, paddingBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
            <Mascot size={70} accessories={["lunettes"]} />
            <T v="body" style={{ flex: 1 }}>
              {revision.data?.title ? `Pose-moi tes questions sur « ${revision.data.title} ».` : "Pose-moi une question sur tes cours, je t'explique pas à pas."}
            </T>
          </View>
          {turns.length === 0 ? (
            <View style={{ gap: space.sm }}>
              {IDEAS.map((idea) => (
                <Pressable key={idea} accessibilityRole="button" onPress={() => send(idea)} style={{ borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, padding: space.md }}>
                  <T v="bodyBold">{idea}</T>
                </Pressable>
              ))}
            </View>
          ) : null}
          {turns.map((t, i) => (
            <View key={i} style={{ alignSelf: t.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: t.role === "user" ? color.brandFill : color.card, borderRadius: radius.lg, borderWidth: t.role === "user" ? 0 : 2, borderColor: color.line, padding: space.md }}>
              <T v="body" style={{ color: t.role === "user" ? color.white : color.ink }} selectable>
                {t.text}
              </T>
            </View>
          ))}
          {ask.isPending ? <T v="small">Cervelle réfléchit…</T> : null}
          {ask.error ? <ErrorBox message={errorMessage(ask.error)} onRetry={() => ask.mutate(turns)} /> : null}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: space.sm, paddingHorizontal: GUTTER, paddingVertical: space.sm, alignItems: "flex-end" }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ta question"
            placeholderTextColor={color.faint}
            accessibilityLabel="Ta question"
            multiline
            maxLength={2000}
            style={{ flex: 1, minHeight: 52, maxHeight: 140, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, fontFamily: font.textSemi, fontSize: size.md, color: color.ink }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Envoyer" disabled={!text.trim() || ask.isPending} onPress={() => send(text)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: text.trim() ? color.brandFill : color.line, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="send" size={22} color={color.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
