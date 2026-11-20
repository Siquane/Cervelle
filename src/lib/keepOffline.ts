import { api } from "../api/client";
import { cardsKey, learnerPath, revisionKey } from "../api/hooks";
import type { Question, RevisionDetail } from "../api/types";
import { hasOffline, saveOffline } from "./offline";

// Keeps every ready revision on the phone (its sheets and its memory cards),
// in the background, one at a time. A sheet does not change once written, so
// what is already kept is not fetched again.

const MAX = 40;
let running = false;

export async function keepOffline(lid: string, revisionIds: string[]) {
  if (running) return;
  running = true;
  try {
    for (const id of revisionIds.slice(0, MAX)) {
      try {
        if (!hasOffline(revisionKey(lid, id))) {
          const r = await api.get<{ revision: RevisionDetail }>(`${learnerPath(lid)}/revisions/${id}`);
          saveOffline(revisionKey(lid, id), r.revision);
        }
        if (!hasOffline(cardsKey(lid, id))) {
          const q = await api.get<{ questions: Question[] }>(`${learnerPath(lid)}/quiz?mode=cartes&revisionId=${id}`);
          saveOffline(cardsKey(lid, id), q.questions);
        }
      } catch {
        // No network or a revision removed meanwhile: try again next time.
        return;
      }
    }
  } finally {
    running = false;
  }
}
