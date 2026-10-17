"""Read-only readiness report for an isolated Linux or Windows training host."""
from __future__ import annotations

import importlib
import json
import os
import platform
import shutil
import sys
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
if str(TRAINING_DIR) not in sys.path:
    sys.path.insert(0, str(TRAINING_DIR))
from job_contract import JobContractError, REQUIRED_PACKAGE_VERSIONS, normalize_job


def _system_ram_bytes() -> int | None:
    try:
        if hasattr(os, "sysconf"):
            return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
        if sys.platform == "win32":
            import ctypes
            class MemoryStatus(ctypes.Structure):
                _fields_ = [("length", ctypes.c_ulong), ("memory_load", ctypes.c_ulong), ("total", ctypes.c_ulonglong)]
            status = MemoryStatus(); status.length = ctypes.sizeof(status)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
                return status.total
    except (AttributeError, OSError, ValueError):
        pass
    return None


def _package_versions() -> tuple[dict, object | None]:
    packages, torch_module = {}, None
    for name, expected in REQUIRED_PACKAGE_VERSIONS.items():
        try:
            module = importlib.import_module(name)
            actual = getattr(module, "__version__", "unknown")
            packages[name] = {"expected": expected, "actual": actual, "ready": actual == expected}
            if name == "torch":
                torch_module = module
        except ImportError:
            packages[name] = {"expected": expected, "actual": None, "ready": False}
    return packages, torch_module


def _dataset_ready(path: Path) -> tuple[bool, str]:
    if not path.is_file():
        return False, "Dataset JSONL file is missing."
    try:
        rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    except (OSError, json.JSONDecodeError):
        return False, "Dataset JSONL cannot be read as valid JSON."
    if not rows or any(not isinstance(row, dict) or not isinstance(row.get("text"), str) or not row["text"].strip() for row in rows):
        return False, "Dataset requires at least one non-empty text record."
    return True, f"{len(rows)} valid JSONL record(s)."


def _readiness_report(raw: object) -> dict:
    """Return JSON-safe host evidence; never creates directories or imports a model."""
    try:
        job = normalize_job(raw)
    except JobContractError as error:
        return {"state": "BLOCKED", "error": str(error)}
    packages, torch_module = _package_versions()
    model_path, dataset_path, output_path = (Path(job[name]) for name in ("modelPath", "datasetPath", "outputPath"))
    model_ready = model_path.is_dir() and (model_path / "config.json").is_file()
    dataset_ready, dataset_message = _dataset_ready(dataset_path)
    output_ready = output_path.is_dir() and os.access(output_path, os.W_OK)
    cuda = {"available": False, "devices": []}
    if torch_module is not None:
        try:
            cuda["available"] = bool(torch_module.cuda.is_available())
            if cuda["available"]:
                cuda["devices"] = [
                    {"name": torch_module.cuda.get_device_name(index), "memoryMiB": round(torch_module.cuda.get_device_properties(index).total_memory / 1048576)}
                    for index in range(torch_module.cuda.device_count())
                ]
        except (AttributeError, RuntimeError):
            cuda["error"] = "PyTorch CUDA inspection failed."
    issues = []
    if not all(item["ready"] for item in packages.values()): issues.append("Pinned training packages are missing or version-mismatched.")
    if not model_ready: issues.append("Model directory or config.json is missing.")
    if not dataset_ready: issues.append(dataset_message)
    if not output_ready: issues.append("Output directory is missing or not writable.")
    if job["device"] == "cuda" and not cuda["available"]: issues.append("CUDA was requested but is unavailable.")
    state = "READY" if not issues else "NEEDS SETUP"
    return {
        "state": state, "job": {name: job[name] for name in ("jobId", "method", "device", "epochs", "batchSize", "maxLength", "timeoutSeconds")},
        "host": {"os": platform.platform(), "python": sys.version.split()[0], "systemRamBytes": _system_ram_bytes(), "freeDiskBytes": shutil.disk_usage(output_path if output_path.exists() else output_path.parent).free},
        "packages": packages, "cuda": cuda,
        "inputs": {"model": {"path": str(model_path), "ready": model_ready}, "dataset": {"path": str(dataset_path), "ready": dataset_ready, "message": dataset_message}, "output": {"path": str(output_path), "writable": output_ready}},
        "issues": issues,
    }


def readiness_report(raw: object) -> dict:
    """Return readiness evidence without propagating an unreadable-host failure."""
    try:
        return _readiness_report(raw)
    except (OSError, RuntimeError, ValueError) as error:
        return {"state": "NOT VERIFIED", "error": f"Host readiness could not be collected: {error}"}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: readiness.py <job-config.json>")
    print(json.dumps(readiness_report(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))), indent=2))
