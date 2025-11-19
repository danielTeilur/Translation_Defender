import csv
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'src' / 'database' / 'game_phrases.db'
CSV_PATH = ROOT / 'src' / 'database' / 'SoftwareEngineeringPhrases.csv'

WORD_RE = re.compile(r"[A-Za-z0-9']+")

DISTRACTOR_WORDS = [
    ('cache', 'backend', 'intermediate'),
    ('scalability', 'backend', 'advanced'),
    ('latency', 'backend', 'intermediate'),
    ('container', 'cloud', 'intermediate'),
    ('orchestration', 'cloud', 'advanced'),
    ('edge', 'cloud', 'intermediate'),
    ('component', 'frontend', 'easy'),
    ('viewport', 'frontend', 'intermediate'),
    ('accessibility', 'frontend', 'advanced'),
    ('refactor', 'frontend', 'intermediate'),
    ('rollback', 'backend', 'easy'),
    ('pipeline', 'cloud', 'easy'),
    ('autoscaling', 'cloud', 'advanced'),
    ('websocket', 'frontend', 'advanced'),
    ('replication', 'backend', 'advanced'),
    ('iteration', None, 'intermediate'),
    ('deadline', None, 'easy'),
    ('prototype', None, 'intermediate'),
    ('blueprint', None, 'easy'),
    ('diagram', None, 'easy'),
    ('handshake', None, 'intermediate'),
    ('gateway', None, 'intermediate'),
    ('monitoring', None, 'intermediate'),
    ('telemetry', None, 'advanced'),
    ('snapshot', None, 'easy'),
    ('uptime', None, 'intermediate'),
    ('downtime', None, 'intermediate'),
    ('migration', None, 'intermediate'),
    ('sync', None, 'easy'),
    ('drift', None, 'intermediate'),
    ('heartbeat', None, 'intermediate'),
    ('payload', None, 'intermediate'),
    ('checksum', None, 'advanced'),
    ('fallback', None, 'easy'),
    ('toggle', None, 'easy'),
    ('queue', None, 'easy'),
    ('buffer', None, 'easy'),
    ('listener', None, 'easy'),
    ('broker', None, 'intermediate'),
    ('registry', None, 'intermediate'),
    ('resolver', None, 'intermediate'),
    ('sandbox', None, 'easy'),
    ('playbook', None, 'intermediate'),
    ('manifest', None, 'intermediate'),
    ('backlog', None, 'easy'),
    ('story', None, 'easy'),
    ('epic', None, 'easy'),
    ('grooming', None, 'easy'),
    ('retrospective', None, 'intermediate'),
    ('estimation', None, 'easy'),
    ('velocity', None, 'intermediate'),
    ('cadence', None, 'intermediate'),
    ('alignment', None, 'easy'),
    ('feedback', None, 'easy'),
    ('insight', None, 'easy'),
    ('forecast', None, 'easy'),
    ('baseline', None, 'easy'),
    ('threshold', None, 'intermediate'),
    ('tolerance', None, 'intermediate'),
    ('variance', None, 'intermediate'),
    ('triage', None, 'intermediate'),
    ('handoff', None, 'easy'),
    ('playback', None, 'easy'),
    ('resilience', None, 'advanced'),
    ('recovery', None, 'easy'),
    ('incident', None, 'easy'),
    ('uptake', None, 'easy'),
    ('advocacy', None, 'intermediate'),
    ('mentoring', None, 'easy'),
    ('pairing', None, 'easy'),
    ('enablement', None, 'intermediate'),
    ('governance', None, 'intermediate'),
    ('policy', None, 'easy'),
    ('compliance', None, 'intermediate'),
    ('audit', None, 'easy'),
    ('roadmap', None, 'easy'),
    ('milestone', None, 'easy'),
    ('initiative', None, 'easy'),
    ('objective', None, 'easy'),
    ('result', None, 'easy'),
    ('signal', None, 'easy'),
    ('noise', None, 'easy'),
    ('pattern', None, 'easy'),
    ('antipattern', None, 'advanced'),
    ('heuristic', None, 'advanced'),
    ('matrix', None, 'intermediate'),
    ('canvas', None, 'easy'),
    ('charter', None, 'intermediate'),
    ('summit', None, 'easy'),
    ('workshop', None, 'easy'),
    ('briefing', None, 'easy'),
    ('deck', None, 'easy'),
    ('memo', None, 'easy'),
    ('statement', None, 'easy'),
    ('consensus', None, 'intermediate'),
    ('escalation', None, 'intermediate'),
    ('branch', None, 'easy'),
    ('merge', None, 'easy'),
    ('diff', None, 'easy'),
    ('commit', None, 'easy'),
    ('release', None, 'easy'),
    ('artifact', None, 'intermediate'),
    ('template', None, 'easy'),
    ('journey', None, 'easy'),
    ('persona', None, 'easy'),
    ('narrative', None, 'easy'),
    ('constraint', None, 'intermediate'),
    ('enabler', None, 'easy'),
    ('triad', None, 'intermediate'),
    ('sprint', None, 'easy'),
    ('kanban', None, 'easy'),
    ('swimlane', None, 'intermediate'),
    ('alert', None, 'easy'),
    ('timeout', None, 'easy'),
    ('comms', None, 'easy'),
    ('handover', None, 'easy'),
    ('discovery', None, 'easy'),
    ('ideation', None, 'intermediate'),
    ('launch', None, 'easy'),
    ('landing', None, 'easy'),
    ('signoff', None, 'easy'),
    ('delegate', None, 'easy'),
    ('calibration', None, 'intermediate'),
    ('roadshow', None, 'easy'),
    ('syncup', None, 'easy'),
    ('checklist', None, 'easy'),
    ('status', None, 'easy'),
    ('kickoff', None, 'easy'),
    ('alignment', None, 'easy'),
    ('horizon', None, 'easy'),
    ('milestone', None, 'easy'),
    ('ramp', None, 'easy'),
    ('handoff', None, 'easy'),
    ('momentum', None, 'easy'),
    ('ownership', None, 'easy'),
    ('followup', None, 'easy'),
    ('touchpoint', None, 'easy'),
    ('vision', None, 'easy'),
    ('mission', None, 'easy'),
    ('value', None, 'easy'),
    ('insight', None, 'easy'),
    ('context', None, 'easy'),
]


def tokenize(text: str) -> list[str]:
    if not text:
        return []
    return [match.group(0) for match in WORD_RE.finditer(text)]


def ensure_schema(connection: sqlite3.Connection) -> None:
    schema_sql = """
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS phrase_words;
    DROP TABLE IF EXISTS phrase_sessions;
    DROP TABLE IF EXISTS distractor_words;
    DROP TABLE IF EXISTS phrases;
    PRAGMA foreign_keys = ON;

    CREATE TABLE phrases (
        id INTEGER PRIMARY KEY,
        difficulty TEXT NOT NULL,
        domain TEXT NOT NULL,
        spanish_text TEXT NOT NULL,
        english_text TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        UNIQUE (spanish_text, english_text)
    );

    CREATE TABLE phrase_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phrase_id INTEGER NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
        word_index INTEGER NOT NULL,
        english_word TEXT NOT NULL,
        normalized_word TEXT NOT NULL,
        domain TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        is_key_word INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX idx_phrase_words_phrase_id ON phrase_words(phrase_id);

    CREATE TABLE phrase_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        phrase_id INTEGER NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        score INTEGER,
        attempts INTEGER DEFAULT 0,
        is_completed INTEGER NOT NULL DEFAULT 0,
        UNIQUE (user_id, phrase_id)
    );

    CREATE TABLE distractor_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        english_word TEXT NOT NULL,
        normalized_word TEXT NOT NULL UNIQUE,
        domain TEXT,
        difficulty TEXT CHECK (difficulty IN ('easy', 'intermediate', 'advanced'))
    );
    """
    connection.executescript(schema_sql)


def load_phrases(connection: sqlite3.Connection) -> None:
    with CSV_PATH.open(encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames:
            reader.fieldnames = [name.replace('\ufeff', '').strip() for name in reader.fieldnames]
        phrases = list(reader)

    insert_phrase_sql = """
        INSERT INTO phrases (id, difficulty, domain, spanish_text, english_text, word_count)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    insert_word_sql = """
        INSERT INTO phrase_words (phrase_id, word_index, english_word, normalized_word, domain, difficulty, is_key_word)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    """

    for row in phrases:
        phrase_id = int(row['id'])
        english_text = row['english_text'].strip()
        tokens = tokenize(english_text)
        connection.execute(
            insert_phrase_sql,
            (
                phrase_id,
                row['difficulty'].strip(),
                row['domain'].strip(),
                row['spanish_text'].strip(),
                english_text,
                len(tokens),
            ),
        )
        for index, token in enumerate(tokens):
            normalized = token.lower()
            connection.execute(
                insert_word_sql,
                (
                    phrase_id,
                    index,
                    token,
                    normalized,
                    row['domain'].strip(),
                    row['difficulty'].strip(),
                ),
            )


def load_distractors(connection: sqlite3.Connection) -> None:
    insert_sql = """
        INSERT INTO distractor_words (english_word, normalized_word, domain, difficulty)
        VALUES (?, ?, ?, ?)
    """
    seen = set()
    for english_word, domain, difficulty in DISTRACTOR_WORDS:
        normalized = english_word.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        connection.execute(
            insert_sql,
            (english_word, normalized, domain, difficulty),
        )


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
    connection = sqlite3.connect(DB_PATH)
    try:
        ensure_schema(connection)
        load_phrases(connection)
        load_distractors(connection)
        connection.commit()
    finally:
        connection.close()


if __name__ == '__main__':
    main()
