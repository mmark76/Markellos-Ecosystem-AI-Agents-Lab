"""Local SQLite persistence for the single Training Lab Student study space."""
from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

OWNER_ROLE = "training:Student"
DISPLAY_NAME = "Student Alpha"
MAX_MATERIALS = 25
MAX_TITLE = 120
MAX_CONTENT = 1400
MAX_NOTES = 600


class StudySpaceError(ValueError):
    pass


class StudentStudySpace:
    """Owns one bounded, local-only study space tied to the canonical Student role."""

    def __init__(self, database_path: Path):
        self.database_path = Path(database_path)

    def _connect(self):
        con = sqlite3.connect(self.database_path, timeout=15)
        con.row_factory = sqlite3.Row
        return con

    @staticmethod
    def _now():
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    def initialize(self):
        with closing(self._connect()) as db, db:
            db.execute("""CREATE TABLE IF NOT EXISTS student_study_notes (
                owner_role TEXT PRIMARY KEY CHECK(owner_role='training:Student'),
                notes TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            )""")
            db.execute("""CREATE TABLE IF NOT EXISTS student_study_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_role TEXT NOT NULL CHECK(owner_role='training:Student'),
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )""")
            db.execute("CREATE INDEX IF NOT EXISTS idx_student_study_materials_owner ON student_study_materials(owner_role,id)")

    def get(self):
        with self._connect() as db:
            row = db.execute("SELECT notes,updated_at FROM student_study_notes WHERE owner_role=?", (OWNER_ROLE,)).fetchone()
            materials = db.execute(
                "SELECT id,title,content,created_at FROM student_study_materials WHERE owner_role=? ORDER BY id DESC",
                (OWNER_ROLE,),
            ).fetchall()
        return {
            "ownerRole": OWNER_ROLE,
            "displayName": DISPLAY_NAME,
            "notes": row["notes"] if row else "",
            "updatedAt": row["updated_at"] if row else None,
            "materials": [dict(item) for item in materials],
            "limits": {"materials": MAX_MATERIALS, "title": MAX_TITLE, "content": MAX_CONTENT, "notes": MAX_NOTES},
        }

    def save_notes(self, notes):
        if not isinstance(notes, str) or len(notes) > MAX_NOTES:
            raise StudySpaceError(f"Notes must be no more than {MAX_NOTES} characters.")
        with self._connect() as db:
            db.execute(
                """INSERT INTO student_study_notes(owner_role,notes,updated_at) VALUES(?,?,?)
                   ON CONFLICT(owner_role) DO UPDATE SET notes=excluded.notes,updated_at=excluded.updated_at""",
                (OWNER_ROLE, notes.strip(), self._now()),
            )
        return self.get()

    def add_material(self, title, content):
        if not isinstance(title, str) or not 1 <= len(title.strip()) <= MAX_TITLE:
            raise StudySpaceError(f"Enter a title of up to {MAX_TITLE} characters.")
        if not isinstance(content, str) or not 1 <= len(content.strip()) <= MAX_CONTENT:
            raise StudySpaceError(f"Enter material of up to {MAX_CONTENT} characters.")
        with self._connect() as db:
            count = db.execute("SELECT COUNT(*) FROM student_study_materials WHERE owner_role=?", (OWNER_ROLE,)).fetchone()[0]
            if count >= MAX_MATERIALS:
                raise StudySpaceError(f"This study space can hold up to {MAX_MATERIALS} materials.")
            db.execute(
                "INSERT INTO student_study_materials(owner_role,title,content,created_at) VALUES(?,?,?,?)",
                (OWNER_ROLE, title.strip(), content.strip(), self._now()),
            )
        return self.get()

    def delete_material(self, material_id):
        if not isinstance(material_id, int) or isinstance(material_id, bool) or material_id < 1:
            raise StudySpaceError("Select one valid study material.")
        with closing(self._connect()) as db, db:
            cursor = db.execute("DELETE FROM student_study_materials WHERE id=? AND owner_role=?", (material_id, OWNER_ROLE))
        if cursor.rowcount != 1:
            raise StudySpaceError("That study material is no longer available.")
        return self.get()
