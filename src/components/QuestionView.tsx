import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Question } from "../api/types";
import { color, font, radius, size, space, readSize } from "../theme/tokens";
import { Button, T } from "./ui";

// One question, whatever its type. `onAnswer` sends what the child chose;
// `locked` once the server has graded it (the choice stays visible).

export type Answer = string | string[];

function Choice({ label, state, onPress, letter }: { label: string; letter?: string; state: "idle" | "picked" | "right" | "wrong"; onPress?: () => void }) {
  const bg = { idle: color.card, picked: color.skySoft, right: color.greenSoft, wrong: color.redSoft }[state];
  const border = { idle: color.line, picked: color.sky, right: color.green, wrong: color.red }[state];
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: state !== "idle" }} onPress={onPress} disabled={!onPress} style={{ minHeight: 60, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: border, backgroundColor: bg, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md }}>
      {letter ? (
        <View style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: border, alignItems: "center", justifyContent: "center" }}>
          <T v="bodyBold">{letter}</T>
        </View>
      ) : null}
      <T read v="bodyBold" style={{ flex: 1 }}>
        {label}
      </T>
      {state === "right" ? <Ionicons name="checkmark-circle" size={26} color={color.green} /> : state === "wrong" ? <Ionicons name="close-circle" size={26} color={color.red} /> : null}
    </Pressable>
  );
}

export function QuestionView({ q, onAnswer, locked, verdict, mode }: { q: Question; onAnswer: (a: Answer) => void; locked: boolean; verdict: { correct: boolean } | null; mode: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setPicked(null);
    setText("");
    setOrder([]);
    setFlipped(false);
  }, [q.id]);

  const stateOf = (value: string): "idle" | "picked" | "right" | "wrong" => {
    if (picked !== value) return "idle";
    if (!verdict) return "picked";
    return verdict.correct ? "right" : "wrong";
  };

  const pick = (value: string) => {
    if (locked) return;
    setPicked(value);
    onAnswer(value);
  };

  // Cards (and short answers in card mode): flip, then say if you knew it.
  if (q.type === "carte" || (mode === "cartes" && (q.type === "courte" || q.type === "trous"))) {
    const back = q.back ?? null;
    return (
      <View style={{ gap: space.lg }}>
        <Pressable accessibilityRole="button" accessibilityLabel={flipped ? "Réponse" : "Retourner la carte"} onPress={() => setFlipped(true)} style={{ minHeight: 220, borderRadius: radius.lg, backgroundColor: flipped ? color.tealSoft : color.card, borderWidth: 2, borderBottomWidth: 6, borderColor: flipped ? color.teal : color.line, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md }}>
          <T v="label">{flipped ? "Réponse" : "Question"}</T>
          <T read v="h3" style={{ textAlign: "center" }}>
            {flipped ? back ?? "Dis la réponse à voix haute, puis vérifie avec la correction." : q.prompt}
          </T>
          {!flipped ? <T v="small">Touche pour retourner</T> : null}
        </Pressable>
        {flipped && !locked ? (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button tone="sun" icon="refresh" label="À revoir" onPress={() => pick("pas_su")} style={{ flex: 1 }} />
            <Button tone="teal" icon="checkmark" label="Je savais" onPress={() => pick("su")} style={{ flex: 1 }} />
          </View>
        ) : null}
      </View>
    );
  }

  switch (q.type) {
    case "qcm":
      return (
        <View style={{ gap: space.md }}>
          <T read v="h3">{q.prompt}</T>
          {q.choices!.map((c, i) => (
            <Choice key={i} letter={"ABCDE"[i]} label={c} state={stateOf(String(i))} onPress={locked ? undefined : () => pick(String(i))} />
          ))}
        </View>
      );
    case "vrai_faux":
      return (
        <View style={{ gap: space.md }}>
          <T read v="h3">{q.prompt}</T>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Choice label="Vrai" state={stateOf("vrai")} onPress={locked ? undefined : () => pick("vrai")} />
            </View>
            <View style={{ flex: 1 }}>
              <Choice label="Faux" state={stateOf("faux")} onPress={locked ? undefined : () => pick("faux")} />
            </View>
          </View>
        </View>
      );
    case "ordre": {
      const remaining = q.items!.filter((it) => !order.includes(it));
      return (
        <View style={{ gap: space.md }}>
          <T read v="h3">{q.prompt}</T>
          <T v="small">Touche les éléments dans le bon ordre.</T>
          <View style={{ gap: space.sm, minHeight: 40 }}>
            {order.map((it, i) => (
              <Pressable key={it} disabled={locked} onPress={() => setOrder(order.filter((x) => x !== it))} accessibilityRole="button" accessibilityLabel={`${i + 1}. ${it}, toucher pour retirer`} style={{ flexDirection: "row", gap: space.sm, alignItems: "center", backgroundColor: color.skySoft, borderRadius: radius.md, padding: space.md }}>
                <T v="bodyBold" style={{ color: color.skyDark, width: 22 }}>
                  {i + 1}.
                </T>
                <T read v="bodyBold" style={{ flex: 1 }}>
                  {it}
                </T>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {remaining.map((it) => (
              <Pressable key={it} disabled={locked} onPress={() => setOrder([...order, it])} accessibilityRole="button" style={{ borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: space.lg, paddingVertical: space.md }}>
                <T read v="bodyBold">{it}</T>
              </Pressable>
            ))}
          </View>
          {!locked ? <Button label="Valider" icon="checkmark" disabled={remaining.length > 0} onPress={() => onAnswer(order)} /> : null}
        </View>
      );
    }
    default: {
      // courte / trous
      const [before, after] = q.type === "trous" ? splitBlank(q.prompt) : [q.prompt, ""];
      return (
        <View style={{ gap: space.md }}>
          {q.type === "trous" ? (
            <T read v="h3">
              {before}
              <T read v="h3" style={{ color: color.brand }}>
                {" ____ "}
              </T>
              {after}
            </T>
          ) : (
            <T read v="h3">{q.prompt}</T>
          )}
          <TextInput
            value={text}
            onChangeText={setText}
            editable={!locked}
            placeholder="Ta réponse"
            placeholderTextColor={color.faint}
            accessibilityLabel="Ta réponse"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => text.trim() && !locked && onAnswer(text.trim())}
            style={{ minHeight: 56, borderRadius: radius.md, borderWidth: 2, borderColor: verdict ? (verdict.correct ? color.green : color.red) : color.line, backgroundColor: color.card, paddingHorizontal: 16, fontFamily: font.readBold, fontSize: readSize(size.lg), color: color.ink }}
          />
          {!locked ? <Button label="Valider" icon="checkmark" disabled={!text.trim()} onPress={() => onAnswer(text.trim())} /> : null}
        </View>
      );
    }
  }
}

function splitBlank(prompt: string): [string, string] {
  const i = prompt.indexOf("___");
  if (i < 0) return [prompt, ""];
  return [prompt.slice(0, i), prompt.slice(i).replace(/^_+/, "")];
}
