"""Regression coverage for fixed-loopback provider timing behavior."""
import importlib.util
import json
import time
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location("providers", Path(__file__).resolve().parents[1] / "providers.py")
providers = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(providers)


class Reply:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, *_):
        return json.dumps(self.payload).encode()


class SlowLocalOpener:
    def __init__(self):
        self.calls = []

    def open(self, request, *args, **kwargs):
        self.calls.append((request.full_url, args, kwargs))
        if request.full_url.endswith('/api/tags'):
            return Reply({'models': [{'name': 'gpt-oss:20b'}]})
        time.sleep(.03)  # A mock long-running local inference, without a real wait.
        return Reply({'message': {'content': 'Local response'}})


class ProviderTimingTests(unittest.TestCase):
    def test_chat_has_no_application_read_timeout_while_discovery_remains_bounded(self):
        opener = SlowLocalOpener()
        answer = providers.InferenceProviders().chat('ollama', 'gpt-oss:20b', [], opener)
        self.assertEqual(answer, 'Local response')
        tags_calls = [call for call in opener.calls if call[0].endswith('/api/tags')]
        chat_calls = [call for call in opener.calls if call[0].endswith('/api/chat')]
        self.assertEqual(tags_calls[0][2]['timeout'], 4)
        self.assertEqual(chat_calls[0][1], ())
        self.assertEqual(chat_calls[0][2], {})


if __name__ == '__main__':
    unittest.main()
