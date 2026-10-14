"""Validated value objects owned by the Evaluation Lab.

These contracts deliberately describe an evaluation as an assertion made by an
Evaluator model.  They do not elevate model-generated scores or findings into
independently verified facts.
"""
from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping, Optional


class EvaluationContractError(ValueError):
    """Raised when an Evaluation Lab value cannot satisfy its data contract."""


RUN_STATUSES = frozenset({"pending", "running", "completed", "failed"})
EVIDENCE_CLASSIFICATIONS = frozenset({"verifiable_record", "model_judgment", "unverified"})


def _required_text(value: str, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise EvaluationContractError(f"{field} must be a non-empty string.")
    return value


def _positive_id(value: int, field: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise EvaluationContractError(f"{field} must be a positive integer.")
    return value


def _criteria(values: tuple[str, ...]) -> tuple[str, ...]:
    normalized = tuple(_required_text(value, "criteria item") for value in values)
    if not normalized:
        raise EvaluationContractError("At least one evaluation criterion is required.")
    if len(set(normalized)) != len(normalized):
        raise EvaluationContractError("Evaluation criteria must be unique.")
    return normalized


@dataclass(frozen=True)
class AgentOutput:
    """One ordered, completed output from the immutable Training Room record."""

    role: str
    content: str
    model: str
    execution_order: int

    def __post_init__(self) -> None:
        _required_text(self.role, "role")
        _required_text(self.content, "content")
        _required_text(self.model, "model")
        _positive_id(self.execution_order, "execution_order")

    def to_dict(self) -> dict[str, object]:
        return {
            "role": self.role,
            "content": self.content,
            "model": self.model,
            "execution_order": self.execution_order,
        }

    @classmethod
    def from_dict(cls, data: Mapping[str, object]) -> "AgentOutput":
        return cls(
            role=data.get("role"),  # type: ignore[arg-type]
            content=data.get("content"),  # type: ignore[arg-type]
            model=data.get("model"),  # type: ignore[arg-type]
            execution_order=data.get("execution_order"),  # type: ignore[arg-type]
        )


@dataclass(frozen=True)
class EvaluationInputSnapshot:
    """A self-contained read-only copy of one completed Training Room session."""

    source_training_session_id: int
    original_request: str
    outputs: tuple[AgentOutput, ...]
    provider: str
    role_models: tuple[tuple[str, str], ...]
    criteria: tuple[str, ...]
    created_at: str

    def __post_init__(self) -> None:
        _positive_id(self.source_training_session_id, "source_training_session_id")
        _required_text(self.original_request, "original_request")
        _required_text(self.provider, "provider")
        _required_text(self.created_at, "created_at")
        outputs = tuple(self.outputs)
        if not outputs:
            raise EvaluationContractError("A snapshot requires at least one completed agent output.")
        if any(not isinstance(output, AgentOutput) for output in outputs):
            raise EvaluationContractError("Snapshot outputs must be AgentOutput records.")
        orders = tuple(output.execution_order for output in outputs)
        if orders != tuple(range(1, len(outputs) + 1)):
            raise EvaluationContractError("Snapshot outputs must be ordered consecutively from one.")
        role_models = tuple(tuple(item) for item in self.role_models)
        if len(role_models) != len(outputs):
            raise EvaluationContractError("Each snapshot output requires matching model metadata.")
        for role, model in role_models:
            _required_text(role, "model role")
            _required_text(model, "model")
        if tuple(role for role, _ in role_models) != tuple(output.role for output in outputs):
            raise EvaluationContractError("Model metadata must match the ordered snapshot outputs.")
        object.__setattr__(self, "outputs", outputs)
        object.__setattr__(self, "role_models", role_models)
        object.__setattr__(self, "criteria", _criteria(tuple(self.criteria)))

    def to_dict(self) -> dict[str, object]:
        return {
            "source_training_session_id": self.source_training_session_id,
            "original_request": self.original_request,
            "outputs": [output.to_dict() for output in self.outputs],
            "provider": self.provider,
            "role_models": [{"role": role, "model": model} for role, model in self.role_models],
            "criteria": list(self.criteria),
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Mapping[str, object]) -> "EvaluationInputSnapshot":
        raw_outputs = data.get("outputs")
        raw_models = data.get("role_models")
        if not isinstance(raw_outputs, list) or not isinstance(raw_models, list):
            raise EvaluationContractError("Snapshot outputs and role_models must be lists.")
        return cls(
            source_training_session_id=data.get("source_training_session_id"),  # type: ignore[arg-type]
            original_request=data.get("original_request"),  # type: ignore[arg-type]
            outputs=tuple(AgentOutput.from_dict(item) for item in raw_outputs if isinstance(item, Mapping)),
            provider=data.get("provider"),  # type: ignore[arg-type]
            role_models=tuple(
                (item.get("role"), item.get("model"))  # type: ignore[arg-type]
                for item in raw_models if isinstance(item, Mapping)
            ),
            criteria=tuple(data.get("criteria", ())),  # type: ignore[arg-type]
            created_at=data.get("created_at"),  # type: ignore[arg-type]
        )


@dataclass(frozen=True)
class EvaluationRun:
    """Lifecycle metadata for one future Evaluator-model execution."""

    source_training_session_id: int
    evaluator_model: str
    input_snapshot: EvaluationInputSnapshot
    status: str
    created_at: str
    run_id: Optional[int] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None

    def __post_init__(self) -> None:
        _positive_id(self.source_training_session_id, "source_training_session_id")
        _required_text(self.evaluator_model, "evaluator_model")
        if not isinstance(self.input_snapshot, EvaluationInputSnapshot):
            raise EvaluationContractError("input_snapshot must be an EvaluationInputSnapshot.")
        if self.input_snapshot.source_training_session_id != self.source_training_session_id:
            raise EvaluationContractError("The snapshot source must match the run source session.")
        if self.status not in RUN_STATUSES:
            raise EvaluationContractError("status is not a supported Evaluation Lab state.")
        _required_text(self.created_at, "created_at")
        if self.run_id is not None:
            _positive_id(self.run_id, "run_id")
        if self.completed_at is not None:
            _required_text(self.completed_at, "completed_at")
        if self.error is not None:
            _required_text(self.error, "error")


@dataclass(frozen=True)
class EvaluationScorecard:
    """Scores asserted by an Evaluator model for one Evaluation Lab run."""

    evaluation_run_id: int
    criteria: tuple[str, ...]
    scores: Mapping[str, int]
    summary: str
    raw_assessment: Optional[str] = None

    def __post_init__(self) -> None:
        _positive_id(self.evaluation_run_id, "evaluation_run_id")
        criteria = _criteria(tuple(self.criteria))
        if not isinstance(self.scores, Mapping):
            raise EvaluationContractError("scores must map each criterion to an integer score.")
        scores = dict(self.scores)
        if set(scores) != set(criteria):
            raise EvaluationContractError("Scores must contain exactly the snapshot criteria.")
        for criterion, score in scores.items():
            _required_text(criterion, "score criterion")
            if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 100:
                raise EvaluationContractError("Every score must be an integer from 0 through 100.")
        _required_text(self.summary, "summary")
        if self.raw_assessment is not None:
            _required_text(self.raw_assessment, "raw_assessment")
        object.__setattr__(self, "criteria", criteria)
        object.__setattr__(self, "scores", MappingProxyType(scores))


@dataclass(frozen=True)
class EvaluationFinding:
    """A qualified finding, with evidence provenance made explicit."""

    evaluation_run_id: int
    description: str
    supporting_evidence: str
    evidence_classification: str
    evidence_reference: Optional[str] = None

    def __post_init__(self) -> None:
        _positive_id(self.evaluation_run_id, "evaluation_run_id")
        _required_text(self.description, "description")
        _required_text(self.supporting_evidence, "supporting_evidence")
        if self.evidence_classification not in EVIDENCE_CLASSIFICATIONS:
            raise EvaluationContractError("evidence_classification must identify the evidence provenance.")
        if self.evidence_reference is not None:
            _required_text(self.evidence_reference, "evidence_reference")
        if self.evidence_classification == "verifiable_record":
            if self.evidence_reference is None:
                raise EvaluationContractError("verifiable_record findings require an inspectable evidence_reference.")
            if not self.evidence_reference.startswith(("snapshot:", "source_session:", "source_stage:")):
                raise EvaluationContractError("verifiable_record evidence_reference must identify snapshot or source evidence.")
