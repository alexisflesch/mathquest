"""
    LaTeX generation functions for yaml2latex
"""

from .utils import sanitize_latex, sanitize_latex_smart, sanitize_preserve_emoji, wrap_emojis, get_env_type, find_emoji_font_file



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
\usepackage{hyperref}
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
    raw_uid = q.get('uid', '')
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
    
    uid_display = sanitize_latex(raw_uid)
    file_uri = q.get('_file_uri')
    if file_uri:
        uri_norm = str(file_uri).replace('\\', '/')
        # Escape characters that hyperref treats specially
        uri_safe = (
            uri_norm
            .replace('%', r'\%')
            .replace('#', r'\#')
            .replace('_', r'\_')
            .replace('&', r'\&')
        )
        uid_link = f"\\href{{{uri_safe}}}{{{uid_display}}}"
    else:
        uid_link = uid_display
    
    line_info = q.get('_line_number')
    line_suffix = ""
    if isinstance(line_info, int) and line_info > 0:
        line_suffix = f" (ligne {sanitize_latex(str(line_info))})"

    header_line = f"\\textbf{{{uid_link} - {title}}}{time_str}{line_suffix}"

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