export type Level = "primaire" | "college" | "lycee" | "superieur" | "adulte";
export type Mastery = "new" | "review" | "mastered";
export type QuizMode = "qcm" | "cartes" | "interro" | "a_revoir";
export type QuestionType = "qcm" | "vrai_faux" | "carte" | "courte" | "trous" | "ordre";

export interface MascotLevel {
  level: number;
  name: string;
  xp: number;
  levelXp: number;
  nextLevelXp: number | null;
}

export interface Learner {
  id: string;
  name: string;
  level: Level;
  grade: string;
  color: string;
  memberId: string | null;
  coins: number;
  streak: number;
  bestStreak: number;
  mascot: MascotLevel;
  owned: string[];
  equipped: string[];
}

export interface RevisionCard {
  id: string;
  title: string;
  subject: string;
  icon: string;
  status: "processing" | "ready" | "failed";
  error: string | null;
  examDate: string | null;
  createdAt: string;
  createdBy: "parent" | "enfant";
  photoCount: number;
  counts: { mastered: number; review: number; new: number };
  progress: number;
}

export interface Sheet {
  notionId: string;
  parentTitle: string;
  title: string;
  essentiel: string;
  points: string[];
  vocabulaire: { terme: string; definition: string }[];
  exemple: string;
  retenir: string;
}

export interface RevisionDetail extends Omit<RevisionCard, "counts"> {
  summary: string;
  questionCount: number;
  steps: { sheets: boolean; quizBest: number | null; examBest: number | null };
  notions: { id: string; title: string; mastery: Mastery; children: { id: string; title: string; mastery: Mastery }[] }[];
  sheets: Sheet[];
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  notionId: string;
  notionTitle: string;
  choices?: string[];
  items?: string[];
  back?: string;
}

export interface AnswerResult {
  correct: boolean;
  expected: string;
  explanation: string;
  comment: string;
  mastery: Mastery;
  coins: number;
  xp: number;
  levelUp: MascotLevel | null;
}

export interface Missions {
  list: { id: string; label: string; done: boolean; progress: string | null }[];
  done: number;
  total: number;
  chestOpened: boolean;
  chestCoins: number;
}

export interface Home {
  learner: Learner;
  missions: Missions;
  revisions: RevisionCard[];
  dueReview: number;
}

export interface SessionResult {
  session: { id: string; coins: number; percent: number | null; score20: number | null };
  learner: Learner;
  streakIncreased: boolean;
  missions: Missions;
}

export interface Overview {
  learner: Learner;
  time: { last30Seconds: number; totalSeconds: number; changePercent: number; sessionsLast30: number; sessionsTotal: number };
  lastActiveAt: string | null;
  notions: { mastered: number; review: number; new: number };
  upcoming: RevisionCard[];
  revisions: RevisionCard[];
  recentSessions: { id: string; mode: string; seconds: number; correct: number; total: number; revisionTitle: string | null; createdAt: string }[];
}

export interface ShopItem {
  id: string;
  name: string;
  slot: "tete" | "visage" | "cou";
  price: number;
  owned: boolean;
  equipped: boolean;
}

export interface ExamAnalysis {
  note: string;
  resume: string;
  points_forts: string[];
  erreurs: { question: string; reponse_eleve: string; correction: string; explication: string; notion_id: string }[];
  conseils: string[];
}

export interface ExamReview {
  id: string;
  status: "processing" | "ready" | "failed";
  error: string | null;
  analysis: ExamAnalysis | null;
  revisionId: string | null;
  revisionTitle: string | null;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface UploadFile {
  data: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
}
