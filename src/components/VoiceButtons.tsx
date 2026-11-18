import { useEffect, useState } from "react";
import { Alert, Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { speak, stopSpeaking, useSpeaking } from "../lib/voice";
import { color } from "../theme/tokens";

/** 🔊 Reads `text` aloud; touching it again stops. */
export function SpeakButton({ id, text, size = 26 }: { id: string; text: string; size?: number }) {
  const speaking = useSpeaking() === id;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={speaking ? "Arrêter la lecture" : "Lire à voix haute"}
      hitSlop={10}
      onPress={() => (speaking ? stopSpeaking() : speak(id, text))}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: speaking ? color.brandSoft : "transparent" }}
    >
      <Ionicons name={speaking ? "stop-circle" : "volume-high"} size={size} color={color.brand} />
    </Pressable>
  );
}

/**
 * 🎤 Say the answer instead of typing it. The phone turns speech into text
 * (French); the text goes into the answer field, where it can be corrected
 * before « Valider ». Hidden where the phone can't do it.
 */
export function MicButton({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    try {
      setAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
    } catch {
      setAvailable(false);
    }
  }, []);

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (e) => {
    const t = e.results[0]?.transcript;
    if (t) onText(t.trim());
  });
  useSpeechRecognitionEvent("error", () => setListening(false));

  if (!available) return null;

  const toggle = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    stopSpeaking();
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Micro", "Pour répondre à voix haute, autorise le micro dans les réglages du téléphone.");
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: "fr-FR", interimResults: true, continuous: false });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listening ? "Arrêter d'écouter" : "Répondre à voix haute"}
      disabled={disabled}
      onPress={toggle}
      style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: listening ? color.brandFill : color.card, borderWidth: 2, borderColor: listening ? color.brandEdge : color.line, opacity: disabled ? 0.5 : 1 }}
    >
      <Ionicons name={listening ? "mic" : "mic-outline"} size={26} color={listening ? color.white : color.brand} />
    </Pressable>
  );
}
