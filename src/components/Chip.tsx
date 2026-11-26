import { Pressable, Text } from "react-native";
import { color, font, radius, size } from "../theme/tokens";
import { withEmojis } from "./Emoji";

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 2, borderColor: on ? color.brand : color.line, backgroundColor: on ? color.brandSoft : color.card, justifyContent: "center" }}
    >
      <Text style={{ fontFamily: font.textBlack, fontSize: size.sm, color: on ? color.brandDark : color.ink }}>{withEmojis(label, size.sm)}</Text>
    </Pressable>
  );
}
