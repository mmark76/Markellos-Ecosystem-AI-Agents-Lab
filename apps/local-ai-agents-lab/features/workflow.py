"""Immutable hand-offs between Training, Evaluation, and Optimization.

This module deliberately owns no HTTP or Ollama details.  The loopback adapter
is injected by the application shell, keeping each department testable and
preventing a UI request from choosing a provider endpoint.
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Callable, Optional


SCHEMA_VERSION = "four-department-v1"
TRAINING_ROLES = ("Trainer", "Student")
EVALUATION_CRITERIA = ("Faithfulness", "Clarity", "Task Completion", "Consistency")


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


class WorkflowError(ValueError):
    """A requested department transition is not valid."""


class WorkflowService:
    """Persistence and state transitions for the three pipeline departments."""

    def __init__(self, db_path: Path):
        self.db_path = db_path

    def connect(self):
        con = sqlite3.connect(self.db_path, timeout=15)
        con.row_factory = sqlite3.Row
        return con

    def initialize(self) -> None:
        """Add tables only; legacy ``messages`` and training tables are untouched."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self.connect()) as db, db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS department_training_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_key TEXT NOT NULL UNIQUE,
                    provider TEXT NOT NULL,
                    trainer_model TEXT NOT NULL,
                    student_model TEXT NOT NULL,
                    task_requirements TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    error TEXT,
                    architecture_version TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS department_training_chat_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    sequence_number INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    model TEXT,
                    created_at TEXT NOT NULL,
                    UNIQUE(session_id, sequence_number),
                    FOREIGN KEY(session_id) REFERENCES department_training_sessions(id)
                );
                CREATE TABLE IF NOT EXISTS evaluation_scorecards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    training_session_id INTEGER NOT NULL UNIQUE,
                    evaluator_model TEXT NOT NULL,
                    status TEXT NOT NULL,
                    criteria_json TEXT NOT NULL,
                    scorecard_json TEXT,
                    raw_assessment TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    error TEXT,
                    architecture_version TEXT NOT NULL,
                    FOREIGN KEY(training_session_id) REFERENCES department_training_sessions(id)
                );
                CREATE TABLE IF NOT EXISTS optimization_proposals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    evaluation_id INTEGER NOT NULL,
                    improver_model TEXT NOT NULL,
                    status TEXT NOT NULL,
                    original_prompts_json TEXT NOT NULL,
                    proposed_prompts_json TEXT NOT NULL,
                    analysis TEXT NOT NULL,
                    raw_response TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    approved_at TEXT,
                    applied_at TEXT,
                    architecture_version TEXT NOT NULL,
                    FOREIGN KEY(evaluation_id) REFERENCES evaluation_scorecards(id)
                );
                CREATE TABLE IF NOT EXISTS prompt_revisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    source_proposal_id INTEGER,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    approved_at TEXT,
                    UNIQUE(role, version),
                    FOREIGN KEY(source_proposal_id) REFERENCES optimization_proposals(id)
                );
                CREATE INDEX IF NOT EXISTS idx_department_training_status
                    ON department_training_sessions(status, id DESC);
                CREATE INDEX IF NOT EXISTS idx_department_chat_session
                    ON department_training_chat_log(session_id, sequence_number);
                CREATE INDEX IF NOT EXISTS idx_scorecards_training
                    ON evaluation_scorecards(training_session_id);
                CREATE INDEX IF NOT EXISTS idx_proposals_evaluation
                    ON optimization_proposals(evaluation_id, id DESC);
            """)

    @staticmethod
    def _key(session_id: int) -> str:
        return f"training-{session_id}"

    def create_training(self, assignments: dict[str, str], task: str) -> int:
        if not task or len(task) > 2500:
            raise WorkflowError("Provide a training task of up to 2,500 characters.")
        if any(not assignments.get(role) for role in TRAINING_ROLES):
            raise WorkflowError("Select a local model for Trainer and Student.")
        timestamp = now()
        with closing(self.connect()) as db, db:
            cursor = db.execute(
                "INSERT INTO department_training_sessions(session_key,provider,trainer_model,student_model,task_requirements,status,created_at,started_at,architecture_version) VALUES(?,?,?,?,?,?,?,?,?)",
                ("pending", "ollama", assignments["Trainer"], assignments["Student"], task,
                 "running", timestamp, timestamp, SCHEMA_VERSION),
            )
            session_id = cursor.lastrowid
            db.execute("UPDATE department_training_sessions SET session_key=? WHERE id=?", (self._key(session_id), session_id))
            db.execute(
                "INSERT INTO department_training_chat_log(session_id,sequence_number,role,content,model,created_at) VALUES(?,?,?,?,?,?)",
                (session_id, 1, "User", task, None, timestamp),
            )
        return session_id

    def append_training_message(self, session_id: int, role: str, content: str, model: Optional[str]) -> None:
        if role not in TRAINING_ROLES or not content:
            raise WorkflowError("Invalid immutable chat-log entry.")
        with closing(self.connect()) as db, db:
            status = db.execute("SELECT status FROM department_training_sessions WHERE id=?", (session_id,)).fetchone()
            if not status or status["status"] != "running":
                raise WorkflowError("This training record can no longer be changed.")
            sequence = db.execute("SELECT COALESCE(MAX(sequence_number),0)+1 FROM department_training_chat_log WHERE session_id=?", (session_id,)).fetchone()[0]
            db.execute(
                "INSERT INTO department_training_chat_log(session_id,sequence_number,role,content,model,created_at) VALUES(?,?,?,?,?,?)",
                (session_id, sequence, role, content[:12000], model, now()),
            )

    def finish_training(self, session_id: int, status: str, error: str = "") -> None:
        if status not in {"completed", "failed"}:
            raise WorkflowError("Invalid training completion state.")
        with closing(self.connect()) as db, db:
            db.execute("UPDATE department_training_sessions SET status=?,completed_at=?,error=? WHERE id=?", (status, now(), error[:500], session_id))

    def training(self, session_id: int) -> Optional[dict]:
        with closing(self.connect()) as db:
            record = db.execute("SELECT * FROM department_training_sessions WHERE id=?", (session_id,)).fetchone()
            if not record:
                return None
            log = db.execute("SELECT sequence_number,role,content,model,created_at FROM department_training_chat_log WHERE session_id=? ORDER BY sequence_number", (session_id,)).fetchall()
        result = dict(record)
        result["chat_log"] = [dict(item) for item in log]
        return result

    def training_records(self) -> list[dict]:
        with closing(self.connect()) as db:
            rows = db.execute("SELECT id,session_key,trainer_model,student_model,task_requirements,status,created_at,completed_at,architecture_version FROM department_training_sessions ORDER BY id DESC LIMIT 40").fetchall()
        return [dict(row) for row in rows]

    def create_scorecard(self, session_id: int, evaluator_model: str) -> int:
        training = self.training(session_id)
        if not training or training["status"] != "completed":
            raise WorkflowError("Choose a completed Training Lab session.")
        if not evaluator_model:
            raise WorkflowError("Select a local Evaluator model.")
        with closing(self.connect()) as db, db:
            existing = db.execute("SELECT id,status FROM evaluation_scorecards WHERE training_session_id=?", (session_id,)).fetchone()
            if existing:
                if existing["status"] == "running":
                    raise WorkflowError("This evaluation is already running.")
                raise WorkflowError("This training session already has an immutable scorecard.")
            cursor = db.execute(
                "INSERT INTO evaluation_scorecards(training_session_id,evaluator_model,status,criteria_json,created_at,architecture_version) VALUES(?,?,?,?,?,?)",
                (session_id, evaluator_model, "running", json.dumps(EVALUATION_CRITERIA), now(), SCHEMA_VERSION),
            )
        return cursor.lastrowid

    @staticmethod
    def _scorecard(raw: str, session: dict) -> dict:
        """Keep model judgement labelled, even if it does not follow JSON instructions."""
        parsed = None
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            pass
        metrics = {criterion: {"score": None, "explanation": "Not structurally reported by the evaluator.", "kind": "model_judgment"} for criterion in EVALUATION_CRITERIA}
        failures: list[dict] = []
        evidence: list[dict] = [{"kind": "verifiable_record", "description": "Original task requirements and immutable Chat Log were provided to the evaluator."}]
        if isinstance(parsed, dict):
            raw_metrics = parsed.get("metrics", {})
            if isinstance(raw_metrics, dict):
                for name in EVALUATION_CRITERIA:
                    value = raw_metrics.get(name)
                    if isinstance(value, dict):
                        score = value.get("score")
                        metrics[name] = {"score": score if isinstance(score, (int, float)) and 0 <= score <= 100 else None,
                                         "explanation": str(value.get("explanation", "Not provided."))[:1200], "kind": "model_judgment"}
            if isinstance(parsed.get("failures"), list):
                failures = [{"kind": "model_judgment", "description": str(item)[:1200]} for item in parsed["failures"]]
            if isinstance(parsed.get("evidence"), list):
                evidence.extend({"kind": "model_judgment", "description": str(item)[:1200]} for item in parsed["evidence"])
        return {"schema_version": SCHEMA_VERSION, "assessment_kind": "model_judgment_with_traceable_inputs",
                "criteria": list(EVALUATION_CRITERIA), "metrics": metrics, "failures": failures, "supporting_evidence": evidence,
                "source_training_session": {"id": session["id"], "session_key": session["session_key"], "task_requirements": session["task_requirements"]}}

    def complete_scorecard(self, scorecard_id: int, raw: str) -> None:
        with closing(self.connect()) as db:
            row = db.execute("SELECT training_session_id FROM evaluation_scorecards WHERE id=?", (scorecard_id,)).fetchone()
        if not row:
            raise WorkflowError("Unknown scorecard.")
        scorecard = self._scorecard(raw, self.training(row["training_session_id"]) or {})
        with closing(self.connect()) as db, db:
            db.execute("UPDATE evaluation_scorecards SET status='completed',scorecard_json=?,raw_assessment=?,completed_at=? WHERE id=?", (json.dumps(scorecard), raw[:12000], now(), scorecard_id))

    def fail_scorecard(self, scorecard_id: int, error: str) -> None:
        with closing(self.connect()) as db, db:
            db.execute("UPDATE evaluation_scorecards SET status='failed',error=?,completed_at=? WHERE id=?", (error[:500], now(), scorecard_id))

    def scorecard(self, scorecard_id: int) -> Optional[dict]:
        with closing(self.connect()) as db:
            row = db.execute("SELECT * FROM evaluation_scorecards WHERE id=?", (scorecard_id,)).fetchone()
        if not row:
            return None
        result = dict(row)
        result["criteria"] = json.loads(result.pop("criteria_json"))
        result["scorecard"] = json.loads(result.pop("scorecard_json")) if result.get("scorecard_json") else None
        result.pop("scorecard_json", None)
        return result

    def scorecards(self) -> list[dict]:
        with closing(self.connect()) as db:
            rows = db.execute("SELECT e.id,e.training_session_id,e.evaluator_model,e.status,e.created_at,e.completed_at,t.session_key FROM evaluation_scorecards e JOIN department_training_sessions t ON t.id=e.training_session_id ORDER BY e.id DESC LIMIT 40").fetchall()
        return [dict(row) for row in rows]

    def current_prompts(self, defaults: dict[str, str]) -> dict[str, str]:
        active = dict(defaults)
        with closing(self.connect()) as db:
            rows = db.execute("SELECT role,content FROM prompt_revisions WHERE status='active'").fetchall()
        for row in rows:
            active[row["role"]] = row["content"]
        return active

    def create_proposal(self, scorecard_id: int, improver_model: str, raw: str, defaults: dict[str, str]) -> int:
        scorecard = self.scorecard(scorecard_id)
        if not scorecard or scorecard["status"] != "completed":
            raise WorkflowError("Choose a completed Evaluation Lab scorecard.")
        proposed = {role: defaults[role] for role in TRAINING_ROLES}
        analysis = "The model proposal was retained for review."
        try:
            candidate = json.loads(raw)
            if isinstance(candidate, dict):
                analysis = str(candidate.get("analysis", analysis))[:4000]
                changes = candidate.get("proposed_prompts", {})
                if isinstance(changes, dict):
                    for role in TRAINING_ROLES:
                        value = changes.get(role)
                        if isinstance(value, str) and value.strip() and len(value) <= 6000:
                            proposed[role] = value.strip()
        except json.JSONDecodeError:
            pass
        with closing(self.connect()) as db, db:
            cursor = db.execute("INSERT INTO optimization_proposals(evaluation_id,improver_model,status,original_prompts_json,proposed_prompts_json,analysis,raw_response,created_at,architecture_version) VALUES(?,?,?,?,?,?,?,?,?)", (scorecard_id, improver_model, "draft", json.dumps(defaults), json.dumps(proposed), analysis, raw[:12000], now(), SCHEMA_VERSION))
        return cursor.lastrowid

    def proposal(self, proposal_id: int) -> Optional[dict]:
        with closing(self.connect()) as db:
            row = db.execute("SELECT * FROM optimization_proposals WHERE id=?", (proposal_id,)).fetchone()
        if not row:
            return None
        result = dict(row)
        result["original_prompts"] = json.loads(result.pop("original_prompts_json"))
        result["proposed_prompts"] = json.loads(result.pop("proposed_prompts_json"))
        return result

    def proposals(self) -> list[dict]:
        with closing(self.connect()) as db:
            rows = db.execute("SELECT p.id,p.evaluation_id,p.improver_model,p.status,p.analysis,p.created_at,p.approved_at,p.applied_at,e.training_session_id FROM optimization_proposals p JOIN evaluation_scorecards e ON e.id=p.evaluation_id ORDER BY p.id DESC LIMIT 40").fetchall()
        return [dict(row) for row in rows]

    def approve(self, proposal_id: int) -> dict:
        proposal = self.proposal(proposal_id)
        if not proposal or proposal["status"] != "draft":
            raise WorkflowError("Only an unmodified draft proposal can be approved.")
        with closing(self.connect()) as db, db:
            db.execute("UPDATE optimization_proposals SET status='approved',approved_at=? WHERE id=?", (now(), proposal_id))
        return self.proposal(proposal_id) or {}

    def apply(self, proposal_id: int) -> dict:
        proposal = self.proposal(proposal_id)
        if not proposal or proposal["status"] != "approved":
            raise WorkflowError("Explicitly approve this proposal before applying it.")
        with closing(self.connect()) as db, db:
            for role, content in proposal["proposed_prompts"].items():
                version = db.execute("SELECT COALESCE(MAX(version),0)+1 FROM prompt_revisions WHERE role=?", (role,)).fetchone()[0]
                db.execute("UPDATE prompt_revisions SET status='superseded' WHERE role=? AND status='active'", (role,))
                db.execute("INSERT INTO prompt_revisions(role,version,content,source_proposal_id,status,created_at,approved_at) VALUES(?,?,?,?,?,?,?)", (role, version, content, proposal_id, "active", now(), now()))
            db.execute("UPDATE optimization_proposals SET status='applied',applied_at=? WHERE id=?", (now(), proposal_id))
        return self.proposal(proposal_id) or {}

    def rollback(self, role: str, revision_id: int) -> dict:
        if role not in TRAINING_ROLES:
            raise WorkflowError("Only Training Lab prompts can be rolled back here.")
        with closing(self.connect()) as db, db:
            target = db.execute("SELECT id,content FROM prompt_revisions WHERE id=? AND role=?", (revision_id, role)).fetchone()
            if not target:
                raise WorkflowError("Unknown prompt revision.")
            db.execute("UPDATE prompt_revisions SET status='superseded' WHERE role=? AND status='active'", (role,))
            db.execute("UPDATE prompt_revisions SET status='active',approved_at=? WHERE id=?", (now(), revision_id))
        return {"role": role, "active_revision_id": revision_id}

    def revisions(self) -> list[dict]:
        with closing(self.connect()) as db:
            rows = db.execute("SELECT id,role,version,status,source_proposal_id,created_at,approved_at FROM prompt_revisions ORDER BY role,version DESC").fetchall()
        return [dict(row) for row in rows]
