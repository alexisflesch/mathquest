import yaml
import psycopg2
import os
import json
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
    logging.info('Clearing the Enseignant and TournoiSauvegarde tables...')
    cur.execute('DELETE FROM "TournoiSauvegarde"')
    cur.execute('DELETE FROM "Enseignant"')
    conn.commit()
    cur.close()
    conn.close()
    logging.info('Tables Enseignant and TournoiSauvegarde cleared.')

def import_questions():
    logging.info('Starting import process...')
    # Clear the Question table before inserting new questions
    conn = get_conn()
    cur = conn.cursor()
    logging.info('Clearing the Question table...')
    cur.execute('DELETE FROM "Question"')
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
                cur.execute(
                    '''INSERT INTO "Question"
                    (uid, question, reponses, type, discipline, theme, difficulte, niveau, auteur, explication, tags, temps)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (uid) DO NOTHING''',
                    [
                        q.get('uid'),
                        q['question'],
                        json.dumps(q['reponses']),
                        q.get('type'),
                        q.get('discipline'),
                        q.get('theme'),
                        q.get('difficulte'),
                        q.get('niveau'),
                        q.get('auteur'),
                        q.get('explication'),
                        q.get('tags'),
                        q.get('temps'),
                    ]
                )
                logging.info(f"Imported: {q['question']}")
            except Exception as e:
                logging.error(f"Error importing: {q['question']}\n{e}")
        conn.commit()
        cur.close()
        conn.close()
    logging.info('Import process completed.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import questions or clear database tables.')
    parser.add_argument('--clear-db', action='store_true', help='Clear Enseignant and TournoiSauvegarde tables')
    args = parser.parse_args()

    if args.clear_db:
        clear_db()
    else:
        import_questions()
