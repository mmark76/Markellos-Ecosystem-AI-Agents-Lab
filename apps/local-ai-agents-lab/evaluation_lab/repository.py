"""SQLite persistence and read-only Training Room access owned by Evaluation Lab."""
from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .contracts import (
    AgentOutput,
    EvaluationContractError,
    EvaluationFinding,
    EvaluationInputSnapshot,
    EvaluationRun,
    EvaluationScorecard,
)


class EvaluationRepositoryError(ValueError):
    """Raised for unavailable, invalid, or invalidly transitioned stored records."""


class EvaluationRepository:
    """Owns additive Evaluation Lab tables and reads legacy Training Room data only."""

    def __init__(self, db_path: Path | str):
        self.db_path = Path(db_path)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=15)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        """Create only Evaluation Lab-owned tables and indexes, idempotently."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self.connect()) as db, db:
            db.execute("""CREATE TABLE IF NOT EXISTS evaluation_lab_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_training_session_id INTEGER NOT NULL,
                evaluator_model TEXT NOT NULL,
                input_snapshot_json TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('pending','running','completed','failed')),
                created_at TEXT NOT NULL,
                completed_at TEXT,
                error TEXT,
                FOREIGN KEY(source_training_session_id) REFERENCES training_sessions(id)
            )""")
            db.execute("""CREATE TABLE IF NOT EXISTS evaluation_lab_scorecards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evaluation_run_id INTEGER NOT NULL UNIQUE,
                criteria_json TEXT NOT NULL,
                scores_json TEXT NOT NULL,
                summary TEXT NOT NULL,
                raw_assessment TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(evaluation_run_id) REFERENCES evaluation_lab_runs(id)
            )""")
            db.execute("""CREATE TABLE IF NOT EXISTS evaluation_lab_findings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evaluation_run_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                supporting_evidence TEXT NOT NULL,
                evidence_classification TEXT NOT NULL CHECK(evidence_classification IN ('verifiable_record','model_judgment','unverified')),
                evidence_reference TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(evaluation_run_id) REFERENCES evaluation_lab_runs(id)
            )""")
            finding_columns = {row[1] for row in db.execute("PRAGMA table_info(evaluation_lab_findings)")}
            if "evidence_reference" not in finding_columns:
                db.execute("ALTER TABLE evaluation_lab_findings ADD COLUMN evidence_reference TEXT")
            # Earlier Phase 1 rows cannot substantiate a structured record reference.
            # Reclassify them rather than presenting them as independently verifiable.
            db.execute(
                "UPDATE evaluation_lab_findings SET evidence_classification='unverified' "
                "WHERE evidence_classification='verifiable_record' "
                "AND (evidence_reference IS NULL OR trim(evidence_reference)='')"
            )
            db.execute("CREATE INDEX IF NOT EXISTS idx_evaluation_lab_runs_source ON evaluation_lab_runs(source_training_session_id,id)")
            db.execute("CREATE INDEX IF NOT EXISTS idx_evaluation_lab_findings_run ON evaluation_lab_findings(evaluation_run_id,id)")
            db.execute("""CREATE TRIGGER IF NOT EXISTS evaluation_lab_runs_snapshot_immutable
                BEFORE UPDATE OF input_snapshot_json, source_training_session_id, evaluator_model, created_at
                ON evaluation_lab_runs
                BEGIN
                    SELECT RAISE(ABORT, 'Evaluation Lab run snapshot identity is immutable');
                END""")

    def snapshot_completed_training_session(
        self, source_training_session_id: int, criteria: tuple[str, ...], *, created_at: Optional[str] = None
    ) -> EvaluationInputSnapshot:
        """Read a completed legacy training session without modifying its records."""
        if isinstance(source_training_session_id, bool) or not isinstance(source_training_session_id, int) or source_training_session_id < 1:
            raise EvaluationRepositoryError("source_training_session_id must be a positive integer.")
        with closing(self.connect()) as db:
            db.execute("BEGIN")
            try:
                self._require_training_schema(db)
                session = db.execute(
                    "SELECT id,provider,status FROM training_sessions WHERE id=?", (source_training_session_id,)
                ).fetchone()
                if session is None:
                    raise EvaluationRepositoryError("The Training Room session does not exist.")
                if session["status"] != "completed":
                    raise EvaluationRepositoryError("Only completed Training Room sessions can be evaluated.")
                request = db.execute(
                    "SELECT content FROM messages WHERE room='training' AND session_id=? AND agent='You' ORDER BY id LIMIT 1",
                    (source_training_session_id,),
                ).fetchone()
                if request is None or not request["content"].strip():
                    raise EvaluationRepositoryError("The completed Training Room session has no original user request.")
                stages = db.execute(
                    "SELECT agent_role,assigned_model,execution_order,status,response "
                    "FROM training_stages WHERE session_id=? ORDER BY execution_order,id",
                    (source_training_session_id,),
                ).fetchall()
                if not stages:
                    raise EvaluationRepositoryError("The completed Training Room session has no stages.")
                if any(stage["status"] != "Completed" or not stage["response"] for stage in stages):
                    raise EvaluationRepositoryError("Every Training Room stage must be completed with a recorded response.")
                outputs = tuple(
                    AgentOutput(
                        role=stage["agent_role"],
                        content=stage["response"],
                        model=stage["assigned_model"],
                        execution_order=stage["execution_order"],
                    )
                    for stage in stages
                )
                return EvaluationInputSnapshot(
                    source_training_session_id=source_training_session_id,
                    original_request=request["content"],
                    outputs=outputs,
                    provider=session["provider"],
                    role_models=tuple((output.role, output.model) for output in outputs),
                    criteria=criteria,
                    created_at=created_at or self._utc_now(),
                )
            except EvaluationContractError as error:
                raise EvaluationRepositoryError(f"The Training Room session cannot form a valid snapshot: {error}") from error
            finally:
                db.rollback()

    def create_run(
        self, source_training_session_id: int, evaluator_model: str, criteria: tuple[str, ...]
    ) -> EvaluationRun:
        """Store one immutable input snapshot and its pending evaluation lifecycle record."""
        snapshot = self.snapshot_completed_training_session(source_training_session_id, criteria)
        created_at = self._utc_now()
        try:
            with closing(self.connect()) as db, db:
                result = db.execute(
                    "INSERT INTO evaluation_lab_runs(source_training_session_id,evaluator_model,input_snapshot_json,status,created_at) "
                    "VALUES(?,?,?,?,?)",
                    (
                        snapshot.source_training_session_id,
                        evaluator_model,
                        json.dumps(snapshot.to_dict(), separators=(",", ":"), sort_keys=True),
                        "pending",
                        created_at,
                    ),
                )
                run_id = result.lastrowid
            return EvaluationRun(
                run_id=run_id,
                source_training_session_id=snapshot.source_training_session_id,
                evaluator_model=evaluator_model,
                input_snapshot=snapshot,
                status="pending",
                created_at=created_at,
            )
        except (sqlite3.DatabaseError, EvaluationContractError) as error:
            raise EvaluationRepositoryError(f"Could not create Evaluation Lab run: {error}") from error

    def get_run(self, run_id: int) -> Optional[EvaluationRun]:
        with closing(self.connect()) as db:
            row = db.execute("SELECT * FROM evaluation_lab_runs WHERE id=?", (run_id,)).fetchone()
        if row is None:
            return None
        try:
            return EvaluationRun(
                run_id=row["id"],
                source_training_session_id=row["source_training_session_id"],
                evaluator_model=row["evaluator_model"],
                input_snapshot=EvaluationInputSnapshot.from_dict(json.loads(row["input_snapshot_json"])),
                status=row["status"],
                created_at=row["created_at"],
                completed_at=row["completed_at"],
                error=row["error"],
            )
        except (EvaluationContractError, json.JSONDecodeError) as error:
            raise EvaluationRepositoryError(f"Stored Evaluation Lab run {run_id} is invalid: {error}") from error

    def mark_run_running(self, run_id: int) -> EvaluationRun:
        return self._transition(run_id, "pending", "running")

    def mark_run_failed(self, run_id: int, error: str) -> EvaluationRun:
        if not isinstance(error, str) or not error.strip():
            raise EvaluationRepositoryError("A failed Evaluation Lab run requires an error message.")
        with closing(self.connect()) as db, db:
            result = db.execute(
                "UPDATE evaluation_lab_runs SET status='failed',completed_at=?,error=? "
                "WHERE id=? AND status IN ('pending','running')",
                (self._utc_now(), error, run_id),
            )
            if result.rowcount != 1:
                raise EvaluationRepositoryError("Only pending or running Evaluation Lab runs can fail.")
        return self._required_run(run_id)

    def record_scorecard(self, scorecard: EvaluationScorecard) -> EvaluationScorecard:
        """Atomically persist model output and transition a running run to completed."""
        with closing(self.connect()) as db, db:
            run = db.execute(
                "SELECT status,input_snapshot_json FROM evaluation_lab_runs WHERE id=?", (scorecard.evaluation_run_id,)
            ).fetchone()
            if run is None:
                raise EvaluationRepositoryError("The Evaluation Lab run does not exist.")
            if run["status"] != "running":
                raise EvaluationRepositoryError("Only a running Evaluation Lab run can receive a scorecard.")
            try:
                snapshot = EvaluationInputSnapshot.from_dict(json.loads(run["input_snapshot_json"]))
            except (EvaluationContractError, json.JSONDecodeError) as error:
                raise EvaluationRepositoryError("The Evaluation Lab run has an invalid immutable snapshot.") from error
            if scorecard.criteria != snapshot.criteria:
                raise EvaluationRepositoryError("Scorecard criteria must exactly match the immutable run snapshot criteria.")
            result = db.execute(
                "UPDATE evaluation_lab_runs SET status='completed',completed_at=? "
                "WHERE id=? AND status='running'",
                (self._utc_now(), scorecard.evaluation_run_id),
            )
            if result.rowcount != 1:
                raise EvaluationRepositoryError("Only a running Evaluation Lab run can receive a scorecard.")
            db.execute(
                "INSERT INTO evaluation_lab_scorecards(evaluation_run_id,criteria_json,scores_json,summary,raw_assessment,created_at) "
                "VALUES(?,?,?,?,?,?)",
                (
                    scorecard.evaluation_run_id,
                    json.dumps(scorecard.criteria, separators=(",", ":")),
                    json.dumps(dict(scorecard.scores), separators=(",", ":"), sort_keys=True),
                    scorecard.summary,
                    scorecard.raw_assessment,
                    self._utc_now(),
                ),
            )
        return scorecard

    def get_scorecard(self, run_id: int) -> Optional[EvaluationScorecard]:
        with closing(self.connect()) as db:
            row = db.execute(
                "SELECT evaluation_run_id,criteria_json,scores_json,summary,raw_assessment "
                "FROM evaluation_lab_scorecards WHERE evaluation_run_id=?", (run_id,)
            ).fetchone()
        if row is None:
            return None
        try:
            return EvaluationScorecard(
                evaluation_run_id=row["evaluation_run_id"],
                criteria=tuple(json.loads(row["criteria_json"])),
                scores=json.loads(row["scores_json"]),
                summary=row["summary"],
                raw_assessment=row["raw_assessment"],
            )
        except (EvaluationContractError, json.JSONDecodeError) as error:
            raise EvaluationRepositoryError(f"Stored scorecard for run {run_id} is invalid: {error}") from error

    def add_finding(self, finding: EvaluationFinding) -> EvaluationFinding:
        with closing(self.connect()) as db, db:
            run = db.execute(
                "SELECT status,input_snapshot_json FROM evaluation_lab_runs WHERE id=?", (finding.evaluation_run_id,)
            ).fetchone()
            if run is None:
                raise EvaluationRepositoryError("The Evaluation Lab run does not exist.")
            if run["status"] != "completed":
                raise EvaluationRepositoryError("Findings can be added only to completed Evaluation Lab runs.")
            if finding.evidence_classification == "verifiable_record":
                try:
                    snapshot = EvaluationInputSnapshot.from_dict(json.loads(run["input_snapshot_json"]))
                except (EvaluationContractError, json.JSONDecodeError) as error:
                    raise EvaluationRepositoryError("The Evaluation Lab run has an invalid immutable snapshot.") from error
                self._validate_verifiable_reference(finding.evidence_reference, snapshot)
            db.execute(
                "INSERT INTO evaluation_lab_findings(evaluation_run_id,description,supporting_evidence,evidence_classification,evidence_reference,created_at) "
                "VALUES(?,?,?,?,?,?)",
                (
                    finding.evaluation_run_id,
                    finding.description,
                    finding.supporting_evidence,
                    finding.evidence_classification,
                    finding.evidence_reference,
                    self._utc_now(),
                ),
            )
        return finding

    def list_findings(self, run_id: int) -> list[EvaluationFinding]:
        with closing(self.connect()) as db:
            rows = db.execute(
                "SELECT evaluation_run_id,description,supporting_evidence,evidence_classification,evidence_reference "
                "FROM evaluation_lab_findings WHERE evaluation_run_id=? ORDER BY id", (run_id,)
            ).fetchall()
        return [
            EvaluationFinding(
                evaluation_run_id=row["evaluation_run_id"],
                description=row["description"],
                supporting_evidence=row["supporting_evidence"],
                evidence_classification=row["evidence_classification"],
                evidence_reference=row["evidence_reference"],
            )
            for row in rows
        ]

    def _transition(self, run_id: int, current: str, target: str) -> EvaluationRun:
        with closing(self.connect()) as db, db:
            result = db.execute(
                "UPDATE evaluation_lab_runs SET status=? WHERE id=? AND status=?", (target, run_id, current)
            )
            if result.rowcount != 1:
                raise EvaluationRepositoryError(f"Only {current} Evaluation Lab runs can become {target}.")
        return self._required_run(run_id)

    def _required_run(self, run_id: int) -> EvaluationRun:
        run = self.get_run(run_id)
        if run is None:
            raise EvaluationRepositoryError("The Evaluation Lab run does not exist.")
        return run

    @staticmethod
    def _validate_verifiable_reference(reference: Optional[str], snapshot: EvaluationInputSnapshot) -> None:
        """Bind a verifiable finding to an inspectable immutable snapshot location."""
        if reference == "snapshot:original_request":
            return
        if reference == f"source_session:{snapshot.source_training_session_id}":
            return
        for output in snapshot.outputs:
            if reference == f"snapshot:output:{output.execution_order}":
                return
            if reference == f"source_stage:{snapshot.source_training_session_id}:{output.execution_order}":
                return
        raise EvaluationRepositoryError("verifiable_record evidence_reference must identify this run's source session or snapshot output.")

    @staticmethod
    def _require_training_schema(db: sqlite3.Connection) -> None:
        required = {"training_sessions", "training_stages", "messages"}
        found = {
            row["name"]
            for row in db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('training_sessions','training_stages','messages')"
            )
        }
        missing = required - found
        if missing:
            raise EvaluationRepositoryError("Training Room schema is unavailable: " + ", ".join(sorted(missing)))
        required_columns = {
            "training_sessions": {"id", "provider", "status"},
            "training_stages": {"id", "session_id", "agent_role", "assigned_model", "execution_order", "status", "response"},
            "messages": {"id", "room", "agent", "content", "session_id"},
        }
        for table, required_for_table in required_columns.items():
            columns = {row[1] for row in db.execute(f"PRAGMA table_info({table})")}
            absent = required_for_table - columns
            if absent:
                raise EvaluationRepositoryError(
                    f"Training Room schema is incompatible: {table} is missing " + ", ".join(sorted(absent))
                )

    @staticmethod
    def _utc_now() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
