# 📄 Document de Cadrage : Jeu de Devinette Temporelle (*Guess The Date*)

---

## 1. Objectifs du Projet

### 1.1 Objectif Pédagogique

- **Culture générale et histoire des sciences/techniques :** permettre aux joueurs de découvrir ou de réviser l'histoire des objets du quotidien, des inventions majeures et des œuvres d'art à travers les époques.
- **Repères chronologiques :** développer une meilleure perception des périodes historiques et de l'évolution technologique et culturelle.
- **Découverte documentée :** associer à chaque objet une référence historique et une source documentaire consultable.

### 1.2 Objectif Ludique

- **Accessibilité immédiate :** proposer un jeu web simple et intuitif (*pick up and play*), sans installation.
- **Mécanique d'engagement (Chaud / Froid) :** guider le joueur par une rétroaction progressive fondée sur l'écart entre la proposition et l'année attendue.
- **Progression et défi :** inciter à affiner ses estimations, à utiliser les indices et à améliorer sa connaissance des époques.

### 1.3 Périmètre de la V0

La priorité du MVP est une **boucle de jeu solo fonctionnelle** :

**Objet → proposition d'année → calcul de l'écart → indication chaud/froid → indices progressifs → victoire → objet suivant.**

La banque d'objets, la frise, la navigation, l'intégration graphique et la recette du parcours constituent le chemin critique. Les statistiques, badges et fonctionnalités avancées du compte pourront être finalisés en **V0.5**. Le multijoueur compétitif constitue une évolution ultérieure.

---

## 2. Cahier des Charges Fonctionnel

### 2.1 Spécifications Techniques

- **Format :** application web multipage en HTML5, CSS3 et JavaScript ES6+ Vanilla, sans framework Front-End.
- **Back-End :** Node.js, Express, architecture de routes/contrôleurs/services.
- **Communication :** API HTTP/REST au format JSON ; CORS configuré pour les origines autorisées.
- **Authentification :** inscription, connexion et vérification de l'adresse e-mail par code OTP ; sessions via JWT en cookie `HttpOnly`.
- **Base de données :** PostgreSQL sur Supabase, accès avec Knex.js, migrations versionnées et séparation des schémas `preprod` / `public`.
- **E-mails :** envoi transactionnel via Resend.
- **Temps réel :** dépendance Socket.IO installée ; fonctionnalités de parties multijoueurs **non implémentées dans le serveur actuel**.
- **Compatibilité :** navigateurs modernes ; objectif responsive ordinateur, tablette et smartphone.
- **Hébergement :** Front-End Cloudflare Pages, Back-End Northflank (Docker), données Supabase.
- **Sources de données envisagées :** Wikidata et Cooper Hewitt API, sous réserve de normalisation et de vérification des droits.

### 2.2 Composants de l'Interface Utilisateur

- **Zone Médias :** image et nom de l'objet mystère, avec solution de repli si l'image est indisponible.
- **Zone de Saisie :** année entière positive ou négative, pour prendre en charge les dates avant notre ère.
- **Zone d'Action :** validation de la proposition et passage à l'objet suivant après résolution.
- **Zone de Rétroaction :** proximité « chaud/froid » et direction vers une année plus ancienne ou plus récente.
- **Zone d'Indices :** révélation automatique après certains essais infructueux.
- **Frise Chronologique :** curseur, graduations et échelle évolutive.
- **Navigation :** pages Home, Play, Login, Account, Badges, Settings et About ; un parcours de vérification reste nécessaire pour assurer la cohérence globale.

---

## 3. Règles du Jeu (*Game Design*)

### 3.1 Déroulement d'une Manche

1. Le joueur découvre un objet mystère.
2. Il saisit une année et valide sa proposition.
3. Le système calcule l'écart avec l'année de référence de l'objet courant.
4. Une indication de proximité et, en cas d'erreur, une direction chronologique sont affichées.
5. Des indices se débloquent après plusieurs tentatives infructueuses.
6. Une réponse exacte termine la manche et permet de passer à un nouvel objet.

Le nombre d'essais, les indices et l'état de la frise doivent être réinitialisés pour chaque nouvel objet.

### 3.2 Mécanique « Chaud / Froid »

L'évaluation repose sur l'écart absolu :

**Écart = |Année saisie − Année de référence|**

| Écart (années) | Niveau de proximité | Indication |
|---|---|---|
| **0** | **Correct 🥳** | Bonne année |
| **1 à 24** | **Burning 🔥** | Très proche |
| **25 à 49** | **Hot 🥵** | Proche |
| **50 à 79** | **Warm 😎** | Assez proche |
| **80 à 99** | **Cold 🥶** | Éloigné |
| **100+** | **Freezing 🧊** | Très éloigné |

Une réponse incorrecte s'accompagne d'une indication **older / more recent**. Ces seuils constituent la convention de la gameloop V0 et doivent rester identiques dans le code, les textes et la légende.

### 3.3 Système d'Indices Progressifs

Les indices V0 sont calculés à partir de l'année de référence ; ils ne sont pas stockés individuellement pour chaque objet.

- **Après 3 essais manqués :** révélation du siècle.
- **Après 5 essais manqués :** révélation partielle de l'année, par exemple `188_` pour `1887`.

La révélation du créateur ou de l'inventeur n'est pas retenue pour la V0. Des indices éditoriaux propres aux objets pourront être envisagés ultérieurement.

### 3.4 Frise Chronologique Dynamique

La frise accompagne la recherche sans divulguer directement l'année correcte :

- Le curseur suit chaque proposition.
- L'échelle s'adapte aux essais successifs.
- Les bornes sont arrondies par paliers pour éviter de révéler indirectement la solution.
- La frise zoome lorsque la recherche se resserre et dézoome si une nouvelle proposition sort de l'intervalle affiché.
- Les graduations sont recalculées lors d'un changement d'échelle.
- Les repères **Past / Present** restent indépendants des bornes numériques.

**État :** une implémentation JavaScript existe dans `assets/main.js` ; la validation fonctionnelle complète et la recette responsive restent à effectuer.

---

## 4. Architecture Technique

Le projet est structuré en **monorepo** :

```text
guess-the-date/
├── frontend/
│   └── public/
│       ├── index.html               # Accueil
│       ├── game.html                # Jeu solo
│       ├── login.html               # Connexion / inscription
│       ├── account.html             # Compte et statistiques (UI)
│       ├── badges.html              # Badges (UI)
│       ├── settings.html            # Paramètres (UI)
│       ├── about.html               # Présentation et carrousel
│       ├── assets/
│       │   ├── config.js            # Configuration de l'URL API
│       │   ├── main.js              # Gameloop et frise
│       │   ├── game-objects.js      # Objets de démonstration locaux
│       │   ├── components.js        # Composants d'interface partagés
│       │   ├── auth.js              # Authentification côté client
│       │   ├── auth_needed.js       # Contrôle d'accès aux pages
│       │   ├── login.js             # Interactions de la page Login
│       │   ├── onboarding.js        # Interactions d'onboarding
│       │   ├── style.css            # Styles partagés et par page
│       │   └── img/                 # Images d'objets
│       └── ressources-design/       # Logos, fonds et éléments graphiques
│
├── backend/
│   ├── server.js                     # Express, CORS, cookies, health
│   ├── knexfile.js                   # Configurations PostgreSQL/Knex
│   ├── Dockerfile                    # Déploiement Northflank
│   ├── scripts/
│   │   └── init_db.sql
│   ├── src/
│   │   ├── routes/auth.routes.js
│   │   ├── controllers/auth.controller.js
│   │   ├── middlewares/auth.middleware.js
│   │   ├── services/email.service.js
│   │   ├── utils/otp.util.js
│   │   └── database/
│   │       ├── db.js
│   │       └── migrations/
│   ├── package.json
│   └── package-lock.json
│
├── package.json                      # Orchestration du développement
├── package-lock.json
├── .gitignore
└── README.md
```

### 4.1 Dossier `frontend/`

Le navigateur charge des pages HTML indépendantes et leurs ressources CSS/JS. Le projet n'utilise ni SPA ni routeur Front-End. `components.js` contient des éléments d'interface partagés ; certaines pages disposent encore de leur propre navigation. L'harmonisation de l'ensemble reste un chantier de finition.

### 4.2 Dossier `backend/`

- `server.js` initialise Express, le parsing JSON, les cookies, CORS et le journal de requêtes.
- `src/routes/` expose les routes d'authentification.
- `src/controllers/` traite les actions et validations métier.
- `src/middlewares/` protège les routes authentifiées.
- `src/services/` regroupe notamment l'envoi des e-mails.
- `src/database/` centralise Knex et les migrations PostgreSQL.

### 4.3 Architecture de Déploiement

```text
                          GitHub
                            │
             ┌──────────────┴──────────────┐
             │                             │
      frontend/public/                 backend/
             │                             │
       Cloudflare Pages               Northflank
       (fichiers statiques)           (Node.js / Docker)
             │                             │
             └────── HTTP / JSON ──────────┤
                                           │
                                   Supabase PostgreSQL
                                    ├── preprod
                                    └── public (prod)
```

Les deux applications sont versionnées dans le même dépôt, mais peuvent être déployées indépendamment. Le temps réel Socket.IO relève de l'architecture cible ; aucun cycle de match 1v1 n'est exposé par le serveur actuel.

---

## 5. Prérequis

### 5.1 Node.js et npm

Utiliser une version **LTS récente** de Node.js : <https://nodejs.org/fr/download>.

```bash
node --version
npm --version
```

### 5.2 Git

```bash
git --version
```

### 5.3 Dépendances

Le projet possède deux manifestes `package.json` :

- **Racine :** `concurrently` et `browser-sync` pour le développement.
- **`backend/` :** Express, Knex, PostgreSQL, JWT, bcrypt, Resend et autres dépendances serveur.

Les dossiers `node_modules/` ne sont pas versionnés.

---

## 6. Installation en Local

### 6.1 Cloner le Dépôt

```bash
git clone https://github.com/Triskolae/guess-the-date.git
cd guess-the-date
```

Choisir la branche de travail appropriée avant toute modification.

### 6.2 Installer les Dépendances

```bash
npm install
cd backend
npm install
cd ..
```

Les dépendances doivent être installées dans les deux emplacements. Ne pas ajouter les dossiers `node_modules/` à Git.

---

## 7. Configuration du Projet

### 7.1 Variables d'Environnement

Le serveur charge notamment les variables depuis `backend/.env` via `dotenv`. Les informations d'accès à la base, les secrets JWT et les clés d'API doivent rester **hors du dépôt Git**.

Exemple indicatif à adapter à son environnement :

```dotenv
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Connexion PostgreSQL / Supabase
DB_HOST=exemple.supabase.com
DB_PORT=5432
DB_USER=postgres.exemple
DB_PASSWORD=remplacer_par_un_secret
DB_NAME=postgres

# Authentification et e-mails
JWT_SECRET=remplacer_par_une_valeur_aleatoire_secrete
RESEND_API_KEY=remplacer_par_une_cle_valide
EMAIL_FROM=adresse-verifiee@exemple.com
```

`knexfile.js` prend également en charge une connexion par `DATABASE_URL` lorsque `DB_HOST` n'est pas renseigné. Les valeurs ci-dessus sont des **exemples**, pas des identifiants utilisables.

### 7.2 Modèle `.env.example`

**À compléter :** aucun `backend/.env.example` n'a été identifié dans l'arborescence de référence examinée. Il est recommandé d'en ajouter un sans secrets pour faciliter l'installation des nouveaux contributeurs.

### 7.3 Configuration de l'API côté Front-End

Le fichier `frontend/public/assets/config.js` définit `window.API_URL` selon l'hôte :

- en local : `http://localhost:3001` ;
- hors local : une URL de Back-End configurée dans le fichier.

**Point de vigilance :** vérifier la présence du protocole `https://` dans l'URL distante et le bon chargement de `config.js` avant tout script qui utilise `window.API_URL`.

---

## 8. Lancement du Projet

### 8.1 Back-End Seul

```bash
cd backend
npm start
```

Le serveur utilise par défaut le port **3001**.

### 8.2 Front-End et Back-End Ensemble

Depuis la racine :

```bash
npm run dev
```

Le script racine lance simultanément :

- le Back-End avec `node --watch server.js` ;
- BrowserSync en serveur statique sur `frontend/public/`, port **3000** (interface BrowserSync sur **3002**).

```text
npm run dev
    ├── Backend   ──> http://localhost:3001
    └── Frontend  ──> http://localhost:3000
```

**Attention :** BrowserSync utilise ici `--server frontend/public` et **non** un proxy Express. Le Front-End appelle séparément l'API grâce à `window.API_URL`.

---

## 9. Live Reload

### 9.1 Fonctionnement

BrowserSync surveille les fichiers de `frontend/public/**/*`. Les changements HTML, CSS, JS et ressources statiques déclenchent un rafraîchissement côté navigateur.

Le serveur Back-End est lancé en mode `node --watch`, qui redémarre le processus lorsque les fichiers surveillés changent.

### 9.2 Commande de Développement

```bash
npm run dev
```

La commande doit être lancée **depuis la racine du dépôt**.

---

## 10. Serveur Express

Le point d'entrée est `backend/server.js`.

Fonctionnalités présentes :

- `express.json()` pour les requêtes JSON ;
- `cookie-parser` pour les cookies ;
- `morgan` pour les journaux HTTP ;
- CORS avec `credentials: true` et liste d'origines autorisées ;
- montage des routes d'authentification sur `/api/auth` ;
- endpoint de contrôle de santé `GET /api/health`.

Un serveur HTTP Node est créé explicitement. Socket.IO est installé dans les dépendances, mais **le serveur actuel n'initialise pas encore une instance Socket.IO ni ses événements de jeu**.

---

## 11. API Back-End

### 11.1 Endpoints Actuellement Déclarés

| Méthode | Endpoint | Rôle |
|---|---|---|
| `GET` | `/api/health` | Vérifier que l'API répond (`{ "status": "ok" }`) |
| `POST` | `/api/auth/register` | Inscrire un utilisateur |
| `POST` | `/api/auth/verify-email` | Valider un code OTP |
| `POST` | `/api/auth/resend-code` | Renvoyer un code de vérification |
| `POST` | `/api/auth/login` | Ouvrir une session |
| `POST` | `/api/auth/logout` | Fermer une session |
| `GET` | `/api/auth/me` | Consulter la session authentifiée |

La route `/api/auth/me` utilise le middleware de vérification du JWT.

### 11.2 Endpoints de Jeu Envisagés

Ces routes sont **prévues**, mais **ne figurent pas dans le routeur du serveur examiné** :

- `GET /api/game`
- `GET /api/game/object`
- `POST /api/game/guess`
- `GET /api/game/hint`
- `POST /api/scores`
- `GET /api/scores`

Le contrat définitif de l'API de jeu devra être validé lors de l'intégration de la banque d'objets et de la persistance des parties.

### 11.3 Temps Réel — Évolution Future

Socket.IO pourra assurer la création des matchs, l'association des joueurs, la synchronisation des objets, des propositions, du chronomètre, des scores et de la fin de partie. Ces fonctionnalités ne doivent pas être considérées comme livrées à ce stade.

---

## 12. Gestion des Données

### 12.1 Contrat Commun des Objets

Le modèle cible d'un objet comprend :

- **Identifiant unique** stable, indépendant du nom ;
- **Nom** normé en anglais pour la V0 ;
- **Année de référence** ;
- **Image** ou URL d'image ;
- **Période historique** ;
- **Rareté** (`Common`, `Uncommon`, `Rare`) ;
- **Source documentaire** ;
- **Thématique(s)**, éventuellement multiples.

La rareté combine la notoriété réelle de l'objet et sa difficulté de reconnaissance/datation. Elle est indépendante de sa thématique.

**Thématiques retenues :** `Everyday Life`, `Science`, `Technology`, `Transport`, `Art & Culture`, `Medicine`, `Military`, `Sport & Leisure`, `Industry & Engineering`.

La catégorie `General` n'est pas retenue : les objets familiers relèvent notamment de `Everyday Life`.

**Non retenus dans le contrat V0 :** une description pédagogique obligatoire et des indices propres à chaque objet. Les indices restent calculés par la gameloop.

### 12.2 Convention — Périodes Historiques

| Période | Années de référence |
|---|---|
| **Prehistory** | Avant -3000 |
| **Antiquity** | -3000 à 476 |
| **Middle Ages** | 477 à 1492 |
| **Modern Era** | 1493 à 1789 |
| **Contemporary Era** | 1790 à aujourd'hui |

Ces bornes sont une **convention de gameplay**, non une périodisation historique universelle. La période peut être calculée à partir de l'année de référence pour éviter les incohérences.

### 12.3 Source Locale Actuelle

`frontend/public/assets/game-objects.js` contient actuellement deux objets de démonstration :

- `gramophone` — année `1887` ;
- `uranium` — année `1789`.

Les enregistrements utilisent notamment `id`, `name`, `year`, `image`, `rarity`, `themes` et `sourceUrl`. Ils ne renseignent pas encore tous les champs du contrat cible (par exemple la période historique). Les valeurs de rareté et de thématique sont représentées par des identifiants minuscules, et non par les libellés éditoriaux présentés plus haut.

**Travail en cours :** consolider le schéma, normaliser les données, intégrer un ensemble plus important d'objets et remplacer progressivement la source locale par l'API/BDD sans réécrire la gameloop.

### 12.4 Séparation Objet / État de Partie

Les tentatives, scores, indices révélés, chronomètres et états de victoire appartiennent à **l'état de partie**, et non aux données permanentes de l'objet. Cette séparation prépare les parties 1v1 et une validation serveur de la bonne réponse.

### 12.5 Sources et Droits d'Utilisation

Wikidata et Cooper Hewitt sont des sources envisagées. Les dates, images, crédits, licences et références documentaires doivent être contrôlés avant intégration. La vérification des droits d'auteur et des exigences RGPD fait partie des travaux identifiés pour la banque d'objets.

---

## 13. Front-End

### 13.1 Architecture Multipage

| Page | Fichier | État / rôle |
|---|---|---|
| Accueil | `index.html` | Présentation et accès au jeu |
| Jeu | `game.html` | Interface de la gameloop solo |
| Connexion | `login.html` | Connexion, inscription et vérification e-mail |
| Compte | `account.html` | Interface de profil et statistiques, données actuellement de démonstration |
| Badges | `badges.html` | Interface de progression, valeurs actuellement statiques |
| Paramètres | `settings.html` | Interface à raccorder aux préférences persistées |
| À propos | `about.html` | Présentation du jeu et carrousel interactif |

La navigation s'appuie sur des liens HTML classiques. Le contrôle d'accès aux actions/pages concernées utilise les scripts d'authentification.

### 13.2 Identité Visuelle et Intégration

L'interface adopte une direction artistique autour de l'enquête historique : fonds de bureau et tableau d'enquête, textures, typographies ornementales, palette brun/doré/bleu et logos dédiés.

Les ressources se trouvent dans `frontend/public/ressources-design/`. La feuille de style commune est `frontend/public/assets/style.css`.

### 13.3 Page About — Intégration Récente

La page About intègre désormais :

- le **carrousel de présentation** développé à partir du travail de Lorenzo ;
- trois sections avec flèches de navigation et indicateurs de position ;
- un **menu burger** inspiré de la navigation de la page Login ;
- un fond « tableau d'enquête » et des ajustements de lisibilité, de positionnement et de responsive ;
- une consolidation des règles CSS associées.

Ces changements ont été intégrés à `preprod`.

### 13.4 Page Login et Authentification Front-End

`login.html`, `assets/login.js`, `assets/auth.js` et `assets/components.js` couvrent l'interface de connexion/inscription, la vérification e-mail, les interactions du menu et la gestion d'une fenêtre d'authentification réutilisable. Les requêtes nécessitant le cookie de session utilisent `credentials: 'include'`.

**À vérifier en QA :** cohérence des parcours de connexion entre page dédiée et modale, messages d'erreur, expiration du code et navigation après authentification.

### 13.5 Responsive et Accessibilité

Le responsive est en cours d'harmonisation entre les pages. Les points de contrôle comprennent les petits écrans, la navigation au clavier, les libellés accessibles, les contrastes, les états de focus, les alternatives textuelles et l'absence de débordements.

---

## 14. Gestion des Années

Le jeu prend en charge les années entières positives et négatives, par exemple `1887`, `1492` ou `-44`.

La convention d'affichage et de calcul doit rester cohérente entre les données, les siècles, les indices et la frise. Les années avant notre ère demandent une vérification spécifique lors de la recette.

---

## 15. Calcul de la Proximité

La proximité utilise la valeur absolue de la différence entre l'année proposée et l'année de référence. Les six niveaux et leurs bornes sont définis en **section 3.2** ; cette section fait foi pour le game design V0.

Le retour directionnel indique si la réponse attendue est plus ancienne ou plus récente. Les retours doivent être recalculés pour chaque proposition et réinitialisés au changement d'objet.

---

## 16. Développement et Répartition des Travaux

### 16.1 Chantiers Fonctionnels

- **Sarah — Front-End fonctionnel :** gameloop solo, frise chronologique, navigation et intégration des objets dynamiques côté jeu.
- **Lorenzo — Intégration graphique :** maquettes, styles, responsive et carrousel About ; travail coordonné avec la logique JavaScript de Sarah.
- **Tristan — Back-End et infrastructure :** authentification, base de données, migrations, hébergement et intégration des services.
- **Leon — Données :** constitution et normalisation de la banque d'objets/images, alimentation des données, licences et crédits.

Cette répartition correspond aux travaux et responsabilités documentés ; elle ne constitue pas une confirmation que tous les tickets associés sont terminés.

### 16.2 Priorité de Livraison

1. Finaliser et tester la gameloop solo.
2. Stabiliser le contrat des objets et intégrer la banque de données.
3. Valider la frise et les indices sur plusieurs objets.
4. Harmoniser navigation, styles et responsive.
5. Vérifier le parcours d'authentification et l'intégration Front/Back.
6. Effectuer la recette fonctionnelle collective.

---

## 17. Gestion de Version (Git)

### 17.1 Branches de Travail

- **`preprod` :** branche d'intégration et de validation collective avant merge sur main.
- **`lorenzo` :** branche de travail de Lorenzo.
- **`leon` :** branche de travail de Leon
- **`sarah` :** branche de développement de Sarah.
- **`sarah-integration` :** branche utilisée par Sarah pour préparer les intégrations compliqués vers `preprod`.
- **`tristan\...etc` :** branches de travails de tristan. Ce dernier préfère créer une branche pour chaque sujet développés.

Les modifications destinées à `preprod` passent par une **Pull Request**, avec revue du diff et résolution des éventuels conflits avant fusion.


### 17.2 Bonnes Pratiques

```bash
git status
git fetch origin
git switch sarah
git merge origin/preprod
```

Pour publier des changements validés :

```bash
git add <fichiers-concernes>
git commit -m "type(scope): description"
git push origin sarah
```

Éviter de versionner les scripts temporaires, les secrets, les fichiers `.env`, les dépendances installées et les fichiers générés non nécessaires. Vérifier systématiquement les fichiers indexés avant de committer.

---

## 18. Installation Rapide

```bash
git clone https://github.com/Triskolae/guess-the-date.git
cd guess-the-date
npm install
cd backend
npm install
cd ..
```

Créer ensuite `backend/.env` avec les variables adaptées à son environnement (voir section 7), puis :

```bash
npm run dev
```

- **Front-End :** <http://localhost:3000>
- **Back-End :** <http://localhost:3001>
- **Santé API :** <http://localhost:3001/api/health>

---

## 19. Évolutions Prévues

Les cases cochées correspondent à une **présence technique vérifiée dans le dépôt** et non à une recette fonctionnelle complète.

- [x] Architecture monorepo Front-End / Back-End.
- [x] Serveur Express et endpoint de santé.
- [x] Base PostgreSQL distante et configuration Knex multi-schémas.
- [x] Migration initiale du schéma d'authentification.
- [x] Routes d'inscription, connexion, vérification e-mail et session.
- [x] Page About avec carrousel et navigation burger.
- [x] Base de gameloop locale et frise JavaScript.
- [ ] Recette complète de la gameloop solo sur une banque d'objets représentative.
- [ ] Normalisation définitive et enrichissement de la banque d'objets.
- [ ] API de jeu et récupération des objets depuis la base.
- [ ] Intégration éventuelle de Wikidata et/ou Cooper Hewitt.
- [ ] Persistance des scores et statistiques.
- [ ] Progression des badges connectée aux données réelles.
- [ ] Paramètres utilisateur persistés.
- [ ] Gestion complète des parties et sessions de jeu.
- [ ] Multijoueur temps réel avec Socket.IO.
- [ ] Vérification de la réponse côté serveur pour le mode compétitif.
- [ ] Tests automatisés et recette d'accessibilité.
- [ ] Vérification systématique des licences, crédits et exigences RGPD.

**Infrastructure :** le README précédent documente des déploiements Cloudflare Pages, Northflank et Supabase. Leur disponibilité opérationnelle actuelle doit être confirmée dans les consoles des services concernés ; la présence des fichiers de configuration ne suffit pas à l'établir.

---

## 20. État Actuel du Projet & Migration MVP

Le projet dispose d'un socle technique opérationnel dans le dépôt : pages HTML, styles, assets graphiques, gameloop locale, routes d'authentification et couche PostgreSQL/Knex.

**Implémenté dans le code :**

- Interface multipage, carrousel About et menu burger associé.
- Gameloop locale avec objets de démonstration et fonctions de frise/indices.
- Routes API d'authentification, cookies de session et envoi d'e-mails.
- Configuration des migrations et séparation des schémas de base de données.

**En cours de consolidation :**

- Passage de quelques objets locaux à une banque de données normalisée.
- Recette de la gameloop et de la frise sur des cas variés.
- Cohérence des parcours d'authentification, de navigation et du responsive.
- Connexion des écrans de profil, statistiques et badges à des données réelles.

**Non implémenté dans le serveur examiné :** API de jeu complète, gestion de match 1v1 et synchronisation temps réel des parties.

```text
Navigateur ──> Front-End HTML/CSS/JS ── HTTP/JSON ──> Express ──> PostgreSQL
                           │
                           └── Objets locaux (solution transitoire)
```

---

## 21. Aide-Mémoire : Commandes Utiles

| Action | Commande |
|---|---|
| Installer les dépendances racine | `npm install` |
| Installer les dépendances serveur | `cd backend && npm install` |
| Démarrer l'ensemble en développement | `npm run dev` |
| Démarrer uniquement l'API | `cd backend && npm start` |
| Vérifier Node.js et npm | `node --version` / `npm --version` |
| Vérifier Git | `git status` |
| Récupérer les branches distantes | `git fetch origin` |
| Contrôler les changements | `git diff --check` |
| Voir les fichiers indexés | `git diff --cached --name-only` |
| Créer une migration | `cd backend && npm run migrate:make -- <nom>` |
| Migrer la préproduction | `cd backend && npm run migrate:preprod` |
| Migrer la production | `cd backend && npm run migrate:prod` |

---

## 22. Procédure de Déploiement

### 22.1 Base de Données — Supabase

L'architecture documentée utilise une instance PostgreSQL avec deux schémas :

- `preprod` pour les tests et la préproduction ;
- `public` pour la production.

Les paramètres de connexion sont fournis au serveur par variables d'environnement. Ne jamais committer les mots de passe ou chaînes de connexion.

### 22.2 Back-End — Northflank

Le Dockerfile se trouve dans `backend/Dockerfile`. Le service doit disposer des variables de connexion à la base, de la configuration CORS et des secrets d'authentification/e-mail.

La variable `NODE_ENV` influence notamment les options du cookie de session (`Secure`, `SameSite`). Les domaines Front-End et Back-End doivent être cohérents avec ces réglages.

### 22.3 Front-End — Cloudflare Pages

Configuration documentée :

- **Dossier publié :** `frontend/public` ;
- **Commande de build :** aucune pour le Front-End statique.

L'URL de l'API utilisée par `assets/config.js` doit être vérifiée sur chaque environnement.

### 22.4 Points de Vérification Avant Publication

1. Confirmer les domaines et les variables d'environnement réellement déployés.
2. Vérifier CORS, HTTPS, cookies et flux de connexion inter-domaines.
3. Tester `GET /api/health` et le parcours d'authentification.
4. Appliquer les migrations au bon schéma.
5. Vérifier les pages, ressources, liens et erreurs console.

---

## 23. Gestion de la Base de Données & Migrations

L'application utilise **Knex.js** pour versionner les changements de schéma sur **Supabase PostgreSQL**.

### 23.1 Configurations

Dans `backend/knexfile.js` :

- `development` → schéma `preprod` ;
- `staging` → schéma `preprod` ;
- `production` → schéma `public`.

### 23.2 Commandes (depuis `backend/`)

| Action | Commande |
|---|---|
| Créer une migration | `npm run migrate:make -- <nom_migration>` |
| Appliquer en préproduction | `npm run migrate:preprod` |
| Appliquer en production | `npm run migrate:prod` |
| Annuler la dernière migration préproduction | `npm run migrate:rollback:preprod` |

**Attention :** les migrations de production doivent être exécutées uniquement après validation du schéma, de la sauvegarde et de l'environnement cible.

### 23.3 État du Schéma

Une migration d'authentification est présente dans `backend/src/database/migrations/`. Les futures tables d'objets, de parties, de propositions, de scores et de progression restent à définir selon les besoins du MVP.

---

## 24. Flux d'Authentification & E-mails

### 24.1 Inscription

Le joueur soumet son e-mail et son mot de passe à `POST /api/auth/register`. Le serveur hache le mot de passe avec `bcrypt` et prépare la vérification de l'adresse e-mail.

### 24.2 Vérification OTP

Un code de vérification à **6 chiffres** est généré et envoyé par e-mail via le service Resend. Le joueur le saisit dans l'interface ; le serveur vérifie le code via `POST /api/auth/verify-email`. Une route `POST /api/auth/resend-code` permet de demander un nouvel envoi.

### 24.3 Connexion et Session

La connexion utilise `POST /api/auth/login`. Après authentification, un JWT est placé dans un cookie `HttpOnly` ; le navigateur transmet ce cookie aux appels concernés grâce à `credentials: 'include'`.

- `GET /api/auth/me` contrôle la session et retourne les informations autorisées.
- `POST /api/auth/logout` ferme la session.
- Le cookie est configuré avec `SameSite=Lax` en développement et `SameSite=None` avec `Secure` pour les environnements `staging` / `production`, selon `NODE_ENV`.

### 24.4 Points de Sécurité et de Recette

- Vérifier les durées de validité, la limitation des tentatives et les erreurs de vérification OTP.
- Contrôler la confidentialité des messages et l'absence de secrets dans les logs.
- Tester les cookies sur les domaines réellement utilisés.
- Vérifier la protection des routes sensibles et les parcours de déconnexion.
- Documenter la politique de conservation des données et les exigences RGPD avant publication.

---

## 25. Qualité, Tests et Recette V0

### 25.1 Parcours Fonctionnel Prioritaire

**Home → Play → Guess → Hot/Cold → Hints → Correct answer → Next object**

Tester ce parcours sur plusieurs objets et plusieurs périodes historiques, y compris avec des années négatives.

### 25.2 Cas à Couvrir

- Réponse exacte au premier essai ;
- Réponses successives plus anciennes et plus récentes ;
- Seuils de proximité (`24/25`, `49/50`, `79/80`, `99/100`) ;
- Déblocage des indices aux 3e et 5e erreurs ;
- Réinitialisation de l'état lors de « Next object » ;
- Frise : zoom, dézoom, graduations et proposition hors bornes ;
- Image absente, objet incomplet et erreur de chargement ;
- Inscription, vérification e-mail, connexion, déconnexion et expiration de session ;
- Navigation clavier, mobile/tablette/desktop, contrastes et débordements ;
- Absence d'erreurs JavaScript bloquantes.

### 25.3 Critères de Validation

La V0 doit être jouable de bout en bout, sans données d'objet codées en dur dans les règles de la gameloop, et sans bug critique sur les principaux navigateurs et tailles d'écran ciblés.

---

## 26. Perspectives V0.5 et Versions Ultérieures

- **V0.5 :** enrichissement des comptes, statistiques et badges persistants ; finalisation des paramètres utilisateur ; progression par période et rareté.
- **Évolutions de contenu :** banque d'objets étendue, validation éditoriale, intégration éventuelle d'API patrimoniales et meilleure gestion des crédits.
- **Multijoueur :** matchmaking ou invitation 1v1, état de partie serveur, synchronisation Socket.IO, score et chronomètre.
- **Qualité :** tests automatisés, observabilité, audit d'accessibilité et consolidation RGPD.

Le périmètre de chaque version devra être confirmé collectivement avant d'être considéré comme engagé.

---

## 27. Historique Documentaire et Points à Confirmer

### 27.1 Modifications Intégrées à Cette Proposition

- Actualisation de l'arborescence réelle du dépôt.
- Documentation de l'authentification, des cookies, de l'OTP et des migrations.
- Mise à jour des commandes de lancement et de BrowserSync.
- Intégration de la nouvelle page About, du carrousel et du menu burger.
- Distinction entre endpoints présents et endpoints envisagés.
- Clarification de la source locale des objets et du contrat de données cible.
- Mise à jour du périmètre V0, des chantiers et de la recette.
- Correction de la structure Markdown et suppression des instructions obsolètes.

### 27.2 Questions à Valider avec l'Équipe

- Le contrat définitif des objets, les conventions de valeurs (`rarity`, `themes`, période) et les modalités d'alimentation par Leon.
- Les domaines exacts de préproduction/production et le fonctionnement effectif des déploiements.
- Le comportement final des pages Account, Badges et Settings et leur priorité de livraison.
- Le contrat de l'API de jeu et la répartition entre calcul client et validation serveur.
- La stratégie de tests, de conformité des images et de protection des données.

**Ce document décrit l'état du dépôt analysé et les décisions de cadrage disponibles ; il doit être révisé à mesure que les fonctionnalités sont intégrées et validées.**