"""Offline contract tests for the fixed-loopback Ollama adapter."""
import importlib.util
import json
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("providers", Path(__file__).resolve().parents[1] / "providers.py")
providers = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(providers)


class Reply:
    def __init__(self, data): self.data = data
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, *_): return json.dumps(self.data).encode()


class Opener:
    def __init__(self, replies): self.replies = list(replies); self.calls = []
    def open(self, request, **kwargs):
        self.calls.append((request, kwargs))
        return Reply(self.replies.pop(0))


class ProviderTests(unittest.TestCase):
    def test_chat_has_no_application_inference_timeout(self):
        opener = Opener([{"models":[{"name":"model:1"}]}, {"message":{"content":"answer"}}])
        self.assertEqual(providers.InferenceProviders().chat("ollama", "model:1", [{"role":"user","content":"test"}], opener), "answer")
        self.assertNotIn("timeout", opener.calls[1][1])

    def test_unload_uses_ollama_keep_alive_zero(self):
        opener = Opener([{}])
        providers.InferenceProviders().unload("ollama", "model:1", opener)
        request, kwargs = opener.calls[0]
        self.assertTrue(request.full_url.endswith("/api/generate"))
        self.assertEqual(json.loads(request.data), {"model":"model:1","prompt":"","stream":False,"keep_alive":0})
        self.assertEqual(kwargs["timeout"], 4)


if __name__ == "__main__":
    unittest.main()
