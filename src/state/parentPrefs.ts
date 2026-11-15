import { create } from "zustand";

/** The child selected in the parent space (kept while the app is open). */
export const useParentPrefs = create<{ learnerId: string | null; setLearner: (id: string) => void }>((set) => ({
  learnerId: null,
  setLearner: (learnerId) => set({ learnerId }),
}));
