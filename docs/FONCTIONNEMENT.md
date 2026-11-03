# Fonctionnement détaillé

Ce document décrit précisément ce que fait l'application, avec les règles et formules utilisées. Tout est calculé dans le navigateur, à partir de ta progression stockée localement.

## Sommaire

1. [Les deux types de session](#1-les-deux-types-de-session)
2. [Règles de réponse](#2-règles-de-réponse)
3. [Tirage des questions](#3-tirage-des-questions)
4. [Thèmes et domaines officiels](#4-thèmes-et-domaines-officiels)
5. [Rapport de fin de session](#5-rapport-de-fin-de-session)
6. [Indice de préparation](#6-indice-de-préparation)
7. [Plan jusqu'au jour J](#7-plan-jusquau-jour-j)
8. [Rythme et questions têtues](#8-rythme-et-questions-têtues)
9. [Historique et revue](#9-historique-et-revue)
10. [Données stockées et sauvegarde](#10-données-stockées-et-sauvegarde)
11. [Apparence](#11-apparence)
12. [Limites connues](#12-limites-connues)

---

## 1. Les deux types de session

| | **Étude** | **Examen réel** |
|---|---|---|
| Correction | Immédiate, après « Valider » | Aucune avant la fin |
| Explication | Affichée après chaque réponse | Uniquement dans le rapport et la revue |
| Chronomètre | Temps écoulé | Compte à rebours : **1 minute par question**, fin automatique à zéro |
| Navigation | Question par question | Libre (précédente, suivante), on peut laisser une question vide |
| Bouton « Valider » | Oui | Non : la réponse compte quand on passe à la suite ou qu'on termine |
| Marquage | Oui | Oui (pour y revenir) |

La **simulation complète** (accueil et tableau de bord) lance 50 questions tirées au hasard, sans pondération, en mode Examen réel : 50 questions en 50 minutes.

## 2. Règles de réponse

- Une question à plusieurs réponses attendues affiche « Choix multiple ».
- **On ne peut pas cocher plus de réponses qu'attendu** : un clic en trop est refusé avec un message ; il faut d'abord en décocher une.
- En mode Étude, valider avec une sélection incomplète affiche une erreur explicite et ne corrige pas.
- Une réponse n'est juste que si l'ensemble coché est **exactement** l'ensemble attendu (pas de points partiels).
- En mode Examen réel, une question laissée vide compte comme une erreur dans le score, mais **pas** comme une question travaillée dans l'activité du jour.

## 3. Tirage des questions

Le **pool aléatoire** n'est pas uniforme. Chaque question reçoit un poids selon ton historique :

| Situation | Poids |
|---|---|
| Jamais vue | 6 |
| Dernière réponse fausse | 4 |
| Dernière réponse juste | 1 |

Le tirage est un échantillonnage pondéré sans remise (algorithme d'Efraimidis–Spirakis : chaque question reçoit la clé `aléatoire^(1/poids)`, on garde les plus grandes). Résultat mesuré : une question jamais vue sort environ 5 fois plus souvent qu'une question maîtrisée, une question ratée environ 3 fois plus souvent.

Ne sont **pas** pondérés : les examens blancs prédéfinis (ordre fixe), la simulation complète (tirage uniforme, pour reproduire un vrai tirage), la révision d'un thème (ordre mélangé).

## 4. Thèmes et domaines officiels

Chaque question appartient à un **thème** (16 existent dans le code, 13 sont utilisés par la banque actuelle). Chaque thème est rattaché à un des **5 domaines du blueprint FCP**, dont le poids sert aux statistiques.

| Domaine | Poids à l'examen | Thèmes |
|---|---|---|
| 1. Deployment and System Configuration | 20–25 % | Système & Réseau, Logs & Monitoring, Haute disponibilité (HA), Diagnostics & Dépannage, FortiGate in the Cloud, FortiSASE |
| 2. Firewall Policies and Authentication | 20–25 % | Politiques de pare-feu & NAT, Authentification pare-feu, FSSO |
| 3. Content Inspection | 25–30 % | Certificats & Inspection SSL, Filtrage Web, IPS & Contrôle d'application, Antivirus |
| 4. Routing | 10–15 % | Routing, SD-WAN |
| 5. VPN | 10–15 % | VPN IPsec/SSL |

Pour l'indice de préparation, le milieu de chaque fourchette est utilisé : 22,5 / 22,5 / 27,5 / 12,5 / 12,5.

## 5. Rapport de fin de session

Calculé à partir des réponses de la session :

- **Score** : bonnes réponses / questions de la session. Couleur : vert ≥ 80 %, orange ≥ 50 %, rouge en dessous.
- **Temps total** et **temps moyen par question**.
- **Maîtrise par domaine** : part de bonnes réponses dans la session pour chaque domaine.
- **Forces** : domaines à 85 % ou plus. **Faiblesses** : domaines sous 60 %.
- **Recommandations** : réviser les domaines faibles, refaire les erreurs, revoir les questions marquées, puis repasser un examen complet chronométré quand le score atteint 75 %.
- **Détail par thème** et **évolution des dernières sessions**.

## 6. Indice de préparation

Un repère sur 100, affiché dans le tableau de bord.

```
maîtrise d'un domaine = questions du domaine dont la DERNIÈRE réponse est juste / questions du domaine
maîtrise pondérée     = Σ (poids du domaine × maîtrise du domaine) / Σ poids
moyenne simulations   = moyenne des 3 dernières simulations en mode Examen réel d'au moins 40 questions
indice                = arrondi( 0,7 × maîtrise pondérée + 0,3 × moyenne simulations )
```

- Une question jamais vue compte comme **non maîtrisée** : l'indice mesure aussi la couverture de la banque.
- **Sans aucune simulation réelle, l'indice ne peut pas dépasser 70.** C'est voulu : on ne se déclare pas prêt sans s'être testé en conditions d'examen.
- Libellés : moins de 35 « Début de parcours », moins de 55 « En construction », moins de 70 « Solide », moins de 85 « Presque prêt », 85 et plus « Prêt pour le jour J ».
- Le **plus gros levier** est le domaine pour lequel `poids × (100 − maîtrise)` est maximal : celui où travailler rapporte le plus de points.

Le **radar** montre la maîtrise des 5 domaines avec une cible à 80 %.

## 7. Plan jusqu'au jour J

La date et l'heure de l'examen se règlent dans le tableau de bord. La **date de départ du plan** est fixée à la première ouverture de l'application.

**Phases** (en jours calendaires restants) :

| Jours restants | Phase | Rythme de simulation complète |
|---|---|---|
| plus de 21 | 1. Couvrir et comprendre | environ 1 par semaine |
| 8 à 21 | 2. Consolider | environ 1 tous les 4 jours |
| 2 à 7 | 3. Simulations | 1 un jour sur deux, dont une à l'heure de l'examen |
| 1 | Veille | aucune : révision légère, repos |
| 0 | Jour J | conseils de gestion du temps |

**Objectif quotidien** :

```
travail restant = questions jamais vues + 2 × questions dont la dernière réponse est fausse
jours d'étude   = max(1, jours restants − 2)
objectif        = arrondi au multiple de 5 supérieur de borne(15 ; 60 ; travail restant / jours d'étude)
```

La veille et le jour J, l'objectif est fixé à 15.

**Statut** (« en avance », « dans les temps », « en retard ») : moyenne de questions travaillées par jour sur les 7 derniers jours (sans compter aujourd'hui) divisée par l'objectif. Au moins 1,15 : en avance. Au moins 0,85 : dans les temps. Au moins 0,5 : légèrement en retard. En dessous : en retard, avec une cible de rattrapage de 1,5 fois l'objectif (plafonnée à 60). La veille et le jour J, un message de confiance remplace ce calcul.

**Simulations recommandées** : somme sur chaque jour restant (jusqu'à J-2) de `1 / intervalle`, avec un intervalle de 7, 4 ou 2 jours selon la phase, arrondie. La « prochaine simulation conseillée » est la dernière simulation + l'intervalle de la phase.

**Série** : nombre de jours consécutifs avec au moins une question travaillée (aujourd'hui compte s'il y a de l'activité, sinon on part d'hier). **Calendrier** : cinq niveaux d'intensité (0, 1–9, 10–24, 25–49, 50 questions ou plus), jusqu'au jour J.

## 8. Rythme et questions têtues

**Rythme** : pour chaque question répondue, l'application mesure le temps de réflexion jusqu'à la validation (mode Étude) ou passé sur la question (mode Examen réel), **explication exclue**. Moyenne comparée au budget d'examen de 60 secondes : vert jusqu'à 45 s, orange jusqu'à 60 s, rouge au-delà. Les questions les plus lentes sont listées.

**Questions têtues** : questions ratées au moins deux fois, ou ratées à la dernière tentative. Classement par `2 × échecs + (1 si dernière tentative fausse) + échecs / tentatives`.

## 9. Historique et revue

Chaque session terminée d'**au moins 2 questions** est enregistrée (les 100 dernières sont conservées) avec ses questions, ses réponses et la correction. Une session d'une seule question (par exemple ouverte depuis le Coach) n'est pas enregistrée, pour ne pas fausser la courbe.

La **revue** rouvre la session en lecture seule : réponses données, correction, explication. Elle ne modifie ni les statistiques ni l'historique, et n'a pas de chronomètre. Les sessions enregistrées avant l'ajout de cette fonction n'ont que leur score : le lien de revue est alors désactivé.

## 10. Données stockées et sauvegarde

Tout est dans le `localStorage` du navigateur, sous la clé `nse4fgt_progress_v1`. Rien n'est envoyé nulle part.

```jsonc
{
  "stats": {                       // une entrée par question déjà vue
    "42": { "attempts": 3, "correct": 2, "lastCorrect": true,
            "totalTimeMs": 51000, "lastSeen": 1793000000000,
            "ansTimeMs": 38000, "ansN": 3 }
  },
  "flagged": { "42": true },       // questions marquées
  "history": [                     // sessions terminées
    { "date": 1793000000000, "label": "Pool aléatoire", "mode": "study",
      "total": 20, "correct": 15, "pct": 75, "totalTimeMs": 600000, "avgTimeMs": 30000,
      "qids": [3, 7], "picks": { "3": ["A"] }, "correctMap": { "3": true } }
  ],
  "activity": { "2026-10-31": { "q": 30, "c": 22, "ms": 900000 } },   // activité par jour
  "settings": { "examDate": "2026-12-08T15:00", "planStart": "2026-10-30",
                "theme": "light", "accent": "#2563EB" }               // theme et accent optionnels
}
```

**Sauvegarde** (icône disquette) : exporte ce JSON dans un fichier `nse4fgt-progress-AAAA-MM-JJ.json`. **Restauration** : remplace la progression par celle du fichier, après confirmation. Le fichier est validé : JSON invalide, fichier sans aucune donnée, thème inconnu ou couleur qui n'est pas de la forme `#RRGGBB` sont refusés ou ignorés. Les anciennes sauvegardes (sans `activity` ni `settings`) restent importables.

Une **réinitialisation** efface la progression mais conserve le thème et la couleur choisis.

## 11. Apparence

Deux thèmes (clair par défaut, sombre) et six couleurs d'accent. Tout passe par des variables CSS : le thème est appliqué par un petit script en tête de page, avant l'affichage, pour éviter tout clignotement. L'accent choisi remplace la couleur principale du thème, ses variantes (survol, bordures) sont calculées automatiquement.

## 12. Limites connues

- Les indicateurs (indice, statut, recommandations) sont des **aides à la décision**, pas des prédictions : le seuil de réussite officiel n'est pas public.
- Avec une banque de quelques dizaines de questions, un bon score finit par refléter la **mémoire des réponses** autant que la compréhension. Plus la banque est large, plus les indicateurs sont fiables.
- La progression est liée au **navigateur** : changer de navigateur ou vider ses données l'efface, d'où l'export.
- Les tests automatiques vérifient la logique, pas le rendu visuel : un contrôle sur de vrais écrans (ordinateur, téléphone) reste nécessaire.
- Les polices viennent de Google Fonts ; hors connexion, des polices système les remplacent.
