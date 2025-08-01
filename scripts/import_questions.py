"""
    Pour importer les questions dans la BDD
"""

import yaml
import psycopg2
import os
import logging
import sys

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def color_text(text, color):
    return f"{color}{text}{Colors.ENDC}"
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT', 5432))

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

# Import all YAML files in ../questions
def get_yaml_paths():
    questions_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../questions'))
    yaml_paths = []
    for root, dirs, files in os.walk(questions_dir):
        for f in files:
            if f.endswith('.yaml'):
                yaml_paths.append(os.path.join(root, f))
    return yaml_paths

# Connect to PostgreSQL
def get_conn():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )

def clear_db():
    conn = get_conn()
    cur = conn.cursor()
    logging.info('Clearing the game_participants, game_instances, and polymorphic question tables...')
    cur.execute('DELETE FROM game_participants')
    cur.execute('DELETE FROM game_instances') 
    cur.execute('DELETE FROM game_templates')
    # Clear polymorphic question tables (will cascade from questions table due to foreign keys)
    cur.execute('DELETE FROM multiple_choice_questions')
    cur.execute('DELETE FROM numeric_questions')
    cur.execute('DELETE FROM questions')
    conn.commit()
    cur.close()
    conn.close()
    logging.info('Tables game_participants, game_instances, game_templates, and question tables cleared.')

def import_questions():

    def print_colored(level, msg):
        prefix = f"[{level}] "
        if level == 'INFO':
            print(color_text(prefix + msg, Colors.OKGREEN))
        elif level == 'WARNING':
            if verbose:
                print(color_text(prefix + msg, Colors.WARNING))
        elif level == 'ERROR':
            print(color_text(prefix + msg, Colors.FAIL))
        else:
            print(prefix + msg)

    print_colored('INFO', 'Starting import process...')
    # NE PAS supprimer la table tant que la validation n'est pas finie !

    total_uploaded = 0
    total_errors = 0
    total_warnings = 0
    all_errors = []
    all_warnings = []
    all_questions = []
    # For summary: count per discipline/theme
    from collections import defaultdict
    questions_per_folder = defaultdict(int)
    global verbose
    # --- NOUVELLE LOGIQUE ---
    import glob
    questions_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../questions'))
    # 1. Trouver tous les dossiers à la racine de questions/
    root_items = os.listdir(questions_dir)
    root_dirs = [d for d in root_items if os.path.isdir(os.path.join(questions_dir, d))]
    # 2. Charger les nomenclatures (ex: cp.yaml, ce1.yaml, ...)
    nomenclatures = {}
    for d in root_dirs:
        nom_path = os.path.join(questions_dir, f"{d}.yaml")
        if os.path.isfile(nom_path):
            try:
                with open(nom_path, 'r', encoding='utf-8') as f:
                    nomenclatures[d] = yaml.safe_load(f)
            except Exception as e:
                msg = f"Erreur lors de la lecture de la nomenclature {nom_path} : {e}"
                logging.error(msg)
                all_errors.append(msg)
                total_errors += 1
    # 3. Parcourir tous les fichiers questions (sauf nomenclatures)
    for d in root_dirs:
        dir_path = os.path.join(questions_dir, d)
        # Préparer la structure de nomenclature pour ce dossier (niveau)
        nomenclature = nomenclatures.get(d)
        disciplines_dict = {}
        if nomenclature and 'disciplines' in nomenclature:
            for disc in nomenclature['disciplines']:
                disc_name = disc.get('nom')
                if not disc_name:
                    continue
                themes_dict = {}
                for theme in disc.get('themes', []):
                    theme_name = theme.get('nom')
                    if not theme_name:
                        continue
                    tags = set(theme.get('tags', []))
                    themes_dict[theme_name] = tags
                disciplines_dict[disc_name] = themes_dict
        # Chercher tous les .yaml dans ce dossier
        for root, dirs, files in os.walk(dir_path):
            for f in files:
                if f.endswith('.yaml'):
                    yaml_path = os.path.join(root, f)
                    # Sauter les nomenclatures (ex: cp.yaml à la racine)
                    if os.path.abspath(yaml_path) == os.path.abspath(os.path.join(questions_dir, f"{d}.yaml")):
                        continue
                    # logging.info(f'Processing file: {yaml_path}')
                    print_colored('INFO', f'Processing file: {yaml_path}')
                    try:
                        with open(yaml_path, 'r', encoding='utf-8') as file:
                            questions = yaml.safe_load(file)
                        if not isinstance(questions, list):
                            msg = f"Erreur de format dans le fichier : {yaml_path} (le fichier doit contenir une liste de questions)"
                            # logging.error(msg)
                            print_colored('ERROR', msg)
                            all_errors.append(msg)
                            total_errors += 1
                            raise Exception(msg)
                    except Exception as e:
                        msg = f"Erreur lors de la lecture du fichier {yaml_path} : {e}"
                        # logging.error(msg)
                        print_colored('ERROR', msg)
                        all_errors.append(msg)
                        total_errors += 1
                        return
                    # Pour chaque question, valider la nomenclature
                    for idx, q in enumerate(questions):
                        required_fields = ["uid", "text", "questionType", "discipline", "themes", "difficulty", "gradeLevel", "author", "timeLimit"]
                        missing = [field for field in required_fields if field not in q or q[field] in [None, ""]]
                        # Special handling for themes - allow empty list but not missing
                        if "themes" not in q:
                            missing.append("themes")
                        elif q["themes"] is None or (isinstance(q["themes"], list) and len(q["themes"]) == 0):
                            missing.append("themes")
                        
                        # Question type specific validation
                        question_type = q.get("questionType")
                        if question_type in ["multipleChoice", "multiple_choice", "single_choice"]:
                            # Multiple choice requires answerOptions and correctAnswers
                            mc_fields = ["answerOptions", "correctAnswers"]
                            mc_missing = [field for field in mc_fields if field not in q or q[field] in [None, ""] or (isinstance(q[field], list) and len(q[field]) == 0)]
                            missing.extend(mc_missing)
                        elif question_type == "numeric":
                            # Numeric requires correctAnswer and optionally tolerance/unit
                            if "correctAnswer" not in q or q["correctAnswer"] is None:
                                missing.append("correctAnswer")
                            # Validate correctAnswer is a number
                            if "correctAnswer" in q and q["correctAnswer"] is not None:
                                try:
                                    float(q["correctAnswer"])
                                except (ValueError, TypeError):
                                    msg = f"correctAnswer must be a number for numeric question (uid={q.get('uid')}) dans {yaml_path}"
                                    print_colored('ERROR', msg)
                                    all_errors.append(msg)
                                    total_errors += 1
                                    return
                        else:
                            msg = f"Unknown questionType '{q.get('questionType')}' for question (uid={q.get('uid')}) dans {yaml_path}"
                            print_colored('ERROR', msg)
                            all_errors.append(msg)
                            total_errors += 1
                            return
                        invalid_time_limit = False
                        if "timeLimit" in q:
                            try:
                                time_limit_val = int(q["timeLimit"])
                                if time_limit_val <= 0:
                                    invalid_time_limit = True
                            except Exception:
                                invalid_time_limit = True

                        if missing or invalid_time_limit:
                            msg = f"Question manquante ou incomplète dans {yaml_path} (index {idx}): champs manquants ou timeLimit invalide : {missing if missing else ''}{' (timeLimit must be a positive integer)' if invalid_time_limit else ''}"
                            print_colored('ERROR', msg)
                            all_errors.append(msg)
                            total_errors += 1
                            return

                        # --- Validation stricte nomenclature ---
                        # 1. Discipline
                        discipline = q.get('discipline')
                        if discipline not in disciplines_dict:
                            msg = f"Discipline '{discipline}' inconnue pour la question (uid={q.get('uid')}) dans {yaml_path}"
                            print_colored('ERROR', msg)
                            all_errors.append(msg)
                            total_errors += 1
                            return
                        # 2. Themes
                        themes = q.get('themes', [])
                        if isinstance(themes, str):
                            themes = [themes]
                        for theme in themes:
                            if discipline in disciplines_dict and theme not in disciplines_dict[discipline]:
                                msg = f"Thème '{theme}' inconnu pour la discipline '{discipline}' (uid={q.get('uid')}) dans {yaml_path}"
                                print_colored('ERROR', msg)
                                all_errors.append(msg)
                                total_errors += 1
                                return
                        # 3. Tags (optionnel, si la question a des tags)
                        if 'tags' in q and q['tags']:
                            tags = q['tags']
                            if isinstance(tags, str):
                                tags = [tags]
                            # Rassembler tous les tags connus pour tous les thèmes de la question
                            known_tags_all_themes = set()
                            for theme in themes:
                                known_tags_all_themes.update(disciplines_dict.get(discipline, {}).get(theme, set()))
                            for tag in tags:
                                if tag not in known_tags_all_themes:
                                    msg = f"Tag '{tag}' inconnu pour les thèmes {themes} de la discipline '{discipline}' (uid={q.get('uid')}) dans {yaml_path}"
                                    print_colored('ERROR', msg)
                                    all_errors.append(msg)
                                    total_errors += 1
                                    return
                        if not q.get("title"):
                            msg = f"Question sans titre (uid={q.get('uid')}) dans {yaml_path}"
                            if verbose:
                                print_colored('WARNING', msg)
                            all_warnings.append(msg)
                            total_warnings += 1
                        # Determine discipline/theme folder for summary
                        rel_path = os.path.relpath(yaml_path, questions_dir)
                        # Remove filename, keep folder path (discipline/theme)
                        folder = os.path.dirname(rel_path)
                        questions_per_folder[folder] += 1
                        all_questions.append((q, yaml_path))

    if total_errors > 0:
        logging.error("\n=== Import annulé : des erreurs ont été détectées dans les fichiers/questions ===")
        logging.error(f"Nombre total d'erreurs : {total_errors}")
        for err in all_errors:
            logging.error(err)
        logging.warning(f"Nombre total de warnings : {total_warnings}")
        for warn in all_warnings:
            logging.warning(warn)
        logging.error("Corrigez les erreurs avant de relancer l'import.")
        return

    # Si aucune erreur, on upload
    try:
        conn = get_conn()
        cur = conn.cursor()
        print_colored('INFO', 'Updating the Question table...')
        # cur.execute('DELETE FROM questions') # DANGEREUX : supprime les liens en cascade vers GameTemplate !!
        # conn.commit()
        # Insérer les questions seulement après suppression
        VALID_PLAYMODES = {"quiz", "practice", "tournament"}
        for q, yaml_path in all_questions:
            # Validate excludedFrom
            excluded_from = q.get('excludedFrom', [])
            if isinstance(excluded_from, str):
                excluded_from = [excluded_from]
            if not isinstance(excluded_from, list):
                excluded_from = []
            invalid_modes = [mode for mode in excluded_from if mode not in VALID_PLAYMODES]
            if invalid_modes:
                msg = f"excludedFrom contient des valeurs invalides {invalid_modes} (uid={q.get('uid')}) dans {yaml_path}"
                logging.error(msg)
                all_errors.append(msg)
                total_errors += 1
                continue
            try:
                # Normalize question type
                question_type = q.get('questionType')
                if question_type in ['multiple_choice', 'single_choice']:
                    question_type = 'multipleChoice'
                
                # Insert or update the main question record
                cur.execute(
                    '''INSERT INTO questions
                    (uid, title, question_text, question_type, discipline, themes, difficulty, grade_level, author, explanation, tags, time_limit_seconds, excluded_from, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (uid) DO UPDATE SET
                    title = EXCLUDED.title,
                    question_text = EXCLUDED.question_text,
                    question_type = EXCLUDED.question_type,
                    discipline = EXCLUDED.discipline,
                    themes = EXCLUDED.themes,
                    difficulty = EXCLUDED.difficulty,
                    grade_level = EXCLUDED.grade_level,
                    author = EXCLUDED.author,
                    explanation = EXCLUDED.explanation,
                    tags = EXCLUDED.tags,
                    time_limit_seconds = EXCLUDED.time_limit_seconds,
                    excluded_from = EXCLUDED.excluded_from,
                    updated_at = NOW()''',
                    [
                        q.get('uid'),
                        q.get('title'),
                        q.get('text'),
                        question_type,  # Use normalized type
                        q.get('discipline'),
                        q.get('themes'),
                        q.get('difficulty'),
                        q.get('gradeLevel'),
                        q.get('author'),
                        q.get('explanation'),
                        q.get('tags'),
                        q.get('timeLimit'),
                        excluded_from
                    ]
                )
                
                # Insert into the appropriate polymorphic table
                if question_type == 'multipleChoice':
                    # Insert or update multiple choice question data
                    cur.execute(
                        '''INSERT INTO multiple_choice_questions
                        (question_uid, answer_options, correct_answers)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (question_uid) DO UPDATE SET
                        answer_options = EXCLUDED.answer_options,
                        correct_answers = EXCLUDED.correct_answers''',
                        [
                            q.get('uid'),
                            q.get('answerOptions'),
                            q.get('correctAnswers')
                        ]
                    )
                elif question_type == 'numeric':
                    # Insert or update numeric question data
                    tolerance = q.get('tolerance', 0)
                    unit = q.get('unit')
                    cur.execute(
                        '''INSERT INTO numeric_questions
                        (question_uid, correct_answer, tolerance, unit)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (question_uid) DO UPDATE SET
                        correct_answer = EXCLUDED.correct_answer,
                        tolerance = EXCLUDED.tolerance,
                        unit = EXCLUDED.unit''',
                        [
                            q.get('uid'),
                            float(q.get('correctAnswer')),
                            float(tolerance) if tolerance is not None else 0,
                            unit
                        ]
                    )
                
                total_uploaded += 1
            except Exception as e:
                msg = f"Erreur lors de l'import de la question (uid={q.get('uid')}) dans {yaml_path} : {e}"
                logging.error(msg)
                all_errors.append(msg)
                total_errors += 1
        # Nettoyer les questions obsolètes
        print_colored('INFO', 'Cleaning obsolete questions...')
        question_uids = [q.get('uid') for q, _ in all_questions]  # ← FIX ICI
        cur.execute('DELETE FROM questions WHERE uid != ALL(%s)', (question_uids,))
        
        # Clean up orphaned polymorphic question records
        print_colored('INFO', 'Cleaning orphaned polymorphic question records...')
        cur.execute('DELETE FROM multiple_choice_questions WHERE question_uid NOT IN (SELECT uid FROM questions WHERE question_type = %s)', ('multipleChoice',))
        cur.execute('DELETE FROM numeric_questions WHERE question_uid NOT IN (SELECT uid FROM questions WHERE question_type = %s)', ('numeric',))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"Erreur de connexion à la base de données : {e}")
        return

    # --- PRETTY SUMMARY ---
    print("\n" + "="*50)
    print(color_text("\U0001F4DA Résumé de l'import", Colors.HEADER))
    print("="*50)
    print(f"{color_text('Nombre de questions dans la base :', Colors.OKGREEN)} {color_text(str(total_uploaded), Colors.OKGREEN if total_uploaded > 0 else Colors.WARNING)}")
    # Per-folder summary
    print(color_text("\nDétail par niveau :", Colors.OKBLUE))
    if questions_per_folder:
        # Group by top-level directory (discipline)
        from collections import defaultdict
        grouped = defaultdict(list)
        for folder, count in questions_per_folder.items():
            # folder: e.g. CP/anglais
            parts = folder.split(os.sep)
            if len(parts) >= 2:
                top = parts[0]
                sub = os.sep.join(parts[1:])
            else:
                top = parts[0]
                sub = ''
            grouped[top].append((sub, count))
        for top in sorted(grouped):
            total_top = sum(count for _, count in grouped[top])
            print(color_text(f"-------- {top} ({total_top}) -----------", Colors.HEADER))
            for sub, count in sorted(grouped[top]):
                # Only print sub if not empty
                if sub:
                    print(f"{color_text(sub + ':', Colors.OKCYAN)} {color_text(str(count), Colors.OKGREEN if count > 0 else Colors.WARNING)}")
                else:
                    print(f"{color_text(str(count), Colors.OKGREEN if count > 0 else Colors.WARNING)}")
            print()
    else:
        print(color_text("  (No questions uploaded)", Colors.WARNING))
    warn_str = color_text(f"{total_warnings} \U000026A0\ufe0f", Colors.WARNING) if total_warnings > 0 else color_text("0", Colors.OKGREEN)
    err_str = color_text(f"{total_errors} \U0000274C", Colors.FAIL) if total_errors > 0 else color_text("0", Colors.OKGREEN)
    print(f"{color_text('Warnings:', Colors.WARNING)} {warn_str}")
    print(f"{color_text('Errors:', Colors.FAIL)} {err_str}")
    if verbose and total_warnings > 0:
        print(color_text("\nWarnings:", Colors.WARNING))
        for warn in all_warnings:
            print(color_text(f"  - {warn}", Colors.WARNING))
    if total_errors > 0:
        print(color_text("\nErrors:", Colors.FAIL))
        for err in all_errors:
            print(color_text(f"  - {err}", Colors.FAIL))
    print("="*50 + "\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import questions or clear database tables.')
    parser.add_argument('--clear-db', action='store_true', help='Clear game-related tables')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show warnings during import')
    args = parser.parse_args()

    global verbose
    verbose = args.verbose

    if args.clear_db:
        clear_db()
    else:
        import_questions()
