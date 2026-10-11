import importlib.util
import json
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("updates", Path(__file__).resolve().parents[1] / "updates.py")
updates = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(updates)


class Reply:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, *_):
        return self.payload


class Opener:
    def __init__(self, payload):
        self.payload = payload
        self.request = None
        self.timeout = None

    def open(self, request, timeout):
        self.request, self.timeout = request, timeout
        return Reply(self.payload)


class UpdateCheckTests(unittest.TestCase):
    def test_explicit_check_uses_only_official_release_and_asset(self):
        opener = Opener({
            "tag_name": "v0.1.2",
            "html_url": "https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/tag/v0.1.2",
            "assets": [{
                "name": "AI-Agents-Lab-Windows.zip",
                "browser_download_url": "https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v0.1.2/AI-Agents-Lab-Windows.zip",
            }],
        })
        result = updates.check_for_update("0.1.1", opener)
        self.assertEqual(opener.request.full_url, updates.LATEST_RELEASE_URL)
        self.assertEqual(opener.timeout, 8)
        self.assertTrue(result["available"])
        self.assertEqual(result["latestVersion"], "0.1.2")
        self.assertTrue(result["downloadUrl"].endswith("AI-Agents-Lab-Windows.zip"))

    def test_untrusted_release_link_is_rejected(self):
        opener = Opener({
            "tag_name": "v0.1.2",
            "html_url": "https://example.invalid/release",
            "assets": [],
        })
        with self.assertRaises(updates.UpdateCheckError):
            updates.check_for_update("0.1.1", opener)

    def test_same_or_older_release_never_offers_an_update(self):
        opener = Opener({
            "tag_name": "v0.1.1",
            "html_url": "https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/tag/v0.1.1",
            "assets": [],
        })
        self.assertFalse(updates.check_for_update("0.1.2", opener)["available"])


if __name__ == "__main__":
    unittest.main()
