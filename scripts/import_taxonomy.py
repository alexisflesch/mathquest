"""
    Manual import script to push taxonomy (grade-level nomenclatures) into the DB.

    This script is intentionally manual-only and should be run by a maintainer.
    It reads YAML files located at the root of the `questions/` folder (not subdirectories),
    validates a minimal schema, computes a content hash, and upserts rows into the
    `taxonomy` table (Postgres JSONB column).

    Usage:
      python3 scripts/import_taxonomy.py --questions-dir ../questions

"""

import os
import sys
import yaml
import json
import uuid
import hashlib
import logging
import argparse
from dotenv import load_dotenv
import psycopg2


class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'


def color_text(text, color):
    return f"{color}{text}{Colors.ENDC}"


def print_ok(msg):
    print(color_text(msg, Colors.OKGREEN))


def print_warn(msg):
    print(color_text(msg, Colors.WARNING))


def print_err(msg):
    print(color_text(msg, Colors.FAIL))


def load_env():
    load_dotenv()
    cfg = {
        'DB_NAME': os.getenv('DB_NAME'),
        'DB_USER': os.getenv('DB_USER'),
        'DB_PASSWORD': os.getenv('DB_PASSWORD'),
        'DB_HOST': os.getenv('DB_HOST'),
        'DB_PORT': int(os.getenv('DB_PORT', '5432')),
    }
    return cfg


def get_conn(cfg):
    return psycopg2.connect(
        dbname=cfg['DB_NAME'],
        user=cfg['DB_USER'],
        password=cfg['DB_PASSWORD'],
        host=cfg['DB_HOST'],
        port=cfg['DB_PORT'],
    )


def validate_taxonomy(obj):
    """Perform a minimal validation of the taxonomy YAML structure.

    Expected shape (minimal):
      { 'disciplines': [ { 'nom': str, 'themes': [ { 'nom': str, 'tags': [str, ...] }, ... ] }, ... ] }

    Returns: (True, None) on success or (False, error_message) on failure.
    """
    if not isinstance(obj, dict):
        return False, 'Top-level taxonomy must be a mapping/object'
    if 'disciplines' not in obj:
        return False, "Missing key 'disciplines'"
    if not isinstance(obj['disciplines'], list):
        return False, "'disciplines' must be a list"
    for i, disc in enumerate(obj['disciplines']):
        if not isinstance(disc, dict):
            return False, f'disciplines[{i}] must be an object'
        if 'nom' not in disc or not isinstance(disc['nom'], str) or not disc['nom'].strip():
            return False, f"discipline at index {i} missing valid 'nom'"
        themes = disc.get('themes', [])
        if not isinstance(themes, list):
            return False, f"'themes' for discipline {disc.get('nom')} must be a list"
        for j, theme in enumerate(themes):
            if not isinstance(theme, dict):
                return False, f'disciplines[{i}].themes[{j}] must be an object'
            if 'nom' not in theme or not isinstance(theme['nom'], str) or not theme['nom'].strip():
                return False, f"theme at index {j} for discipline {disc.get('nom')} missing valid 'nom'"
            tags = theme.get('tags', [])
            if not isinstance(tags, list):
                return False, f"'tags' for theme {theme.get('nom')} must be a list"
            for k, tag in enumerate(tags):
                if not isinstance(tag, str):
                    return False, f'tag at index {k} in theme {theme.get("nom")} must be a string'
    return True, None


def compute_hash(obj):
    # canonical JSON (sorted keys) ensures stable hash
    s = json.dumps(obj, ensure_ascii=False, sort_keys=True)
    h = hashlib.sha256(s.encode('utf-8')).hexdigest()
    return h


def upsert_taxonomy(conn, grade_level, content_json, content_hash):
    cur = conn.cursor()
    # Use explicit cast to jsonb
    new_id = str(uuid.uuid4())
    cur.execute(
        '''INSERT INTO taxonomy (id, grade_level, content, content_hash, updated_at)
           VALUES (%s, %s, %s::jsonb, %s, now())
           ON CONFLICT (grade_level) DO UPDATE SET
             content = EXCLUDED.content,
             content_hash = EXCLUDED.content_hash,
             updated_at = now()
        ''',
        [new_id, grade_level, json.dumps(content_json, ensure_ascii=False), content_hash]
    )
    conn.commit()
    cur.close()


def find_root_yaml_files(questions_dir):
    # Only list files at the root of questions_dir (no subdirectories)
    files = []
    for entry in os.listdir(questions_dir):
        p = os.path.join(questions_dir, entry)
        if os.path.isfile(p) and entry.lower().endswith('.yaml'):
            files.append(p)
    return sorted(files)


def main():
    parser = argparse.ArgumentParser(description='Import taxonomy YAMLs to DB (manual script)')
    parser.add_argument('--questions-dir', default=os.path.abspath(os.path.join(os.path.dirname(__file__), '../questions')),
                        help='Path to questions directory (defaults to ../questions)')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

    cfg = load_env()
    missing = [k for k, v in cfg.items() if not v]
    if missing:
        print_err(f'Missing DB environment variables: {missing}. Check scripts/.env or environment.')
        sys.exit(1)

    qdir = os.path.abspath(args.questions_dir)
    if not os.path.isdir(qdir):
        print_err(f'Questions directory not found: {qdir}')
        sys.exit(1)

    files = find_root_yaml_files(qdir)
    if not files:
        print_warn(f'No YAML files found in {qdir} (only root-level .yaml files are considered)')
        return

    print_ok(f'Found {len(files)} taxonomy files in {qdir}')
    for fpath in files:
        print_ok(f'  - {os.path.basename(fpath)}')

    if not args.yes:
        resp = input('Proceed to import these taxonomy files into DB? [y/N]: ').strip().lower()
        if resp not in ('y', 'yes'):
            print('Aborted by user')
            return

    conn = None
    try:
        conn = get_conn(cfg)
    except Exception as e:
        print_err(f'Failed to connect to DB: {e}')
        sys.exit(1)

    successful = 0
    failed = 0
    for fpath in files:
        name = os.path.basename(fpath)
        grade_level = os.path.splitext(name)[0]
        try:
            with open(fpath, 'r', encoding='utf-8') as fh:
                content = yaml.safe_load(fh)
        except Exception as e:
            print_err(f'Failed to read {fpath}: {e}')
            failed += 1
            continue

        ok, err = validate_taxonomy(content)
        if not ok:
            print_err(f'Validation failed for {name}: {err}')
            failed += 1
            continue

        h = compute_hash(content)
        try:
            upsert_taxonomy(conn, grade_level, content, h)
            print_ok(f'Imported taxonomy for {grade_level} (hash={h[:8]})')
            successful += 1
        except Exception as e:
            print_err(f'Failed to upsert {grade_level}: {e}')
            failed += 1

    if conn:
        conn.close()

    print('\n' + '='*40)
    print_ok(f'Import finished: {successful} succeeded, {failed} failed')
    print('='*40 + '\n')


if __name__ == '__main__':
    main()
