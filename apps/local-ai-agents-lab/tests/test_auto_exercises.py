"""Inactive exercise engine contracts: no live content or agent inference."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from exercise_library import EXERCISES, select_exercise, format_exercise


class AutoExerciseCatalogTests(unittest.TestCase):
    def test_shipped_catalog_is_empty(self):
        self.assertEqual(EXERCISES, {})
        with self.assertRaisesRegex(ValueError, "No curated exercises"):
            select_exercise("training", 0)

    def test_selector_can_rotate_synthetic_fixtures_when_activated_in_future(self):
        fixtures = (
            {"id": "fixture-one", "title": "Synthetic A", "reference": "https://example.org/a",
             "source_type": "test only", "task": "Synthetic text only."},
            {"id": "fixture-two", "title": "Synthetic B", "reference": "https://example.org/b",
             "source_type": "test only", "task": "Synthetic text only."},
        )
        with patch.dict(EXERCISES, {"training": fixtures}):
            self.assertEqual(select_exercise("training", 0), fixtures[0])
            self.assertEqual(select_exercise("training", 1), fixtures[1])
            self.assertEqual(select_exercise("training", 2), fixtures[0])
            text = format_exercise(fixtures[0])
            self.assertIn("[AUTO EXERCISE: fixture-one]", text)
            self.assertIn("not downloaded", text)

    def test_selector_rejects_invalid_arguments_and_rooms(self):
        for value in (-1, "1", True):
            with self.subTest(value=value), self.assertRaises(ValueError):
                select_exercise("training", value)
        for room in ("conference", "evaluation", "advisory", "optimization", "unknown"):
            with self.subTest(room=room), self.assertRaises(ValueError):
                select_exercise(room, 0)

    def test_platform_badge_and_unavailable_status_colors(self):
        html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "static" / "style.css").read_text(encoding="utf-8")
        self.assertIn('<span class="platform-badge">EXPERIMENTAL PLATFORM</span>', html)
        self.assertNotIn('<span class="beta-badge">BETA</span>', html)
        self.assertIn('<span class="nav-status">Unavailable - Under Construction</span>', html)
        self.assertIn('.exercise-feature-heading .nav-status{', css)
        self.assertIn('border-color:#f2c230;border-radius:999px;background:#f2c230;color:#1d2c38;font-weight:800', css)

    def test_status_is_visible_but_auto_start_is_disabled(self):
        html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
        app = (ROOT / "static" / "app.js").read_text(encoding="utf-8")
        server = (ROOT / "server.py").read_text(encoding="utf-8")
        packager = (ROOT / "scripts" / "build-release.cjs").read_text(encoding="utf-8")
        css = (ROOT / "static" / "style.css").read_text(encoding="utf-8")
        self.assertIn('id="auto-exercise-feature"', html)
        self.assertIn("Unavailable - Under Construction", html)
        self.assertIn('id="prompt" rows="3" maxlength="2500" required', html)
        self.assertIn("$('auto-exercise-feature').hidden=room!=='training'", app)
        self.assertIn("$('prompt').required=true", app)
        self.assertIn("fetch('/api/run'", app)
        self.assertNotIn("fetch('/api/auto-run'", app)
        self.assertIn('self._json({"error": "Unavailable - Under Construction"}, 503)', server)
        self.assertIn("exercise-feature[hidden]", css)
        self.assertIn("'exercise_library.py'", packager)


if __name__ == "__main__":
    unittest.main()
