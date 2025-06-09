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
    conn = get_conn()
    cur = conn.cursor()
    logging.info('Clearing the Question table...')
    cur.execute('DELETE FROM questions')
    conn.commit()
    cur.close()
    conn.close()
    
    for yaml_path in get_yaml_paths():
        logging.info(f'Processing file: {yaml_path}')
        with open(yaml_path, 'r', encoding='utf-8') as f:
            questions = yaml.safe_load(f)
        conn = get_conn()
        cur = conn.cursor()
        for q in questions:
            try:
                # Process reponses to extract answer options and correct answers
                reponses = q.get('reponses', [])
                answer_options = []
                correct_answers = []
                
                for reponse in reponses:
                    answer_options.append(reponse.get('texte', ''))
                    correct_answers.append(reponse.get('correct', False))
                
                # Convert theme to array format
                theme = q.get('theme')
                themes = [theme] if theme else []
                
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
                        q.get('titre'),
                        q.get('question'),
                        q.get('type'),
                        q.get('discipline'),
                        themes,
                        q.get('difficulte'),
                        q.get('niveau'),
                        q.get('auteur'),
                        q.get('explication'),
                        q.get('tags'),
                        q.get('temps'),
                        q.get('hidden', False),
                        answer_options,
                        correct_answers
                    ]
                )
                logging.info(f"Imported: {q.get('question')}")
            except Exception as e:
                logging.error(f"Error importing: {q.get('question')}\n{e}")
        conn.commit()
        cur.close()
        conn.close()
    logging.info('Import process completed.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import questions or clear database tables.')
    parser.add_argument('--clear-db', action='store_true', help='Clear game-related tables')
    args = parser.parse_args()

    if args.clear_db:
        clear_db()
    else:
        import_questions()
