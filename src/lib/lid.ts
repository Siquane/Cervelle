import { useLocalSearchParams } from "expo-router";
import { useSession } from "../state/session";

/** The learner a screen is about: « me » for a child, the chosen child for a parent. */
export function useLid(): { lid: string; asParent: boolean } {
  const { lid } = useLocalSearchParams<{ lid?: string }>();
  const kind = useSession((s) => s.session?.kind);
  return { lid: kind === "child" ? "me" : lid || "me", asParent: kind === "parent" };
}
