"""HTTP integration contract for the additive, loopback-only Evaluation Lab."""
import importlib.util
import json
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from threading import Thread
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, ProxyHandler, build_opener
from http.server import ThreadingHTTPServer

APP_ROOT = Path(__file__).resolve().parents[1]
if str(APP_ROOT) in sys.path:
    sys.path.remove(str(APP_ROOT))
sys.path.insert(0, str(APP_ROOT))
# unittest discovery may preload tests/evaluation_lab as the top-level package;
# keep the installed application package distinct from that test-discovery alias.
loaded = sys.modules.get("evaluation_lab")
if loaded is not None and Path(getattr(loaded, "__file__", "") or "").resolve() != (APP_ROOT / "evaluation_lab" / "__init__.py").resolve():
    sys.modules.pop("evaluation_lab")
SPEC = importlib.util.spec_from_file_location("evaluation_http_test_server", APP_ROOT / "server.py")
server_module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(server_module)


class EvaluationHTTPTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.previous_db = server_module.DB_PATH
        self.previous_port = server_module.PORT
        server_module.DB_PATH = Path(self.temporary.name) / "campus.sqlite3"
        server_module.initialize()
        with closing(sqlite3.connect(server_module.DB_PATH)) as db, db:
            db.execute(
                "INSERT INTO training_sessions(provider,trainer_model,student_model,evaluator_model,improver_model,"
                "created_at,status) VALUES('ollama','t:1','s:1','e:1','i:1','now','completed')"
            )
            self.session_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            db.execute(
                "INSERT INTO messages(room,agent,content,created_at,session_id) VALUES('training','You','Prompt','now',?)",
                (self.session_id,),
            )
            for n, role in enumerate(("Trainer", "Student", "Evaluator", "Improver"), 1):
                db.execute(
                    "INSERT INTO training_stages(session_id,agent_role,assigned_model,execution_order,status,response)"
                    " VALUES(?,?,?,?,?,?)",
                    (self.session_id, role, role.lower() + ":1", n, "Completed", "Output " + role),
                )
        self.http = ThreadingHTTPServer(("127.0.0.1", 0), server_module.Handler)
        server_module.PORT = self.http.server_address[1]
        self.origin = f"http://127.0.0.1:{server_module.PORT}"
        self.client = build_opener(ProxyHandler({}))
        self.thread = Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.thread.join(timeout=3)
        server_module.DB_PATH = self.previous_db
        server_module.PORT = self.previous_port
        self.temporary.cleanup()

    def get(self, path):
        with self.client.open(self.origin + path) as response:
            return response.status, json.load(response)

    def post(self, body, *, origin=None):
        request = Request(
            self.origin + "/api/evaluation/runs",
            data=json.dumps(body).encode(),
            method="POST",
            headers={"Origin": origin if origin is not None else self.origin, "Content-Type": "application/json"},
        )
        with self.client.open(request) as response:
            return response.status, json.load(response)

    def request_body(self):
        return {"source_training_session_id": self.session_id, "evaluator_model": "eval:1",
                "criteria": ["Faithfulness", "Completeness"]}

    def test_completed_sessions_and_empty_runs_are_read_only(self):
        code, data = self.get("/api/evaluation/sessions")
        self.assertEqual(code, 200)
        self.assertEqual(data["sessions"][0]["id"], self.session_id)
        self.assertEqual(self.get("/api/evaluation/runs")[1]["runs"], [])

    def test_session_listing_excludes_completed_but_invalid_sources(self):
        with closing(sqlite3.connect(server_module.DB_PATH)) as db, db:
            db.execute(
                "INSERT INTO training_sessions(provider,trainer_model,student_model,created_at,status) "
                "VALUES('ollama','t:1','s:1','now','completed')"
            )
            missing_request = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            db.execute(
                "INSERT INTO training_sessions(provider,trainer_model,student_model,created_at,status) "
                "VALUES('ollama','t:1','s:1','now','completed')"
            )
            incomplete = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            db.execute(
                "INSERT INTO messages(room,agent,content,created_at,session_id) "
                "VALUES('training','You','Test','now',?)", (incomplete,)
            )
            db.execute(
                "INSERT INTO training_stages(session_id,agent_role,assigned_model,execution_order,status,response) "
                "VALUES(?,'Trainer','t:1',1,'Running',NULL)", (incomplete,)
            )
        _, listed = self.get("/api/evaluation/sessions")
        self.assertEqual([item["id"] for item in listed["sessions"]], [self.session_id])
        with patch.object(server_module, "local_models", return_value=["eval:1"]):
            for invalid_id in (missing_request, incomplete):
                body = self.request_body()
                body["source_training_session_id"] = invalid_id
                with self.subTest(session_id=invalid_id), self.assertRaises(HTTPError) as response:
                    self.post(body)
                self.assertEqual(response.exception.code, 400)
        with closing(sqlite3.connect(server_module.DB_PATH)) as db:
            self.assertEqual(
                db.execute("SELECT count(*) FROM training_sessions WHERE status='completed'").fetchone()[0], 3
            )
            self.assertEqual(db.execute("SELECT count(*) FROM evaluation_lab_runs").fetchone()[0], 0)

    def test_invalid_requests_and_cross_origin_writes_are_rejected(self):
        with self.assertRaises(HTTPError) as error:
            self.post(self.request_body(), origin="http://evil.invalid")
        self.assertEqual(error.exception.code, 403)
        invalid = self.request_body()
        invalid["criteria"] = ["Duplicate", "Duplicate"]
        with self.assertRaises(HTTPError) as error:
            self.post(invalid)
        self.assertEqual(error.exception.code, 400)
        self.assertEqual(self.get("/api/evaluation/runs")[1]["runs"], [])

    def test_run_creation_and_readback_with_mocked_model_execution(self):
        with patch.object(server_module, "local_models", return_value=["eval:1"]):
            with patch("evaluation_lab.http_api.EvaluationExecutionEngine") as fake_engine:
                code, created = self.post(self.request_body())
                self.assertEqual(code, 202)
                self.assertIn("id", created)
                # Thread might finish independently; its model execution is mocked.
                status, run = self.get("/api/evaluation/runs/" + str(created["id"]))
                self.assertEqual(status, 200)
                self.assertEqual(run["criteria"], ["Faithfulness", "Completeness"])
                self.assertIsNone(run["scorecard"])
                self.assertEqual(run["source_training_session_id"], self.session_id)
        self.assertEqual(self.get("/api/evaluation/runs")[1]["runs"][0]["id"], created["id"])

    def test_mocked_evaluator_completes_through_http_without_source_mutation(self):
        import time

        with closing(sqlite3.connect(server_module.DB_PATH)) as db, db:
            original = db.execute("SELECT response FROM training_stages ORDER BY execution_order").fetchall()

        class LocalFakeEvaluator:
            def evaluate(self, model, messages):
                assert model == "eval:1"
                return json.dumps({
                    "scores": {"Faithfulness": 85, "Completeness": 78},
                    "summary": "Qualified local model assessment.",
                    "findings": [{
                        "description": "Recorded response",
                        "supporting_evidence": "Trainer output",
                        "evidence_classification": "verifiable_record",
                        "evidence_reference": "snapshot:output:1",
                    }],
                })

        with patch.object(server_module, "local_models", return_value=["eval:1"]):
            with patch("evaluation_lab.execution.OllamaEvaluatorAdapter", return_value=LocalFakeEvaluator()):
                code, started = self.post(self.request_body())
                self.assertEqual(code, 202)
                run = None
                for _ in range(120):
                    _, run = self.get("/api/evaluation/runs/" + str(started["id"]))
                    if run["status"] in ("completed", "failed"):
                        break
                    time.sleep(0.02)
                self.assertEqual(run["status"], "completed", run.get("error"))
                self.assertEqual(run["scorecard"]["scores"], {"Faithfulness": 85, "Completeness": 78})
                self.assertEqual(run["findings"][0]["evidence_reference"], "snapshot:output:1")

        with closing(sqlite3.connect(server_module.DB_PATH)) as db, db:
            self.assertEqual(original, db.execute("SELECT response FROM training_stages ORDER BY execution_order").fetchall())

    def test_background_failure_persistence_error_is_logged_and_lock_released(self):
        import time
        from evaluation_lab.execution import EvaluationExecutionEngine as ActualEngine
        from evaluation_lab.repository import EvaluationRepository

        class FailingAdapter:
            def evaluate(self, model, messages):
                raise RuntimeError("Mock local Evaluator failed.")

        with patch.object(server_module, "local_models", return_value=["eval:1"]), \
             patch("evaluation_lab.http_api.EvaluationExecutionEngine",
                   side_effect=lambda repo: ActualEngine(repo, FailingAdapter())), \
             patch.object(EvaluationRepository, "mark_run_failed",
                          side_effect=sqlite3.OperationalError("failure-state write unavailable")), \
             patch("evaluation_lab.http_api.LOGGER.exception") as log_error:
            code, started = self.post(self.request_body())
            self.assertEqual(code, 202)
            for _ in range(150):
                if log_error.called and not server_module.RUN_LOCK.locked():
                    break
                time.sleep(0.02)
            self.assertTrue(log_error.called, "Worker failure must never disappear silently.")
            self.assertFalse(server_module.RUN_LOCK.locked(), "Worker must release the execution lock.")
            self.assertIn("inspect persisted state", log_error.call_args.args[0])
            self.assertEqual(log_error.call_args.args[1], started["id"])

        _, run = self.get("/api/evaluation/runs/" + str(started["id"]))
        self.assertEqual(run["status"], "running")
        self.assertIsNone(run["scorecard"])
        self.assertEqual(run["findings"], [])

    def test_asset_routes_and_unknown_run(self):
        for path in ("/static/evaluation.js", "/static/evaluation.css"):
            with self.client.open(self.origin + path) as response:
                self.assertEqual(response.status, 200)
        with self.assertRaises(HTTPError) as error:
            self.get("/api/evaluation/runs/99999")
        self.assertEqual(error.exception.code, 404)


if __name__ == "__main__":
    unittest.main()
