export type Level = "primaire" | "college" | "lycee" | "superieur" | "adulte";
export type Mastery = "new" | "review" | "mastered";
export type QuizMode = "qcm" | "cartes" | "interro" | "a_revoir" | "express";
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
  timer: { focus: number; pause: number };
  studyProfile: { profile: string; scores: Record<string, number>; methods: string[]; at?: string } | null;
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
  programmeChapterId: string | null;
  progress: number;
}

export interface Sheet {
  notionId: string;
  fromProgramme?: boolean;
  parentTitle: string;
  title: string;
  essentiel: string;
  points: string[];
  vocabulaire: { terme: string; definition: string }[];
  exemple: string;
  retenir: string;
}

export interface RevisionDetail extends Omit<RevisionCard, "counts" | "programmeChapterId"> {
  programme: { chapterId: string; chapter: string; subject: string; grade: string } | null;
  summary: string;
  questionCount: number;
  steps: { sheets: boolean; quizBest: number | null; examBest: number | null };
  notions: { id: string; title: string; mastery: Mastery; children: { id: string; title: string; mastery: Mastery; fromProgramme: boolean }[] }[];
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

export type ShopSlot = "tete" | "visage" | "cou" | "tenue" | "main" | "couleur" | "decor";

export interface ShopItem {
  id: string;
  name: string;
  slot: ShopSlot;
  price: number;
  /** saison: on sale only part of the year; legendaire: very expensive; badge: won with a badge. */
  kind: "normal" | "saison" | "legendaire" | "badge" | "chemin";
  /** saison: « MM-DD » first and last day. */
  season: [string, string] | null;
  /** badge: the badge's name. */
  badge: string | null;
  /** badge / chemin: what to do to win it, in one sentence (null for items that are bought). */
  how?: string | null;
  onSale: boolean;
  owned: boolean;
  equipped: boolean;
}

export interface Shop {
  coins: number;
  items: ShopItem[];
  /** 3 saved outfits (item ids), null when empty. */
  outfits: (string[] | null)[];
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

export interface ProgrammeChapter {
  id: string;
  title: string;
  notions: string[];
  revisions: { id: string; title: string; progress: number }[];
  status: "todo" | "started" | "mastered";
}

export interface Programme {
  available: boolean;
  grade: string;
  schoolYear: string;
  subjects: { subject: string; source: string; verified: boolean; cycleWide: boolean; chapters: ProgrammeChapter[] }[];
}

// ─── S'organiser ─────────────────────────────────────────────────────────

export type EventKind = "cours" | "interro" | "devoir" | "revision" | "activite" | "maison" | "sante" | "travail";

export interface AgendaEvent {
  id: string;
  title: string;
  kind: EventKind;
  weekday: number | null;
  day: string | null;
  start: string;
  end: string;
  room: string;
  createdBy: "parent" | "enfant";
  source: "cervelle" | "passerelle";
  synced: boolean;
  /** Catégorie de la tâche Passerelle (« École », « Maison »…), pour ce qui vient de Passerelle. */
  category?: string | null;
}

export interface AgendaExam {
  id: string;
  title: string;
  subject: string;
  day: string;
}

export interface Agenda {
  events: AgendaEvent[];
  exams: AgendaExam[];
  canSync: boolean;
}

export interface TimetableSlot {
  weekday: number;
  start: string;
  end: string;
  title: string;
  room: string;
}

export interface Todo {
  id: string;
  title: string;
  urgent: boolean;
  important: boolean;
  dueDay: string | null;
  done: boolean;
  doneAt: string | null;
  createdBy: "parent" | "enfant";
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  emoji: string;
  color: string;
  days: number[];
  createdBy: "parent" | "enfant";
  /** Day it was created. */
  since: string;
  checked: string[];
}

export interface JournalEntry {
  day: string;
  mood: number;
  learned: string;
  proud: string;
  hard: string;
}

export interface Reward {
  coins: number;
  xp: number;
  learner: Learner;
  levelUp?: MascotLevel | null;
  missions?: Missions;
}

export interface FocusResult extends Reward {
  counted: boolean;
  streakIncreased: boolean;
}

export interface Stats {
  days: { day: string; minutes: number }[];
  week: { day: string; minutes: number }[];
  totals: {
    minutes: number;
    sessions: number;
    minutes30: number;
    weekMinutes: number;
    activeDays: number;
    todosDone: number;
    habitChecks: number;
    journalDays: number;
    notionsMastered: number;
    streak: number;
    bestStreak: number;
  };
  subjects: { subject: string; minutes: number }[];
}

export interface PublicLearner {
  id: string;
  name: string;
  color: string;
  equipped: string[];
  level: number;
}

export interface BoardRow extends PublicLearner {
  weekMinutes: number;
  me: boolean;
  sibling: boolean;
  friendshipId: string | null;
}

export interface Friends {
  code: string;
  week: string;
  board: BoardRow[];
  pending: { id: string; name: string; outgoing: boolean }[];
  cheers: { id: string; fromName: string; kind: string; emoji: string; label: string; createdAt: string }[];
  cheerKinds: { id: string; emoji: string; label: string }[];
  challenges: {
    id: string;
    week: string;
    status: "pending" | "active" | "done";
    sentByMe: boolean;
    other: PublicLearner;
    myMinutes: number;
    theirMinutes: number;
    result: "won" | "lost" | "tie" | "none" | null;
    prize: number;
  }[];
}

export interface FriendRequest {
  id: string;
  child: { id: string; name: string };
  other: { name: string; grade: string; level: Level };
  outgoing: boolean;
  otherApproved: boolean;
  createdAt: string;
}

export type BadgeShape = "star" | "shield" | "hexagon" | "round" | "flower" | "diamond";

export interface BadgeSuccess {
  id: string;
  label: string;
  icon: string;
  shape: BadgeShape;
  /** 0 (pas encore) à 3 (or). */
  tier: number;
  tiers: number[];
  value: number;
  next: { target: number; left: string; describe: string } | null;
  describe: string;
  coins: number[];
  isNew: boolean;
}

export interface BadgeWindow {
  key: string;
  family: "saison" | "fete" | "chemin";
  label: string;
  icon: string;
  shape: BadgeShape;
  earned: boolean;
  when: "now" | "soon" | "past";
  days: number;
  needs: number;
  from: string;
  to: string;
  hint: string;
  coins: number;
  isNew: boolean;
}

export interface Badges {
  records: { id: string; label: string; icon: string; value: number; unit: string }[];
  successes: BadgeSuccess[];
  windows: BadgeWindow[];
  newCount: number;
  earnedCount: number;
  coinsEarned: number;
  added: string[];
}

export interface WeeklyReport {
  name: string;
  from: string;
  to: string;
  minutes: number;
  minutesBefore: number;
  activeDays: number;
  perDay: { day: string; minutes: number }[];
  quizzes: number;
  quizAverage: number | null;
  answers: number;
  mastered: number;
  toReview: { title: string; revisionId: string; revision: string; subject: string }[];
  exams: { id: string; title: string; subject: string; day: string; examBest: number | null; quizBest: number | null }[];
  subjects: { subject: string; minutes: number }[];
  badges: { key: string; label: string }[];
  streak: number;
}

export interface Duel {
  id: string;
  title: string;
  friend: { name: string; color: string; equipped: string[] };
  sentByMe: boolean;
  status: "open" | "done" | "expired";
  myScore: number | null;
  theirScore: number | null;
  theyPlayed: boolean;
  /** « progress »: bonus for progressing since my last duel; « finished »: both played. */
  result: "progress" | "finished" | null;
  total: number;
  createdAt: string;
}

export interface DuelQuestion {
  id: string;
  type: "qcm" | "vrai_faux";
  prompt: string;
  choices: string[];
}

export interface DuelResult {
  score: number;
  total: number;
  theirScore: number | null;
  result: "progress" | "finished" | null;
  coins: number;
  corrections: { questionId: string; correct: boolean; expected: string }[];
}

/** « none » : une case du chemin sans récompense (il y en a une toutes les 5 cases). */
export type StarReward = { type: "coins"; coins: number } | { type: "chest" } | { type: "item" } | { type: "none" };

export interface StarPath {
  month: string;
  theme: { id: "espace" | "ocean" | "jungle" | "nuit"; label: string; item: string; itemName: string };
  stars: number;
  end: number;
  breakdown: { revision: number; regularite: number; missions: number; defis: number };
  rules: { quiz: number; effort: number; interro: number; day: number; week: number; chest: number; win: number; badge: number };
  steps: { at: number; reward: StarReward; reached: boolean; result: { coins: number; item: string | null; itemName: string | null } | null }[];
  fresh: { at: number; coins: number; item: string | null; itemName: string | null }[];
}

export interface Goal {
  id: string;
  kind: "jours" | "etoiles";
  target: number;
  reward: string;
  current: number;
  label: string;
  until: string | null;
  reached: boolean;
  wins: number;
}

export type UsageKind = "revision" | "exam" | "assistant" | "grading" | "timetable" | "homework" | "brevet";
export interface AiUsageReport {
  month: string;
  /** Dollars. */
  total: number;
  byKind: { kind: UsageKind; calls: number; measured: number; cost: number; average: number | null; outputTokens: number }[];
  byLearner: { id: string; name: string; calls: number; cost: number }[];
}

/** « Aide aux devoirs » : the solution never reaches the phone. */
export interface Homework {
  id: string;
  subject: string;
  instructions: string;
  createdAt: string;
  solved: number;
  questions: { index: number; prompt: string; hints: string[]; hintsLeft: number; attempts: number; solved: boolean; lastMessage: string }[];
}

export type BrevetKey = "francais" | "maths" | "histoire" | "sciences";
export interface BrevetSujet {
  id: string;
  subject: BrevetKey;
  label: string;
  status: "processing" | "ready" | "failed";
  error: string | null;
  title: string;
  minutes: number;
  createdAt: string;
  exercises: { title: string; points: number; documents: string; questions: { prompt: string; points: number; correction: string; advice: string }[] }[];
}
export interface BrevetHome {
  date: string;
  daysLeft: number;
  subjects: { key: BrevetKey; label: string; revisions: number }[];
  sujets: BrevetSujet[];
}
