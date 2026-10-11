"""Offline, deterministic tests for the opt-in Ollama model installer."""
import importlib.util
import io
import json
import unittest
from pathlib import Path
from threading import Event
from unittest.mock import Mock

SOURCE = Path(__file__).resolve().parents[1] / 'model_install.py'
SPEC = importlib.util.spec_from_file_location('model_install', SOURCE)
installer_module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer_module)


class FakeReply:
    def __init__(self, entries):
        self.stream = io.BytesIO(b''.join(json.dumps(row).encode() + b'\n' for row in entries))
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def readline(self, limit): return self.stream.readline(limit)


class OllamaModelInstallTests(unittest.TestCase):
    def test_accepts_names_but_rejects_urls_paths_and_cloud(self):
        check = installer_module.OllamaModelInstaller.validate_model
        for valid in ('gemma3:4b', 'llama3.2', 'library/gemma3:latest', 'my-org/model:7b'):
            self.assertEqual(check(valid), valid)
        for invalid in ('', ' ', 'https://evil.example/a', '../model', 'a\\b', 'x;rm', 'x:cloud',
                        'name:tag?query=1', 'x'*97, {}, 'model\nname'):
            with self.subTest(invalid=invalid), self.assertRaises(installer_module.ModelInstallError):
                check(invalid)

    def test_pull_is_only_local_and_progress_completes(self):
        opener = Mock()
        opener.open.return_value = FakeReply([
            {'status': 'pulling manifest'},
            {'status': 'downloading', 'completed': 50, 'total': 100},
            {'status': 'success'}
        ])
        service = installer_module.OllamaModelInstaller(opener)
        self.assertEqual(service.start('gemma3:4b')['model'], 'gemma3:4b')
        service._thread.join(timeout=3)
        result = service.status()
        self.assertEqual(result['state'], 'completed')
        self.assertEqual(result['percent'], 100)
        self.assertEqual(opener.open.call_args.args[0].full_url, 'http://127.0.0.1:11434/api/pull')
        self.assertEqual(json.loads(opener.open.call_args.args[0].data), {'model': 'gemma3:4b', 'stream': True})

    def test_rejects_simultaneous_install(self):
        entered, release = Event(), Event()
        class PausedReply(FakeReply):
            def __enter__(self):
                entered.set()
                release.wait(2)
                return self
        opener = Mock()
        opener.open.return_value = PausedReply([{'status': 'success'}])
        service = installer_module.OllamaModelInstaller(opener)
        try:
            service.start('gemma3:4b')
            self.assertTrue(entered.wait(2))
            with self.assertRaises(installer_module.ModelInstallBusy):
                service.start('llama3.2')
        finally:
            release.set()
            service._thread.join(timeout=3)

    def test_missing_success_or_provider_error_fails(self):
        for entry in ([{'status': 'pulling manifest'}], [{'error': 'Not found'}]):
            with self.subTest(entry=entry):
                opener = Mock()
                opener.open.return_value = FakeReply(entry)
                service = installer_module.OllamaModelInstaller(opener)
                service.start('gemma3:4b')
                service._thread.join(timeout=3)
                self.assertEqual(service.status()['state'], 'failed')
                self.assertTrue(service.status()['error'])


if __name__ == '__main__':
    unittest.main()
