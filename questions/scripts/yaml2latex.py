#!/usr/bin/env python3
import os
import yaml
from pathlib import Path
import subprocess


import re

def sanitize_latex(s):
    if not isinstance(s, str):
        return s
    return s.replace('_', '\_').replace('%', '\%').replace('&', '\&').replace('#', '\#').replace('$', '\$').replace('{', '\{').replace('}', '\}').replace('^', '\^{}').replace('~', '\~{}')

# N'échappe pas les blocs \( ... \) et \[ ... \]
def sanitize_latex_smart(s):
    if not isinstance(s, str):
        return s
    # Regex pour trouver les blocs math \( ... \) et \[ ... \] sur plusieurs lignes
    pattern = r'(\\\(|\\\[)(.*?)(\\\)|\\\])'
    # Version améliorée :
    # - \( ... \)  ou  \[ ... \]  sur plusieurs lignes
    # - non greedy, mais inclut tout jusqu'à le bon séparateur
    pattern = r'(\\\(|\\\[)(.*?)(\\\)|\\\])'
    matches = list(re.finditer(pattern, s, re.DOTALL))
    if not matches:
        return sanitize_latex(s)
    parts = []
    last_end = 0
    for m in matches:
        before = s[last_end:m.start()]
        if before:
            parts.append(sanitize_latex(before))
        parts.append(m.group(0))
        last_end = m.end()
    if last_end < len(s):
        parts.append(sanitize_latex(s[last_end:]))
    return ''.join(parts)

def get_env_type(q):
    # Détection du type de question
    t = q.get('type', '').lower() or q.get('questionType', '').lower()
    if t in ['choix_multiple', 'multiple_choice']:
        return 'choix_multiple'
    elif t in ['numeric', 'numeric_answer']:
        return 'numeric'
    return 'choix_simple'

def latex_header(title, subtitle):
    title = sanitize_latex(title)
    subtitle = sanitize_latex(subtitle)
    full_title = title
    if subtitle:
        full_title += "\\\\" + subtitle
    return r"""
\documentclass[12pt]{{article}}
\usepackage[utf8]{{inputenc}}
\usepackage[T1]{{fontenc}}
\usepackage{{geometry}}
\geometry{{margin=2cm}}
\usepackage{{enumitem}}
\usepackage{{pifont}}
\usepackage{{amsmath, amssymb}}
% Environnements personnalisés
\newenvironment{{choix_simple}}{{\begin{{quote}}}}{{\end{{quote}}}}
\newenvironment{{choix_multiple}}{{\begin{{quote}}}}{{\end{{quote}}}}
\newenvironment{{numeric}}{{\begin{{quote}}}}{{\end{{quote}}}}
% Commandes pour champs
\newcommand{{\champAuteur}}[1]{{\textbf{{Auteur}} : #1}}
\newcommand{{\champDiscipline}}[1]{{\textbf{{Discipline}} : #1}}
\newcommand{{\champThemes}}[1]{{\textbf{{Thèmes}} : #1}}
\newcommand{{\champTags}}[1]{{\textbf{{Tags}} : #1}}
\newcommand{{\champTemps}}[1]{{\textbf{{Temps}} : #1 s}}
\newcommand{{\champDifficulte}}[1]{{\textbf{{Difficulté}} : #1}}
\newcommand{{\champNiveau}}[1]{{\textbf{{Niveau:}} #1}}
\newcommand{{\champUID}}[1]{{\textbf{{UID:}} #1}}
\newcommand{{\checkmark}}{{\ding{{51}}}}
\title{{{}}}
\author{{}}
\date{{}}
\begin{{document}}
\maketitle
""".format(full_title)

def latex_footer():
    return "\n\end{document}\n"

def latex_question(q):

    env = get_env_type(q)
    uid = sanitize_latex(q.get('uid', ''))
    title = sanitize_latex(q.get('title', ''))
    auteur = sanitize_latex(q.get('author', ''))
    discipline = sanitize_latex(q.get('discipline', ''))
    themes = q.get('themes', [])
    tags = q.get('tags', [])
    temps = sanitize_latex(q.get('time', ''))
    difficulte = sanitize_latex(q.get('difficulty', ''))
    niveau = sanitize_latex(q.get('level', ''))
    # Utilise le champ 'text' comme énoncé, en n'échappant pas les blocs math
    statement = sanitize_latex_smart(q.get('text', q.get('statement', '')))
    feedback = sanitize_latex(q.get('feedback', ''))
    explanation = sanitize_latex_smart(q.get('explanation', ''))
    feedback_wait_time = q.get('feedbackWaitTime', 5)

    # Ligne 1 : uid et titre en gras, séparés par un tiret, sans parenthèses, avec temps
    time_limit = q.get('timeLimit', q.get('time', None))
    time_str = f" ({time_limit}s)" if time_limit is not None else ""
    header_line = f"\\textbf{{{uid} - {title}}}{time_str}"

    # Ligne 2 : auteur, difficulté, etc. sur une seule ligne
    meta_parts = []
    if auteur:
        meta_parts.append(f"{auteur}")
    if discipline:
        meta_parts.append(f"{discipline}")
    if niveau:
        meta_parts.append(f"{niveau}")
    if difficulte:
        meta_parts.append(f"Difficulté : {difficulte}")
    if themes:
        meta_parts.append(", ".join(sanitize_latex(t) for t in themes))
    if tags:
        meta_parts.append(", ".join(sanitize_latex(t) for t in tags))
    meta_line = " \, | \, ".join(meta_parts)

    # Ligne 3 : énoncé (toujours affiché)
    statement_line = statement if statement else ""

    # Ligne 4 : réponses (toujours affiché)
    opts_latex = ""
    if env in ['choix_simple', 'choix_multiple']:
        opts = q.get('answerOptions', q.get('options', []))
        corrects = q.get('correctAnswers', [])
        if opts:
            opts_latex = "\\begin{enumerate}[label=\\alph*)]"
            for i, opt in enumerate(opts):
                txt = sanitize_latex(str(opt))
                correct = False
                if isinstance(corrects, list) and i < len(corrects):
                    correct = bool(corrects[i])
                if correct:
                    opts_latex += f"\n  \\item \\checkmark  {txt}"
                else:
                    opts_latex += f"\n  \\item  {txt}"
            opts_latex += "\n\\end{enumerate}"
        else:
            opts_latex = "\\textit{Aucune réponse}"
    elif env == 'numeric':
        # Affiche la réponse même si elle est 0 ou vide
        if 'correctAnswer' in q:
            answer = q.get('correctAnswer')
            opts_latex = f"\\textbf{{Réponse attendue}} : {sanitize_latex_smart(str(answer))}"
        else:
            opts_latex = "\\textit{Réponse numérique}"

    # Ligne 5 : feedback (temps) si présent
    fb_latex = ""
    if explanation:
        fb_latex = f"\\textbf{{Explication}} ({feedback_wait_time}s) : {explanation}"
    elif feedback:
        fb_latex = f"\\textit{{Feedback}} : {feedback}"
        if temps:
            fb_latex += f" \, (Temps : {temps} s)"
    elif temps:
        fb_latex = f"\\textit{{Temps}} : {temps} s"

    # Construction finale :
    # - \hline entre chaque exercice
    # - saut de ligne avant le texte
    # - pas de saut entre texte et réponses
    # - puces remplacées par checkmark/croix
    separator = "\\hline\n"

    # Réponses avec checkmark/croix pour choix
    if env in ['choix_simple', 'choix_multiple']:
        opts = q.get('answerOptions', q.get('options', []))
        corrects = q.get('correctAnswers', [])
        if opts:
            opts_latex = ""
            for i, opt in enumerate(opts):
                txt = sanitize_latex_smart(str(opt))
                correct = False
                if isinstance(corrects, list) and i < len(corrects):
                    correct = bool(corrects[i])
                symbol = "\\checkmark\," if correct else "\\ding{55}\,"
                opts_latex += f"{symbol} {txt}\\\\\n"
        else:
            opts_latex = "\\textit{Aucune réponse}"
    elif env == 'numeric':
        answer = q.get('correctAnswer', None)
        if answer is not None:
            opts_latex = f"\\textbf{{Réponse attendue}} : {sanitize_latex(str(answer))}"
        else:
            opts_latex = "\\textit{Réponse numérique}"

    # Construction finale
    return (
        f"{separator}"
        f"\\begin{{{env}}}\n"
        f"{header_line}\\\\\n"
        f"{meta_line}\\\\\n"
        f"\\\\ \n{statement_line}\\\\\n"
        f"{opts_latex}\n"
        f"{fb_latex}\n"
        f"\\end{{{env}}}\n"
    )

def process_yaml_file(yaml_path, title, subtitle, out_tex):
    with open(yaml_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    questions = data if isinstance(data, list) else [data]
    with open(out_tex, 'w', encoding='utf-8') as f:
        f.write(latex_header(title, subtitle))
        for q in questions:
            f.write(latex_question(q))
        f.write(latex_footer())

def compile_latex(tex_path):
    subprocess.run(['pdflatex', '-interaction=nonstopmode', tex_path], cwd=tex_path.parent)
    subprocess.run(['pdflatex', '-interaction=nonstopmode', tex_path], cwd=tex_path.parent)

def clean_aux_files(folder):
    for ext in ['aux', 'log', 'out', 'toc']:
        for f in Path(folder).glob(f'*.{ext}'):
            f.unlink()

def main():

    import argparse
    base_dir = Path(__file__).parent.parent.resolve()
    parser = argparse.ArgumentParser(description="Compile les fichiers YAML en LaTeX.")
    parser.add_argument('dossier', nargs='?', help='Nom du dossier à compiler (optionnel)')
    parser.add_argument('sous_dossier', nargs='?', help='Nom du sous-dossier à compiler (optionnel)')
    args = parser.parse_args()

    # Détermine le(s) dossier(s) à compiler
    if not args.dossier:
        # Tout compiler
        folders = [Path(root) for root, dirs, files in os.walk(base_dir) if any(f.endswith('.yaml') for f in files)]
    elif not args.sous_dossier:
        # Un dossier
        target = base_dir / args.dossier
        folders = [Path(root) for root, dirs, files in os.walk(target) if any(f.endswith('.yaml') for f in files)]
    else:
        # Dossier + sous-dossier
        target = base_dir / args.dossier / args.sous_dossier
        folders = [Path(root) for root, dirs, files in os.walk(target) if any(f.endswith('.yaml') for f in files)]

    for folder in folders:
        yaml_files = [f for f in os.listdir(folder) if f.endswith('.yaml')]
        if not yaml_files:
            continue
        title = folder.name
        subtitle = folder.parent.name if folder.parent != base_dir else ''
        for yf in yaml_files:
            yaml_path = folder / yf
            out_tex = folder / f'{title}.tex'
            process_yaml_file(yaml_path, title, subtitle, out_tex)
            compile_latex(out_tex)
            clean_aux_files(folder)

    # Met à jour le .gitignore
    gitignore = Path(base_dir) / '.gitignore'
    lines = []
    if gitignore.exists():
        with open(gitignore, 'r') as f:
            lines = f.readlines()
    for ext in ['*.tex', '*.pdf']:
        if ext + '\n' not in lines and ext not in ''.join(lines):
            lines.append(ext + '\n')
    with open(gitignore, 'w') as f:
        f.writelines(lines)

if __name__ == '__main__':
    main()

