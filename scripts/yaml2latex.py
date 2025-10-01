"""
    Utilitaire pour générer des pdfs à partir des questions yaml
"""

#!/usr/bin/env python3
import os
import shutil
import yaml
from pathlib import Path
import sys
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).parent))

from yaml2latex.utils import sanitize_latex
from yaml2latex.latex import latex_header, latex_footer, latex_question
from yaml2latex.compiler import compile_latex, clean_aux_files

def find_question_line_number(yaml_path, uid):
    """Find the line number where a question with given uid starts in the YAML file."""
    with open(yaml_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines, 1):  # 1-indexed
        if f'uid: {uid}' in line or f"uid: '{uid}'" in line or f'uid: "{uid}"' in line:
            return i
    return 1  # fallback


def to_file_uri(source_file: Path) -> str:
    """Return a file:// URI accessible from Windows or local viewers."""
    distro = os.environ.get('WSL_DISTRO_NAME')
    # When running inside WSL, expose files via the UNC share (\\wsl.localhost\<distro>\...)
    if distro:
        # Drop leading slash from the POSIX path and URL-encode safely while preserving separators
        posix_path = source_file.as_posix().lstrip('/')
        quoted = quote(posix_path, safe="/-_.~!")
        return f"file://wsl.localhost/{distro}/{quoted}"

    # Fallback to standard file URI for non-WSL environments
    return source_file.resolve().as_uri()


def remove_legacy_launchers(folder: Path):
    legacy_dir = folder / 'open-in-vscode'
    if legacy_dir.exists() and legacy_dir.is_dir():
        shutil.rmtree(legacy_dir)

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
        remove_legacy_launchers(folder)
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
                    # Add source location info
                    uid = q.get('uid', '')
                    line_number = find_question_line_number(yaml_path, uid)
                    q['_source_file'] = str(yaml_path)
                    q['_line_number'] = line_number
                    q['_file_uri'] = to_file_uri(yaml_path)
                    f.write(latex_question(q))
            f.write(latex_footer())
        compile_latex(out_tex)
        clean_aux_files(folder)

if __name__ == '__main__':
    main()

