"""Explicit local Ollama model downloads; no browser-supplied endpoint or command."""
from __future__ import annotations

import json
import re
from threading import Lock, Thread
from urllib.error import HTTPError, URLError
from urllib.request import Request


class ModelInstallError(ValueError):
    """A model download request cannot be started."""


class ModelInstallBusy(ModelInstallError):
    """A different model download is already underway."""


class OllamaModelInstaller:
    """One opt-in Ollama pull at a time, using only a fixed loopback API."""

    PULL_URL = "http://127.0.0.1:11434/api/pull"
    MODEL_ID = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.-]*(?:/[a-zA-Z0-9][a-zA-Z0-9_.-]*){0,2}(?::[a-zA-Z0-9][a-zA-Z0-9_.-]*)?\Z", re.ASCII)

    def __init__(self, opener):
        self.opener = opener
        self._lock = Lock()
        self._job = {"state": "idle", "model": "", "status": "", "completed": 0,
                     "total": 0, "percent": None, "error": ""}
        self._thread = None

    @classmethod
    def validate_model(cls, model):
        if not isinstance(model, str) or not 1 <= len(model) <= 96 or not cls.MODEL_ID.fullmatch(model):
            raise ModelInstallError("Enter a valid Ollama model name, e.g. gemma3:4b.")
        if "cloud" in model.lower():
            raise ModelInstallError("Cloud-hosted models are not supported by this local Lab.")
        return model

    def status(self):
        with self._lock:
            return self._job.copy()

    def start(self, model):
        model = self.validate_model(model)
        with self._lock:
            if self._job["state"] == "running":
                raise ModelInstallBusy("Another model is downloading. Wait until it finishes.")
            self._job = {"state": "running", "model": model, "status": "Connecting to local Ollama...",
                         "completed": 0, "total": 0, "percent": None, "error": ""}
            self._thread = Thread(target=self._run, args=(model,), name="ollama-model-pull", daemon=True)
            self._thread.start()
            return self._job.copy()

    def _update(self, **values):
        with self._lock:
            self._job.update(values)

    def _run(self, model):
        request = Request(self.PULL_URL, data=json.dumps({"model": model, "stream": True}).encode("utf-8"),
                          headers={"Content-Type": "application/json"}, method="POST")
        success = False
        try:
            with self.opener.open(request, timeout=120) as response:
                while True:
                    line = response.readline(16385)
                    if not line:
                        break
                    if len(line) > 16384:
                        raise ModelInstallError("Ollama returned an oversized progress response.")
                    entry = json.loads(line)
                    if not isinstance(entry, dict):
                        raise ModelInstallError("Ollama returned an invalid progress response.")
                    if entry.get("error"):
                        raise ModelInstallError(str(entry["error"])[:200])
                    status = entry.get("status", "")
                    if not isinstance(status, str):
                        raise ModelInstallError("Ollama returned an invalid status.")
                    completed, total = entry.get("completed", 0), entry.get("total", 0)
                    if type(completed) is not int or type(total) is not int:
                        raise ModelInstallError("Ollama returned invalid progress counts.")
                    completed, total = max(0, completed), max(0, total)
                    percent = min(100, (100 * completed) // total) if total else None
                    if status == "success":
                        success = True
                    self._update(status=status[:160], completed=completed, total=total, percent=percent)
            if not success:
                raise ModelInstallError("Ollama closed the download before reporting success.")
            self._update(state="completed", status="Model installed. Refreshing models.", percent=100, error="")
        except (HTTPError, URLError, OSError, TimeoutError, ValueError, TypeError, UnicodeDecodeError) as error:
            self._update(state="failed", status="Model download failed.",
                         error=str(error)[:200] or "Check Ollama, network, and disk space.")
