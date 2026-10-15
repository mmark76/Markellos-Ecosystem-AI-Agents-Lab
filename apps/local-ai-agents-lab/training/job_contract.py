"""Provider-neutral, file-based contract for one supervised LoRA job."""
from __future__ import annotations

from pathlib import Path


REQUIRED_PACKAGE_VERSIONS = {
    "torch": "2.7.1",
    "transformers": "4.53.0",
    "peft": "0.15.2",
    "trl": "0.19.1",
    "accelerate": "1.8.1",
    "datasets": "3.6.0",
}
SUPPORTED_METHOD = "lora"
SUPPORTED_DEVICES = {"auto", "cpu", "cuda"}
DEFAULT_TRAINING = {"epochs": 1, "batchSize": 1, "maxLength": 512, "timeoutSeconds": 1800}


class JobContractError(ValueError):
    """Raised when a job file cannot safely be executed by the worker."""


def normalize_job(raw: object) -> dict:
    """Validate a portable job mapping without performing filesystem writes."""
    if not isinstance(raw, dict):
        raise JobContractError("Training job configuration must be a JSON object.")
    job = dict(raw)
    for field in ("modelPath", "datasetPath", "outputPath", "statusPath"):
        value = job.get(field)
        if not isinstance(value, str) or not value.strip():
            raise JobContractError(f"Training job requires a non-empty {field}.")
        job[field] = str(Path(value))
    job["jobId"] = job.get("jobId", "developer-smoke-test")
    if not isinstance(job["jobId"], str) or not job["jobId"].replace("-", "").isalnum():
        raise JobContractError("Training job identity must contain only letters, digits, and hyphens.")
    job["method"] = job.get("method", SUPPORTED_METHOD)
    if job["method"] != SUPPORTED_METHOD:
        raise JobContractError("Only supervised LoRA adapter training is supported.")
    job["device"] = job.get("device", "auto")
    if job["device"] not in SUPPORTED_DEVICES:
        raise JobContractError("Training device must be auto, cpu, or cuda.")
    for field, default, minimum, maximum in (
        ("epochs", DEFAULT_TRAINING["epochs"], 1, 10),
        ("batchSize", DEFAULT_TRAINING["batchSize"], 1, 8),
        ("maxLength", DEFAULT_TRAINING["maxLength"], 8, 4096),
        ("timeoutSeconds", DEFAULT_TRAINING["timeoutSeconds"], 1, 14400),
    ):
        value = job.get(field, default)
        if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
            raise JobContractError(f"Training job {field} must be an integer from {minimum} to {maximum}.")
        job[field] = value
    return job
