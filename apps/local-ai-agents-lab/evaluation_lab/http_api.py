"""Narrow local HTTP integration service for Evaluation Lab, independent of legacy rooms."""
from __future__ import annotations

import logging
import sqlite3
from contextlib import closing
from pathlib import Path
from threading import Lock, Thread
from typing import Callable

from .contracts import EvaluationContractError
from .execution import EvaluationExecutionEngine
from .repository import EvaluationRepository, EvaluationRepositoryError


LOGGER = logging.getLogger(__name__)


class EvaluationAPIError(ValueError):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


class EvaluationHTTPService:
    """Owns local Evaluation Lab routes, with explicit execution and no automatic retries."""

    def __init__(self, db_path: Callable[[], Path], run_lock: Lock, available_models: Callable[[], list[str]]):
        self._db_path = db_path
        self._run_lock = run_lock
        self._available_models = available_models

    def _repository(self) -> EvaluationRepository:
        return EvaluationRepository(self._db_path())

    def get(self, path: str) -> dict:
        repo = self._repository()
        if path == "/api/evaluation/sessions":
            with closing(repo.connect()) as db:
                candidates = db.execute(
                    "SELECT id, created_at, provider FROM training_sessions "
                    "WHERE status='completed' ORDER BY id DESC LIMIT 200"
                ).fetchall()
            # Reuse Phase 1 snapshot validation rather than duplicating source rules.
            # A session can become invalid between listing and run creation; create_run
            # validates again and remains the authoritative persistence boundary.
            sessions = []
            for row in candidates:
                try:
                    repo.snapshot_completed_training_session(row["id"], ("Eligibility",))
                except EvaluationRepositoryError:
                    continue
                sessions.append(dict(row))
                if len(sessions) == 50:
                    break
            return {"sessions": sessions}
        if path == "/api/evaluation/runs":
            with closing(repo.connect()) as db:
                rows = db.execute(
                    "SELECT id, source_training_session_id, evaluator_model, status, created_at "
                    "FROM evaluation_lab_runs ORDER BY id DESC LIMIT 50"
                ).fetchall()
            return {"runs": [dict(row) for row in rows]}
        prefix = "/api/evaluation/runs/"
        if path.startswith(prefix):
            run_id = self._id(path[len(prefix):])
            run = repo.get_run(run_id)
            if run is None:
                raise EvaluationAPIError("Unknown Evaluation Lab run.", 404)
            card = repo.get_scorecard(run_id)
            findings = repo.list_findings(run_id)
            return {
                "id": run.run_id,
                "source_training_session_id": run.source_training_session_id,
                "evaluator_model": run.evaluator_model,
                "status": run.status,
                "created_at": run.created_at,
                "completed_at": run.completed_at,
                "error": run.error,
                "criteria": list(run.input_snapshot.criteria),
                "scorecard": None if card is None else {
                    "scores": dict(card.scores), "summary": card.summary,
                },
                "findings": [
                    {
                        "description": finding.description,
                        "supporting_evidence": finding.supporting_evidence,
                        "evidence_classification": finding.evidence_classification,
                        "evidence_reference": finding.evidence_reference,
                    }
                    for finding in findings
                ],
            }
        raise EvaluationAPIError("Unknown Evaluation Lab endpoint.", 404)

    def start(self, body: object) -> dict:
        if not isinstance(body, dict) or set(body) != {
            "source_training_session_id", "evaluator_model", "criteria"
        }:
            raise EvaluationAPIError("Provide session ID, Evaluator model, and criteria.")
        session_id = self._id(body["source_training_session_id"])
        model = body["evaluator_model"]
        criteria = body["criteria"]
        if not isinstance(model, str) or not model.strip() or len(model) > 128:
            raise EvaluationAPIError("Select a valid local Evaluator model.")
        if not isinstance(criteria, list) or not 1 <= len(criteria) <= 8 or any(
            not isinstance(x, str) or not x.strip() or len(x) > 80 for x in criteria
        ) or len(set(criteria)) != len(criteria):
            raise EvaluationAPIError("Provide 1–8 distinct non-empty evaluation criteria (up to 80 characters each).")
        if not self._run_lock.acquire(blocking=False):
            raise EvaluationAPIError("Another local agent session is already running.", 409)
        try:
            try:
                models = self._available_models()
            except Exception as error:
                raise EvaluationAPIError("Local Ollama models are unavailable.", 502) from error
            if model not in models:
                raise EvaluationAPIError("The selected Evaluator model is not available locally.")
            repo = self._repository()
            try:
                run = repo.create_run(session_id, model, tuple(criteria))
            except (EvaluationContractError, EvaluationRepositoryError, sqlite3.DatabaseError) as error:
                raise EvaluationAPIError(str(error)) from error

            def work() -> None:
                try:
                    EvaluationExecutionEngine(repo).execute(run.run_id)
                except Exception:
                    # The engine records failed state if persistence is available.
                    # If that write failed, surface it in the local diagnostic log;
                    # manual recovery is required for any stale running record.
                    LOGGER.exception(
                        "Evaluation Lab worker for run %s failed; inspect persisted state before manual recovery.",
                        run.run_id,
                    )
                finally:
                    self._run_lock.release()

            try:
                Thread(target=work, name=f"evaluation-run-{run.run_id}", daemon=True).start()
            except Exception as error:
                repo.mark_run_failed(run.run_id, "Evaluation worker could not start.")
                raise EvaluationAPIError("Evaluation worker could not start.", 500) from error
            return {"id": run.run_id, "status": "pending"}
        except Exception:
            self._run_lock.release()
            raise

    @staticmethod
    def _id(value: object) -> int:
        if isinstance(value, bool):
            raise EvaluationAPIError("A positive integer ID is required.")
        if isinstance(value, int):
            result = value
        elif isinstance(value, str) and value.isascii() and value.isdecimal():
            result = int(value)
        else:
            raise EvaluationAPIError("A positive integer ID is required.")
        if not 1 <= result <= 2_147_483_647:
            raise EvaluationAPIError("A positive integer ID is required.")
        return result
