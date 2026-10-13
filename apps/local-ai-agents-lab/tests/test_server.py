"""Deterministic Local Lab server tests; Ollama is always mocked here."""
import importlib.util
import gc
import json
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path
from threading import Event, Thread
from unittest.mock import patch
from urllib.error import URLError

SPEC = importlib.util.spec_from_file_location("campus_server", Path(__file__).resolve().parents[1] / "server.py")
campus = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(campus)


class CampusTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_db = campus.DB_PATH
        campus.DB_PATH = Path(self.tmp.name) / "data" / "campus.sqlite3"
        campus.initialize()

    def tearDown(self):
        campus.DB_PATH = self.original_db
        gc.collect()
        time.sleep(.05)
        self.tmp.cleanup()

    def assignments(self):
        return {"Trainer": "trainer:1", "Student": "student:1", "Evaluator": "evaluator:1", "Improver": "improver:1"}

    def test_training_flow_has_four_named_roles(self):
        self.assertEqual(campus.FLOW["training"], ["Trainer", "Student", "Evaluator", "Improver"])
        self.assertTrue(all(role in campus.PROMPTS for role in campus.FLOW["training"]))

    def test_four_stage_cycle_is_strictly_serial_and_persists_every_result(self):
        session_id = campus.create_training_session("ollama", self.assignments())
        calls, unloads, active = [], [], [0]

        def answer(provider, model, role, transcript, language):
            self.assertEqual(active[0], 0, "inference requests overlapped")
            active[0] += 1
            calls.append((model, role, [item["agent"] for item in transcript]))
            active[0] -= 1
            return "Score: 87\nResult: Needs Improvement" if role == "Evaluator" else "Response " + role

        campus.RUN_LOCK.acquire()
        with patch.object(campus, "provider_chat", side_effect=answer), patch.object(campus.PROVIDERS, "unload", side_effect=lambda provider, model, opener: unloads.append(model)):
            campus.run_training_session(session_id, "Teach safe review", self.assignments(), Event())
        record = campus.training_session(session_id)
        self.assertEqual(record["status"], "completed")
        self.assertEqual([stage["status"] for stage in record["stages"]], ["Completed"] * 4)
        self.assertEqual([call[0] for call in calls], ["trainer:1", "student:1", "evaluator:1", "improver:1"])
        self.assertEqual(unloads, ["trainer:1", "student:1", "evaluator:1", "improver:1"])
        self.assertEqual(calls[1][2], ["You", "Trainer"])
        self.assertEqual(calls[3][2], ["You", "Trainer", "Student", "Evaluator"])
        self.assertEqual(record["stages"][2]["evaluation_score"], 87)
        self.assertEqual(record["stages"][2]["evaluation_result"], "Needs Improvement")
        self.assertEqual([message["agent"] for message in campus.history("training")], ["You", "Trainer", "Student", "Evaluator", "Improver"])

    def test_failed_stage_preserves_completed_responses_and_does_not_complete_session(self):
        session_id = campus.create_training_session("ollama", self.assignments())
        campus.RUN_LOCK.acquire()
        with patch.object(campus, "provider_chat", side_effect=["Lesson", campus.ProviderError("student failed")]), patch.object(campus.PROVIDERS, "unload"):
            campus.run_training_session(session_id, "Topic", self.assignments(), Event())
        record = campus.training_session(session_id)
        self.assertEqual(record["status"], "failed")
        self.assertEqual([stage["status"] for stage in record["stages"]], ["Completed", "Failed", "Cancelled", "Cancelled"])
        self.assertEqual([message["agent"] for message in campus.history("training")], ["You", "Trainer"])

    def test_cancelled_session_does_not_start_inference(self):
        session_id = campus.create_training_session("ollama", self.assignments())
        cancel = Event(); cancel.set(); campus.RUN_LOCK.acquire()
        with patch.object(campus, "provider_chat") as chat, patch.object(campus.PROVIDERS, "unload"):
            campus.run_training_session(session_id, "Topic", self.assignments(), cancel)
        self.assertFalse(chat.called)
        record = campus.training_session(session_id)
        self.assertEqual(record["status"], "cancelled")
        self.assertEqual([stage["status"] for stage in record["stages"]], ["Cancelled"] * 4)

    def test_initialize_migrates_legacy_session_and_message_rows(self):
        current_db = campus.DB_PATH
        campus.DB_PATH = Path(self.tmp.name) / "legacy" / "data" / "campus.sqlite3"
        campus.DB_PATH.parent.mkdir(parents=True)
        with campus.closing(sqlite3.connect(campus.DB_PATH)) as db, db:
            db.execute("CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, agent TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL)")
            db.execute("INSERT INTO messages(room,agent,content,created_at) VALUES(?,'Trainer','Old lesson','2026-01-01 UTC')", (campus.LEGACY_TRAINING_ROOM,))
            db.execute("CREATE TABLE training_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, trainer_model TEXT NOT NULL, student_model TEXT NOT NULL, created_at TEXT NOT NULL)")
        campus.initialize()
        self.assertEqual(campus.history("training")[0]["content"], "Old lesson")
        with campus.closing(campus.connect()) as db:
            columns = {row[1] for row in db.execute("PRAGMA table_info(training_sessions)")}
        self.assertTrue({"evaluator_model", "improver_model", "status"}.issubset(columns))
        campus.DB_PATH = current_db

    def test_ollama_unavailable_is_reported_without_fallback(self):
        with patch.object(campus.OPENER, "open", side_effect=URLError("offline")):
            self.assertFalse(campus.provider_status("ollama")["available"])


class HttpIntegrationTests(unittest.TestCase):
    def test_http_session_routes_four_models_and_publishes_stage_state(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_db, original_port = campus.DB_PATH, campus.PORT
        with tempfile.TemporaryDirectory() as temp:
            campus.DB_PATH = Path(temp) / "data" / "campus.sqlite3"; campus.initialize()
            server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
            thread = Thread(target=server.serve_forever, daemon=True); thread.start(); origin = f"http://127.0.0.1:{campus.PORT}"; opener = build_opener(ProxyHandler({}))
            try:
                with patch.object(campus, "local_models", return_value=["trainer:1", "student:1", "evaluator:1", "improver:1"]), patch.object(campus, "provider_chat", side_effect=lambda provider, model, role, transcript, language: "Score: 100\nResult: Pass" if role == "Evaluator" else role), patch.object(campus.PROVIDERS, "unload") as unload:
                    request = Request(origin+"/api/run", data=json.dumps({"room":"training","provider":"ollama","trainer_model":"trainer:1","student_model":"student:1","evaluator_model":"evaluator:1","improver_model":"improver:1","prompt":"Topic"}).encode(), headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
                    with opener.open(request) as response: started = json.load(response)
                    self.assertEqual(response.status, 202); self.assertIn("session_id", started)
                    for _ in range(40):
                        with opener.open(origin+"/api/training-sessions/"+str(started["session_id"])) as response: session = json.load(response)
                        if session["status"] == "completed": break
                        time.sleep(.05)
                    self.assertEqual(session["status"], "completed")
                    self.assertEqual([stage["assigned_model"] for stage in session["stages"]], ["trainer:1", "student:1", "evaluator:1", "improver:1"])
                    self.assertEqual(unload.call_count, 4)
            finally:
                server.shutdown(); server.server_close(); thread.join(timeout=4); campus.DB_PATH, campus.PORT = original_db, original_port


if __name__ == "__main__":
    unittest.main()
