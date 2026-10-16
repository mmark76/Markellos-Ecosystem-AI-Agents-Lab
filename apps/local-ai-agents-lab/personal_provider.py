"""Local-only validation for a user-owned remote training provider plan.

This module deliberately has no credential, subprocess, filesystem, or network
capability. It gives the local UI a small, testable boundary for collecting a
user's declared limits before a later credential/executor phase is approved.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation


class PersonalProviderPlanError(ValueError):
    """Raised when a personal-provider plan is incomplete or unsafe."""


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
        "credentials": "not-collected",
        "execution": "not-available",
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
        "credentials": "No credential was requested, stored, or returned.",
        "execution": "No provider connection, upload, provisioning, or training job was started.",
        "nextStep": "Credential storage and the approved remote executor remain a separate security-reviewed phase.",
    }
