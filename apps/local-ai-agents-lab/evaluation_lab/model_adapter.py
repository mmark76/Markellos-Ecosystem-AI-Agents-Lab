"""Fixed-loopback Ollama adapter used only by the Evaluation Lab engine."""
from __future__ import annotations

import json
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener

from providers import InferenceProviders, ProviderError, ProviderUnavailable


class EvaluationModelError(ValueError):
    """A selected local Evaluator model could not produce a usable response."""


def _structured_format(messages: list[dict[str, str]]) -> dict:
    """Bind the Ollama JSON Schema to the server-generated snapshot criteria."""
    prefix = "Evaluate this immutable recorded Training Room snapshot:\n"
    if not messages or not isinstance(messages[-1].get("content"), str):
        raise EvaluationModelError("A structured Evaluation Lab snapshot is required.")
    content = messages[-1]["content"]
    if not content.startswith(prefix):
        raise EvaluationModelError("A structured Evaluation Lab snapshot is required.")
    try:
        snapshot = json.loads(content[len(prefix):])
        criteria = snapshot["criteria"]
        if not isinstance(criteria, list) or not criteria or any(
            not isinstance(item, str) or not item.strip() for item in criteria
        ) or len(set(criteria)) != len(criteria):
            raise ValueError("Invalid snapshot criteria.")
    except (TypeError, KeyError, ValueError, json.JSONDecodeError) as error:
        raise EvaluationModelError("The Evaluation Lab snapshot criteria are invalid.") from error
    try:
        orders = [item["execution_order"] for item in snapshot["recorded_outputs"]]
        if any(not isinstance(n, int) or isinstance(n, bool) or n < 1 for n in orders):
            raise ValueError("Invalid recorded output order.")
    except (KeyError, TypeError, ValueError) as error:
        raise EvaluationModelError("The Evaluation Lab recorded outputs are invalid.") from error
    references = ["snapshot:original_request"] + [f"snapshot:output:{n}" for n in orders]
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["scores", "summary", "findings"],
        "properties": {
            "scores": {
                "type": "object", "additionalProperties": False, "required": criteria,
                "properties": {name: {"type": "integer", "minimum": 0, "maximum": 100} for name in criteria},
            },
            "summary": {"type": "string"},
            "findings": {
                "type": "array", "items": {
                    "type": "object", "additionalProperties": False,
                    "required": ["description", "supporting_evidence", "evidence_classification", "evidence_reference"],
                    "properties": {
                        "description": {"type": "string"},
                        "supporting_evidence": {"type": "string"},
                        "evidence_classification": {
                            "type": "string",
                            "enum": ["verifiable_record", "model_judgment", "unverified"],
                        },
                        "evidence_reference": {"type": "string", "enum": references},
                    },
                },
            },
        },
    }


class OllamaEvaluatorAdapter:
    """Calls only the existing fixed local Ollama endpoint with a bounded timeout."""

    def __init__(
        self,
        providers: Optional[InferenceProviders] = None,
        opener=None,
        *,
        timeout_seconds: int = 60,
        max_response_bytes: int = 2_000_000,
    ) -> None:
        if isinstance(timeout_seconds, bool) or not isinstance(timeout_seconds, int) or timeout_seconds < 1:
            raise ValueError("timeout_seconds must be a positive integer.")
        if isinstance(max_response_bytes, bool) or not isinstance(max_response_bytes, int) or max_response_bytes < 1:
            raise ValueError("max_response_bytes must be a positive integer.")
        self.providers = providers or InferenceProviders()
        self.opener = opener or build_opener(ProxyHandler({}))
        self.timeout_seconds = timeout_seconds
        self.max_response_bytes = max_response_bytes

    def evaluate(self, model: str, messages: list[dict[str, str]]) -> str:
        if not isinstance(model, str) or not model.strip():
            raise EvaluationModelError("An explicitly configured Evaluator model is required.")
        try:
            provider = self.providers.get("ollama")
            if model not in self.providers.models("ollama", self.opener):
                raise EvaluationModelError("The configured Evaluator model is not available from local Ollama.")
            request = Request(
                provider.base_url + "/api/chat",
                data=json.dumps(
                    {"model": model, "messages": messages, "stream": False, "think": False, "format": _structured_format(messages), "options": {"num_predict": 1800}}
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with self.opener.open(request, timeout=self.timeout_seconds) as response:
                raw = response.read(self.max_response_bytes + 1)
            if not isinstance(raw, bytes):
                raise EvaluationModelError("The local Evaluator model returned a non-binary response payload.")
            if len(raw) > self.max_response_bytes:
                raise EvaluationModelError("The local Evaluator model response exceeded the configured size limit.")
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise EvaluationModelError("The local Evaluator model response must be a JSON object.")
            message = payload.get("message")
            if not isinstance(message, dict):
                raise EvaluationModelError("The local Evaluator model response must contain an object message.")
            answer = message.get("content")
        except EvaluationModelError:
            raise
        except (ProviderError, ProviderUnavailable, HTTPError, URLError, OSError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError, KeyError, TypeError) as error:
            raise EvaluationModelError(f"The configured local Evaluator model did not complete the evaluation: {error}") from error
        if not isinstance(answer, str) or not answer.strip():
            raise EvaluationModelError("The configured local Evaluator model returned no assessment text.")
        return answer.strip()
