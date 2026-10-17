import importlib.util
import tempfile
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("openai_connection", ROOT / "openai_connection.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class FakeVault:
    def __init__(self): self.values = {}
    def load(self, provider): return self.values.get(provider)
    def store(self, provider, value): self.values[provider] = value
    def remove(self, provider): return self.values.pop(provider, None) is not None


class OpenAIConnectionTests(unittest.TestCase):
    def make_service(self, root, opened):
        return module.OpenAIConnectionService(
            FakeVault(), root, browser_open=lambda url: opened.append(url) or True,
            token_exchange=lambda form: {"id_token": "identity", "refresh_token": "refresh", "access_token": "access", "scope": "openid chatgpt.tokens.use.direct"},
            identity_validator=lambda token, client_id, nonce: {"sub": "local-user", "nonce": nonce},
        )

    def test_starts_dynamic_registration_with_pkce_and_never_exposes_tokens(self):
        with tempfile.TemporaryDirectory() as temporary:
            opened = []
            service = self.make_service(Path(temporary), opened)
            service._require_crypto = lambda: None
            result = service.start(8765)
            query = parse_qs(urlsplit(opened[0]).query)
            self.assertEqual(result["state"], "AUTHORIZATION_STARTED")
            self.assertEqual(query["client_id"], [module.DYNAMIC_CLIENT_ID])
            self.assertEqual(query["code_challenge_method"], ["S256"])
            self.assertEqual(query["redirect_uri"], ["http://127.0.0.1:8765/auth/callback"])
            self.assertNotIn("access_token", opened[0])

    def test_completion_protects_record_and_status_never_returns_secrets(self):
        with tempfile.TemporaryDirectory() as temporary:
            opened = []
            service = self.make_service(Path(temporary), opened)
            service._require_crypto = lambda: None
            service.start(8765)
            attempt = service._attempt.copy()
            status = service.complete({"state": attempt["state"], "code": "authorization-code", "client_id": "oaiapp_example"})
            self.assertTrue(status["connected"])
            self.assertTrue(status["planUsageAuthorized"])
            self.assertNotIn("accessToken", status)
            self.assertNotIn("refreshToken", status)
            self.assertEqual(service.remove()["state"], "REMOVED_LOCALLY")
            self.assertFalse(service.status()["connected"])

    def test_rejects_wrong_state_before_token_exchange(self):
        with tempfile.TemporaryDirectory() as temporary:
            opened, called = [], []
            service = self.make_service(Path(temporary), opened)
            service._require_crypto = lambda: None
            service._token_exchange = lambda form: called.append(form) or {}
            service.start(8765)
            with self.assertRaisesRegex(module.OpenAIConnectionError, "state"):
                service.complete({"state": "wrong", "code": "authorization-code", "client_id": "oaiapp_example"})
            self.assertEqual(called, [])


if __name__ == "__main__":
    unittest.main()
