"""
    Utilitaire pour la génération de la doc (nomenclature)
"""

import yaml
import json
import os
from glob import glob

base_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(base_dir, '..'))

# Uniquement traiter les YAML dans le dossier questions/
src_dir = os.path.join(root_dir, 'questions')
# Destination adaptée pour VuePress : .vuepress/data/ pour les imports ES6
dst_dir = os.path.join(root_dir, 'vuepress', 'docs', '.vuepress', 'data')
os.makedirs(dst_dir, exist_ok=True)

yaml_files = glob(os.path.join(src_dir, '*.yaml'))
for yaml_file in yaml_files:
    base_name = os.path.splitext(os.path.basename(yaml_file))[0]
    json_file = os.path.join(dst_dir, f"{base_name}.json")
    with open(yaml_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"{yaml_file} converti en {json_file}")