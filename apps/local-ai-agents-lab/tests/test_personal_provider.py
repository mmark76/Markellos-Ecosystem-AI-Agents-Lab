import importlib.util
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location(
    "personal_provider", Path(__file__).resolve().parents[1] / "personal_provider.py"
)
personal_provider = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(personal_provider)


class PersonalProviderPlanTests(unittest.TestCase):
    def valid(self):
        return {
            "provider": "runpod", "region": "europe", "maxBudgetUsd": 5,
            "maxRuntimeMinutes": 60, "confirmOwnAccount": True, "confirmDataTransfer": True,
        }

    def test_plan_is_user_billed_but_never_connects_or_executes(self):
        plan = personal_provider.build_provider_plan(self.valid())
        self.assertEqual(plan["state"], "PLAN_REVIEWED")
        self.assertEqual(plan["provider"]["id"], "runpod")
        self.assertIn("your own account", plan["billing"])
        self.assertIn("No credential", plan["credentials"])
        self.assertIn("No provider connection", plan["execution"])

    def test_plan_rejects_credentials_unknown_fields_and_unconfirmed_cost(self):
        with self.assertRaisesRegex(personal_provider.PersonalProviderPlanError, "unsupported fields"):
            personal_provider.build_provider_plan({**self.valid(), "apiKey": "not-accepted"})
        invalid = self.valid(); invalid["confirmOwnAccount"] = False
        with self.assertRaisesRegex(personal_provider.PersonalProviderPlanError, "charges"):
            personal_provider.build_provider_plan(invalid)

    def test_plan_rejects_unsafe_limits_and_unknown_provider(self):
        invalid = self.valid(); invalid["maxBudgetUsd"] = 101
        with self.assertRaisesRegex(personal_provider.PersonalProviderPlanError, r"from \$1 to \$100"):
            personal_provider.build_provider_plan(invalid)
        invalid = self.valid(); invalid["provider"] = "https://example.invalid"
        with self.assertRaisesRegex(personal_provider.PersonalProviderPlanError, "supported personal provider"):
            personal_provider.build_provider_plan(invalid)

    def test_options_describe_the_separate_local_credential_vault(self):
        self.assertEqual(personal_provider.provider_options()["credentials"], "optional-local-vault")
        self.assertEqual(personal_provider.provider_options()["execution"], "connection-ready")

    def test_credential_requests_require_exact_fields_and_never_echo_a_token(self):
        request = {
            "provider": "runpod", "apiKey": "runpod-test-token-1234567890",
            "confirmOwnAccount": True, "confirmCredentialStorage": True,
        }
        validated = personal_provider.credential_store_request(request)
        self.assertEqual(validated["provider"], "runpod")
        self.assertEqual(validated["apiKey"], request["apiKey"])
        with self.assertRaisesRegex(personal_provider.PersonalProviderCredentialError, "unsupported fields"):
            personal_provider.credential_store_request({**request, "endpoint": "https://example.invalid"})
        with self.assertRaisesRegex(personal_provider.PersonalProviderCredentialError, "spaces"):
            personal_provider.credential_store_request({**request, "apiKey": "token with a space 123456"})

    def test_credential_removal_requires_explicit_confirmation(self):
        with self.assertRaisesRegex(personal_provider.PersonalProviderCredentialError, "Confirm removal"):
            personal_provider.credential_removal_request({"provider": "runpod", "confirmCredentialRemoval": False})
        self.assertEqual(personal_provider.credential_removal_request({"provider": "runpod", "confirmCredentialRemoval": True}), "runpod")

    def test_connection_check_requires_an_explicit_read_only_confirmation(self):
        with self.assertRaisesRegex(personal_provider.PersonalProviderConnectionError, "Confirm the read-only"):
            personal_provider.connection_check_request({"provider": "runpod", "confirmReadOnlyConnection": False})
        self.assertEqual(personal_provider.connection_check_request({"provider": "runpod", "confirmReadOnlyConnection": True}), "runpod")


if __name__ == "__main__":
    unittest.main()
