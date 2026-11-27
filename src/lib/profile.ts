// « Quel élève es-tu ? » — a short questionnaire that finds where studying
// is hard (getting organised, focusing, getting started, remembering,
// understanding) and suggests the methods that help most. Computed on the
// phone; only the result goes to the server.

export type Dim = "organisation" | "concentration" | "motivation" | "memoire" | "comprehension";

export const DIM_LABEL: Record<Dim, string> = {
  organisation: "S'organiser",
  concentration: "Se concentrer",
  motivation: "Se lancer",
  memoire: "Retenir",
  comprehension: "Comprendre",
};

/** `hard: true` = agreeing means it's hard for you. */
export const QUESTIONS: { text: string; dim: Dim; hard: boolean }[] = [
  { text: "Quand j'ai beaucoup de devoirs, je les remets à plus tard.", dim: "motivation", hard: true },
  { text: "Je sais toujours ce que j'ai à faire pour demain.", dim: "organisation", hard: false },
  { text: "Mon téléphone ou le bruit me déconcentrent vite.", dim: "concentration", hard: true },
  { text: "J'oublie vite ce que j'ai appris la veille.", dim: "memoire", hard: true },
  { text: "Je relis ma leçon, mais je ne sais pas si je l'ai comprise.", dim: "comprehension", hard: true },
  { text: "J'arrive à travailler 20 minutes sans m'arrêter.", dim: "concentration", hard: false },
  { text: "Je commence mes révisions la veille de l'interro.", dim: "organisation", hard: true },
  { text: "Je retiens bien quand je me pose des questions.", dim: "memoire", hard: false },
  { text: "J'ai du mal à me mettre au travail.", dim: "motivation", hard: true },
  { text: "Je peux expliquer ma leçon à quelqu'un sans la regarder.", dim: "comprehension", hard: false },
];

export const ANSWERS = ["Pas du tout", "Un peu", "Plutôt oui", "Tout à fait"];

export type ProfileId = "tourbillon" | "papillon" | "marmotte" | "poisson" | "perroquet" | "hibou";

export const PROFILES: Record<ProfileId, { name: string; emoji: string; text: string }> = {
  tourbillon: { name: "Le tourbillon", emoji: "🌪️", text: "Plein d'énergie, mais tout arrive en même temps. Un plan simple va t'aider à souffler." },
  papillon: { name: "Le papillon", emoji: "🦋", text: "Curieux de tout, ton attention s'envole vite. Des petites séances sans distraction, c'est ton super-pouvoir." },
  marmotte: { name: "La marmotte", emoji: "🐹", text: "Le plus dur, c'est de commencer. Une fois lancé, tu avances bien. On va t'aider à démarrer." },
  poisson: { name: "Le poisson rouge", emoji: "🐠", text: "Tu comprends vite, mais ça s'envole. Revoir souvent et un peu à la fois va tout changer." },
  perroquet: { name: "Le perroquet", emoji: "🦜", text: "Tu apprends par cœur, mais pas toujours le sens. Explique avec tes mots pour vraiment comprendre." },
  hibou: { name: "Le hibou", emoji: "🦉", text: "Tu as déjà de bonnes habitudes. Garde le rythme et teste de nouvelles méthodes pour aller plus loin." },
};

const PROFILE_OF: Record<Dim, ProfileId> = { organisation: "tourbillon", concentration: "papillon", motivation: "marmotte", memoire: "poisson", comprehension: "perroquet" };

export type Family = "Comprendre" | "Apprendre" | "Réviser" | "S'organiser" | "Se concentrer";

export interface Method {
  id: string;
  title: string;
  family: Family;
  how: string;
  dims: Dim[];
  /** Where to try it in Cervelle. */
  route: "minuteur" | "todos" | "agenda" | "habits" | "quiz_revoir" | "quiz_cartes" | "assistant" | "revision" | "amis" | null;
}

export const METHODS: Method[] = [
  { id: "pomodoro", title: "Le minuteur Pomodoro", family: "Se concentrer", how: "Travaille 15 à 25 minutes sans rien d'autre, puis fais une vraie pause. Recommence.", dims: ["concentration", "motivation"], route: "minuteur" },
  { id: "coin_calme", title: "Le coin calme", family: "Se concentrer", how: "Téléphone dans une autre pièce, bureau rangé, tout ce qu'il faut à portée de main.", dims: ["concentration"], route: null },
  { id: "petites_etapes", title: "Les petites étapes", family: "S'organiser", how: "Coupe un gros devoir en morceaux de 10 minutes. Commence par le plus facile.", dims: ["motivation", "organisation"], route: "todos" },
  { id: "matrice", title: "Urgent ou important ?", family: "S'organiser", how: "Range tes tâches en 4 cases. Fais d'abord ce qui est urgent ET important.", dims: ["organisation"], route: "todos" },
  { id: "planning", title: "Le planning de la semaine", family: "S'organiser", how: "Note tes interros et place tes révisions plusieurs jours avant, pas la veille.", dims: ["organisation"], route: "agenda" },
  { id: "routine", title: "La routine du soir", family: "S'organiser", how: "Même heure, même endroit, chaque jour. Au bout de 2 semaines, ça devient facile.", dims: ["motivation", "organisation"], route: "habits" },
  { id: "espacee", title: "La révision espacée", family: "Réviser", how: "Revois une leçon le lendemain, puis 3 jours après, puis une semaine après.", dims: ["memoire"], route: "quiz_revoir" },
  { id: "cartes", title: "Les fiches-questions", family: "Apprendre", how: "Une question devant, la réponse derrière. Garde de côté celles que tu rates.", dims: ["memoire"], route: "quiz_cartes" },
  { id: "auto_interro", title: "Je m'interroge", family: "Réviser", how: "Ferme ton cahier et réponds à des questions. C'est plus efficace que relire.", dims: ["memoire", "comprehension"], route: "revision" },
  { id: "explique", title: "Explique-le à quelqu'un", family: "Comprendre", how: "Raconte ta leçon avec tes mots, comme à un petit frère. Là où tu bloques, relis.", dims: ["comprehension"], route: "assistant" },
  { id: "fiche", title: "La fiche résumé", family: "Comprendre", how: "Une page par leçon : l'essentiel, les mots clés, un exemple.", dims: ["comprehension", "memoire"], route: "revision" },
  { id: "carte_mentale", title: "La carte mentale", family: "Comprendre", how: "Le thème au centre, des branches pour les idées, des couleurs et des dessins.", dims: ["comprehension", "organisation"], route: null },
  { id: "defi", title: "Le défi entre amis", family: "Se concentrer", how: "Lance un défi à un ami : qui travaillera le plus cette semaine ?", dims: ["motivation"], route: "amis" },
];

export interface ProfileResult {
  profile: ProfileId;
  /** Difficulty per dimension, 0 (facile) to 100 (difficile). */
  scores: Record<Dim, number>;
  /** Best methods first, with how much they fit (40–100 %). */
  methods: { id: string; fit: number }[];
}

/** `answers[i]` = index in ANSWERS (0–3) for QUESTIONS[i]. */
export function computeProfile(answers: number[]): ProfileResult {
  const sum: Record<Dim, number[]> = { organisation: [], concentration: [], motivation: [], memoire: [], comprehension: [] };
  QUESTIONS.forEach((q, i) => {
    const a = Math.max(0, Math.min(3, answers[i] ?? 1));
    sum[q.dim].push(q.hard ? a : 3 - a);
  });
  const scores = Object.fromEntries(
    (Object.keys(sum) as Dim[]).map((d) => [d, Math.round((sum[d].reduce((n, v) => n + v, 0) / (sum[d].length * 3)) * 100)]),
  ) as Record<Dim, number>;
  const order: Dim[] = ["motivation", "concentration", "organisation", "memoire", "comprehension"];
  const top = order.reduce((best, d) => (scores[d] > scores[best] ? d : best), order[0]);
  const profile: ProfileId = scores[top] < 40 ? "hibou" : PROFILE_OF[top];
  const methods = METHODS.map((m) => {
    const need = m.dims.reduce((n, d, i) => n + scores[d] * (i === 0 ? 1 : 0.6), 0) / m.dims.reduce((n, _, i) => n + (i === 0 ? 1 : 0.6), 0);
    return { id: m.id, fit: Math.round(40 + need * 0.6) };
  })
    .sort((a, b) => b.fit - a.fit || METHODS.findIndex((m) => m.id === a.id) - METHODS.findIndex((m) => m.id === b.id))
    .slice(0, 6);
  return { profile, scores, methods };
}

export const methodById = (id: string) => METHODS.find((m) => m.id === id) ?? null;
