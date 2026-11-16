import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { longDate } from "../lib/format";
import { color, radius, space } from "../theme/tokens";
import { T } from "./ui";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Optional date (the next test). */
export function DateField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <T v="bodyBold">{label}</T>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} : ${value ? longDate(value) : "aucune"}`}
          onPress={() => setOpen(true)}
          style={{ flex: 1, minHeight: 54, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <Ionicons name="calendar" size={20} color={color.brand} />
          <T v="bodyBold" style={{ color: value ? color.ink : color.faint }}>
            {value ? longDate(value) : "Pas de date"}
          </T>
        </Pressable>
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Retirer la date" hitSlop={10} onPress={() => onChange(null)}>
            <Ionicons name="close-circle" size={28} color={color.faint} />
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <DateTimePicker
          value={value ? new Date(`${value}T12:00:00`) : new Date()}
          mode="date"
          minimumDate={new Date()}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, d) => {
            setOpen(false);
            if (event.type === "set" && d) onChange(iso(d));
          }}
        />
      ) : null}
    </View>
  );
}
