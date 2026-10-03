# 📄 Document de Cadrage : Jeu de Devinette Temporelle (*Guess The Date*)

---

## 1. Objectifs du Projet

### 1.1 Objectif Pédagogique
* **Culture générale et histoire des sciences/techniques :** Permettre aux joueurs de découvrir ou de réviser l'histoire des objets du quotidien, des inventions majeures et des œuvres d'art à travers les époques.
* **Repères chronologiques :** Aider à développer une meilleure perception des époques historiques et des étapes de l'évolution technologique et culturelle.

### 1.2 Objectif Ludique
* **Accessibilité immédiate :** Proposer un gameplay simple et intuitif (*"pick up and play"*) ne nécessitant aucune installation préalable.
* **Mécanique d'engagement (Chaud / Froid) :** Offrir une rétroaction dynamique et progressive stimulant le questionnement et l'apprentissage par essais-erreurs.
* **Progression et défi :** Inciter le joueur à améliorer sa précision et à utiliser judicieusement ses essais avant d'atteindre les indices.

---

## 2. Cahier des Charges Fonctionnel

### 2.1 Spécifications Techniques
* **Format :** Application Web avec un Front-End léger en HTML5, CSS3 et JavaScript ES6 Vanilla.
* **Back-End :** Serveur Node.js avec Express.
* **Architecture :** Séparation entre les ressources statiques du Front-End et la logique serveur.
* **Compatibilité :** Responsive Design (Desktop, Tablette, Smartphone) et support des navigateurs modernes.
* **Communication Front-End / Back-End :** API HTTP/REST au format JSON.
* **Stockage des données :** API externes + base de données locale ou distante selon les besoins du projet.
* **Sources de données envisagées :**
  * Cooper Hewitt API
  * Wikidata
* **Données associées aux objets :**
  * Titre ;
  * Année de création/invention ;
  * URL de l'image ;
  * Siècle ;
  * Auteur, inventeur ou créateur ;
  * Catégorie/type d'objet ;
  * Source ;
  * Type de licence ;
  * Informations complémentaires.
* **Scores :** Les scores pourront être persistés en base de données dans une version ultérieure.

### 2.2 Composants de l'Interface Utilisateur (UI)
* **Zone Médias :** Affichage central de l'image de l'objet à deviner avec crédits d'auteur/source.
* **Zone de Saisie :** Champ d'entrée numérique réservé aux années (supportant les valeurs positives et négatives/BC).
* **Zone d'Action :** Bouton de validation (« Valider ») et bouton de passage (« Suivant / Objet suivant »).
* **Zone de Rétroaction :** Indication visuelle et textuelle du niveau de proximité (Système Chaud/Froid).
* **Zone d'Indices :** Zone de texte se débloquant automatiquement selon le nombre d'essais infructueux.

---

## 3. Règles du Jeu (Game Design)

### 3.1 Déroulement d'une Partie
1. Une image d'un objet mystère est présentée au joueur.
2. Le joueur saisit une année dans le champ de saisie et valide sa réponse.
3. Le système évalue l'écart entre l'année proposée et l'année réelle d'invention/création.

### 3.2 Mécanique "Chaud / Froid" (Indicateur de proximité)
L'évaluation de la réponse repose sur l'écart absolu :
$$\text{Écart} = |\text{Année saisie} - \text{Année réelle}|$$

| Écart (années) | Niveau de proximité | Indication visuelle / Textuelle |
| :--- | :--- | :--- |
| **$\le 2$ ans** | **Brûlant** 🔥 | *"Vous y êtes presque !"* |
| **$3$ à $5$ ans** | **Chaud** ☀️ | Proche |
| **$6$ à $15$ ans** | **Tiède** 🌤️ | Modéré |
| **$16$ à $30$ ans** | **Froid** ❄️ | Eloigné |
| **$> 30$ ans** | **Gelé** 🧊 | Très éloigné |

### 3.3 Système d'Indices Progressifs
Pour éviter le blocage du joueur, des indices se débloquent progressivement :
* **Après 3 essais manqués :** Affichage du siècle concerné *(ex. "Invention du XIXe siècle")*.
* **Après 5 essais manqués :** Affichage du nom de l'inventeur, créateur ou domaine d'origine.

---

## 4. Architecture Technique

### 4.1 Structure du Projet
L'arborescence cible du projet est la suivante :

```text
guess-the-date/
├── public/
│   ├── index.html
│   └── assets/
│       ├── main.js
│       ├── style.css
│       └── img/
│           ├── gramophone.png
│           └── uranium.jpg
│
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── data/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

#### Dossier `public/`
Contient les ressources accessibles par le navigateur :
* HTML ;
* CSS ;
* JavaScript côté client ;
* Images ;
* Autres ressources statiques.

#### Dossier `src/`
Contient la logique côté serveur. Les sous-dossiers sont organisés comme suit :
* `routes/` : Les routes HTTP.
* `controllers/` : Les contrôleurs.
* `services/` : La logique métier.
* `data/` : L'accès aux données.

*Note : Au début du projet, ces dossiers peuvent rester vides si aucune fonctionnalité ne les nécessite encore.*

#### Fichier `server.js`
Point d'entrée du serveur Express. Responsabilités initiales :
* Démarrer le serveur HTTP ;
* Servir les fichiers statiques présents dans `public/` ;
* Exposer les futures routes de l'API ;
* Gérer la configuration du serveur.

---

## 5. Prérequis

### 5.1 Node.js
Le projet nécessite une version récente de Node.js (il est recommandé d'utiliser une version LTS).

https://nodejs.org/fr/download

Vérifier l'installation :
```bash
node --version
npm --version
```

### 5.2 Git
Git est nécessaire pour récupérer le projet et gérer les versions.

Vérifier l'installation :
```bash
git --version
```

---

## 6. Installation en Local

### 6.1 Cloner le projet
Depuis le terminal :
```bash
git clone <URL_DU_REPOSITORY>
cd guess-the-date
```
*(Remplacer `<URL_DU_REPOSITORY>` par l'URL réelle du dépôt Git).*

### 6.2 Installer les dépendances
Installer les dépendances Node.js avec :
```bash
npm install
```
Cette commande utilise le fichier `package.json` et installe les dépendances dans le dossier `node_modules/`.

> ⚠️ Le dossier `node_modules/` est ignoré par Git et ne doit pas être versionné.

---

## 7. Configuration du Projet

### 7.1 Variables d'environnement
Les variables d'environnement sont stockées dans un fichier `.env` à la racine du projet.

Exemple :
```env
PORT=3000
```
*(Le fichier `.env` contient potentiellement des informations sensibles et ne doit jamais être versionné).*

### 7.2 File `.env.example`
Un fichier `.env.example` doit être présent dans le repository afin de documenter les variables nécessaires.

Créer le fichier `.env` à partir du modèle d'exemple :
```bash
cp .env.example .env
```
*(Sous Windows, le fichier peut également être créé manuellement).*

---

## 8. Lancement du Projet

### 8.1 Lancement simple
Le serveur Express peut être lancé directement avec :
```bash
node server.js
```
Le serveur sera accessible à l'adresse : `http://localhost:3000` (ou le port configuré dans le `.env`).

### 8.2 Scripts npm
Le `package.json` doit contenir au minimum les scripts suivants :
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "concurrently \"node --watch server.js\" \"browser-sync start --proxy localhost:3000 --files 'public/**/*'\""
  }
}
```

Outils utilisés :
* `node --watch` : Redémarre automatiquement le serveur à la modification du code Back-End.
* `browser-sync` : Recharge automatiquement le navigateur à la modification des fichiers Front-End.
* `concurrently` : Lance les deux processus simultanément.

---

## 9. Live Reload

### 9.1 Installation des dépendances de dev
```bash
npm install --save-dev concurrently browser-sync
```

### 9.2 Lancement en mode développement
```bash
npm run dev
```

Architecture d'exécution :
```text
npm run dev
     │
     ├── Node.js / Express ──> http://localhost:3000
     │
     └── BrowserSync ────────> http://localhost:3001
```

> **Note :** BrowserSync utilise Express comme serveur proxy. L'adresse à ouvrir dans le navigateur sera généralement `http://localhost:3001`.

### 9.3 Fichiers surveillés
* Fichiers Front-End surveillés par BrowserSync :
  * `public/index.html`
  * `public/assets/main.js`
  * `public/assets/style.css`
  * `public/assets/img/*`
* Fichiers Back-End surveillés par Node :
  * `node --watch server.js`

---

## 10. Serveur Express

Configuration minimale initiale pour servir les fichiers statiques du dossier `public/` :

```javascript
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Guess The Date running on http://localhost:${PORT}`);
});
```

---

## 11. API Backend

L'API permettra progressivement de déplacer la logique du jeu côté serveur.

### Exemple d'organisation future :
```text
src/
├── routes/
│   └── game.routes.js
├── controllers/
│   └── game.controller.js
├── services/
│   └── game.service.js
└── data/
    └── objects.js
```

### Endpoints envisagés :
* `GET /api/game`
* `GET /api/game/object`
* `POST /api/game/guess`
* `GET /api/game/hint`
* `POST /api/scores`
* `GET /api/scores`

---

## 12. Gestion des Données

Chaque objet utilisé dans le jeu devra disposer, au minimum, de la structure suivante :

```json
{
  "id": "example-001",
  "title": "Nom de l'objet",
  "year": 1877,
  "century": 19,
  "creator": "Nom du créateur",
  "category": "Technology",
  "imageUrl": "https://example.com/image.jpg",
  "source": "Example API",
  "license": "CC BY"
}
```

### 12.1 API externes
Deux sources principales sont envisagées :
1. **Cooper Hewitt API :** Données liées aux collections du musée.
2. **Wikidata :** Base de connaissances collaborative (informations historiques et temporelles).

*Les données récupérées devront être normalisées avant d'être transmises au moteur du jeu.*

---

## 13. Front-End

Le Front-End est actuellement développé sans framework en **HTML5**, **CSS3** et **JavaScript ES6+**.

* **Fichier JS principal :** `public/assets/main.js`
* **Feuille de style :** `public/assets/style.css`

Exemple de communication avec le serveur via `fetch()` :
```javascript
const response = await fetch("/api/game/object");
const object = await response.json();
```

---

## 14. Gestion des Années

Le jeu doit prendre en charge :
* Les années positives : ex. `2026`
* Les années négatives (dates avant J.-C.) : ex. `-350`
* Les valeurs entières (`1877`, `1492`, `-44`, etc.)

---

## 15. Calcul de la Proximité

L'écart entre la réponse du joueur et la date réelle est calculé avec :
```javascript
const difference = Math.abs(playerYear - correctYear);
```

Plages d'évaluation :
* `0` à `2` ans $\rightarrow$ **Brûlant 🔥**
* `3` à `5` ans $\rightarrow$ **Chaud ☀️️**
* `6` à `15` ans $\rightarrow$ **Tiède 🌤️**
* `16` à `30` ans $\rightarrow$ **Froid ❄️**
* $> 30$ ans $\rightarrow$ **Gelé 🧊**

---

## 16. Développement

Pendant le développement, les fichiers principalement édités sont :
* `public/index.html`
* `public/assets/main.js`
* `public/assets/style.css`
* `server.js`

Les modifications sont détectées automatiquement grâce à `npm run dev`.

---

## 17. Gestion de Version (Git)

### 17.1 Fichiers à versionner
* `public/`
* `src/`
* `server.js`
* `package.json`
* `package-lock.json`
* `README.md`
* `.gitignore`
* `.env.example`

### 17.2 Fichiers à ignorer (`.gitignore`)
* `node_modules/`
* `.env`
* `*.log`
* Fichiers temporaires
* Bases de données locales

---

## 18. Installation Rapide

Pour un nouveau développeur :
```bash
git clone <URL_DU_REPOSITORY>
cd guess-the-date
npm install
cp .env.example .env
npm run dev
```

Accès :
* **BrowserSync (recommandé pour dev) :** `http://localhost:3001`
* **Serveur Express direct :** `http://localhost:3000`

---

## 19. Évolutions Prévues

* [ ] Mise en place complète de l'API Express.
* [ ] Récupération automatique des objets depuis Wikidata et/ou Cooper Hewitt.
* [ ] Normalisation et validation des données.
* [ ] Stockage des objets dans une base de données.
* [ ] Persistance des scores.
* [ ] Gestion de sessions et parties.
* [ ] Génération aléatoire des objets.
* [ ] System de gestion avancée des indices.
* [ ] Authentification des joueurs.
* [ ] Tests automatisés.
* [ ] Déploiement en production.

---

## 20. État Actuel du Projet & Migration MVP

Le projet est au stade de **MVP**. Le Front-End existant dans `mvp/` doit être migré vers `public/`.

### Migration des dossiers :
```text
Ancienne structure:               Nouvelle structure target:
.                                 guess-the-date/
├── guess-the-date                ├── public/
└── mvp                           │   ├── index.html
    ├── assets                    │   └── assets/
    │   ├── img                   │       ├── main.js
    │   │   ├── gramophone.png     │       ├── style.css
    │   │   └── uranium.jpg       │       └── img/
    │   ├── main.js               ├── src/
    │   └── style.css             ├── .env.example
    └── index.html                ├── server.js
                                  └── ...
```

Une fois la migration effectuée, le dossier `mvp/` sera supprimé.

### Flux cible de l'application :
```text
Browser ──> Frontend (HTML/CSS/JS) ──(HTTP/JSON)──> Express/Node.js ──> Data (API Ext. / BDD)
```

---

## 21. Aide-Mémoire : Commandes Utiles

| Action | Commande |
| :--- | :--- |
| **Installer les dépendances** | `npm install` |
| **Ajouter les dev-dependencies** | `npm install --save-dev concurrently browser-sync` |
| **Démarrer en production** | `npm start` |
| **Démarrer en dev (Live Reload)** | `npm run dev` |
| **Vérifier Node / npm** | `node --version` / `npm --version` |
| **Statut Git** | `git status` |
| **Commit & Push rapide** | `git add . && git commit -m "feat: setup" && git push` |