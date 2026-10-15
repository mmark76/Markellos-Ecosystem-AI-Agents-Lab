"""Independent, additive persistence contracts for the future Evaluation Lab."""

from .contracts import (
    AgentOutput,
    EvaluationContractError,
    EvaluationFinding,
    EvaluationInputSnapshot,
    EvaluationRun,
    EvaluationScorecard,
)
from .repository import EvaluationRepository, EvaluationRepositoryError
from .execution import EvaluationExecutionEngine, EvaluationExecutionError
from .model_adapter import EvaluationModelError, OllamaEvaluatorAdapter
from .response import EvaluationResponseError, ParsedAssessment, parse_assessment_response

__all__ = [
    "AgentOutput",
    "EvaluationContractError",
    "EvaluationExecutionEngine",
    "EvaluationExecutionError",
    "EvaluationFinding",
    "EvaluationInputSnapshot",
    "EvaluationRepository",
    "EvaluationRepositoryError",
    "EvaluationModelError",
    "EvaluationResponseError",
    "EvaluationRun",
    "EvaluationScorecard",
    "OllamaEvaluatorAdapter",
    "ParsedAssessment",
    "parse_assessment_response",
]
