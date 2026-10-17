import importlib.util
import json
import sys
import unittest
from pathlib import Path
from urllib.error import HTTPError


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
VAULT_SPEC = importlib.util.spec_from_file_location("credential_vault", ROOT / "credential_vault.py")
credential_vault = importlib.util.module_from_spec(VAULT_SPEC)
VAULT_SPEC.loader.exec_module(credential_vault)

MODULE_SPEC = importlib.util.spec_from_file_location("runpod_readonly", ROOT / "runpod_readonly.py")
runpod_readonly = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(runpod_readonly)


class FakeVault:
    def load(self, provider):
        if provider != "runpod":
            raise credential_vault.CredentialVaultError("unsupported")
        return "runpod-test-token-1234567890"


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def read(self, _limit):
        return self.payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class FakeOpener:
    def __init__(self, response):
        self.response = response
        self.request = None

    def open(self, request, timeout):
        self.request = request
        self.timeout = timeout
        if isinstance(self.response, BaseException):
            raise self.response
        return FakeResponse(self.response)


class RunpodReadOnlyTests(unittest.TestCase):
    def response(self):
        return {"data": {"myself": {"id": "account-123"}, "gpuTypes": [{
            "id": "NVIDIA A40", "displayName": "A40", "memoryInGb": 48,
            "lowestPrice": {"stockStatus": "High", "uninterruptablePrice": 0.59},
        }]}}

    def test_check_uses_fixed_https_bearer_request_and_returns_only_safe_catalog_fields(self):
        opener = FakeOpener(self.response())
        result = runpod_readonly.RunpodReadOnlyService(FakeVault(), opener).check("runpod")
        self.assertEqual(opener.request.full_url, "https://api.runpod.io/graphql")
        self.assertEqual(opener.request.get_header("Authorization"), "Bearer runpod-test-token-1234567890")
        self.assertNotIn("runpod-test-token-1234567890", opener.request.full_url)
        self.assertIn(b"LocalLabReadOnlyConnection", opener.request.data)
        self.assertEqual(result["state"], "READ_ONLY_CONNECTED")
        self.assertEqual(result["account"], "authenticated")
        self.assertEqual(result["gpus"], [{"id": "NVIDIA A40", "name": "A40", "memoryGb": 48,
                                           "availability": "High", "hourlyPriceUsd": 0.59}])
        self.assertNotIn("account-123", json.dumps(result))

    def test_check_rejects_provider_errors_without_exposing_the_token(self):
        error = HTTPError("https://api.runpod.io/graphql", 401, "unauthorized", None, None)
        service = runpod_readonly.RunpodReadOnlyService(FakeVault(), FakeOpener(error))
        with self.assertRaisesRegex(runpod_readonly.RunpodReadOnlyError, "did not accept") as captured:
            service.check("runpod")
        self.assertNotIn("runpod-test-token", str(captured.exception))
        error.close()

    def test_default_client_disables_redirects_before_a_token_is_used(self):
        service = runpod_readonly.RunpodReadOnlyService(FakeVault())
        self.assertTrue(any(isinstance(handler, runpod_readonly._NoRedirectHandler)
                            for handler in service._opener.handlers))

    def test_check_rejects_mutable_or_malformed_provider_responses(self):
        malformed = {"data": {"myself": {"id": "account-123"}, "gpuTypes": "not-a-list"}}
        service = runpod_readonly.RunpodReadOnlyService(FakeVault(), FakeOpener(malformed))
        with self.assertRaisesRegex(runpod_readonly.RunpodReadOnlyError, "invalid GPU catalog"):
            service.check("runpod")


if __name__ == "__main__":
    unittest.main()
