import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'src' / 'database' / 'game_phrases.db'
OUTPUT_PATH = ROOT / 'src' / 'game' / 'phrases.json'


def fetch_phrases():
  connection = sqlite3.connect(DB_PATH)
  try:
    connection.row_factory = sqlite3.Row
    phrases = connection.execute(
      """
      SELECT id, difficulty, domain, spanish_text, english_text
      FROM phrases
      ORDER BY id
      """
    ).fetchall()

    results = []
    for phrase in phrases:
      words = connection.execute(
        """
        SELECT english_word
        FROM phrase_words
        WHERE phrase_id = ?
        ORDER BY word_index
        """,
        (phrase['id'],),
      ).fetchall()

      results.append({
        'id': phrase['id'],
        'difficulty': phrase['difficulty'],
        'domain': phrase['domain'],
        'spanishText': phrase['spanish_text'],
        'englishText': phrase['english_text'],
        'words': [row['english_word'] for row in words],
      })

    return results
  finally:
    connection.close()


def main():
  phrases = fetch_phrases()
  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  OUTPUT_PATH.write_text(json.dumps(phrases, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
  main()
