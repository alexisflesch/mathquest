import yaml
import psycopg2
import os
import logging
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
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

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
    logging.info('Clearing the game_participants and game_instances tables...')
    cur.execute('DELETE FROM game_participants')
    cur.execute('DELETE FROM game_instances') 
    cur.execute('DELETE FROM game_templates')
    conn.commit()
    cur.close()
    conn.close()
    logging.info('Tables game_participants, game_instances, and game_templates cleared.')

def import_questions():
    logging.info('Starting import process...')
    # Clear the Question table before inserting new questions
    try:
        conn = get_conn()
        cur = conn.cursor()
        logging.info('Clearing the Question table...')
        cur.execute('DELETE FROM questions')
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"Erreur de connexion à la base de données : {e}")
        return

    total_uploaded = 0
    total_errors = 0
    total_warnings = 0
    all_errors = []
    all_warnings = []
    all_questions = []
    yaml_files = get_yaml_paths()
    for yaml_path in yaml_files:
        logging.info(f'Processing file: {yaml_path}')
        try:
            with open(yaml_path, 'r', encoding='utf-8') as f:
                questions = yaml.safe_load(f)
            if not isinstance(questions, list):
                msg = f"Erreur de format dans le fichier : {yaml_path} (le fichier doit contenir une liste de questions)"
                logging.error(msg)
                all_errors.append(msg)
                total_errors += 1
                continue
        except Exception as e:
            msg = f"Erreur lors de la lecture du fichier {yaml_path} : {e}"
            logging.error(msg)
            all_errors.append(msg)
            total_errors += 1
            continue

        for idx, q in enumerate(questions):
            # Champs obligatoires YAML (anglais)
            required_fields = ["uid", "text", "questionType", "discipline", "themes", "answerOptions", "correctAnswers", "difficulty", "gradeLevel"]
            missing = [field for field in required_fields if field not in q or q[field] in [None, "", []]]
            if missing:
                msg = f"Question manquante ou incomplète dans {yaml_path} (index {idx}): champs manquants : {missing}"
                logging.error(msg)
                all_errors.append(msg)
                total_errors += 1
                continue

            # Champs recommandés mais non obligatoires
            if not q.get("title"):
                msg = f"Question sans titre (uid={q.get('uid')}) dans {yaml_path}"
                logging.warning(msg)
                all_warnings.append(msg)
                total_warnings += 1
            if not q.get("timeLimit"):
                msg = f"Question sans timeLimit (uid={q.get('uid')}) dans {yaml_path}"
                logging.warning(msg)
                all_warnings.append(msg)
                total_warnings += 1

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
        logging.info('Clearing the Question table...')
        cur.execute('DELETE FROM questions')
        conn.commit()
    except Exception as e:
        logging.error(f"Erreur de connexion à la base de données : {e}")
        return

    for q, yaml_path in all_questions:
        try:
            cur.execute(
                '''INSERT INTO questions
                (uid, title, question_text, question_type, discipline, themes, difficulty, grade_level, author, explanation, tags, time_limit_seconds, is_hidden, answer_options, correct_answers, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
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
                is_hidden = EXCLUDED.is_hidden,
                answer_options = EXCLUDED.answer_options,
                correct_answers = EXCLUDED.correct_answers,
                updated_at = NOW()''',
                [
                    q.get('uid'),
                    q.get('title'),
                    q.get('text'),
                    q.get('questionType'),
                    q.get('discipline'),
                    q.get('themes'),
                    q.get('difficulty'),
                    q.get('gradeLevel'),
                    q.get('author'),
                    q.get('explanation'),
                    q.get('tags'),
                    q.get('timeLimit'),
                    q.get('isHidden', False),
                    q.get('answerOptions'),
                    q.get('correctAnswers')
                ]
            )
            total_uploaded += 1
        except Exception as e:
            msg = f"Erreur lors de l'import de la question (uid={q.get('uid')}) dans {yaml_path} : {e}"
            logging.error(msg)
            all_errors.append(msg)
            total_errors += 1
    if conn:
        conn.commit()
        cur.close()
        conn.close()

    logging.info(f'Import process completed. Total questions uploadées : {total_uploaded}')
    logging.warning(f'Nombre total de warnings : {total_warnings}')
    if total_errors > 0:
        logging.error(f'Nombre total d\'erreurs lors de l\'upload : {total_errors}')
        for err in all_errors:
            logging.error(err)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import questions or clear database tables.')
    parser.add_argument('--clear-db', action='store_true', help='Clear game-related tables')
    args = parser.parse_args()

    if args.clear_db:
        clear_db()
    else:
        import_questions()
