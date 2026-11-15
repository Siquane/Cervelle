# Cervelle

Appli de révision : on prend un cours en photo, Cervelle (via Claude) en tire
les notions, des fiches et des quiz. Pour les enfants (primaire → lycée), les
étudiants et les adultes en formation, avec un espace parent.

## Fonctionnement

- **Serveur** : celui de Passerelle (`Siquane/Appli-planning-familial`,
  dossier `server/`, routes `/cervelle/*`). Mêmes comptes et même famille.
- **Parents** : connexion avec le compte Passerelle. Ils créent un profil par
  enfant, ajoutent des révisions, suivent le temps passé, les notions
  maîtrisées et les prochaines interros.
- **Enfants** : sur leur propre téléphone, « Je suis élève » puis un code à
  6 chiffres créé par un parent (Mes enfants → Relier un téléphone, valable
  15 min). Le téléphone reste relié jusqu'à ce qu'un parent le délie.
- **Révision** : photos (8 max) ou PDF → notions et sous-notions, une fiche
  par sous-notion, questions QCM, vrai/faux, cartes mémoire, réponse courte,
  texte à trous, remettre dans l'ordre.
- **Étiquettes** : En cours / À revoir / Maîtrisé, avec révision espacée.
- **Jeu** : série de jours, pièces, missions du jour et coffre, mascotte qui
  grandit et accessoires à acheter.
- **Coach** : assistant « Aide-moi à… » et analyse d'une interro corrigée
  (les notions ratées repassent en « À revoir »).

## Développer

```bash
npm install --legacy-peer-deps
npm start            # Expo ; EXPO_PUBLIC_API_URL pour viser un serveur
npm run typecheck
npm test
npm run assets       # régénère icônes et splash depuis la mascotte (Playwright)
```

## Compiler l'APK

1. Ajouter le secret `EXPO_TOKEN` au dépôt (Settings → Secrets and variables
   → Actions), le même jeton Expo que pour Passerelle.
2. Actions → « EAS Build (Android APK) » → Run workflow. Le lien de
   l'APK s'affiche à la fin, sur expo.dev (projet `cervelle`).
3. Ensuite, chaque fusion sur `main` envoie les changements JavaScript aux
   APK installés (workflow « EAS Update »). Si `package.json` ou `app.json`
   change, augmenter `runtimeVersion` et recompiler.

Côté serveur, la clé `ANTHROPIC_API_KEY` doit être présente dans Render
(déjà utilisée pour les menus de Passerelle). Sans elle, la création de
révisions répond « pas encore activé ».
