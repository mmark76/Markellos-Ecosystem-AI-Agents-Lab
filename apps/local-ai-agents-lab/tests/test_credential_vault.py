import importlib.util
import os
import tempfile
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location(
    "credential_vault", Path(__file__).resolve().parents[1] / "credential_vault.py"
)
credential_vault = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(credential_vault)


class FakeProtector:
    def protect(self, value):
        return b"encrypted:" + value[::-1]

    def unprotect(self, value):
        if not value.startswith(b"encrypted:"):
            raise credential_vault.CredentialVaultError("invalid test blob")
        return value[len(b"encrypted:"):][::-1]


class CredentialVaultTests(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Windows DPAPI is a Windows-only integration")
    def test_windows_dpapi_round_trip_uses_an_opaque_blob(self):
        value = b"synthetic-dpapi-regression-value"
        protector = credential_vault.WindowsDpapi()
        protected = protector.protect(value)
        self.assertNotEqual(protected, value)
        self.assertEqual(protector.unprotect(protected), value)

    def test_store_load_status_and_remove_never_leave_plaintext_on_disk(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "credentials"
            vault = credential_vault.CredentialVault(root, FakeProtector())
            token = "runpod-test-token-1234567890"
            self.assertFalse(vault.status("runpod")["stored"])
            vault.store("runpod", token)
            stored_file = root / "runpod.token.dpapi"
            self.assertTrue(vault.status("runpod")["stored"])
            self.assertNotIn(token.encode("utf-8"), stored_file.read_bytes())
            self.assertEqual(vault.load("runpod"), token)
            self.assertTrue(vault.remove("runpod"))
            self.assertFalse(vault.status("runpod")["stored"])
            self.assertFalse(vault.remove("runpod"))

    def test_unknown_provider_cannot_control_a_vault_path(self):
        with tempfile.TemporaryDirectory() as temporary:
            vault = credential_vault.CredentialVault(Path(temporary), FakeProtector())
            with self.assertRaisesRegex(credential_vault.CredentialVaultError, "Unsupported"):
                vault.status("../../outside")


if __name__ == "__main__":
    unittest.main()
