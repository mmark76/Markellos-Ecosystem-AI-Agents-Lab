"""Offline automatic exercise-selection regressions; no real Ollama calls."""
import json
import sys
import tempfile
import time
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import exercise_library
import server as campus


class AutoExerciseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.original_db = campus.DB_PATH
        campus.DB_PATH = Path(self.temp.name) / "data" / "campus.sqlite3"
        campus.initialize()

    def tearDown(self):
        campus.DB_PATH = self.original_db
        self.temp.cleanup()

    def test_catalog_has_two_trusted_tasks_for_each_of_five_labs(self):
        self.assertEqual(set(exercise_library.EXERCISES), set(campus.LABS))
        ids = set()
        for room, options in exercise_library.EXERCISES.items():
            self.assertGreaterEqual(len(options), 2)
            for exercise in options:
                self.assertNotIn(exercise["id"], ids)
                ids.add(exercise["id"])
                self.assertTrue(exercise["reference"].startswith("https://"))
                prompt = exercise_library.format_exercise(exercise)
                self.assertTrue(prompt.startswith("[AUTO EXERCISE:"))
                self.assertLessEqual(len(prompt), 1500)
                self.assertIn("not downloaded", prompt)

    def test_local_selection_cycles_and_manual_topics_do_not_advance_count(self):
        first, first_text = campus.auto_exercise_for_room("training")
        campus.add_message("training", "You", "Manual custom topic")
        unchanged, _ = campus.auto_exercise_for_room("training")
        self.assertEqual(first, unchanged)
        campus.add_message("training", "You", first_text)
        second, second_text = campus.auto_exercise_for_room("training")
        self.assertNotEqual(first["id"], second["id"])
        campus.add_message("training", "You", second_text)
        again, _ = campus.auto_exercise_for_room("training")
        self.assertEqual(first["id"], again["id"])

    def test_invalid_auto_selector_counts_and_rooms_rejected(self):
        for invalid in (-1, "1", True):
            with self.subTest(value=invalid):
                with self.assertRaises(ValueError):
                    exercise_library.select_exercise("training", invalid)
        with self.assertRaises(ValueError):
            exercise_library.select_exercise("nonexistent", 0)

    def test_http_auto_mode_runs_existing_training_roles_and_keeps_manual_route(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler)
        original_port = campus.PORT
        campus.PORT = server.server_address[1]
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()
        origin = f"http://127.0.0.1:{campus.PORT}"
        opener = build_opener(ProxyHandler({}))
        assignments = {role: "test-local:1" for role in campus.FLOW["training"]}

        def post(path, body):
            request = Request(
                origin + path, data=json.dumps(body).encode("utf-8"),
                headers={"Origin": origin, "Content-Type": "application/json"}, method="POST")
            with opener.open(request, timeout=5) as response:
                return response.status, json.load(response)

        try:
            with (patch.object(campus, "local_models", return_value=["test-local:1"]),
                  patch.object(campus, "provider_chat", side_effect=lambda provider, model, room, role, transcript, language: role + " result"),
                  patch.object(campus.PROVIDERS, "unload")):
                status, result = post("/api/auto-run", {
                    "room": "training", "models": assignments, "provider": "ollama", "language": "en"})
                self.assertEqual(status, 202)
                self.assertEqual(result["autoExercise"]["id"], "train-evidence-01")
                for _ in range(80):
                    with opener.open(origin + "/api/training-sessions/" + str(result["session_id"])) as response:
                        session = json.load(response)
                    if session["status"] in ("completed", "failed", "cancelled"):
                        break
                    time.sleep(.05)
                self.assertEqual(session["status"], "completed")
                for _ in range(40):
                    if not campus.RUN_LOCK.locked():
                        break
                    time.sleep(.05)
                self.assertFalse(campus.RUN_LOCK.locked())
                self.assertEqual([s["agent_role"] for s in session["stages"]], list(campus.FLOW["training"]))
                self.assertEqual(campus.history("training")[0]["agent"], "You")
                self.assertIn("train-evidence-01", campus.history("training")[0]["content"])
                with self.assertRaises(HTTPError) as failure:
                    post("/api/auto-run", {
                        "room": "training", "models": assignments, "prompt": "No override permitted"})
                self.assertEqual(failure.exception.code, 400)
                status, manual = post("/api/run", {
                    "room": "conference", "provider": "ollama",
                    "models": {role: "test-local:1" for role in campus.FLOW["conference"]},
                    "prompt": "Existing manual flow is still supported"})
                self.assertEqual(status, 200)
                self.assertNotIn("autoExercise", manual)
        finally:
            server.shutdown()
            server.server_close()
            worker.join(timeout=5)
            campus.PORT = original_port

    def test_ui_supports_empty_topic_and_release_includes_selector(self):
        html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "static" / "app.js").read_text(encoding="utf-8")
        packager = (ROOT / "scripts" / "build-release.cjs").read_text(encoding="utf-8")
        self.assertNotIn('id="prompt" rows="3" maxlength="2500" required', html)
        self.assertIn("/api/auto-run", js)
        self.assertIn("'exercise_library.py'", packager)


if __name__ == "__main__":
    unittest.main()
