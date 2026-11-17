# Cervelle

Appli de révision : on prend un cours en photo, Cervelle (via Claude) en tire
les notions, des fiches et des quiz. Pour les enfants (primaire → lycée), les
étudiants et les adultes en formation, avec un espace parent.

## Fonctionnement

- **Serveur** : celui de Passerelle (`Siquane/Appli-planning-familial`,
  dossier `server/`, routes `/cervelle/*`). Mêmes comptes et même famille.
- **Parents** : compte créé dans Cervelle avec un code reçu par e-mail (ou
  connexion par mot de passe). C'est le même compte que Passerelle. Ils créent un profil par
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
- **S'organiser** (onglets Accueil, Agenda, Minuteur, Progrès, Amis) :
  - minuteur Pomodoro (15 + 5 min en primaire, 25 + 5 sinon, réglable) :
    1 pièce toutes les 5 min, 2 xp par minute, la série compte dès 5 min ;
  - agenda : créneaux de la semaine ou d'un jour, emploi du temps importé
    en photo (Claude le lit, l'enfant vérifie), interros des révisions ;
    synchronisation avec le planning de Passerelle **seulement à la demande
    d'un parent**, dans un sens ou les deux (le profil doit être relié à un
    membre de la famille) ;
  - tâches rangées en matrice urgent / important, habitudes à cocher
    (aujourd'hui ou hier), journal de bord (lisible par les parents) ;
  - progrès : 7 derniers jours, 12 semaines, par matière, compteurs ;
  - « Quel élève es-tu ? » : 10 questions → un profil et 6 méthodes de
    travail avec un lien pour les essayer ;
  - amis : code à 6 caractères, **chaque lien validé par un parent de
    chaque côté**, frères et sœurs d'office ; classement de la semaine,
    encouragements tout faits (pas de texte libre), défis d'une semaine
    (20 pièces au gagnant) ;
  - missions du jour tirées chaque jour parmi : révisions, minuteur,
    habitudes, tâches, journal.

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
