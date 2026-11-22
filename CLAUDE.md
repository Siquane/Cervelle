# Cervelle — contexte pour Claude

- Appli Expo (SDK 58, expo-router) de révision. Serveur = celui de Passerelle
  (`Siquane/Appli-planning-familial`, `server/src/routes/cervelle.ts`,
  `server/src/services/cervelleAi.ts`). Toute route nouvelle se fait là-bas.
- Parent : jeton d'accès Passerelle (+ renouvellement). Enfant : jeton
  d'appareil `cv_…` ; ses routes utilisent `/cervelle/learners/me/…`
  (`src/lib/lid.ts`).
- **Principe : l'apprentissage et le travail avant les notes.** Cervelle
  valorise l'effort, la régularité et ce que l'enfant a compris (notions
  maîtrisées, jours de révision, progrès), pas la note obtenue. Pas de
  classement ni de récompense fondés sur une note ; une note sert à repérer
  ce qu'il reste à apprendre. Formulations : « tu as appris », « tu as
  travaillé », plutôt que « tu as eu 18/20 ».
- Identité visuelle : fond `#F3F6FB`, rose cerveau `#FF5C8A`, encre
  `#1F1A3D`, turquoise `#10B5A5`, soleil `#FFC23D`, ciel `#3D8BFD` ; polices
  Outfit (titres) et Atkinson Hyperlegible (texte), option OpenDyslexic
  (Réglages, `src/state/reading.ts`) : toujours lire `font.x` au moment de
  l'affichage, jamais dans un `StyleSheet.create` ; mascotte cerveau dessinée en SVG
  (`src/components/mascot/geometry.ts`, une seule source pour l'appli et les
  icônes). Jetons dans `src/theme/tokens.ts`.
- Couleurs accessibles (WCAG 2.2, calculées en OKLCH) : texte ≥ 4,5:1,
  icônes ≥ 3:1. Couleur vive = décor (barres, anneaux, bordures) ; texte en
  `brand`/`teal`/`sky`/`green`/`red`/`sunDark` ; blanc seulement sur
  `brandFill`/`tealFill`/`skyFill`/`greenFill` ou `tint.fill` (bord `…Edge`,
  `tint.edge`) ; sur le jaune, texte `onSun`. Bouton « danger » = contour.
- Badges : calculés et payés par le serveur (`GET …/badges`, catalogue dans
  `server/src/lib/cervelle/badges.ts` de Passerelle) ; dessin des médailles
  dans `src/components/Medal.tsx` (mascotte au centre, métal selon le niveau).
- Boutique : catalogue côté serveur (`server/src/lib/cervelle/shop.ts`,
  emplacements tête / visage / cou / tenue / main / couleur / décor) ; dessins
  dans `src/components/mascot/wardrobe.ts` (mêmes id), décors dans
  `src/components/mascot/Scene.tsx`.
- Voix : lecture à voix haute avec la voix du téléphone (`expo-speech`,
  `src/lib/voice.ts`, bouton 🔊 `SpeakButton`) ; réponse à l'oral pour les
  questions courtes et à trous (`expo-speech-recognition`, `MicButton`,
  caché là où le téléphone ne sait pas faire).
- Étiquettes : new = « En cours » (ciel), review = « À revoir » (soleil),
  mastered = « Maîtrisé » (vert).
- Textes en français, tutoiement, phrases courtes lisibles par un enfant de 8 ans.
- Notifications de l'enfant : `src/lib/reminders.ts` (calcul, testé) et
  `src/lib/notifications.ts` (programmation locale, jeton push pour « fiches
  prêtes »).
- Widgets Android (`react-native-android-widget`, déclarés dans `app.json`) :
  `src/widgets/` (données `GET …/widget` + cache, dessins, gestionnaire
  enregistré dans `index.js`) ; Cervelle en SVG texte par
  `src/components/mascot/svgString.ts`. Aperçus dans `assets/widgets/`.
- Avant de pousser : `npm run typecheck` et `npm test`. Ne jamais redescendre
  `runtimeVersion` ; l'augmenter si `package.json` ou `app.json` change.
