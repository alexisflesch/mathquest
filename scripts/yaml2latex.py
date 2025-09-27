"""
    Utilitaire pour générer des pdfs à partir des questions yaml
"""

#!/usr/bin/env python3
import os
import yaml
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from yaml2latex.utils import sanitize_latex
from yaml2latex.latex import latex_header, latex_footer, latex_question
from yaml2latex.compiler import compile_latex, clean_aux_files

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

