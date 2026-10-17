import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from urllib.error import HTTPError
from io import BytesIO
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
    def status(self, provider): return {"provider": provider, "stored": provider in self.values}


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
            self.assertEqual(query["resource"], [module.RESOURCE])
            self.assertTrue(query["ext_agent_host_id"][0].startswith("urn:uuid:"))
            self.assertNotIn("access_token", opened[0])

    def test_completion_protects_record_and_status_never_returns_secrets(self):
        with tempfile.TemporaryDirectory() as temporary:
            opened = []
            service = self.make_service(Path(temporary), opened)
            exchanged = []
            service._token_exchange = lambda form: exchanged.append(form) or {"id_token": "identity", "refresh_token": "refresh", "access_token": "access", "scope": "openid chatgpt.tokens.use.direct"}
            service._require_crypto = lambda: None
            service.start(8765)
            attempt = service._attempt.copy()
            status = service.complete({"state": attempt["state"], "code": "authorization-code", "client_id": "oaiapp_example"})
            self.assertTrue(status["connected"])
            self.assertTrue(status["planUsageAuthorized"])
            self.assertNotIn("accessToken", status)
            self.assertNotIn("refreshToken", status)
            self.assertEqual(exchanged[0]["resource"], module.RESOURCE)
            self.assertEqual(service.remove()["state"], "REMOVED_LOCALLY")
            self.assertFalse(service.remove()["removed"])
            self.assertFalse(service.status()["connected"])
            self.assertFalse((Path(temporary) / "data" / "openai-chatgpt-registration.json").exists())
            self.assertFalse((Path(temporary) / "data" / "openai-chatgpt-host.json").exists())

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

    def test_missing_and_corrupted_credentials_have_safe_distinct_states(self):
        with tempfile.TemporaryDirectory() as temporary:
            vault = FakeVault()
            service = module.OpenAIConnectionService(vault, Path(temporary))
            self.assertEqual(service.status()["connectionState"], "disconnected")
            vault.values["openai-chatgpt"] = "not-json"
            state = service.status()
            self.assertEqual(state["connectionState"], "unreadable")
            self.assertTrue(state["removalAvailable"])
            self.assertFalse(state["connected"])

    def test_automatic_model_selection_and_question_use_only_saved_access_token(self):
        class FakeResponse:
            def __init__(self, body=None, lines=()): self._body, self._lines = body, lines
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self): return self._body
            def __iter__(self): return iter(self._lines)

        class FakeOpener:
            def __init__(self): self.requests = []
            def open(self, request, timeout):
                self.requests.append(request)
                if request.full_url.endswith("/models"):
                    return FakeResponse(b'{"models":[{"visibility":"list","slug":"model-a","display_name":"Model A"},{"visibility":"hidden","slug":"hidden","display_name":"Hidden"}]}')
                return FakeResponse(lines=[b'data: {"type":"response.created"}\n', b'data: {"type":"response.in_progress"}\n', b'data: {"type":"response.output_text.delta","delta":"Reviewed"}\n', b'data: {"type":"response.completed"}\n'])

        with tempfile.TemporaryDirectory() as temporary:
            opened, opener = [], FakeOpener()
            service = self.make_service(Path(temporary), opened)
            exchanged = []
            def exchange(form):
                exchanged.append(form)
                if form["grant_type"] == "refresh_token":
                    return {"access_token": "renewed-access", "refresh_token": "renewed-refresh", "expires_in": 3600}
                return {"id_token": "identity", "refresh_token": "refresh", "access_token": "access", "scope": "openid chatgpt.tokens.use.direct", "expires_in": 0}
            service._token_exchange = exchange
            service._require_crypto = lambda: None
            service.start(8765)
            attempt = service._attempt.copy()
            service.complete({"state": attempt["state"], "code": "authorization-code", "client_id": "oaiapp_example"})
            original = module.build_opener
            module.build_opener = lambda *args: opener
            try:
                self.assertEqual(service.ask_advisor(question="Review this")["answer"], "Reviewed")
            finally:
                module.build_opener = original
            self.assertEqual(len(opener.requests), 2)
            self.assertTrue(all(request.get_header("Authorization") == "Bearer renewed-access" for request in opener.requests))
            self.assertIn(b'"store": false', opener.requests[1].data)
            self.assertIn(b'Review this', opener.requests[1].data)
            self.assertNotIn(b'only this text', opener.requests[1].data)
            self.assertEqual(exchanged[-1], {"grant_type": "refresh_token", "client_id": "oaiapp_example", "refresh_token": "refresh", "resource": module.RESOURCE})

    def test_stream_failure_and_incomplete_response_are_not_reported_as_success(self):
        class FakeResponse:
            def __init__(self, lines): self._lines = lines
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def __iter__(self): return iter(self._lines)

        class FakeOpener:
            def __init__(self, lines): self.lines = lines
            def open(self, request, timeout):
                if request.full_url.endswith("/models"):
                    return type("Catalog", (), {"__enter__": lambda self: self, "__exit__": lambda self, *args: False,
                                                   "read": lambda self: b'{"models":[{"visibility":"list","slug":"model-a","display_name":"Model A"}]}'})()
                return FakeResponse(self.lines)

        with tempfile.TemporaryDirectory() as temporary:
            for lines, message in (
                ([b'data: {"type":"response.failed","response":{"error":{"code":"subscription_sharing_usage_limit_exceeded"}}}\n'], "temporarily unavailable"),
                ([b'data: {"type":"response.incomplete"}\n'], "incomplete"),
                ([b'data: {"type":"response.output_text.delta","delta":"partial"}\n'], "ended before completion"),
            ):
                with self.subTest(message=message):
                    service = self.make_service(Path(temporary), [])
                    service._vault.store("openai-chatgpt", json.dumps({"subject":"local-user","clientId":"oaiapp_example","refreshToken":"refresh","accessToken":"access","accessTokenExpiresAt":9999999999,"planUsageAuthorized":True}))
                    original = module.build_opener
                    module.build_opener = lambda *args: FakeOpener(lines)
                    try:
                        with self.assertRaisesRegex(module.OpenAIConnectionError, message):
                            service.ask_advisor(question="Question")
                    finally:
                        module.build_opener = original

    def test_http_errors_are_classified_without_returning_provider_body(self):
        error = HTTPError("https://api.openai.com/v1/responses", 401, "unauthorized", {}, BytesIO(b'{"detail":"sensitive provider detail"}'))
        message = module.OpenAIConnectionService._http_failure(error)
        self.assertIn("did not accept", str(message))
        self.assertNotIn("sensitive", str(message))

    def test_refresh_failure_is_actionable_and_failed_removal_is_not_hidden(self):
        class FailingVault(FakeVault):
            def remove(self, provider):
                raise module.CredentialVaultError("cannot remove")

        with tempfile.TemporaryDirectory() as temporary:
            vault = FailingVault()
            service = module.OpenAIConnectionService(vault, Path(temporary), token_exchange=lambda _form: {})
            vault.store("openai-chatgpt", json.dumps({"subject":"local-user","clientId":"oaiapp_example","refreshToken":"refresh","accessToken":"","accessTokenExpiresAt":0,"planUsageAuthorized":True}))
            with self.assertRaisesRegex(module.OpenAIConnectionError, "renewed connection token"):
                service._access_token(service._connection_record())
            with self.assertRaisesRegex(module.OpenAIConnectionError, "could not be removed"):
                service.remove()


if __name__ == "__main__":
    unittest.main()
