"""Strict parsing of structured local Evaluator-model responses."""
from __future__ import annotations

import json
from dataclasses import dataclass

from .contracts import EvaluationContractError, EvaluationFinding, EvaluationInputSnapshot, EvaluationScorecard


class EvaluationResponseError(ValueError):
    """A model response did not meet the Evaluation Lab structured-response contract."""


MAX_RESPONSE_CHARACTERS = 2_000_000


@dataclass(frozen=True)
class ParsedAssessment:
    scorecard: EvaluationScorecard
    findings: tuple[EvaluationFinding, ...]


def parse_assessment_response(
    raw_response: str, evaluation_run_id: int, snapshot: EvaluationInputSnapshot
) -> ParsedAssessment:
    """Parse exactly the JSON contract expected by the Evaluation Lab execution engine."""
    if not isinstance(raw_response, str) or len(raw_response) > MAX_RESPONSE_CHARACTERS:
        raise EvaluationResponseError("The Evaluator model response exceeds the configured size limit.")
    try:
        payload = json.loads(raw_response)
    except (TypeError, json.JSONDecodeError) as error:
        raise EvaluationResponseError("The Evaluator model response must be valid JSON.") from error
    if not isinstance(payload, dict) or set(payload) != {"scores", "summary", "findings"}:
        raise EvaluationResponseError("The Evaluator model response must contain exactly scores, summary, and findings.")
    if not isinstance(payload["findings"], list):
        raise EvaluationResponseError("The Evaluator model findings must be a JSON array.")
    try:
        scorecard = EvaluationScorecard(
            evaluation_run_id=evaluation_run_id,
            criteria=snapshot.criteria,
            scores=payload["scores"],
            summary=payload["summary"],
            raw_assessment=raw_response,
        )
        findings = tuple(
            _finding_from_payload(item, evaluation_run_id)
            for item in payload["findings"]
        )
    except EvaluationContractError as error:
        raise EvaluationResponseError(f"The Evaluator model response is invalid: {error}") from error
    return ParsedAssessment(scorecard=scorecard, findings=findings)


def _finding_from_payload(item: object, evaluation_run_id: int) -> EvaluationFinding:
    if not isinstance(item, dict):
        raise EvaluationResponseError("Every Evaluator model finding must be an object.")
    allowed = {"description", "supporting_evidence", "evidence_classification", "evidence_reference"}
    required = {"description", "supporting_evidence", "evidence_classification"}
    if not required.issubset(item) or not set(item).issubset(allowed):
        raise EvaluationResponseError("Every finding must use the documented evidence fields.")
    return EvaluationFinding(
        evaluation_run_id=evaluation_run_id,
        description=item.get("description"),
        supporting_evidence=item.get("supporting_evidence"),
        evidence_classification=item.get("evidence_classification"),
        evidence_reference=item.get("evidence_reference"),
    )
