# Publier Cervelle en test interne sur le Play Store

But : que les enfants installent et mettent à jour Cervelle depuis le **Play Store**,
sans activer « sources inconnues » (bloqué par défaut sur les comptes Family Link).

Le test interne n'est pas une publication publique : seules les adresses Gmail de la
liste de testeurs voient l'appli. Pas d'examen long par Google, l'appli est disponible
en quelques minutes.

Compter environ 1 h la première fois.

---

## 1. Compiler le fichier pour le Play Store (.aab)

1. GitHub → dépôt **Cervelle** → **Actions** → **EAS Build (Android APK / Play Store)**
   → **Run workflow**.
2. Choisir `where` = **github** et `kind` = **play-store**, puis **Run workflow**.
3. Environ 30 à 45 min plus tard, en bas de la page du run, section **Artifacts** :
   télécharger **cervelle-play-store** (un zip), puis l'extraire sur l'ordinateur.
   Il contient `cervelle.aab`.

Le fichier est signé avec la même clé que les APK. Le numéro de version augmente tout
seul à chaque compilation.

## 2. Créer l'appli dans la Play Console

1. [play.google.com/console](https://play.google.com/console) → **Créer une application**.
2. Nom : **Cervelle** · langue : français · type : **Application** · **Gratuite**.
3. Cocher les déclarations, puis **Créer l'application**.

Le nom du package sera fixé par le premier fichier importé : `app.cervelle.mobile`.
Il ne pourra plus changer.

## 3. Le test interne

1. Menu de gauche → **Tester et publier** → **Tests** → **Test interne**.
2. Onglet **Testeurs** → **Créer une liste d'adresses e-mail**, par exemple « Famille ».
   Ajouter l'adresse Gmail de chaque enfant, et la vôtre pour vérifier.
   **Enregistrer**, puis cocher la liste.
3. Onglet **Versions** → **Créer une version**.
   - Si Google propose la **signature d'application par Google Play** : accepter
     (choix par défaut).
   - Importer `cervelle.aab`.
   - Nom de la version : laisser celui proposé. Notes : « Première version de test ».
4. **Suivant** → **Enregistrer et publier**.

Google peut demander de remplir quelques rubriques avant la première version, même en
test interne (accès à l'appli, publicité, classification du contenu, public cible).
Elles sont listées dans **Tableau de bord**. Pour Cervelle :

- **Accès à l'appli** : « Certaines fonctionnalités sont restreintes » → expliquer que
  le parent crée son compte dans Cervelle (code reçu par e-mail), puis donne à l'enfant
  un code à 6 chiffres depuis l'espace parent. Pour l'examen de Google, fournir un compte
  de test avec mot de passe (connexion « Mot de passe »).
- **Publicité** : non.
- **Public cible** : l'appli s'adresse à des enfants. Google demande alors une
  **politique de confidentialité** (une adresse web) et applique ses règles
  « Familles ». Aucune pub, aucun prénom n'est envoyé à Claude (seulement le niveau).
- **Politique de confidentialité** : `docs/politique-confidentialite.html`, publiée sur
  https://claude.ai/artifact/3XxwLUFfpgffLdoFg4aWcG. La rendre **publique** (menu
  Partager de la page) avant de coller l'adresse dans la Play Console
  (**Règles et programmes → Contenu de l'application → Règles de confidentialité**).

## 4. Installer sur le téléphone de l'enfant

1. Test interne → onglet **Testeurs** → **Copier le lien** (« Rejoindre sur le Web »
   ou « Rejoindre sur Android »).
2. Ouvrir ce lien **sur le téléphone de l'enfant**, avec son compte Google, puis
   **Accepter l'invitation** et **Télécharger sur Google Play**.
3. Sur un compte Family Link, le parent peut recevoir une **demande d'approbation**
   dans l'appli Family Link : l'accepter.

Les mises à jour du code arrivent ensuite automatiquement à l'ouverture de l'appli
(EAS Update). Un nouveau `.aab` n'est nécessaire que quand `runtimeVersion` change.

## Si le compte de l'enfant ne peut pas rejoindre le test

Certains comptes supervisés par Family Link (surtout pour les moins de 13 ans)
peuvent être refusés par les programmes de test de Google. Ce n'est pas documenté
clairement : à vérifier avec le compte de l'enfant.

Dans ce cas, deux solutions :

- **Le plus simple** : Family Link → profil de l'enfant → **Commandes** → **Appareils**
  → son téléphone → activer **Applications de sources inconnues**, installer l'APK,
  puis désactiver de nouveau le réglage.
- **Plus tard** : publier Cervelle en **production** sur le Play Store, avec la fiche
  complète et le programme « Familles ». C'est plus long (examen de Google).
