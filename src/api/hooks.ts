import { focusManager, QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { api } from "./client";
import { withOffline } from "../lib/offline";
import type { Dictation, MindMap, MentalProblem, MentalState, Pride, Mastery, Advent, AiUsageReport, Album, TreasureMap, Agenda, Badges, Goal, StarPath, Duel, Device, ExamReview, FriendRequest, Friends, Habit, Home, JournalEntry, Learner, Overview, Programme, RevisionCard, RevisionDetail, Shop, Stats, Todo, WeeklyReport, Homework, BrevetHome, BrevetSujet } from "./types";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

// React Query only knows about the browser's focus: tell it when the phone app
// goes to the background (polls pause) and comes back (stale screens refresh).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (s) => focusManager.setFocused(s === "active"));
}

const L = (lid: string) => `/cervelle/learners/${lid}`;

export const keys = {
  learners: ["learners"] as const,
  home: (lid: string) => ["home", lid] as const,
  overview: (lid: string) => ["overview", lid] as const,
  revisions: (lid: string) => ["revisions", lid] as const,
  revision: (lid: string, id: string) => ["revision", lid, id] as const,
  shop: (lid: string) => ["shop", lid] as const,
  exams: (lid: string) => ["exams", lid] as const,
  exam: (lid: string, id: string) => ["exam", lid, id] as const,
  devices: (lid: string) => ["devices", lid] as const,
  programme: (lid: string) => ["programme", lid] as const,
  agenda: (lid: string) => ["agenda", lid] as const,
  todos: (lid: string) => ["todos", lid] as const,
  habits: (lid: string) => ["habits", lid] as const,
  journal: (lid: string) => ["journal", lid] as const,
  stats: (lid: string) => ["stats", lid] as const,
  friends: (lid: string) => ["friends", lid] as const,
  friendRequests: ["friendRequests"] as const,
  badges: (lid: string) => ["badges", lid] as const,
  duels: (lid: string) => ["duels", lid] as const,
  goals: (lid: string) => ["goals", lid] as const,
  stars: (lid: string, month: string) => ["stars", lid, month] as const,
  advent: (lid: string) => ["advent", lid] as const,
  islands: (lid: string) => ["islands", lid] as const,
  album: (lid: string) => ["album", lid] as const,
  albumPending: (lid: string) => ["albumPending", lid] as const,
};

export const useAgenda = (lid: string) => useQuery({ queryKey: keys.agenda(lid), queryFn: () => api.get<Agenda>(`${L(lid)}/agenda`) });
export const useTodos = (lid: string) => useQuery({ queryKey: keys.todos(lid), queryFn: () => api.get<{ todos: Todo[] }>(`${L(lid)}/todos`).then((r) => r.todos) });
export const useHabits = (lid: string) => useQuery({ queryKey: keys.habits(lid), queryFn: () => api.get<{ today: string; habits: Habit[] }>(`${L(lid)}/habits`) });
export const useJournal = (lid: string) => useQuery({ queryKey: keys.journal(lid), queryFn: () => api.get<{ today: string; entries: JournalEntry[] }>(`${L(lid)}/journal`) });
/** Asking also saves the new badges and pays their coins (server side). */
export const useBadges = (lid: string) => useQuery({ queryKey: keys.badges(lid), queryFn: () => api.get<Badges>(`${L(lid)}/badges`) });

export const useAiUsage = (month: string) => useQuery({ queryKey: ["aiUsage", month], queryFn: () => api.get<AiUsageReport>(`/cervelle/usage?month=${month}`) });

export const useWeekly = (lid: string, week: string) =>
  useQuery({ queryKey: ["weekly", lid, week], enabled: !!lid, queryFn: () => api.get<WeeklyReport>(`${L(lid)}/weekly?week=${week}`) });

export const useDuels = (lid: string) => useQuery({ queryKey: keys.duels(lid), queryFn: () => api.get<{ duels: Duel[] }>(`${L(lid)}/duels`).then((r) => r.duels), refetchInterval: 60_000 });

/** Asking also pays the steps reached (server side). `month` « AAAA-MM », empty for this month. */
export const useStars = (lid: string, month = "") => useQuery({ queryKey: keys.stars(lid, month), queryFn: () => api.get<StarPath>(`${L(lid)}/stars${month ? `?month=${month}` : ""}`) });

/** Calendrier de l'Avent ; null hors saison (du 20 novembre au 6 janvier). */
export const useAdvent = (lid: string) => useQuery({ queryKey: keys.advent(lid), enabled: !!lid, queryFn: () => api.get<{ advent: Advent | null }>(`${L(lid)}/advent`).then((r) => r.advent) });

/** Asking also pays a newly explored island (server side). */
export const useIslands = (lid: string) => useQuery({ queryKey: keys.islands(lid), enabled: !!lid, queryFn: () => api.get<TreasureMap>(`${L(lid)}/islands`) });

/** Asking draws the cards waiting (server side). */
export const useAlbum = (lid: string) => useQuery({ queryKey: keys.album(lid), enabled: !!lid, queryFn: () => api.get<Album>(`${L(lid)}/album`) });
/** How many cards wait to be drawn, without drawing them. */
export const useAlbumPending = (lid: string) => useQuery({ queryKey: keys.albumPending(lid), enabled: !!lid, queryFn: () => api.get<{ pending: number }>(`${L(lid)}/album?peek=1`).then((r) => r.pending) });

export const useGoals = (lid: string) => useQuery({ queryKey: keys.goals(lid), enabled: !!lid, queryFn: () => api.get<{ goals: Goal[] }>(`${L(lid)}/goals`).then((r) => r.goals) });

export const useStats = (lid: string) => useQuery({ queryKey: keys.stats(lid), queryFn: () => api.get<Stats>(`${L(lid)}/stats`) });
export const useFriends = (lid: string) => useQuery({ queryKey: keys.friends(lid), queryFn: () => api.get<Friends>(`${L(lid)}/friends`), refetchInterval: 60_000 });
export const useFriendRequests = (enabled = true) =>
  useQuery({ queryKey: keys.friendRequests, enabled, queryFn: () => api.get<{ requests: FriendRequest[] }>("/cervelle/friend-requests").then((r) => r.requests) });

export const useProgramme = (lid: string) => useQuery({ queryKey: keys.programme(lid), queryFn: () => api.get<Programme>(`${L(lid)}/programme`) });

export const useLearners = (enabled = true) =>
  useQuery({ queryKey: keys.learners, enabled, queryFn: () => api.get<{ learners: Learner[] }>("/cervelle/learners").then((r) => r.learners) });

export const useHome = (lid: string) => useQuery({ queryKey: keys.home(lid), queryFn: () => withOffline(`home-${lid}`, () => api.get<Home>(`${L(lid)}/home`)) });

export const useOverview = (lid: string | null) =>
  useQuery({ queryKey: keys.overview(lid ?? ""), enabled: !!lid, queryFn: () => api.get<Overview>(`${L(lid!)}/overview`) });

/** File names of the copies kept for offline revision. */
export const revisionKey = (lid: string, id: string) => `revision-${lid}-${id}`;
export const cardsKey = (lid: string, id: string) => `cartes-${lid}-${id}`;

/** Revisions; polls while one is still being prepared. */
export const useRevisions = (lid: string) =>
  useQuery({
    queryKey: keys.revisions(lid),
    queryFn: () => withOffline(`revisions-${lid}`, () => api.get<{ revisions: RevisionCard[] }>(`${L(lid)}/revisions`).then((r) => r.revisions)),
    refetchInterval: (q) => (q.state.data?.some((r) => r.status === "processing") ? 4000 : false),
  });

export const useRevision = (lid: string, id: string) =>
  useQuery({
    queryKey: keys.revision(lid, id),
    queryFn: () => withOffline(revisionKey(lid, id), () => api.get<{ revision: RevisionDetail }>(`${L(lid)}/revisions/${id}`).then((r) => r.revision)),
    // « Aide-moi à… » without a course asks for nothing (it used to request revision "").
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false),
  });

export const useShop = (lid: string) => useQuery({ queryKey: keys.shop(lid), queryFn: () => api.get<Shop>(`${L(lid)}/shop`) });

export const useExams = (lid: string) =>
  useQuery({
    queryKey: keys.exams(lid),
    queryFn: () => api.get<{ examReviews: ExamReview[] }>(`${L(lid)}/exam-reviews`).then((r) => r.examReviews),
    refetchInterval: (q) => (q.state.data?.some((e) => e.status === "processing") ? 4000 : false),
  });

export const useExam = (lid: string, id: string) =>
  useQuery({
    queryKey: keys.exam(lid, id),
    queryFn: () => api.get<{ examReview: ExamReview }>(`${L(lid)}/exam-reviews/${id}`).then((r) => r.examReview),
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false),
  });

export const useDevices = (lid: string) =>
  useQuery({ queryKey: keys.devices(lid), queryFn: () => api.get<{ devices: Device[] }>(`${L(lid)}/devices`).then((r) => r.devices) });

/** After anything that changes progress, coins or revisions. */
export function useRefreshLearner(lid: string) {
  const qc = useQueryClient();
  return () => {
    for (const k of [keys.home(lid), keys.revisions(lid), keys.overview(lid), keys.shop(lid), ["revision", lid], keys.learners, keys.programme(lid), keys.stats(lid), keys.friends(lid), keys.badges(lid), keys.duels(lid), ["stars", lid], keys.goals(lid), keys.advent(lid), keys.islands(lid), keys.albumPending(lid)]) {
      qc.invalidateQueries({ queryKey: k });
    }
  };
}

export const learnerPath = L;

export const useHomeworkList = (lid: string) => useQuery({ queryKey: ["homework", lid], queryFn: () => api.get<{ homework: Homework[] }>(`${L(lid)}/homework`).then((r) => r.homework) });
export const useHomework = (lid: string, id: string) =>
  useQuery({ queryKey: ["homework", lid, id], enabled: !!id, queryFn: () => api.get<{ homework: Homework }>(`${L(lid)}/homework/${id}`).then((r) => r.homework) });
export const useBrevet = (lid: string) =>
  useQuery({
    queryKey: ["brevet", lid],
    queryFn: () => api.get<BrevetHome>(`${L(lid)}/brevet`),
    refetchInterval: (q) => (q.state.data?.sujets.some((s) => s.status === "processing") ? 4000 : false),
  });
export const useBrevetSujet = (lid: string, id: string) =>
  useQuery({
    queryKey: ["brevet", lid, id],
    enabled: !!id,
    queryFn: () => api.get<{ sujet: BrevetSujet }>(`${L(lid)}/brevet/sujets/${id}`).then((r) => r.sujet),
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false),
  });
export { useMutation, useQueryClient };

// ─── Dictée, carte mentale, calcul mental, journal de fierté ─────────────
export const useDictations = (lid: string) =>
  useQuery({ queryKey: ["dictations", lid], enabled: !!lid, queryFn: () => api.get<{ dictations: Dictation[]; stars: number }>(`${L(lid)}/dictations`) });
export const useMindMap = (lid: string, revisionId: string) =>
  useQuery({
    queryKey: ["mindmap", lid, revisionId],
    enabled: !!lid && !!revisionId,
    retry: false,
    staleTime: Infinity,
    queryFn: () => api.get<{ map: MindMap; mastery: Record<string, Mastery> }>(`${L(lid)}/revisions/${revisionId}/mindmap`),
  });
export const useMental = (lid: string) =>
  useQuery({ queryKey: ["mental", lid], enabled: !!lid, gcTime: 0, queryFn: () => api.get<MentalState & { problems: MentalProblem[]; stars: number }>(`${L(lid)}/mental`) });
export const usePride = (lid: string, week?: string) =>
  useQuery({ queryKey: ["pride", lid, week ?? ""], enabled: !!lid, queryFn: () => api.get<{ pride: Pride; stars: number }>(`${L(lid)}/pride${week ? `?week=${week}` : ""}`) });
