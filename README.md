# 📄 Document de Cadrage : Jeu de Devinette Temporelle (*Guess The Date*)

---

## 1. Objectifs du Projet

### 1.1 Objectif Pédagogique

-   **Culture générale et histoire des sciences/techniques :** Permettre
    aux joueurs de découvrir ou de réviser l'histoire des objets du
    quotidien, des inventions majeures et des œuvres d'art à travers les
    époques.
-   **Repères chronologiques :** Aider à développer une meilleure
    perception des époques historiques et des étapes de l'évolution
    technologique et culturelle.

### 1.2 Objectif Ludique

-   **Accessibilité immédiate :** Proposer un gameplay simple et
    intuitif (*"pick up and play"*) ne nécessitant aucune installation
    préalable.
-   **Mécanique d'engagement (Chaud / Froid) :** Offrir une rétroaction
    dynamique et progressive stimulant le questionnement et
    l'apprentissage par essais-erreurs.
-   **Progression et défi :** Inciter le joueur à améliorer sa précision
    et à utiliser judicieusement ses essais avant d'atteindre les
    indices.

---

## 2. Cahier des Charges Fonctionnel

### 2.1 Spécifications Techniques

-   **Format :** Application Web avec un Front-End léger en HTML5, CSS3
    et JavaScript ES6 Vanilla.
-   **Back-End :** Serveur Node.js avec Express, Knex.js, et Socket.IO pour le temps réel.
-   **Authentification :** Sécurisée via JWT stocké dans un Cookie `HttpOnly` (`SameSite=None/Lax`) et vérification e-mail par code OTP.-
-   **Architecture :** Monorepo séparant les ressources statiques du Front-End et la logique serveur.
-   **Compatibilité :** Responsive Design (Desktop, Tablette,
    Smartphone) et support des navigateurs modernes.
-   **Communication Front-End / Back-End :** API HTTP/REST (JSON) avec gestion CORS et `credentials: 'include'`.
-   **Stockage des données :** Base PostgreSQL distante (Supabase) avec isolation multi-schémas (`preprod` / `public`).
-   **Service E-mail :** E-mails transactionnels via API Resend.
-   **Sources de données envisagées :**
    -   Cooper Hewitt API
    -   Wikidata
-   **Données associées aux objets :**
    -   Titre ;
    -   Année de création/invention ;
    -   URL de l'image ;
    -   Siècle ;
    -   Auteur, inventeur ou créateur ;
    -   Catégorie/type d'objet ;
    -   Source ;
    -   Type de licence ;
    -   Informations complémentaires.
-   **Scores :** Les scores pourront être persistés en base de données
    dans une version ultérieure.

### 2.2 Composants de l'Interface Utilisateur (UI)

-   **Zone Médias :** Affichage central de l'image de l'objet à deviner
    avec crédits d'auteur/source.
-   **Zone de Saisie :** Champ d'entrée numérique réservé aux années
    (supportant les valeurs positives et négatives/BC).
-   **Zone d'Action :** Bouton de validation (« Valider ») et bouton de
    passage (« Suivant / Objet suivant »).
-   **Zone de Rétroaction :** Indication visuelle et textuelle du niveau
    de proximité (Système Chaud/Froid).
-   **Zone d'Indices :** Zone de texte se débloquant automatiquement
    selon le nombre d'essais infructueux.

---

## 3. Règles du Jeu (Game Design)

### 3.1 Déroulement d'une Partie

1.  Une image d'un objet mystère est présentée au joueur.
2.  Le joueur saisit une année dans le champ de saisie et valide sa
    réponse.
3.  Le système évalue l'écart entre l'année proposée et l'année réelle
    d'invention/création.

### 3.2 Mécanique "Chaud / Froid" (Indicateur de proximité)

L'évaluation de la réponse repose sur l'écart absolu :

**Écart = \|Année saisie - Année de référence\|**

  Écart (années)   Niveau de proximité   Indication
  ---------------- --------------------- --------------
  **0**            **Correct** 🥳        Bonne année
  **1 à 24**       **Burning** 🔥        Très proche
  **25 à 49**      **Hot** 🥵            Proche
  **50 à 79**      **Warm** 😎           Assez proche
  **80 à 99**      **Cold** 🥶           Éloigné
  **100+**         **Freezing** 🧊       Très éloigné

En complément, le joueur reçoit une indication directionnelle lui
demandant d'essayer une date **plus récente** ou **plus ancienne**
lorsque la réponse n'est pas correcte.

### 3.3 Système d'Indices Progressifs

Les indices de la V0 sont générés automatiquement à partir de l'année de
référence ; ils ne sont pas stockés dans les données propres à chaque
objet.

-   **Après 3 essais manqués :** affichage du siècle concerné.
-   **Après 5 essais manqués :** affichage d'une partie de l'année de
    référence.

Des indices éditoriaux propres à chaque objet pourront être ajoutés
ultérieurement si le game design évolue.

### 3.4 Frise chronologique dynamique

La frise accompagne la recherche du joueur sans révéler directement la
bonne réponse.

-   Chaque proposition positionne le curseur sur l'année saisie.
-   L'échelle temporelle s'adapte progressivement aux essais du joueur.
-   Les bornes sont arrondies par paliers afin de ne pas donner
    indirectement la réponse.
-   Lorsque les propositions resserrent la zone de recherche, la frise
    peut zoomer.
-   Si une nouvelle proposition sort de l'échelle affichée, la frise
    dézoome automatiquement afin de l'inclure.
-   Les graduations sont recalculées lorsque l'échelle change.
-   Les repères textuels **Past / Present** restent fixes et
    indépendants des bornes numériques.
-   La frise fonctionne conjointement avec l'indication directionnelle
    **older / more recent**.

---

## 4. Architecture Technique

Le projet est structuré en **Monorepo** :
```text
guess-the-date/
├── frontend/
│   └── public/
│       ├── about.html
│       ├── account.html
│       ├── badges.html
│       ├── game.html
│       ├── index.html
│       ├── login.html
│       ├── settings.html
│       └── assets/
│           ├── config.js         ← Résolution dynamique de window.API_URL
│           ├── main.js
│           ├── style.css
│           └── img/
│
├── backend/
│   ├── src/
│   │   ├── controllers/         ← auth.controller.js, etc.
│   │   ├── database/
│   │   │   ├── db.js             ← Instance Knex connectée
│   │   │   └── migrations/     ← Fichiers d'évolution du schéma SQL
│   │   ├── middlewares/        ← auth.middleware.js (JWT Cookie)
│   │   ├── routes/             ← auth.routes.js, etc.
│   │   ├── services/           ← email.service.js (Resend)
│   │   └── utils/              ← otp.util.js (Code à 6 chiffres)
│   ├── knexfile.js               ← Conf multi-environnement & multi-schémas
│   ├── server.js                 ← Express App, CORS, Cookies & Sockets
│   ├── Dockerfile                ← Build Docker (Northflank)
│   ├── package.json
│   └── package-lock.json
│
├── package.json                  ← Orchestration dev locale (Concurrently + BrowserSync)
├── package-lock.json
├── .gitignore
└── README.md
```

\#### Dossier `frontend/`

Contient uniquement les ressources du Front-End accessibles par le
navigateur :

-   HTML ;
-   CSS ;
-   JavaScript côté client ;
-   Images ;
-   Autres ressources statiques.

Le Front-End n'utilise actuellement **aucun framework JavaScript**.

\#### Dossier `backend/`

Contient le serveur Node.js et toute la logique côté serveur :

-   `server.js` : point d'entrée du serveur Express ;
-   `src/routes/` : routes HTTP/API ;
-   `src/controllers/` : contrôleurs ;
-   `src/services/` : logique métier ;
-   `src/data/` : accès et traitement des données ;
-   `package.json` : dépendances propres au Back-End.

Les futures fonctionnalités temps réel pourront utiliser **Socket.IO**
côté Back-End.

\#### `package.json` racine

Le `package.json` situé à la racine est utilisé principalement pour
orchestrer le développement local et lancer simultanément le Front-End
et le Back-End.
### Architecture de Production

```text
                         GitHub
                           │
             ┌─────────────┴─────────────┐
             │                           │
     frontend/public/                backend/
             │                           │
      Cloudflare Pages               Northflank (Docker)
   (Static CDN Host)             (Node.js + WebSockets)
             │                           │
             └────────── HTTP / WS ──────┴────── Database (Supabase PostgreSQL)
                                                  ├── Schema: preprod
                                                  └── Schema: public (prod)
```

Le Front-End et le Back-End restent donc dans un **seul repository**,
tout en pouvant être déployés indépendamment.

---

## 5. Prérequis

\### 5.1 Node.js

Le projet nécessite une version récente de Node.js (il est recommandé
d'utiliser une version LTS).

https://nodejs.org/fr/download

Vérifier l'installation :

    node --version
    npm --version

\### 5.2 Git

Git est nécessaire pour récupérer le projet et gérer les versions.

Vérifier l'installation :

    git --version

\### 5.3 Organisation des dépendances

Le projet utilise deux `package.json` distincts :

    guess-the-date/
    ├── package.json          ← outils de développement / orchestration
    │
    ├── frontend/
    │   └── public/           ← HTML / CSS / JS vanilla
    │
    └── backend/
        ├── package.json      ← dépendances du serveur
        └── server.js

Les dépendances du Back-End doivent être installées depuis le dossier
`backend/`.

Les outils de développement communs comme `concurrently` et
`browser-sync` sont installés à la racine.

---

## 6. Installation en Local

\### 6.1 Cloner le projet

Depuis le terminal :

    git clone <URL_DU_REPOSITORY>
    cd guess-the-date

*(Remplacer `<URL_DU_REPOSITORY>` par l'URL réelle du dépôt Git).*

\### 6.2 Installer les dépendances

Installer les dépendances de développement à la racine :

    npm install

Puis installer les dépendances du Back-End :

    cd backend
    npm install
    cd ..

Cette organisation permet à chaque partie du projet de conserver ses
propres dépendances.

## \> ⚠️ Les dossiers `node_modules/` sont ignorés par Git et ne doivent pas être versionnés.

## 7. Configuration du Projet

\### 7.1 Variables d'environnement

Les variables d'environnement du Back-End sont stockées dans un fichier
`.env` situé dans le dossier `backend/`.

Exemple :

    PORT=3001

Le fichier `.env` contient potentiellement des informations sensibles et
ne doit jamais être versionné.

\### 7.2 Fichier `.env.example`

Un fichier `backend/.env.example` doit être présent dans le repository
afin de documenter les variables nécessaires.

Créer le fichier `.env` à partir du modèle d'exemple :

    cp backend/.env.example backend/.env

*(Sous Windows, le fichier peut également être créé manuellement).*

---

## 8. Lancement du Projet

\### 8.1 Lancement simple du Back-End

Le serveur Express peut être lancé depuis le dossier `backend/` :

    cd backend
    npm start

Le serveur sera accessible à l'adresse :

    http://localhost:3001

\### 8.2 Lancement global en développement

Depuis la racine du projet :

    npm run dev

Le script racine démarre simultanément le serveur Back-End et
BrowserSync pour le Front-End.

---

## 9. Live Reload

\### 9.1 Installation des dépendances de développement

Depuis la racine :

    npm install --save-dev concurrently browser-sync

\### 9.2 Lancement en mode développement

Depuis la racine du projet :

    npm run dev

Architecture d'exécution :

    npm run dev
         │
         ├── Backend
         │     └── Node.js / Express ──> http://localhost:3001
         │
         └── Frontend
               └── BrowserSync ─────────> http://localhost:3000

> **Note :** BrowserSync utilise Express comme serveur proxy. L'adresse
> à ouvrir dans le navigateur sera généralement `http://localhost:3000`.

\### 9.3 Fichiers surveillés

Fichiers Front-End surveillés par BrowserSync :

    frontend/public/index.html
    frontend/public/assets/main.js
    frontend/public/assets/style.css
    frontend/public/assets/img/*

Fichiers Back-End surveillés par `node --watch` :

    backend/server.js

\### 9.4 Où exécuter les commandes ?

Pour le développement complet :

    cd guess-the-date
    npm run dev

Il n'est pas nécessaire de lancer `npm run dev` depuis `backend/`
lorsque le script d'orchestration racine est utilisé.

---

## 10. Serveur Express

Le serveur Express se trouve désormais dans `backend/server.js`.

Configuration minimale initiale :

    const express = require("express");

    const app = express();
    const PORT = process.env.PORT || 3001;

    app.use(express.json());

    app.listen(PORT, () => {
      console.log(`Guess The Date API running on http://localhost:${PORT}`);
    });

Le Front-End est désormais séparé du serveur Express et sera servi
indépendamment en production.

Le Back-End expose principalement les futures routes de l'API et les
fonctionnalités temps réel.

---

## 11. API Backend

L'API est développée dans le dossier `backend/`.

\### Organisation actuelle/future :

    backend/
    ├── server.js
    ├── package.json
    └── src/
        ├── routes/
        │   └── game.routes.js
        ├── controllers/
        │   └── game.controller.js
        ├── services/
        │   └── game.service.js
        └── data/
            └── objects.js

\### Endpoints envisagés :

-   `GET /api/game`
-   `GET /api/game/object`
-   `POST /api/game/guess`
-   `GET /api/game/hint`
-   `POST /api/scores`
-   `GET /api/scores`

\### Temps réel

Le mode multijoueur pourra utiliser **Socket.IO** pour gérer les
communications temps réel entre les deux joueurs et le serveur.

Exemples de fonctionnalités concernées :

-   création d'une partie ;
-   association de deux joueurs à une même partie ;
-   synchronisation du chronomètre ;
-   transmission des réponses ;
-   mise à jour des scores ;
-   fin de partie ;
-   synchronisation de l'objet actuellement affiché.

La communication classique avec l'API REST restera adaptée aux
opérations qui ne nécessitent pas de temps réel.

---

## 12. Gestion des Données

### 12.1 Structure commune des objets

Pour la V0, chaque objet prévoit les données suivantes :

-   **Identifiant unique** : référence stable de l'objet, indépendante
    de son nom.
-   **Nom** : normé en anglais pour la V0. Les traductions seront
    ajoutées ultérieurement en restant rattachées au même identifiant.
-   **Année de référence** : réponse attendue pour la manche.
-   **Image** : visuel utilisé dans le jeu.
-   **Période historique** : `Prehistory`, `Antiquity`, `Middle Ages`,
    `Modern Era` ou `Contemporary Era`. Cette donnée servira notamment à
    la progression des badges historiques.
-   **Rareté** : trois niveaux `Common`, `Uncommon`, `Rare`.
    -   **Common** : objet connu/familier et raisonnablement
        identifiable/dat-able.
    -   **Uncommon** : objet moins fréquent, moins connu ou plus
        spécialisé, mais dont l'époque reste raisonnablement
        identifiable.
    -   **Rare** : objet réellement rare, très spécialisé ou peu connu,
        associé également à une difficulté de reconnaissance/datation
        supérieure.
    -   La rareté prend donc en compte à la fois la **rareté/notoriété
        réelle de l'objet** et sa **difficulté dans le jeu**.
-   **Source documentaire** : lien permettant d'en apprendre davantage
    et de documenter la référence historique retenue.
-   **Thématique(s)** : avec possibilité de choix multiple si l'objet
    est transversal entre différentes thématiques.

**Thématiques retenues pour le moment :**\
`Everyday Life`, `Science`, `Technology`, `Transport`, `Art & Culture`,
`Medicine`, `Military`, `Sport & Leisure`, `Industry & Engineering`.

> ⚠️ On n'utilise pas de catégorie `General` : les objets
> usuels/familiers relèvent plutôt de **Everyday Life**, ce qui évite de
> confondre une thématique avec un mode de jeu « généraliste ».

Les catégories et la rareté restent indépendantes : un objet
`Everyday Life` peut par exemple être `Common`, `Uncommon` ou `Rare`.

**Non retenu dans le contrat V0 :**

-   description pédagogique : le lien documentaire suffit pour le moment
    ;
-   indices propres à l'objet : les indices actuels sont générés
    automatiquement par la gameloop. Ce champ pourra être ajouté plus
    tard si des indices éditoriaux sont introduits.

La source locale temporaire sera mise au même format pour tous les
objets. La gameloop utilisera ensuite uniquement l'objet courant pour
récupérer son nom, son image et sa date de référence, sans valeur
spécifique codée dans le HTML ou dans les règles du jeu.

L'objectif est qu'à terme la source locale puisse être remplacée par
l'API/BDD **sans réécrire la gameloop**. Les champs période, rareté et
thématiques prépareront également la progression/badges et les futurs
modes de jeu.

Pour le futur **1v1**, le contrat de l'objet restera séparé de l'état
d'une partie : tentatives, score, chrono, joueurs, etc. n'appartiennent
pas aux données de l'objet. L'identifiant permettra aux deux joueurs de
jouer sur la même référence. À terme, la réponse correcte pourra être
vérifiée côté serveur afin de ne pas exposer directement l'année au
client pendant une partie compétitive.

### 12.2 Convention --- périodes historiques

Les périodes sont déterminées automatiquement à partir de l'année de
référence afin d'éviter les incohérences de saisie :

-   **Prehistory** : avant -3000
-   **Antiquity** : -3000 à 476
-   **Middle Ages** : 477 à 1492
-   **Modern Era** : 1493 à 1789
-   **Contemporary Era** : 1790 à aujourd'hui

Ces bornes constituent une **convention de gameplay** commune au projet.

L'année de référence reste la source de vérité : la période historique
peut être calculée automatiquement plutôt que renseignée manuellement.

### 12.3 Séparation objet / état de partie

Les données propres à une partie ne font pas partie du contrat de
l'objet : tentatives, score, chrono, joueur, état de victoire ou données
de match sont gérés séparément.

Cette séparation prépare le futur 1v1 : les deux joueurs peuvent être
associés au même identifiant d'objet tandis que leurs états de partie
restent distincts. À terme, en mode compétitif, l'année correcte pourra
être vérifiée côté serveur plutôt qu'exposée directement au navigateur.

### 12.4 API externes

Deux sources principales sont envisagées : 1. **Cooper Hewitt API :**
Données liées aux collections du musée. 2. **Wikidata :** Base de
connaissances collaborative (informations historiques et temporelles).

*Les données récupérées devront être normalisées avant d'être transmises
au moteur du jeu.*

---

## 13. Front-End

Le Front-End est développé sans framework en **HTML5**, **CSS3** et
**JavaScript ES6+**.

Les fichiers sont situés dans :

    frontend/public/
    ├── index.html
    └── assets/
        ├── main.js
        ├── style.css
        └── img/

-   **Fichier HTML principal :** `frontend/public/index.html`
-   **Fichier JS principal :** `frontend/public/assets/main.js`
-   **Feuille de style :** `frontend/public/assets/style.css`

Exemple de communication avec le Back-End via `fetch()` :

    const response = await fetch("http://localhost:3001/api/game/object");
    const object = await response.json();

En production, l'URL de l'API sera configurée selon le domaine du
Back-End déployé.

---

## 14. Gestion des Années

Le jeu doit prendre en charge : \* Les années positives : ex. `2026` \*
Les années négatives (dates avant J.-C.) : ex. `-350` \* Les valeurs
entières (`1877`, `1492`, `-44`, etc.)

---

## 15. Calcul de la Proximité

L'écart entre la réponse du joueur et l'année de référence est calculé
avec la valeur absolue de la différence.

Plages d'évaluation de la gameloop V0 :

-   `0` an → **Correct 🥳**
-   `1` à `24` ans → **Burning 🔥**
-   `25` à `49` ans → **Hot 🥵**
-   `50` à `79` ans → **Warm 😎**
-   `80` à `99` ans → **Cold 🥶**
-   `100+` ans → **Freezing 🧊**

Lorsque la réponse est incorrecte, le jeu indique également au joueur
s'il doit essayer une date plus ancienne ou plus récente.

---

## 16. Développement

Pendant le développement, les fichiers principalement édités sont :

    frontend/public/index.html
    frontend/public/assets/main.js
    frontend/public/assets/style.css
    backend/server.js

Les modifications sont détectées automatiquement grâce à :

    npm run dev

Le développement est orchestré depuis la **racine du projet**.

---

## 17. Gestion de Version (Git)

\### 17.1 Fichiers à versionner

-   `frontend/`
-   `backend/src/`
-   `backend/server.js`
-   `backend/package.json`
-   `backend/package-lock.json`
-   `package.json`
-   `package-lock.json`
-   `README.md`
-   `.gitignore`
-   `backend/.env.example`

\### 17.2 Fichiers à ignorer (`.gitignore`)

-   `node_modules/`
-   `.env`
-   `*.log`
-   Fichiers temporaires
-   Bases de données locales

---

## 18. Installation Rapide

Pour un nouveau développeur :

    git clone <URL_DU_REPOSITORY>
    cd guess-the-date

    npm install

    cd backend
    npm install
    cd ..

    cp backend/.env.example backend/.env

    npm run dev

Accès :

-   **Front-End avec BrowserSync :** `http://localhost:3000`
-   **Back-End Express :** `http://localhost:3001`

Le serveur de développement doit être lancé depuis la **racine du
projet**.

---

## 19. Évolutions Prévues

-   [ ] Mise en place complète de l'API Express.
-   [ ] Récupération automatique des objets depuis Wikidata et/ou Cooper
    Hewitt.
-   [ ] Normalisation et validation des données.
-   [x] Mise en place d'une base de données distante.
-   [ ] Persistance des scores.
-   [ ] Gestion de sessions et parties.
-   [ ] Génération aléatoire des objets.
-   [ ] Système de gestion avancée des indices.
-   [ ] Mise en place du multijoueur temps réel avec Socket.IO.
-   [ ] Synchronisation de deux joueurs dans une même partie.
-   [ ] Chronomètre et état de partie synchronisés côté serveur.
-   [ ] Authentification des joueurs.
-   [ ] Tests automatisés.
-   [x] Déploiement du Front-End sur CloudFlare Pages.
-   [x] Déploiement du Back-End sur Northflank.
-   [x] Déploiement de la BDD sur Supabase.

---

## 20. État Actuel du Projet & Migration MVP

Le projet est au stade de **MVP**. Le Front-End existant est désormais
organisé dans `frontend/public/` et le serveur dans `backend/`.

\### Structure actuelle :

    guess-the-date/
    ├── frontend/
    │   └── public/
    │       ├── index.html
    │       └── assets/
    │           ├── main.js
    │           ├── style.css
    │           └── img/
    │               ├── gramophone.png
    │               └── uranium.jpg
    │
    ├── backend/
    │   ├── src/
    │   ├── server.js
    │   ├── package.json
    │   └── package-lock.json
    │
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    ├── .gitignore
    └── README.md

Le projet utilise un **monorepo GitHub**. Les deux parties peuvent être
développées et versionnées ensemble tout en étant déployées séparément.

### Flux cible de l'application :

``` text
Browser ──> Frontend (HTML/CSS/JS) ──(HTTP/JSON)──> Express/Node.js ──> Data (API Ext. / BDD)
```

---

## 21. Aide-Mémoire : Commandes Utiles

  --------------------------------------------------------------------------------------------
  Action                              Commande
  ----------------------------------- --------------------------------------------------------
  **Installer les dépendances         `npm install`
  racine**                            

  **Installer les dépendances         `cd backend && npm install`
  Back-End**                          

  **Ajouter les dev-dependencies**    `npm install --save-dev concurrently browser-sync`

  **Démarrer le Back-End**            `cd backend && npm start`

  **Démarrer le projet en dev**       `npm run dev`

  **Vérifier Node / npm**             `node --version` / `npm --version`

  **Statut Git**                      `git status`

  **Commit & Push rapide**            `git add . && git commit -m "feat: setup" && git push`
  --------------------------------------------------------------------------------------------

## 22. Procédure de Déploiement

1. **Supabase :** PostgreSQL configuré avec Session Pooler (port 5432 / IPv4) et schémas `preprod` et `public`.
2. **Northflank :** Service connecté au dépôt Git avec build type `Dockerfile` (`/backend/Dockerfile`).
3. **Cloudflare Pages :** Connecté au dépôt Git avec Build Output Directory réglé sur `frontend/public`.

### 22.1 Base de données (Supabase)

Base PostgreSQL créée sur Supabase.

Chaîne de connexion injectée via la variable DATABASE_URL sur
Northflank. => à modifier pour DB_**

### 22.2 Back-End (Northflank)

Déploiement via le Dockerfile situé dans /backend/Dockerfile.

Variables d'environnement configurées : PORT, DATABASE_URL,
FRONTEND_URL.

Règle CORS activée pour accepter les requêtes originaires du domaine
Cloudflare.

Via Northflank (Recommandé) : Exécuter npm run migrate:prod directement depuis le terminal / la console de ton conteneur Northflank.

### 22.3 Front-End (Cloudflare Pages)

Connecté au dépôt GitHub.

Build output directory : frontend/public.

Build command : (Vide).

### 22.4 Variables d'Environnement

Dans `backend/.env` (Dev / Prod) ou `backend/.env_preprod` (Staging) :

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Base de données Supabase (Connexion décomposée recommandée)
DB_HOST=xxx-host.supabase.com
DB_PORT=5432
DB_USER=postgres.xxxx
DB_PASSWORD=ton_mot_de_passe
DB_NAME=postgres

# Authentification & Service Mail
JWT_SECRET=ton_jwt_secret_super_securise
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Guess The Date <onboarding@resend.dev>

---

## 23. Gestion de la Base de Données & Migrations

L'application utilise **Knex.js** pour piloter les évolutions de schéma sur l'instance **Supabase PostgreSQL**. Les environnements **Preprod** et **Prod** sont isolés dans deux schémas distincts (`preprod` et `public`).

### 23.1 Commandes de Migration (depuis `backend/`)

| Action | Commande |
| :--- | :--- |
| **Créer une migration** | `npm run migrate:make <nom_migration>` |
| **Appliquer en Preprod (`preprod`)** | `npm run migrate:preprod` |
| **Appliquer en Prod (`public`)** | `npm run migrate:prod` |
| **Rollback Preprod** | `npm run migrate:rollback:preprod` |

---

## 24. Flux d'Authentification & E-mails

1. **Inscription :** Le joueur soumet son e-mail et mot de passe (`POST /api/auth/register`). Le mot de passe est haché avec `bcrypt`.
2. **Code OTP :** Un code à 6 chiffres est généré et expédié via **Resend** (`sendVerificationEmail`).
3. **Validation :** Le joueur saisit son code (`POST /api/auth/verify-email`). Une fois vérifié, un **JWT** est généré et stocké dans un cookie HTTP-Only sécurisé.
4. **Session :** Chaque requête authentifiée transmet automatiquement le cookie (`credentials: 'include'`). Le serveur valide la session via `GET /api/auth/me`.