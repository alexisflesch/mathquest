#!/usr/bin/env python3
"""
Script de migration pour moderniser la variable d'environnement backend frontend MathQuest.
Remplace toutes les occurrences de NEXT_PUBLIC_BACKEND_URL et NEXT_PUBLIC_BACKEND_URL_API par NEXT_PUBLIC_BACKEND_API_URL
et adapte les accès à la variable dans le code, les .env, et les messages d'erreur.

Usage :
    python3 scripts/replace_backend_env_var.py
"""
import os
import re

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

# Extensions de fichiers à traiter
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.env', '.md'}

# Fichiers à ignorer (build, cache, node_modules, etc)
EXCLUDE_DIRS = {'node_modules', '.next', 'dist', 'coverage', '.git', '.turbo', '.cache'}

# Patterns à remplacer
REPLACEMENTS = [
    # Variables d'environnement
    (r'NEXT_PUBLIC_BACKEND_URL_API', 'NEXT_PUBLIC_BACKEND_API_URL'),
    (r'NEXT_PUBLIC_BACKEND_URL', 'NEXT_PUBLIC_BACKEND_API_URL'),
    # Messages d'erreur explicites
    (r'NEXT_PUBLIC_BACKEND_URL_API non défini', 'NEXT_PUBLIC_BACKEND_API_URL non défini'),
    (r'NEXT_PUBLIC_BACKEND_URL non défini', 'NEXT_PUBLIC_BACKEND_API_URL non défini'),
    (r'Configuration serveur manquante : NEXT_PUBLIC_BACKEND_URL_API', 'Configuration serveur manquante : NEXT_PUBLIC_BACKEND_API_URL'),
    (r'Configuration serveur manquante : NEXT_PUBLIC_BACKEND_URL', 'Configuration serveur manquante : NEXT_PUBLIC_BACKEND_API_URL'),
]

def should_process_file(filename):
    ext = os.path.splitext(filename)[1]
    return ext in EXTENSIONS

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content
    for pattern, repl in REPLACEMENTS:
        new_content = re.sub(pattern, repl, new_content)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[MODIFIED] {filepath}")

def walk_and_process():
    for root, dirs, files in os.walk(FRONTEND_DIR):
        # Exclure certains dossiers
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if should_process_file(file):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    walk_and_process()
    print("Migration terminée. Pensez à rebuild le frontend.")
