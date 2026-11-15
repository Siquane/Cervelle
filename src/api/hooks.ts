import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { Device, ExamReview, Home, Learner, Overview, RevisionCard, RevisionDetail, ShopItem } from "./types";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

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
};

export const useLearners = (enabled = true) =>
  useQuery({ queryKey: keys.learners, enabled, queryFn: () => api.get<{ learners: Learner[] }>("/cervelle/learners").then((r) => r.learners) });

export const useHome = (lid: string) => useQuery({ queryKey: keys.home(lid), queryFn: () => api.get<Home>(`${L(lid)}/home`) });

export const useOverview = (lid: string | null) =>
  useQuery({ queryKey: keys.overview(lid ?? ""), enabled: !!lid, queryFn: () => api.get<Overview>(`${L(lid!)}/overview`) });

/** Revisions; polls while one is still being prepared. */
export const useRevisions = (lid: string) =>
  useQuery({
    queryKey: keys.revisions(lid),
    queryFn: () => api.get<{ revisions: RevisionCard[] }>(`${L(lid)}/revisions`).then((r) => r.revisions),
    refetchInterval: (q) => (q.state.data?.some((r) => r.status === "processing") ? 4000 : false),
  });

export const useRevision = (lid: string, id: string) =>
  useQuery({
    queryKey: keys.revision(lid, id),
    queryFn: () => api.get<{ revision: RevisionDetail }>(`${L(lid)}/revisions/${id}`).then((r) => r.revision),
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false),
  });

export const useShop = (lid: string) => useQuery({ queryKey: keys.shop(lid), queryFn: () => api.get<{ coins: number; items: ShopItem[] }>(`${L(lid)}/shop`) });

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
    for (const k of [keys.home(lid), keys.revisions(lid), keys.overview(lid), keys.shop(lid), ["revision", lid], keys.learners]) {
      qc.invalidateQueries({ queryKey: k });
    }
  };
}

export const learnerPath = L;
export { useMutation, useQueryClient };
