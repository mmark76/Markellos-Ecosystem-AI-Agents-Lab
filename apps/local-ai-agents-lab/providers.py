"""Fixed loopback Ollama adapter for the Local AI Agents Lab."""
from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request


class ProviderError(ValueError):
    """A local provider returned an invalid or unusable response."""


class ProviderUnavailable(ProviderError):
    """A configured loopback provider could not be reached."""


@dataclass(frozen=True)
class ProviderInfo:
    identifier: str
    label: str
    base_url: str
    api_style: str


class InferenceProviders:
    """Routes only to the application's fixed local Ollama endpoint."""

    _providers = {
        "ollama": ProviderInfo("ollama", "Ollama", "http://127.0.0.1:11434", "ollama"),
    }

    def get(self, identifier: str) -> ProviderInfo:
        if not isinstance(identifier, str) or identifier not in self._providers:
            raise ProviderError("Invalid inference provider.")
        return self._providers[identifier]

    def models(self, identifier: str, opener) -> list[str]:
        provider = self.get(identifier)
        try:
            if provider.api_style == "ollama":
                payload = self._json(opener, Request(provider.base_url + "/api/tags", headers={"Accept": "application/json"}), 4)
                names = [model.get("name", "") for model in payload.get("models", []) if isinstance(model, dict)]
                return [name for name in names if isinstance(name, str) and name and "cloud" not in name.lower()]
        except (HTTPError, URLError, OSError, json.JSONDecodeError, UnicodeDecodeError, KeyError, TypeError) as err:
            raise ProviderUnavailable(f"{provider.label} is unavailable on its local endpoint.") from err

    def chat(self, identifier: str, model: str, messages: list[dict], opener) -> str:
        provider = self.get(identifier)
        if not isinstance(model, str) or model not in self.models(identifier, opener):
            raise ProviderError("Select a model exposed by the chosen local provider.")
        try:
            if provider.api_style == "ollama":
                request = Request(
                    provider.base_url + "/api/chat",
                    data=json.dumps({"model": model, "messages": messages, "stream": False,
                                     "think": False, "options": {"num_predict": 450}}).encode("utf-8"),
                    headers={"Content-Type": "application/json"}, method="POST",
                )
                payload = self._json(opener, request, 150)
                answer = (payload.get("message") or {}).get("content", "")
        except (HTTPError, URLError, OSError, json.JSONDecodeError, UnicodeDecodeError, KeyError, TypeError) as err:
            raise ProviderUnavailable(f"{provider.label} did not complete the local request.") from err
        if not isinstance(answer, str) or not answer.strip():
            raise ProviderError("The selected model returned no text response.")
        return answer.strip()

    @staticmethod
    def _json(opener, request: Request, timeout: int) -> dict:
        with opener.open(request, timeout=timeout) as response:
            payload = json.loads(response.read(2_000_000))
        if not isinstance(payload, dict):
            raise ProviderError("Invalid provider response.")
        return payload
