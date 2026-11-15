import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../theme/tokens";

/** A gold coin with a star: Cervelle's currency. */
export function Coin({ size: px = 20 }: { size?: number }) {
  return (
    <View style={{ width: px, height: px, borderRadius: px / 2, backgroundColor: color.sun, borderWidth: Math.max(2, px / 10), borderColor: color.sunDark, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="star" size={px * 0.5} color={color.white} />
    </View>
  );
}

