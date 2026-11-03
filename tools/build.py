#!/usr/bin/env python3
"""
Assemble l'application autonome `index.html` à partir de :
    src/template.html   le code (HTML, CSS, JavaScript)
    data/questions.json la banque de questions (texte + exhibits en base64)
    package.json        le numéro de version

Usage :
    python tools/build.py           construit index.html
    python tools/build.py --check   échoue si index.html n'est pas à jour (utilisé par la CI)
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "src" / "template.html"
DATA = ROOT / "data" / "questions.json"
PACKAGE = ROOT / "package.json"
OUTPUT = ROOT / "index.html"

REQUIRED = ("id", "theme", "question", "choices", "correct", "explanation", "multi", "images")


def known_themes(template: str):
    """Lit la liste des thèmes directement dans le code, pour ne pas la dupliquer ici."""
    m = re.search(r"const THEME_ORDER = \[(.*?)\];", template, re.S)
    if not m:
        raise SystemExit("THEME_ORDER introuvable dans le template.")
    return set(re.findall(r'"([^"]+)"', m.group(1)))


def validate(questions, themes):
    errors = []
    if not isinstance(questions, list) or not questions:
        return ["data/questions.json doit contenir une liste non vide."]
    seen = set()
    for i, q in enumerate(questions, 1):
        where = f"question n°{i} (id={q.get('id') if isinstance(q, dict) else '?'})"
        if not isinstance(q, dict):
            errors.append(f"{where} : doit être un objet.")
            continue
        for key in REQUIRED:
            if key not in q:
                errors.append(f"{where} : champ « {key} » manquant.")
        if errors and any(where in e for e in errors):
            continue
        if q["id"] in seen:
            errors.append(f"{where} : id en double.")
        seen.add(q["id"])
        if q["theme"] not in themes:
            errors.append(f"{where} : thème inconnu « {q['theme']} ».")
        if not isinstance(q["choices"], dict) or len(q["choices"]) < 2:
            errors.append(f"{where} : au moins 2 choix attendus.")
            continue
        if not q["correct"] or not set(q["correct"]) <= set(q["choices"]):
            errors.append(f"{where} : « correct » doit être une liste non vide de lettres présentes dans « choices ».")
        elif q["multi"] != (len(q["correct"]) > 1):
            errors.append(f"{where} : « multi » doit valoir true si et seulement si plusieurs réponses sont attendues.")
        for img in q["images"]:
            if not (isinstance(img, str) and img.startswith("data:image/")):
                errors.append(f"{where} : les images doivent être des URI « data:image/... ».")
                break
    ids = sorted(seen)
    if ids != list(range(1, len(ids) + 1)):
        errors.append("Les id doivent former la suite 1, 2, 3… sans trou (les examens blancs s'appuient dessus).")
    return errors


def build():
    template = TEMPLATE.read_text(encoding="utf-8")
    questions = json.loads(DATA.read_text(encoding="utf-8"))
    version = json.loads(PACKAGE.read_text(encoding="utf-8"))["version"]

    errors = validate(questions, known_themes(template))
    if errors:
        print("Banque de questions invalide :", file=sys.stderr)
        for e in errors:
            print("  -", e, file=sys.stderr)
        raise SystemExit(1)

    payload = json.dumps(questions, ensure_ascii=False)
    if "</script" in payload.lower():
        raise SystemExit("Une question contient « </script » : impossible de l'embarquer dans la page.")
    if template.count("__QUESTIONS_JSON__") != 1:
        raise SystemExit("Le template doit contenir exactement un marqueur __QUESTIONS_JSON__.")

    html = template.replace("__QUESTIONS_JSON__", payload).replace("__APP_VERSION__", version)
    return html, questions, version


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="vérifie que index.html est à jour sans l'écrire")
    args = ap.parse_args()

    html, questions, version = build()
    images = sum(len(q["images"]) for q in questions)
    exhibits = sum(1 for q in questions if q["images"])
    summary = f"v{version} · {len(questions)} questions · {exhibits} avec exhibits ({images} images) · {len(html) / 1024:.0f} Ko"

    if args.check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if current != html:
            print("index.html n'est pas à jour : lance « python tools/build.py » puis commit.", file=sys.stderr)
            raise SystemExit(1)
        print("index.html à jour —", summary)
        return

    OUTPUT.write_text(html, encoding="utf-8", newline="\n")
    print("index.html construit —", summary)


if __name__ == "__main__":
    main()
