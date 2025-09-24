"""
    Utilitaire pour générer des pdfs à partir des questions yaml
"""

#!/usr/bin/env python3
import os
import yaml
from pathlib import Path
import subprocess


import re
from typing import Set

# When option 1 selected: do not attempt font or image rendering; replace emoji with placeholder
EMOJI_PLACEHOLDER = '[emoji]'

def find_emoji_font_file():
    """Return an absolute path to a Noto Color Emoji ttf if present, else None."""
    try:
        out = subprocess.check_output(['fc-list', ':file family'], stderr=subprocess.DEVNULL).decode('utf-8')
        for line in out.splitlines():
            # line format: /path/to/file.ttf: Family Name
            parts = line.split(':')
            if not parts:
                continue
            path = parts[0].strip()
            fam = ':'.join(parts[1:]).strip()
            if 'Noto Color Emoji' in fam or 'NotoColorEmoji' in path or 'Noto-Emoji' in path or 'NotoEmoji' in fam:
                return path
    except Exception:
        return None
    return None

def sanitize_latex(s):
    if not isinstance(s, str):
        return s
    # Escape LaTeX special characters, but avoid re-escaping ones that are
    # already escaped in the source (e.g. "\_" should remain "\_"). We use
    # negative lookbehind to only match characters not preceded by a backslash.
    s2 = s
    # Common single-char escapes
    replacements = [
        (r'(?<!\\)_', r'\\_'),
        (r'(?<!\\)%', r'\\%'),
        (r'(?<!\\)&', r'\\&'),
        (r'(?<!\\)#', r'\\#'),
        (r'(?<!\\)\$', r'\\$'),
        (r'(?<!\\){', r'\\{'),
        (r'(?<!\\)}', r'\\}'),
    ]
    for pat, repl in replacements:
        s2 = re.sub(pat, repl, s2)
    # Caret and tilde need special forms
    s2 = re.sub(r'(?<!\\)\^', r'\\^{}', s2)
    s2 = re.sub(r'(?<!\\)~', r'\\~{}', s2)
    return s2

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

def wrap_emojis(s):
    """Replace emoji characters by \emoji{<char>} so they render with the emoji font.
    Matches common emoji Unicode ranges.
    """
    if not isinstance(s, str) or not s:
        return s
    # common emoji ranges: Misc symbols, emoticons, transport, dingbats, etc.
    emoji_pattern = re.compile(r'([\U0001F300-\U0001F5FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\u2600-\u26FF\u2700-\u27BF])')
    return emoji_pattern.sub(r'\\emoji{\1}', s)


def sanitize_preserve_emoji(s):
    """Sanitize a string for LaTeX while preserving emoji characters.
    Approach:
    - Find emoji runs and replace them by placeholders (\x01, \x02, ...)
    - Run existing sanitize_latex / sanitize_latex_smart on the non-emoji parts
    - Reinsert the emoji runs wrapped in a TeX group that selects the emoji font
      i.e. {\emojiFont <emoji>} so fontspec will use the emoji font for that glyph
    """
    if not isinstance(s, str) or not s:
        return s
    # Regex matching a wide set of emoji/codepoints (extend as needed)
    emoji_pattern = re.compile(r'([\U0001F300-\U0001FAFF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\u2600-\u26FF\u2700-\u27BF])')
    parts = []
    placeholders = {}
    idx = 0
    last = 0
    for m in emoji_pattern.finditer(s):
        if m.start() > last:
            parts.append(s[last:m.start()])
        ph = f"\x01{idx}\x02"
        placeholders[ph] = m.group(0)
        parts.append(ph)
        idx += 1
        last = m.end()
    if last < len(s):
        parts.append(s[last:])

    # Sanitize the non-emoji pieces using the smart sanitizer to keep math blocks
    sanitized = ''.join(sanitize_latex_smart(p) if not (p.startswith('\x01') and p.endswith('\x02')) else p for p in parts)

    # Reinsert emojis with a simple textual placeholder (easier, portable)
    for ph, emo in placeholders.items():
        sanitized = sanitized.replace(ph, EMOJI_PLACEHOLDER)
    return sanitized

def get_env_type(q):
    # Détection du type de question
    t = q.get('type', '').lower() or q.get('questionType', '').lower()
    if t in ['choix_multiple', 'multiple_choice']:
        return 'choix_multiple'
    elif t in ['numeric', 'numeric_answer']:
        return 'numeric'
    return 'choix_simple'

def latex_header(title, subtitle):
    full_title = subtitle + " - " + title
    # Try to find an installed Noto Color Emoji file and prefer explicit path when available
    emoji_ttf = find_emoji_font_file()
    # If we found a ttf file, add a fontspec option to load it by path
    # We no longer load or declare an emoji font because emojis are replaced by a
    # textual placeholder earlier in the pipeline (EMOJI_PLACEHOLDER). Keep fontspec
    # available for users who choose a Unicode engine, but avoid forcing specific
    # fonts that previously caused engine-dependent failures.
    emoji_font_declaration = ''

    header = r"""
\documentclass[12pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{geometry}
\geometry{margin=2cm}
\usepackage{enumitem}
\usepackage{pifont}
\usepackage{color,xcolor}
\usepackage{amsmath, amssymb}
% Allow unicode fonts (for emoji) when using XeLaTeX
\usepackage{fontspec}
% Keep fontspec available for Unicode-aware engines; do not force a specific main or emoji font
""" + "\n" + emoji_font_declaration + "\n" + r"""
% Use TikZ to draw a reliable forbidden icon (avoids missing emoji fonts)
\usepackage{tikz}
% Environnements personnalisés
\newenvironment{choix_simple}{\begin{quote}}{\end{quote}}
\newenvironment{choix_multiple}{\begin{quote}}{\end{quote}}
\newenvironment{numeric}{\begin{quote}}{\end{quote}}
% Commandes pour champs
\newcommand{\champAuteur}[1]{\textbf{Auteur} : #1}
\newcommand{\champDiscipline}[1]{\textbf{Discipline} : #1}
\newcommand{\champThemes}[1]{\textbf{Thèmes} : #1}
\newcommand{\champTags}[1]{\textbf{Tags} : #1}
\newcommand{\champTemps}[1]{\textbf{Temps} : #1 s}
\newcommand{\champDifficulte}[1]{\textbf{Difficulté} : #1}
\newcommand{\champNiveau}[1]{\textbf{Niveau:} #1}
\newcommand{\champUID}[1]{\textbf{UID:} #1}
% Draw a simple 'forbidden' icon using pifont inside a red colorbox (reliable)
\newcommand{\forbiddenIcon}{%
    \raisebox{-0.2ex}{\colorbox{red}{\textcolor{white}{\small\ding{55}}}}%
}
\newcommand{\panneauInterdit}[1]{%
        \vspace{0.3em}\noindent\fcolorbox{red}{white}{\textcolor{red}{\textbf{\forbiddenIcon~#1}}}\\
}
\definecolor{darkgreen}{RGB}{0,120,0}
\definecolor{myblue}{RGB}{0,70,200}
\renewcommand{\checkmark}{\textcolor{darkgreen}{\ding{51}}}
\newcommand{\cross}{\textcolor{red}{\ding{55}}}
% Ligne séparatrice personnalisée : boxée et colorée
\newcommand{\questionsep}[1]{\vspace{0.5em}\noindent\\[0.1em]\noindent\fcolorbox{myblue}{white}{\textcolor{myblue}{\textbf{#1}}}\hrulefill\noindent}
___TITLE___
\author{}
\date{}
\begin{document}
\maketitle
"""
    # remplacer le placeholder de titre par le titre réel en l'échappant
    header = header.replace('___TITLE___', f"\\title{{{sanitize_latex(full_title)}}}")
    return header

def latex_footer():
    return "\n\end{document}\n"

def latex_question(q):

    env = get_env_type(q)
    uid = sanitize_latex(q.get('uid', ''))
    title = sanitize_latex_smart(q.get('title', ''))
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

    # Panneau pour les modes exclus
    excluded = q.get('excludedFrom', []) or []
    excluded_latex = ''
    if excluded:
        # map internal names to friendly french labels
        name_map = {
            'practice': 'entraînement',
            'tournament': 'tournoi',
            'quiz': 'quiz',
        }
        labels = [name_map.get(x, x) for x in excluded]
        excluded_latex = f"\\panneauInterdit{{{sanitize_latex(', '.join(labels))}}}\n"

    # Ligne 1 : uid et titre en gras, séparés par un tiret, sans parenthèses, avec temps
    time_limit = q.get('timeLimit', q.get('time', None))
    time_str = f" ({time_limit}s)" if time_limit is not None else ""
    header_line = f"\\textbf{{{uid} - {title}}}{time_str}"

    # Ligne 2 : auteur, difficulté, etc. sur une seule ligne
    meta_parts = []
    if auteur:
        meta_parts.append(f"{auteur}")
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
    # Sanitize while preserving/wrapping emoji runs so they use the emoji font
    statement_line = sanitize_preserve_emoji(statement) if statement else ""

    # Ligne 4 : réponses (toujours affiché)
    opts_latex = ""
    # --- Numeric question: check for answerOption and numeric ---
    if env == 'numeric':
        answer = None
        # Prefer answerOption if present and numeric
        if 'answerOption' in q:
            ao = q.get('answerOption')
            try:
                # Accept int or float
                if isinstance(ao, (int, float)) or (isinstance(ao, str) and ao.replace('.', '', 1).isdigit()):
                    answer = ao
            except Exception:
                pass
        if answer is None and 'correctAnswer' in q:
            answer = q.get('correctAnswer')
        if answer is not None:
            opts_latex = f"\\textbf{{Réponse attendue}} : {sanitize_latex_smart(str(answer))}"
        else:
            opts_latex = "\\textit{Réponse numérique}"
    # --- Single choice: ensure only one correct answer ---
    elif env == 'choix_simple':
        opts = q.get('answerOptions', q.get('options', []))
        corrects = q.get('correctAnswers', [])
        # Check that only one answer is True
        if isinstance(corrects, list) and sum(bool(x) for x in corrects) != 1:
            opts_latex = "\\textcolor{red}{\\textbf{Attention: une seule réponse correcte doit être sélectionnée!}}\\\n"
        if opts:
            opts_latex += "\\begin{enumerate}[label=\\alph*)]"
            for i, opt in enumerate(opts):
                txt = sanitize_preserve_emoji(str(opt))
                correct = False
                if isinstance(corrects, list) and i < len(corrects):
                    correct = bool(corrects[i])
                if correct:
                    opts_latex += f"\n  \\item \\checkmark  {wrap_emojis(txt)}"
                else:
                    opts_latex += f"\n  \\item  {wrap_emojis(txt)}"
            opts_latex += "\n\\end{enumerate}"
        else:
            opts_latex += "\\textit{Aucune réponse}"
    # --- Multiple choice: keep original logic ---
    elif env == 'choix_multiple':
        opts = q.get('answerOptions', q.get('options', []))
        corrects = q.get('correctAnswers', [])
        if opts:
            opts_latex = "\\begin{enumerate}[label=\\alph*)]"
            for i, opt in enumerate(opts):
                txt = sanitize_preserve_emoji(str(opt))
                correct = False
                if isinstance(corrects, list) and i < len(corrects):
                    correct = bool(corrects[i])
                if correct:
                    opts_latex += f"\n  \\item \\checkmark  {wrap_emojis(txt)}"
                else:
                    opts_latex += f"\n  \\item  {wrap_emojis(txt)}"
            opts_latex += "\n\\end{enumerate}"
        else:
            opts_latex = "\\textit{Aucune réponse}"

    # Ligne 5 : feedback (temps) si présent
    fb_latex = ""
    if explanation:
        # Ensure the explanation starts on its own line in LaTeX output.
        # We prepend a newline command so it doesn't run on the same line as the answer block.
        #only for numeric questions
        fb_latex = f"\\textbf{{Explication}} ({feedback_wait_time}s) : {sanitize_preserve_emoji(explanation)}"
        if env=='numeric':
            fb_latex = "\\newline " + fb_latex
    elif feedback:
        fb_latex = f"\\textit{{Feedback}} : {feedback}"
        if temps:
            fb_latex += f" \, (Temps : {temps} s)"
    elif temps:
        fb_latex = f"\\textit{{Temps}} : {temps} s"

    # Construction finale :
    # - séparateur personnalisé entre chaque exercice
    # - saut de ligne avant le texte
    # - puces remplacées par checkmark/croix
    env_label = {
        'choix_simple': 'choix_simple',
        'choix_multiple': 'choix_multiple',
        'numeric': 'numeric',
    }.get(env, env)
    env_label_escaped = sanitize_latex(env_label)
    separator = f"\\questionsep{{{env_label_escaped}}}\n"

    # Réponses avec checkmark/croix pour choix
    if env in ['choix_simple', 'choix_multiple']:
        opts = q.get('answerOptions', q.get('options', []))
        corrects = q.get('correctAnswers', [])
        if opts:
            opts_latex = ""
            for i, opt in enumerate(opts):
                txt = sanitize_preserve_emoji(str(opt))
                correct = False
                if isinstance(corrects, list) and i < len(corrects):
                    correct = bool(corrects[i])
                symbol = "\\checkmark\\," if correct else "\\cross\\,"
                opts_latex += f"{symbol} {txt}\\\\\n"
        else:
            opts_latex = "\\textit{Aucune réponse}"
    elif env == 'numeric':
        answer = q.get('correctAnswer', None)
        if answer is not None:
            opts_latex = f"\\textbf{{Réponse attendue}} : {sanitize_latex(str(answer))}"
        else:
            opts_latex = "\\textit{Réponse numérique}"

    # Retour sécurisé de la chaîne LaTeX (construction sans f-strings complexes)
    out = ""
    out += separator
    out += "\\begin{" + env + "}\n"
    out += header_line + "\\\\\n"
    out += meta_line + "\\\\\n"
    out += "\\medskip\n"
    out += excluded_latex
    out += statement_line + "\\\\\n"
    out += opts_latex + "\n"
    out += fb_latex + "\n"
    out += "\\end{" + env + "}\n"
    return out

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
    # Prefer lualatex if available (better color emoji support via fontspec + HarfBuzz),
    # otherwise fallback to xelatex.
    def has_cmd(cmd):
        from shutil import which
        return which(cmd) is not None

    # Detect presence of Noto Color Emoji
    def has_emoji_font():
        try:
            out = subprocess.check_output(['fc-list', ':family'], stderr=subprocess.DEVNULL).decode('utf-8')
            return 'Noto Color Emoji' in out
        except Exception:
            return False

    engine = None
    if has_cmd('lualatex') and has_emoji_font():
        engine = 'lualatex'
    elif has_cmd('xelatex'):
        engine = 'xelatex'
    else:
        engine = 'xelatex'  # fallback; will error if absent

    # Diagnostics for debugging emoji rendering
    print(f"[yaml2latex] Using LaTeX engine: {engine}")
    print(f"[yaml2latex] Noto Color Emoji available: {has_emoji_font()}")



    # Try to dump a small excerpt around the first emoji (if any) for inspection
    try:
        txt = Path(tex_path).read_text(encoding='utf-8')
        m = re.search(r'([\U0001F300-\U0001FAFF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\u2600-\u26FF\u2700-\u27BF])', txt)
        if m:
            start = max(0, m.start() - 40)
            end = min(len(txt), m.end() + 40)
            excerpt = txt[start:end]
            print("[yaml2latex] .tex excerpt around first emoji:")
            print(excerpt)
    except Exception:
        pass

    def run_engine(cmd):
        try:
            cp = subprocess.run(cmd, cwd=tex_path.parent, capture_output=True, text=True)
            if cp.returncode != 0:
                print(f"[yaml2latex] {cmd[0]} failed with return code {cp.returncode}")
                if cp.stdout:
                    print("[yaml2latex] stdout:")
                    print(cp.stdout)
                if cp.stderr:
                    print("[yaml2latex] stderr:")
                    print(cp.stderr)
            return cp.returncode, cp.stdout + "\n" + cp.stderr
        except Exception as e:
            print(f"[yaml2latex] Error running {cmd}: {e}")
            return 1, str(e)

    cmd = [engine, '-interaction=nonstopmode', tex_path]
    rc, out = run_engine(cmd)
    if rc != 0 and engine == 'lualatex':
        print('[yaml2latex] lualatex failed, retrying with xelatex')
        if has_cmd('xelatex'):
            engine = 'xelatex'
            cmd = [engine, '-interaction=nonstopmode', tex_path]
            rc2, out2 = run_engine(cmd)
            rc = rc2
            out = out2
        else:
            print('[yaml2latex] xelatex not available as fallback')
    # run a second pass if first succeeded
    if rc == 0:
        run_engine([engine, '-interaction=nonstopmode', tex_path])

def clean_aux_files(folder):
    for ext in ['aux', 'log', 'out', 'toc']:
        for f in Path(folder).glob(f'*.{ext}'):
            f.unlink()

def main():

    import argparse
    # Le script est maintenant dans monapp/scripts, donc on remonte d'un niveau et on va dans questions
    base_dir = Path(__file__).parent.parent.resolve() / 'questions'
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
        out_tex = folder / f'{title}.tex'
        with open(out_tex, 'w', encoding='utf-8') as f:
            f.write(latex_header(title, subtitle))
            for yf in yaml_files:
                yaml_path = folder / yf
                section_name = os.path.splitext(yf)[0]
                f.write(f"\\section{{{sanitize_latex(section_name)}}}\n")
                with open(yaml_path, 'r', encoding='utf-8') as yfile:
                    data = yaml.safe_load(yfile)
                questions = data if isinstance(data, list) else [data]
                for q in questions:
                    f.write(latex_question(q))
            f.write(latex_footer())
        compile_latex(out_tex)
        clean_aux_files(folder)

if __name__ == '__main__':
    main()

