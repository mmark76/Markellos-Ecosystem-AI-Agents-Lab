"""One-shot evaluator execution engine for independent Evaluation Lab runs."""
from __future__ import annotations

from typing import Protocol

from .model_adapter import OllamaEvaluatorAdapter
from .prompt import build_evaluation_messages
from .repository import EvaluationRepository, EvaluationRepositoryError
from .response import parse_assessment_response


class EvaluationExecutionError(ValueError):
    """An Evaluation Lab run could not be safely executed to completion."""


class EvaluatorModelAdapter(Protocol):
    def evaluate(self, model: str, messages: list[dict[str, str]]) -> str: ...


class EvaluationExecutionEngine:
    """Coordinates one pending run while keeping all source records strictly read-only."""

    def __init__(
        self, repository: EvaluationRepository, adapter: EvaluatorModelAdapter | None = None, *, timeout_seconds: int = 60
    ) -> None:
        self.repository = repository
        self.adapter = adapter or OllamaEvaluatorAdapter(timeout_seconds=timeout_seconds)

    def execute(self, run_id: int):
        run = self.repository.get_run(run_id)
        if run is None:
            raise EvaluationExecutionError("The Evaluation Lab run does not exist.")
        if run.status != "pending":
            raise EvaluationExecutionError("Only a pending Evaluation Lab run can be executed; running runs require explicit recovery.")
        try:
            run = self.repository.mark_run_running(run_id)
        except EvaluationRepositoryError as error:
            raise EvaluationExecutionError("The Evaluation Lab run could not enter the running state.") from error
        try:
            messages = build_evaluation_messages(run.input_snapshot)
            raw_response = self.adapter.evaluate(run.evaluator_model, messages)
            assessment = parse_assessment_response(raw_response, run_id, run.input_snapshot)
            self.repository.record_assessment(assessment.scorecard, assessment.findings)
        except Exception as error:
            self._fail_running_run(run_id, error)
            reason = str(error).strip() or type(error).__name__
            raise EvaluationExecutionError(f"Evaluation Lab run failed: {reason}") from error
        completed = self.repository.get_run(run_id)
        if completed is None or completed.status != "completed":
            raise EvaluationExecutionError("Evaluation Lab run did not reach a completed state.")
        return completed

    def _fail_running_run(self, run_id: int, error: Exception) -> None:
        """Persist a failure only while the engine still owns a running run."""
        try:
            self.repository.mark_run_failed(run_id, str(error).strip() or type(error).__name__)
        except Exception as persistence_error:
            try:
                current = self.repository.get_run(run_id)
            except Exception as lookup_error:
                raise EvaluationExecutionError(
                    "Evaluation Lab execution failed and its failure state could not be verified."
                ) from lookup_error
            if current is not None and current.status != "running":
                # A completed or manually recovered run must never be overwritten.
                return
            raise EvaluationExecutionError(
                "Evaluation Lab execution failed and its failed state could not be persisted."
            ) from persistence_error
