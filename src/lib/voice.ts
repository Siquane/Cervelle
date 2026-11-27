import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";

// Reading aloud with the phone's own voice: free, works offline, in French.
// One text at a time; any new reading stops the previous one.

let current: string | null = null;
const listeners = new Set<(key: string | null) => void>();
const emit = () => listeners.forEach((l) => l(current));

/** Reads `text` aloud; `key` lets a button know it is the one speaking. */
export function speak(key: string, text: string, opts: { slow?: boolean } = {}) {
  Speech.stop();
  current = key;
  emit();
  Speech.speak(text, {
    language: "fr-FR",
    rate: opts.slow ? (Platform.OS === "ios" ? 0.38 : 0.7) : Platform.OS === "ios" ? 0.5 : 0.95,
    onDone: () => {
      if (current === key) current = null;
      emit();
    },
    onStopped: () => {
      if (current === key) current = null;
      emit();
    },
    onError: () => {
      current = null;
      emit();
    },
  });
}

export function stopSpeaking() {
  Speech.stop();
  current = null;
  emit();
}

/** Which text is being read (its key), or null. */
export function useSpeaking(): string | null {
  const [key, setKey] = useState<string | null>(current);
  useEffect(() => {
    listeners.add(setKey);
    return () => {
      listeners.delete(setKey);
    };
  }, []);
  return key;
}

/** Stops reading when the screen goes away. */
export function useStopSpeakingOnLeave() {
  useEffect(() => () => stopSpeaking(), []);
}
