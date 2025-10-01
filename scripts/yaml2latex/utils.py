"""
    Utility functions for yaml2latex
"""

import re
import subprocess
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