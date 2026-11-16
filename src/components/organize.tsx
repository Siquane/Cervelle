import { useState } from "react";
import { Alert, Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import type { Reward } from "../api/types";
import { color, radius, space } from "../theme/tokens";
import { T } from "./ui";

/** A round tick box, big enough for small fingers. */
export function Check({ on, onPress, tint = color.green, label }: { on: boolean; onPress: () => void; tint?: string; label: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label} hitSlop={8} onPress={onPress}>
      <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={30} color={on ? tint : color.faint} />
    </Pressable>
  );
}

/** A title with an optional action on the right (« Tout voir »). */
export function Section({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <T v="h3" style={{ flex: 1 }}>
        {title}
      </T>
      {action ? (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}>
          <T v="bodyBold" style={{ color: color.brand }}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const base = new Date();
  base.setHours(Number(value.slice(0, 2)), Number(value.slice(3, 5)), 0, 0);
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <T v="bodyBold">{label}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value}`}
        onPress={() => setOpen(true)}
        style={{ minHeight: 54, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }}
      >
        <Ionicons name="time" size={20} color={color.brand} />
        <T v="bodyBold">{value}</T>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={base}
          mode="time"
          is24Hour
          minuteInterval={5}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, d) => {
            setOpen(false);
            if (event.type === "set" && d) onChange(toHHMM(d));
          }}
        />
      ) : null}
    </View>
  );
}

/** « +2 pièces » after a tick, and a party when the mascot grows. */
export function celebrate(r: Pick<Reward, "coins" | "levelUp">, what = "Bravo !") {
  if (r.levelUp) {
    Alert.alert("Cervelle grandit !", `Niveau ${r.levelUp.level} : ${r.levelUp.name}.${r.coins ? ` Et +${r.coins} pièces.` : ""}`);
  } else if (r.coins > 0) {
    Alert.alert(what, `+${r.coins} pièce${r.coins > 1 ? "s" : ""}`);
  }
}

/** A row of day chips (L M M J V S D). */
export function DayPicker({ value, onChange, multi = true }: { value: number[]; onChange: (v: number[]) => void; multi?: boolean }) {
  const letters = ["L", "M", "M", "J", "V", "S", "D"];
  const names = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  return (
    <View style={{ flexDirection: "row", gap: space.xs, justifyContent: "space-between" }}>
      {letters.map((l, i) => {
        const on = value.includes(i);
        return (
          <Pressable
            key={i}
            accessibilityRole={multi ? "checkbox" : "radio"}
            accessibilityState={multi ? { checked: on } : { selected: on }}
            accessibilityLabel={names[i]}
            onPress={() => onChange(multi ? (on ? value.filter((d) => d !== i) : [...value, i].sort()) : [i])}
            style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: on ? color.brand : color.card, borderWidth: 2, borderColor: on ? color.brandDark : color.line }}
          >
            <T v="bodyBold" style={{ color: on ? color.white : color.ink }}>
              {l}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
