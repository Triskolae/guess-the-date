# 📄 Document de Cadrage : Jeu de Devinette Temporelle (*Guess The Date*)

## 1. Objectifs du Projet

### 1.1 Objectif Pédagogique
* **Culture générale et histoire des sciences/techniques** : Permettre aux joueurs de découvrir ou de réviser l'histoire des objets du quotidien, des inventions majeures et des œuvres d'art à travers les époques.
* **Repères chronologiques** : Aider à développer une meilleure perception des époques historiques et des étapes de l'évolution technologique et culturelle.

### 1.2 Objectif Ludique
* **Accessibilité immédiate** : Proposer un gameplay simple et intuitif (*"pick up and play"*) ne nécessitant aucune installation préalable.
* **Mécanique d'engagement (Chaud / Froid)** : Offrir une rétroaction dynamique et progressive stimulant le questionnement et l'apprentissage par essais-erreurs.
* **Progression et défi** : Inciter le joueur à améliorer sa précision et à utiliser judicieusement ses essais avant d'atteindre les indices.

---

## 2. Cahier des Charges Fonctionnel

### 2.1 Spécifications Techniques
* **Format** : Application Web Front-End légère (HTML5, CSS3, JavaScript ES6 Vanilla).
* **Compatibilité** : Responsive Design (Desktop, Tablette, Smartphone) et support des navigateurs modernes.
* **Stockage des données** : Appel à une API (TBD: https://apidocs.cooperhewitt.org/the-api/, https://www.wikidata.org/wiki/Wikidata:Main_Page) pour récupérer la liste des objets (titre, année, URL d'image, siècle, auteur/inventeur, type de licence) + base de données (stockage des scores, inforations supplémentaires sur les objets)

### 2.2 Composants de l'Interface Utilisateur (UI)
1. **Zone Médias** : Affichage central de l'image de l'objet à deviner avec crédits d'auteur/source.
2. **Zone de Saisie** : Champ d'entrée numérique réservé aux années (supportant les valeurs positives et négatives/BC).
3. **Zone d'Action** : Bouton de validation (« Valider ») et bouton de passage (« Suivant / Objet suivant »).
4. **Zone de Rétroaction** : Indication visuelle et textuelle du niveau de proximité (Système Chaud/Froid).
5. **Zone d'Indices** : Zone de texte se débloquant automatiquement selon le nombre d'essais infructueux.

---

## 3. Règles du Jeu (*Game Design*)

### 3.1 Déroulement d'une Partie
1. Une image d'un objet mystère est présentée au joueur.
2. Le joueur saisit une année dans le champ de saisie et valide sa réponse.
3. Le système évalue l'écart entre l'année proposée et l'année réelle d'invention/création.

### 3.2 Mécanique "Chaud / Froid" (Indicateur de proximité)
L'évaluation de la réponse repose sur l'écart absolu (`| Année saisie - Année réelle |`) :
* **Brûlant 🔥** : Écart ≤ 2 ans (*"Vous y êtes presque !"*)
* **Chaud ☀️** : Écart entre 3 et 5 ans
* **Tiède 🌤️** : Écart entre 6 et 15 ans
* **Froid ❄️** : Écart entre 16 et 30 ans
* **Gelé 🧊** : Écart > 30 ans

### 3.3 Système d'Indices Progressifs
Pour éviter le blocage du joueur, des indices se débloquent progressivement :
* **Après 3 essais manqués** : Affichage du siècle concerné (ex. *"Invention du XIXe siècle"*).
* **Après 5 essais manqués** : Affichage du nom de l'inventeur, créateur ou domaine d'origine.
