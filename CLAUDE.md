# Cervelle — contexte pour Claude

- Appli Expo (SDK 58, expo-router) de révision. Serveur = celui de Passerelle
  (`Siquane/Appli-planning-familial`, `server/src/routes/cervelle.ts`,
  `server/src/services/cervelleAi.ts`). Toute route nouvelle se fait là-bas.
- Parent : jeton d'accès Passerelle (+ renouvellement). Enfant : jeton
  d'appareil `cv_…` ; ses routes utilisent `/cervelle/learners/me/…`
  (`src/lib/lid.ts`).
- Identité visuelle : fond `#F3F6FB`, rose cerveau `#FF5C8A`, encre
  `#1F1A3D`, turquoise `#10B5A5`, soleil `#FFC23D`, ciel `#3D8BFD` ; polices
  Outfit (titres) et Atkinson Hyperlegible (texte), option OpenDyslexic
  (Réglages, `src/state/reading.ts`) : toujours lire `font.x` au moment de
  l'affichage, jamais dans un `StyleSheet.create` ; mascotte cerveau dessinée en SVG
  (`src/components/mascot/geometry.ts`, une seule source pour l'appli et les
  icônes). Jetons dans `src/theme/tokens.ts`.
- Étiquettes : new = « En cours » (ciel), review = « À revoir » (soleil),
  mastered = « Maîtrisé » (vert).
- Textes en français, tutoiement, phrases courtes lisibles par un enfant de 8 ans.
- Notifications de l'enfant : `src/lib/reminders.ts` (calcul, testé) et
  `src/lib/notifications.ts` (programmation locale, jeton push pour « fiches
  prêtes »).
- Avant de pousser : `npm run typecheck` et `npm test`. Ne jamais redescendre
  `runtimeVersion` ; l'augmenter si `package.json` ou `app.json` change.
