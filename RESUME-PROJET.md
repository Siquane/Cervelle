# Revue de projet — Cervelle

À lire en premier dans une nouvelle session. Remplace l'historique des
conversations précédentes. Dernière mise à jour : 16 novembre 2026.

## En une phrase

Appli Android de révision : l'élève (ou un parent) photographie une leçon,
Claude en tire les notions, des fiches et des quiz calés sur le programme de
l'Éducation nationale ; un espace parent suit les progrès. Inspirée, pour les
fonctionnalités seulement, de l'appli Baobab (rien de son code ni de son
design n'est repris).

## Où en est-on

| Élément | État |
|---|---|
| Serveur (routes `/cervelle/*`) | Fait, testé. PR **Siquane/Appli-planning-familial#41**, non fusionnée |
| Appli Expo | Fait, testée en web local. PR **Siquane/cervelle#1**, CI verte, non fusionnée |
| Programme officiel | CM2 et 5e, toutes matières, relu sur les textes officiels |
| Clé Claude sur Render | À vérifier : `ANTHROPIC_API_KEY` (même clé que les menus de Passerelle) |
| Secret `EXPO_TOKEN` du dépôt cervelle | À ajouter par l'utilisatrice |
| APK | Jamais compilé (workflow « EAS Build (Android APK) ») |
| Essai avec le vrai Claude | Jamais fait : tous les tests simulent Claude |

Branches de travail : `ccr-80182f3f-ln4dhr` dans les deux dépôts.

**Prochaines étapes, dans l'ordre** : fusionner #41 (Render redéploie) →
vérifier la clé → fusionner cervelle#1 → ajouter `EXPO_TOKEN` → lancer EAS
Build → installer → tester avec une vraie leçon et ajuster les consignes
données à Claude.

## Architecture

```
Appli Cervelle (dépôt Siquane/cervelle, Expo SDK 58)
        │  HTTPS, jeton parent Passerelle ou jeton d'appareil « cv_… »
        ▼
Serveur Passerelle (dépôt Siquane/Appli-planning-familial, dossier server/)
  routes/cervelle.ts ── services/cervelleAi.ts ── API Claude (claude-opus-5-5)
        │                 lib/cervelle/ (programme, maîtrise, jeu, correction, dates)
        ▼
Postgres Neon (mêmes tables User/FamilyMember que Passerelle + tables Cervelle)
Cloudflare R2 (photos des cours, si le stockage est configuré)
```

Toute nouvelle route se fait **dans le dépôt Passerelle**, pas dans cervelle.

### Serveur (dépôt Passerelle)

- `server/src/routes/cervelle.ts` — toutes les routes. Montées dans
  `index.ts` **avant** le `express.json()` global, avec une limite de 40 Mo
  (les photos arrivent en base64).
- `server/src/services/cervelleAi.ts` — les 4 appels à Claude :
  `generateRevision` (photos/PDF → notions, fiches, questions, chapitre du
  programme), `gradeAnswer` (réponse tapée), `analyzeExam` (interro
  corrigée), `assistantReply` (« Aide-moi à… »). Sorties structurées (zod),
  repli automatique en cas de refus (`server-side-fallback-2026-07-01`,
  `fallbacks: "default"`). Aucun prénom n'est envoyé, seulement le niveau.
- `server/src/lib/cervelle/`
  - `programme.ts` — chapitres officiels par classe (CM2, 5e), ids stables
    enregistrés sur les révisions ; `programmeForPrompt` pour Claude.
  - `mastery.ts` — étiquettes et révision espacée (intervalles 0/1/3/7/16/35
    jours, « Maîtrisé » après 2 bonnes réponses à des moments différents).
  - `game.ts` — pièces, niveaux de la mascotte, série de jours, missions,
    boutique.
  - `grading.ts` — correction locale (accents, articles, petites fautes)
    avant d'appeler Claude.
  - `days.ts` — jours en heure de Paris.
- Modèles Prisma : `Learner`, `LearnerCode`, `LearnerDevice`, `Revision`,
  `Notion`, `Question`, `Attempt`, `StudySession`, `ExamReview`, `AiUsage`.
  Migrations `20261116080000_cervelle` et `20261116090000_cervelle_programme`.
- Tests : `server/tests/routes/cervelle.test.ts`,
  `server/tests/lib/cervelle.test.ts` (Claude simulé avec `vi.spyOn`).
- Textes officiels : `docs/programmes/` (PDF + texte extrait + tableau des
  programmes en vigueur en 2026-2027).

### Fonctionnement clé

- **Connexion enfant** : le parent crée un code à 6 chiffres (15 min, usage
  unique, stocké haché) ; l'enfant le tape ; son téléphone reçoit un jeton
  `cv_…` (haché en base, révocable depuis l'espace parent). Un enfant n'accède
  qu'à `/cervelle/learners/me/…`.
- **Préparation d'une révision** : `POST …/revisions` répond 202, Claude
  travaille en tâche de fond dans le process Node, l'appli interroge toutes
  les 3 s. Une préparation bloquée plus de 15 min passe en « failed ».
- **Quiz** : les réponses ne sont jamais envoyées à l'appli (sauf le dos des
  cartes) ; chaque réponse est corrigée par le serveur.
- **Programme** : pour primaire/collège/lycée, Claude reçoit la liste des
  chapitres de la classe, rattache la révision à un chapitre et peut ajouter
  au plus 2 sous-notions « programme » (signalées dans l'appli). Études sup et
  adultes : fidèle au cours, rien d'ajouté.
- **Limites par famille sur 24 h** : 15 révisions, 10 interros, 120 messages
  d'assistant, 400 corrections (`DAILY_LIMITS`).

### Appli (ce dépôt)

- `app/` (expo-router) : `auth/` (accueil, parent, code enfant), `parent/`
  (tableau de bord, enfants, profil), `child/` (accueil gamifié, boutique),
  `revision/` (nouvelle, détail, fiches), `quiz.tsx`, `assistant.tsx`,
  `exam/` (interros corrigées), `programme.tsx`.
- `src/state/session.ts` — session parent (jetons Passerelle + renouvellement)
  ou enfant (jeton d'appareil), dans SecureStore.
- `src/api/` — client, types, requêtes React Query.
- `src/lib/lid.ts` — `useLid()` : « me » pour un enfant, l'id choisi pour un
  parent. Toutes les pages élève servent aussi au parent.
- `src/lib/files.ts` — photos réduites à 1600 px, JPEG 70 %, 8 pages max ;
  PDF jusqu'à 15 Mo.
- `src/components/mascot/geometry.ts` — la mascotte (cerveau rose) en SVG,
  source unique pour l'appli et pour les icônes (`npm run assets`, qui utilise
  Playwright).
- Identité : `src/theme/tokens.ts` (voir aussi `CLAUDE.md`).
- Workflows : `eas-build.yml` (APK à la main), `eas-update.yml` (mise à jour
  JS à chaque push sur `main`, sauf changement natif), `checks.yml`.
- `runtimeVersion` : "1". À augmenter si `package.json` ou `app.json` change.

## Décisions prises avec l'utilisatrice

- Appli séparée de Passerelle, mais même serveur, même base, mêmes comptes.
- Accès enfant sur son propre téléphone avec un code ; parent et enfant
  peuvent ajouter une révision.
- Version 1 complète : cœur (fiches, 6 types de questions, étiquettes),
  espace parent, jeu (série, pièces, missions, mascotte et accessoires),
  assistant et interros corrigées.
- Identité visuelle propre (pas celle de Passerelle).
- Cours calés sur le programme de l'Éducation nationale ; écran « Mon
  programme » ; éducation à la vie affective affichée comme une matière.
- Enfants de la famille : un en CM2, un en 5e.

## Programme officiel

- Classes couvertes : CM2 et 5e (année 2026-2027), toutes matières.
- Les sites officiels (éduscol, education.gouv.fr) bloquent les serveurs
  (Cloudflare) : les textes ont été fournis par l'utilisatrice et rangés dans
  `docs/programmes/` du dépôt Passerelle. Pour une nouvelle classe, lui
  demander les PDF officiels, vérifier les doublons par empreinte (md5, pas
  par nom), extraire avec `pdftotext -layout`.
- Pour ajouter une classe : une entrée dans `PROGRAMMES` + `programmeKey`
  (`lib/cervelle/programme.ts`). Les ids de chapitre ne doivent plus changer.

## Points faibles connus (à traiter un jour)

1. **Tâches de fond en mémoire** : si Render redémarre pendant une
   préparation, elle échoue au bout de 15 min (bouton « Réessayer », qui ne
   marche que si les photos ont été gardées dans R2). Une vraie file
   d'attente serait plus sûre.
2. **Pas de notifications** : aucun rappel avant une interro, ni de
   notification quand une révision est prête.
3. **Aucun test d'écran** dans l'appli (seulement typecheck et un test de
   formatage) ; vérification visuelle faite en version web locale.
4. **Coût Claude** : non mesuré ; une révision envoie jusqu'à 8 images et
   demande jusqu'à 20 000 tokens de sortie (effort « medium »).
5. **Mode cartes** : l'élève se note lui-même (« Je savais ») ; les pièces
   sont accordées quand même (une fois par question et par jour).
6. **Pas de code parent** pour revenir de l'espace enfant quand un parent
   l'ouvre sur son propre téléphone (c'est juste un retour arrière).
7. **Étoiles de Passerelle** (PR #38, récompenses enfants) et pièces de
   Cervelle sont deux systèmes séparés.

## Idées pour la suite

- Rappels d'interro (veille et J-3) avec révision express.
- Autres classes du programme (CM1, 6e, 4e, 3e, lycée).
- Tableau des dépenses Claude par famille.
- Code parent pour sortir de l'espace enfant.
- Notification « ta révision est prête ».

## Règles de travail

- Parler français à l'utilisatrice, poser les questions avec des réponses à
  cliquer.
- Avant de pousser : `npm run typecheck` et `npm test` ici ; côté serveur
  `npx tsc -p tsconfig.json --noEmit` et `npx vitest run` (Postgres local,
  base `passerelle_test` ; Prisma demande l'accord de l'utilisatrice pour la
  réinitialiser).
- Côté Passerelle : fusionner `main` avant de pousser ; migrations datées
  après la dernière de `main` ; ne jamais redescendre `runtimeVersion`.
