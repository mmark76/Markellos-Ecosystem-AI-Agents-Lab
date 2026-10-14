"""Regression coverage for the additive Evaluation Lab persistence boundary."""
from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
import importlib.util
from contextlib import closing
from dataclasses import FrozenInstanceError
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2]
PACKAGE_SPEC = importlib.util.spec_from_file_location(
    "evaluation_lab_contracts_under_test",
    APP_ROOT / "evaluation_lab" / "__init__.py",
    submodule_search_locations=[str(APP_ROOT / "evaluation_lab")],
)
assert PACKAGE_SPEC and PACKAGE_SPEC.loader
PACKAGE = importlib.util.module_from_spec(PACKAGE_SPEC)
sys.modules[PACKAGE_SPEC.name] = PACKAGE
PACKAGE_SPEC.loader.exec_module(PACKAGE)

from evaluation_lab_contracts_under_test import (  # noqa: E402
    AgentOutput,
    EvaluationContractError,
    EvaluationFinding,
    EvaluationRepository,
    EvaluationRepositoryError,
    EvaluationScorecard,
)


class EvaluationRepositoryTests(unittest.TestCase):
    criteria = ("Faithfulness", "Completeness")

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp.name) / "data" / "campus.sqlite3"
        self._create_legacy_training_schema()
        self.repository = EvaluationRepository(self.db_path)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _create_legacy_training_schema(self) -> None:
        self.db_path.parent.mkdir(parents=True)
        with closing(self._connect()) as db, db:
            db.executescript("""
                CREATE TABLE messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, agent TEXT NOT NULL,
                    content TEXT NOT NULL, created_at TEXT NOT NULL, session_id INTEGER, model TEXT
                );
                CREATE TABLE training_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL,
                    trainer_model TEXT NOT NULL, student_model TEXT NOT NULL, created_at TEXT NOT NULL,
                    evaluator_model TEXT, improver_model TEXT, status TEXT NOT NULL DEFAULT 'running',
                    started_at TEXT, completed_at TEXT, error TEXT
                );
                CREATE TABLE training_stages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL, agent_role TEXT NOT NULL,
                    assigned_model TEXT NOT NULL, execution_order INTEGER NOT NULL, status TEXT NOT NULL,
                    started_at TEXT, completed_at TEXT, duration_ms INTEGER, response TEXT,
                    evaluation_score INTEGER, evaluation_result TEXT, error TEXT,
                    UNIQUE(session_id, agent_role)
                );
                CREATE INDEX idx_room_id ON messages(room,id);
                CREATE INDEX idx_messages_session_id ON messages(session_id);
                CREATE INDEX idx_training_stages_session ON training_stages(session_id,execution_order);
            """)
            db.execute(
                "INSERT INTO training_sessions(id,provider,trainer_model,student_model,evaluator_model,improver_model,created_at,status,completed_at) "
                "VALUES(1,'ollama','trainer:1','student:1','evaluator:1','improver:1','2026-10-14 UTC','completed','2026-10-14 UTC')"
            )
            db.execute(
                "INSERT INTO messages(room,agent,content,created_at,session_id) VALUES('training','You','Teach deterministic tests','2026-10-14 UTC',1)"
            )
            for order, role in ((4, "Improver"), (2, "Student"), (1, "Trainer"), (3, "Evaluator")):
                db.execute(
                    "INSERT INTO training_stages(session_id,agent_role,assigned_model,execution_order,status,response) VALUES(?,?,?,?,?,?)",
                    (1, role, role.lower() + ":1", order, "Completed", role + " response"),
                )

    def _legacy_rows(self) -> dict[str, list[tuple]]:
        with closing(self._connect()) as db:
            return {
                name: [tuple(row) for row in db.execute(f"SELECT * FROM {name} ORDER BY id")]
                for name in ("messages", "training_sessions", "training_stages")
            }

    def test_initialization_is_additive_idempotent_and_preserves_legacy_records(self) -> None:
        before = self._legacy_rows()
        self.repository.initialize()
        self.repository.initialize()
        with closing(self._connect()) as db:
            tables = {row["name"] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            indexes = {row["name"] for row in db.execute("SELECT name FROM sqlite_master WHERE type='index'")}
        self.assertTrue({"evaluation_lab_runs", "evaluation_lab_scorecards", "evaluation_lab_findings"}.issubset(tables))
        self.assertTrue({"idx_evaluation_lab_runs_source", "idx_evaluation_lab_findings_run"}.issubset(indexes))
        self.assertEqual(self._legacy_rows(), before)

    def test_initialization_can_create_an_empty_evaluation_database(self) -> None:
        empty_repository = EvaluationRepository(Path(self.temp.name) / "empty" / "evaluation.sqlite3")
        empty_repository.initialize()
        with closing(empty_repository.connect()) as db:
            tables = {row["name"] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertTrue({"evaluation_lab_runs", "evaluation_lab_scorecards", "evaluation_lab_findings"}.issubset(tables))

    def test_completed_session_snapshot_is_ordered_and_legacy_data_remains_unchanged(self) -> None:
        self.repository.initialize()
        before = self._legacy_rows()
        snapshot = self.repository.snapshot_completed_training_session(1, self.criteria, created_at="2026-10-14 12:00:00 UTC")
        self.assertEqual(snapshot.original_request, "Teach deterministic tests")
        self.assertEqual([output.role for output in snapshot.outputs], ["Trainer", "Student", "Evaluator", "Improver"])
        self.assertEqual(snapshot.role_models[0], ("Trainer", "trainer:1"))
        self.assertEqual(self._legacy_rows(), before)

    def test_missing_or_incomplete_session_is_rejected(self) -> None:
        self.repository.initialize()
        with self.assertRaisesRegex(EvaluationRepositoryError, "does not exist"):
            self.repository.snapshot_completed_training_session(99, self.criteria)
        with closing(self._connect()) as db, db:
            db.execute("UPDATE training_sessions SET status='running' WHERE id=1")
        with self.assertRaisesRegex(EvaluationRepositoryError, "Only completed"):
            self.repository.snapshot_completed_training_session(1, self.criteria)

    def test_incomplete_stage_is_rejected_without_writing_source_records(self) -> None:
        self.repository.initialize()
        with closing(self._connect()) as db, db:
            db.execute("UPDATE training_stages SET status='Running' WHERE session_id=1 AND execution_order=2")
        before = self._legacy_rows()
        with self.assertRaisesRegex(EvaluationRepositoryError, "Every Training Room stage"):
            self.repository.snapshot_completed_training_session(1, self.criteria)
        self.assertEqual(self._legacy_rows(), before)

    def test_snapshot_is_stored_immutably_and_scorecard_findings_round_trip(self) -> None:
        self.repository.initialize()
        run = self.repository.create_run(1, "separate-evaluator:1", self.criteria)
        self.assertEqual(run.status, "pending")
        stored = self.repository.get_run(run.run_id)
        self.assertIsNotNone(stored)
        self.assertEqual(stored.input_snapshot.original_request, "Teach deterministic tests")
        with closing(self._connect()) as db, db:
            db.execute("UPDATE messages SET content='Changed after snapshot' WHERE session_id=1 AND agent='You'")
        self.assertEqual(self.repository.get_run(run.run_id).input_snapshot.original_request, "Teach deterministic tests")
        self.repository.mark_run_running(run.run_id)
        scorecard = EvaluationScorecard(run.run_id, self.criteria, {"Faithfulness": 100, "Completeness": 0}, "Model assessment", "raw output")
        self.repository.record_scorecard(scorecard)
        self.assertEqual(self.repository.get_run(run.run_id).status, "completed")
        self.assertEqual(dict(self.repository.get_scorecard(run.run_id).scores), {"Faithfulness": 100, "Completeness": 0})
        finding = EvaluationFinding(run.run_id, "A model-generated concern", "Evaluator output", "model_judgment")
        self.repository.add_finding(finding)
        self.assertEqual(self.repository.list_findings(run.run_id), [finding])

    def test_scorecard_criteria_must_match_snapshot_without_transitioning_the_run(self) -> None:
        self.repository.initialize()
        run = self.repository.create_run(1, "separate-evaluator:1", self.criteria)
        self.repository.mark_run_running(run.run_id)
        mismatched = EvaluationScorecard(run.run_id, ("Different criterion",), {"Different criterion": 80}, "Assessment")
        with self.assertRaisesRegex(EvaluationRepositoryError, "exactly match"):
            self.repository.record_scorecard(mismatched)
        self.assertEqual(self.repository.get_run(run.run_id).status, "running")
        self.assertIsNone(self.repository.get_scorecard(run.run_id))

    def test_direct_sql_cannot_mutate_stored_snapshot_identity(self) -> None:
        self.repository.initialize()
        run = self.repository.create_run(1, "separate-evaluator:1", self.criteria)
        with closing(self._connect()) as db, db:
            with self.assertRaisesRegex(sqlite3.IntegrityError, "immutable"):
                db.execute("UPDATE evaluation_lab_runs SET input_snapshot_json='{}' WHERE id=?", (run.run_id,))
            with self.assertRaisesRegex(sqlite3.IntegrityError, "immutable"):
                db.execute("UPDATE evaluation_lab_runs SET source_training_session_id=2 WHERE id=?", (run.run_id,))
        stored = self.repository.get_run(run.run_id)
        self.assertEqual(stored.input_snapshot.source_training_session_id, 1)

    def test_findings_require_completed_runs_for_every_other_lifecycle_state(self) -> None:
        self.repository.initialize()
        pending = self.repository.create_run(1, "evaluator:1", self.criteria)
        running = self.repository.create_run(1, "evaluator:1", self.criteria)
        self.repository.mark_run_running(running.run_id)
        failed = self.repository.create_run(1, "evaluator:1", self.criteria)
        self.repository.mark_run_failed(failed.run_id, "unavailable")
        for run_id in (pending.run_id, running.run_id, failed.run_id):
            with self.subTest(run_id=run_id), self.assertRaisesRegex(EvaluationRepositoryError, "only to completed"):
                self.repository.add_finding(EvaluationFinding(run_id, "Finding", "Evidence", "model_judgment"))
        with self.assertRaisesRegex(EvaluationRepositoryError, "does not exist"):
            self.repository.add_finding(EvaluationFinding(999, "Finding", "Evidence", "model_judgment"))

    def test_verifiable_findings_require_and_preserve_inspectable_provenance(self) -> None:
        self.repository.initialize()
        run = self.repository.create_run(1, "evaluator:1", self.criteria)
        self.repository.mark_run_running(run.run_id)
        self.repository.record_scorecard(EvaluationScorecard(run.run_id, self.criteria, {"Faithfulness": 90, "Completeness": 80}, "Assessment"))
        with self.assertRaises(EvaluationContractError):
            EvaluationFinding(run.run_id, "Record claim", "Trainer response", "verifiable_record")
        finding = EvaluationFinding(run.run_id, "Record claim", "Trainer response", "verifiable_record", "snapshot:output:1")
        self.repository.add_finding(finding)
        self.assertEqual(self.repository.list_findings(run.run_id), [finding])
        invalid_reference = EvaluationFinding(run.run_id, "Bad record claim", "Unknown", "verifiable_record", "source_stage:1:99")
        with self.assertRaisesRegex(EvaluationRepositoryError, "must identify this run"):
            self.repository.add_finding(invalid_reference)
        self.assertEqual(self.repository.list_findings(run.run_id), [finding])

    def test_initialization_migrates_legacy_findings_without_structured_provenance(self) -> None:
        with closing(self._connect()) as db, db:
            db.executescript("""
                CREATE TABLE evaluation_lab_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, source_training_session_id INTEGER NOT NULL,
                    evaluator_model TEXT NOT NULL, input_snapshot_json TEXT NOT NULL, status TEXT NOT NULL,
                    created_at TEXT NOT NULL, completed_at TEXT, error TEXT
                );
                CREATE TABLE evaluation_lab_findings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, evaluation_run_id INTEGER NOT NULL,
                    description TEXT NOT NULL, supporting_evidence TEXT NOT NULL,
                    evidence_classification TEXT NOT NULL, created_at TEXT NOT NULL
                );
                INSERT INTO evaluation_lab_findings(evaluation_run_id,description,supporting_evidence,evidence_classification,created_at)
                VALUES(44,'Historic finding','Old evidence','verifiable_record','2026-10-14 UTC');
            """)
        self.repository.initialize()
        self.repository.initialize()
        with closing(self._connect()) as db:
            columns = {row[1] for row in db.execute("PRAGMA table_info(evaluation_lab_findings)")}
            row = db.execute("SELECT evidence_classification,evidence_reference FROM evaluation_lab_findings WHERE id=1").fetchone()
        self.assertIn("evidence_reference", columns)
        self.assertEqual((row["evidence_classification"], row["evidence_reference"]), ("unverified", None))

    def test_only_pending_or_running_runs_can_transition_to_failed(self) -> None:
        self.repository.initialize()
        run = self.repository.create_run(1, "separate-evaluator:1", self.criteria)
        failed = self.repository.mark_run_failed(run.run_id, "Evaluator process unavailable")
        self.assertEqual((failed.status, failed.error), ("failed", "Evaluator process unavailable"))
        with self.assertRaisesRegex(EvaluationRepositoryError, "pending or running"):
            self.repository.mark_run_failed(run.run_id, "second failure")

    def test_contracts_reject_invalid_scores_and_mutation(self) -> None:
        output = AgentOutput("Trainer", "response", "trainer:1", 1)
        with self.assertRaises(FrozenInstanceError):
            output.role = "Other"
        with self.assertRaises(EvaluationContractError):
            EvaluationScorecard(1, ("A",), {"A": 101}, "summary")
        with self.assertRaises(EvaluationContractError):
            EvaluationScorecard(1, ("A",), {"B": 50}, "summary")


if __name__ == "__main__":
    unittest.main()
