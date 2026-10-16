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


if __name__ == "__main__":
    unittest.main()
