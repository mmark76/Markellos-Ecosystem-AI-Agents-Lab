"""Offline automatic learning-catalog contracts; no Ollama or server import."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from exercise_library import EXERCISES, select_exercise, format_exercise


class AutoExerciseCatalogTests(unittest.TestCase):
    def test_catalog_has_training_exercises_only(self):
        self.assertEqual(set(EXERCISES), {"training"})
        all_ids = set()
        for room, options in EXERCISES.items():
            self.assertGreaterEqual(len(options), 2, room)
            for item in options:
                self.assertNotIn(item["id"], all_ids)
                all_ids.add(item["id"])
                self.assertTrue(item["reference"].startswith("https://"))
                prompt = format_exercise(item)
                self.assertTrue(prompt.startswith("[AUTO EXERCISE:"))
                self.assertIn("not downloaded", prompt)
                self.assertLessEqual(len(prompt), 1500)

    def test_selector_rotates_training_exercises(self):
        for room, options in EXERCISES.items():
            self.assertEqual(select_exercise(room, 0), options[0])
            self.assertEqual(select_exercise(room, 1), options[1])
            self.assertEqual(select_exercise(room, len(options)), options[0])

    def test_selector_rejects_invalid_arguments(self):
        for count in (-1, "1", True):
            with self.subTest(count=count), self.assertRaises(ValueError):
                select_exercise("training", count)
        for room in ("conference", "evaluation", "advisory", "optimization", "unknown"):
            with self.subTest(room=room), self.assertRaises(ValueError):
                select_exercise(room, 0)

    def test_static_ui_and_future_packaging_have_automatic_mode(self):
        html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
        app = (ROOT / "static" / "app.js").read_text(encoding="utf-8")
        server = (ROOT / "server.py").read_text(encoding="utf-8")
        packager = (ROOT / "scripts" / "build-release.cjs").read_text(encoding="utf-8")
        self.assertNotIn('id="prompt" rows="3" maxlength="2500" required', html)
        self.assertIn("/api/auto-run", app)
        self.assertIn("auto_exercise_for_room", server)
        self.assertIn("'exercise_library.py'", packager)


if __name__ == "__main__":
    unittest.main()
