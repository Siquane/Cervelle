import { useLocalSearchParams } from "expo-router";
import { useParentPrefs } from "../state/parentPrefs";
import { useSession } from "../state/session";

/**
 * The learner a screen is about: « me » for a child, the chosen child for a
 * parent (from the route, or the child selected in the parent space — the
 * tabs of the child space don't carry the route's parameters).
 */
export function useLid(): { lid: string; asParent: boolean } {
  const { lid } = useLocalSearchParams<{ lid?: string }>();
  const kind = useSession((s) => s.session?.kind);
  const selected = useParentPrefs((s) => s.learnerId);
  return { lid: kind === "child" ? "me" : lid || selected || "me", asParent: kind === "parent" };
}
