"""Local-only validation for a user-owned remote training provider plan.

This module has no subprocess, filesystem, or network capability. It gives the
local UI small, testable request contracts for a provider plan and a separately
scoped local credential vault. Its public response helpers never return
credential material.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation


class PersonalProviderPlanError(ValueError):
    """Raised when a personal-provider plan is incomplete or unsafe."""


class PersonalProviderCredentialError(ValueError):
    """Raised when a local credential request is incomplete or unsafe."""


class PersonalProviderConnectionError(ValueError):
    """Raised when an explicit read-only connection check is unsafe."""


_PROVIDERS = {
    "runpod": {
        "id": "runpod",
        "label": "RunPod",
        "status": "first-supported-provider",
        "description": "Your own RunPod account pays the provider directly.",
    }
}
_REGIONS = {"any", "europe", "north-america"}
_MAX_BUDGET_USD = Decimal("100.00")


def provider_options() -> dict:
    """Return public UI options without reading local credentials or config."""
    return {
        "providers": list(_PROVIDERS.values()),
        "regions": sorted(_REGIONS),
        "limits": {"minimumBudgetUsd": 1, "maximumBudgetUsd": int(_MAX_BUDGET_USD), "minimumRuntimeMinutes": 15, "maximumRuntimeMinutes": 720},
        "credentials": "optional-local-vault",
        "execution": "connection-ready",
    }


def _budget(value: object) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        raise PersonalProviderPlanError("Choose a whole-dollar personal spending limit.")
    try:
        budget = Decimal(str(value))
    except InvalidOperation as error:
        raise PersonalProviderPlanError("Choose a valid personal spending limit.") from error
    if not budget.is_finite() or budget != budget.to_integral_value() or not Decimal("1") <= budget <= _MAX_BUDGET_USD:
        raise PersonalProviderPlanError("Personal spending limit must be a whole number from $1 to $100.")
    return budget


def build_provider_plan(raw: object) -> dict:
    """Validate a non-secret preview. It never provisions or contacts a provider."""
    if not isinstance(raw, dict):
        raise PersonalProviderPlanError("Personal provider plan must be a JSON object.")
    expected = {"provider", "region", "maxBudgetUsd", "maxRuntimeMinutes", "confirmOwnAccount", "confirmDataTransfer"}
    if set(raw) != expected:
        raise PersonalProviderPlanError("Personal provider plan contains unsupported fields.")
    provider = raw["provider"]
    region = raw["region"]
    runtime = raw["maxRuntimeMinutes"]
    if provider not in _PROVIDERS:
        raise PersonalProviderPlanError("Select a supported personal provider.")
    if region not in _REGIONS:
        raise PersonalProviderPlanError("Select a supported provider region preference.")
    if isinstance(runtime, bool) or not isinstance(runtime, int) or not 15 <= runtime <= 720:
        raise PersonalProviderPlanError("Maximum runtime must be an integer from 15 to 720 minutes.")
    if raw["confirmOwnAccount"] is not True:
        raise PersonalProviderPlanError("Confirm that the provider account and charges are your responsibility.")
    if raw["confirmDataTransfer"] is not True:
        raise PersonalProviderPlanError("Confirm that selected training data may be sent directly to your provider.")
    budget = _budget(raw["maxBudgetUsd"])
    details = _PROVIDERS[provider]
    return {
        "state": "PLAN_REVIEWED",
        "provider": {"id": details["id"], "label": details["label"], "region": region},
        "limits": {"maxBudgetUsd": int(budget), "maxRuntimeMinutes": runtime},
        "billing": "The provider charges your own account directly.",
        "credentials": "No credential was requested, stored, or returned by this plan review.",
        "execution": "No provider connection, upload, provisioning, or training job was started.",
        "nextStep": "Save a token locally and use the explicit connection check. A paid Pod or training job is never created by this review.",
    }


def _credential_token(value: object) -> str:
    if not isinstance(value, str) or not 16 <= len(value) <= 512 or value != value.strip() or any(character.isspace() or ord(character) < 32 for character in value):
        raise PersonalProviderCredentialError("Enter a valid provider access token without spaces or line breaks.")
    return value


def credential_store_request(raw: object) -> dict:
    """Validate an exact local-vault request without persisting the token."""
    if not isinstance(raw, dict):
        raise PersonalProviderCredentialError("Provider credential request must be a JSON object.")
    expected = {"provider", "apiKey", "confirmOwnAccount", "confirmCredentialStorage"}
    if set(raw) != expected:
        raise PersonalProviderCredentialError("Provider credential request contains unsupported fields.")
    provider = raw["provider"]
    if provider not in _PROVIDERS:
        raise PersonalProviderCredentialError("Select a supported personal provider.")
    if raw["confirmOwnAccount"] is not True:
        raise PersonalProviderCredentialError("Confirm that the provider account and charges are your responsibility.")
    if raw["confirmCredentialStorage"] is not True:
        raise PersonalProviderCredentialError("Confirm local encrypted storage for this Windows user.")
    return {"provider": provider, "apiKey": _credential_token(raw["apiKey"])}


def credential_removal_request(raw: object) -> str:
    """Validate an explicit removal request for an allow-listed provider."""
    if not isinstance(raw, dict) or set(raw) != {"provider", "confirmCredentialRemoval"}:
        raise PersonalProviderCredentialError("Provider credential removal request contains unsupported fields.")
    if raw["provider"] not in _PROVIDERS:
        raise PersonalProviderCredentialError("Select a supported personal provider.")
    if raw["confirmCredentialRemoval"] is not True:
        raise PersonalProviderCredentialError("Confirm removal of the locally stored provider credential.")
    return raw["provider"]


def connection_check_request(raw: object) -> str:
    """Validate the one explicit, non-mutating provider connection action."""
    if not isinstance(raw, dict) or set(raw) != {"provider", "confirmReadOnlyConnection"}:
        raise PersonalProviderConnectionError("Provider connection request contains unsupported fields.")
    if raw["provider"] not in _PROVIDERS:
        raise PersonalProviderConnectionError("Select a supported personal provider.")
    if raw["confirmReadOnlyConnection"] is not True:
        raise PersonalProviderConnectionError("Confirm the read-only RunPod connection check.")
    return raw["provider"]
