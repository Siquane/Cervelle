import { TextInput, TextInputProps, View } from "react-native";
import { color, font, radius, size } from "../theme/tokens";
import { T } from "./ui";

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="bodyBold">{label}</T>
      <TextInput
        placeholderTextColor={color.faint}
        {...props}
        accessibilityLabel={label}
        style={[
          { minHeight: 54, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 16, fontFamily: font.textSemi, fontSize: size.md, color: color.ink },
          props.multiline && { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
          props.style,
        ]}
      />
      {hint ? <T v="small">{hint}</T> : null}
    </View>
  );
}
