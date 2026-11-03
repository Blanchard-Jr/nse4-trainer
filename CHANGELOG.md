# Historique des versions

## 1.0.0 — novembre 2026

Première version stable, construite par itérations successives.

**Entraînement**
- Banque de 82 questions (32 avec exhibits), classées en thèmes et en 5 domaines officiels FCP.
- Modes Étude et Examen réel (chronomètre à 1 min/question, aucune correction avant la fin).
- Règle des réponses multiples : sélection plafonnée, erreur explicite si incomplète.
- Pool aléatoire pondéré (jamais vues et ratées prioritaires), examens blancs, filtre par thème, révision des erreurs, marquage.

**Coaching et mesure**
- Coach FCP FortiGate : concepts, pièges, exhibits, commandes CLI par domaine.
- Rapport de fin de session : maîtrise par domaine, forces et faiblesses, recommandations.
- Tableau de bord : indice de préparation, radar, courbe de progression, rythme, questions têtues.
- Historique des examens avec revue des sessions passées.
- Plan jusqu'au jour J : compte à rebours, phases, objectif quotidien, simulations conseillées, série et calendrier.

**Confort**
- Thèmes clair et sombre, six couleurs d'accent.
- Export et import de la progression.
- Interface adaptée aux petits écrans.

**Ingénierie**
- Code et données séparés, assemblage et validation par `tools/build.py`.
- 136 vérifications automatiques, horloge figée, intégration continue GitHub Actions.
