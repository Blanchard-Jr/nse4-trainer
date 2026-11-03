# Ajouter ou modifier des questions

La banque est un seul fichier : **`data/questions.json`**. L'application n'a pas besoin d'être modifiée pour accueillir de nouvelles questions.

## Procédure

1. Édite `data/questions.json` (ajoute tes questions à la fin).
2. Reconstruis l'application, ce qui **valide** aussi la banque :
   ```bash
   python tools/build.py
   ```
3. Vérifie :
   ```bash
   npm test
   ```
4. Committe `data/questions.json` **et** `index.html` ensemble.

Le build refuse une banque invalide et dit précisément laquelle des questions pose problème.

## Format d'une question

```json
{
  "id": 83,
  "theme": "VPN IPsec/SSL",
  "question": "Refer to the exhibit. Which two changes bring phase 2 up? (Choose two.)",
  "choices": {
    "A": "On BR1-FGT, set Seconds to 43200.",
    "B": "On HQ-NGFW, enable Diffie-Hellman Group 2.",
    "C": "On BR1-FGT, set Remote Address to 10.0.11.0/24.",
    "D": "On HQ-NGFW, set Encryption to AES256."
  },
  "correct": ["C", "D"],
  "explanation": "Les sélecteurs distants ne correspondent pas… (explication en français, \n pour un retour à la ligne)",
  "multi": true,
  "images": ["data:image/webp;base64,UklGR…"]
}
```

| Champ | Règle |
|---|---|
| `id` | Entier unique. Les id doivent former la suite **1, 2, 3… sans trou** : les examens blancs s'appuient dessus. |
| `theme` | L'un des thèmes reconnus (liste ci-dessous). Il détermine le domaine officiel. |
| `question` | Texte de l'énoncé. `\n` pour un retour à la ligne. |
| `choices` | Objet lettre → texte, au moins 2 choix (`A`, `B`, `C`…). |
| `correct` | Liste non vide de lettres existant dans `choices`. |
| `multi` | `true` **si et seulement si** `correct` contient plusieurs lettres. Le build le vérifie. |
| `explanation` | Texte affiché après la réponse et dans la revue. |
| `images` | Liste d'URI `data:image/…;base64,…` (vide s'il n'y a pas d'exhibit). |

### Thèmes reconnus

`Système & Réseau`, `Logs & Monitoring`, `Politiques de pare-feu & NAT`, `Routing`, `Authentification pare-feu`, `Fortinet Single Sign-On (FSSO)`, `Certificats & Inspection SSL`, `Antivirus`, `Filtrage Web`, `IPS & Contrôle d'application`, `VPN IPsec/SSL`, `SD-WAN`, `Haute disponibilité (HA)`, `Diagnostics & Dépannage`, `FortiGate in the Cloud`, `FortiSASE`.

## Préparer un exhibit

Les images sont embarquées en base64 pour que l'application reste un fichier unique. Pour qu'elle reste légère :

- Convertis en **WebP** (qualité 80 environ) : une capture de GUI passe de 100 Ko en PNG à 10–30 Ko.
- Recadre sur l'exhibit, sans marges.
- Garde le texte **lisible** à 100 % : vérifie dans l'application, en agrandissant l'image.

Exemple de conversion et d'encodage :

```python
import base64
from PIL import Image

Image.open("capture.png").convert("RGB").save("capture.webp", "WEBP", quality=82, method=6)
uri = "data:image/webp;base64," + base64.b64encode(open("capture.webp", "rb").read()).decode()
```

## Ajouter un examen blanc

Les examens blancs A à E sont des plages d'id définies dans `src/template.html` (constante `EXAMS`). L'« Examen complet » suit automatiquement la taille de la banque. Pour créer un examen blanc F sur les questions 83 à 98, ajoute une ligne à `EXAMS` :

```js
{id:"examF", name:"Examen Blanc F", range:[83,98], desc:"Description courte — questions 83 à 98"},
```

## Publier le moteur sans les questions

Ce dépôt est privé car la banque contient du contenu tiers (voir le README). Pour partager seulement le moteur :

1. Crée un nouveau dépôt à partir d'une copie **sans** le dossier `data/` et sans `index.html` (il contient les questions).
2. Remplace `data/questions.json` par ta propre banque, ou par quelques questions d'exemple que tu as écrites toi-même.
3. N'oublie pas que l'**historique Git** conserve les anciens fichiers : pars d'un dépôt neuf plutôt que de supprimer des fichiers dans celui-ci.
