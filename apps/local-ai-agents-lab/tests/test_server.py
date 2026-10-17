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
from urllib.error import HTTPError, URLError

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
        return {"Tutor": "tutor:1", "Student": "student:1", "Evaluator": "evaluator:1", "Improver": "improver:1"}

    def test_training_flow_has_four_named_roles(self):
        self.assertEqual(campus.FLOW["training"], ["Tutor", "Student", "Evaluator", "Improver"])
        self.assertTrue(all(campus.agent_id("training", role) in campus.PROMPTS for role in campus.FLOW["training"]))

    def test_all_fifteen_agent_prompts_load_from_scoped_role_files(self):
        self.assertEqual(len(campus.PROMPT_ROLES), 15)
        self.assertEqual(set(campus.PROMPTS), set(campus.PROMPT_ROLES))
        for role_id in campus.PROMPT_ROLES:
            prompt_file = campus.ROOT / "prompts" / (role_id.replace(":", "-").lower() + ".txt")
            with self.subTest(role_id=role_id):
                self.assertTrue(prompt_file.is_file())
                self.assertEqual(campus.PROMPTS[role_id], prompt_file.read_text(encoding="utf-8").strip())
                self.assertTrue(campus.PROMPTS[role_id])

    def test_four_stage_cycle_is_strictly_serial_and_persists_every_result(self):
        session_id = campus.create_training_session("ollama", self.assignments())
        calls, unloads, active = [], [], [0]

        def answer(provider, model, room, role, transcript, language):
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
        self.assertEqual([call[0] for call in calls], ["tutor:1", "student:1", "evaluator:1", "improver:1"])
        self.assertEqual(unloads, ["tutor:1", "student:1", "evaluator:1", "improver:1"])
        self.assertEqual(calls[1][2], ["You", "Tutor"])
        self.assertEqual(calls[3][2], ["You", "Tutor", "Student", "Evaluator"])
        self.assertEqual(record["stages"][2]["evaluation_score"], 87)
        self.assertEqual(record["stages"][2]["evaluation_result"], "Needs Improvement")
        self.assertEqual([message["agent"] for message in campus.history("training")], ["You", "Tutor", "Student", "Evaluator", "Improver"])

    def test_failed_stage_preserves_completed_responses_and_does_not_complete_session(self):
        session_id = campus.create_training_session("ollama", self.assignments())
        campus.RUN_LOCK.acquire()
        with patch.object(campus, "provider_chat", side_effect=["Lesson", campus.ProviderError("student failed")]), patch.object(campus.PROVIDERS, "unload"):
            campus.run_training_session(session_id, "Topic", self.assignments(), Event())
        record = campus.training_session(session_id)
        self.assertEqual(record["status"], "failed")
        self.assertEqual([stage["status"] for stage in record["stages"]], ["Completed", "Failed", "Cancelled", "Cancelled"])
        self.assertEqual([message["agent"] for message in campus.history("training")], ["You", "Tutor"])

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

    def test_conference_messages_persist_individual_models_without_changing_training(self):
        self.assertEqual(campus.FLOW["conference"], ["Strategist", "Analyst", "Engineer"])
        for agent, model in (("Strategist", "strategist:1"), ("Analyst", "analyst:1"), ("Engineer", "engineer:1")):
            campus.add_message("conference", agent, "response", model=model)
        self.assertEqual([entry["model"] for entry in campus.history("conference")],
                         ["strategist:1", "analyst:1", "engineer:1"])
        self.assertEqual(campus.history("training"), [])

    def test_ollama_unavailable_is_reported_without_fallback(self):
        with patch.object(campus.OPENER, "open", side_effect=URLError("offline")):
            self.assertFalse(campus.provider_status("ollama")["available"])


class HttpIntegrationTests(unittest.TestCase):
    def test_http_training_job_start_is_locked_before_service_execution(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_port = campus.PORT
        server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
        thread = Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            origin = f"http://127.0.0.1:{campus.PORT}"
            request = Request(origin + "/api/training/jobs", data=b'{"method":"lora"}', headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
            with patch.object(campus.TRAINING, 'start') as start, self.assertRaises(HTTPError) as raised:
                build_opener(ProxyHandler({})).open(request)
            self.assertEqual(raised.exception.code, 423)
            self.assertIn('locked', json.load(raised.exception)['error'])
            raised.exception.close()
            start.assert_not_called()
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=4); campus.PORT = original_port

    def test_http_personal_provider_plan_is_local_only_and_rejects_credentials(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_port = campus.PORT
        server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
        thread = Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            origin = f"http://127.0.0.1:{campus.PORT}"
            opener = build_opener(ProxyHandler({}))
            with opener.open(origin + "/api/training/provider-options") as response:
                options = json.load(response)
                self.assertEqual(options["credentials"], "optional-local-vault")
            self.assertEqual(options["execution"], "connection-ready")
            self.assertEqual(options["providers"][0]["id"], "runpod")
            body = {"provider":"runpod","region":"europe","currency":"EUR","maxBudget":5,"maxRuntimeMinutes":60,"confirmOwnAccount":True,"confirmDataTransfer":True}
            request = Request(origin + "/api/training/provider-plan", data=json.dumps(body).encode(), headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
            with opener.open(request) as response:
                plan = json.load(response)
            self.assertEqual(plan["state"], "PLAN_REVIEWED")
            self.assertEqual(plan["limits"]["currency"], "EUR")
            self.assertIn("No credential", plan["credentials"])
            invalid = {**body, "apiKey":"rejected"}
            request = Request(origin + "/api/training/provider-plan", data=json.dumps(invalid).encode(), headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
            with self.assertRaises(HTTPError) as raised:
                opener.open(request)
            self.assertEqual(raised.exception.code, 400)
            raised.exception.close()
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=4); campus.PORT = original_port

    def test_http_chatgpt_connection_is_explicit_and_never_returns_a_token(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_port, original_connection = campus.PORT, campus.OPENAI_CONNECTION

        class FakeConnection:
            def __init__(self): self.calls = []
            def status(self): return {"provider":"openai-chatgpt","connected":False,"scope":"current-windows-user"}
            def start(self, port): self.calls.append(("start", port)); return {"state":"AUTHORIZATION_STARTED","expiresInSeconds":600}
            def remove(self): self.calls.append(("remove",)); return {"state":"REMOVED_LOCALLY","removed":True}
            def models(self): self.calls.append(("models",)); return {"models":[{"slug":"model-a","displayName":"Model A"}]}
            def cloud_review(self, **kwargs): self.calls.append(("review", kwargs)); return {"model":kwargs["model"],"review":"External response"}

        fake = FakeConnection()
        server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
        thread = Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            origin = f"http://127.0.0.1:{campus.PORT}"
            campus.OPENAI_CONNECTION = fake
            opener = build_opener(ProxyHandler({}))
            with opener.open(origin + "/api/openai/connection") as response:
                self.assertFalse(json.load(response)["connected"])
            connect = Request(origin + "/api/openai/connection", data=b'{"confirmConnection":true}', headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
            with opener.open(connect) as response:
                result = json.load(response)
            self.assertEqual(result["state"], "AUTHORIZATION_STARTED")
            self.assertEqual(fake.calls, [("start", campus.PORT)])
            with opener.open(origin + "/api/openai/models") as response:
                self.assertEqual(json.load(response)["models"][0]["slug"], "model-a")
            review_body = {"confirmExternalReview":True,"mode":"question","room":"training","question":"Review this","pastedText":"","notes":"","model":"model-a"}
            review = Request(origin + "/api/openai/review", data=json.dumps(review_body).encode(), headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
            with opener.open(review) as response:
                self.assertEqual(json.load(response)["review"], "External response")
            self.assertEqual(fake.calls[-1], ("review", {"model":"model-a","question":"Review this","shared_content":""}))
            remove = Request(origin + "/api/openai/connection", data=b'{"confirmRemoval":true}', headers={"Origin":origin,"Content-Type":"application/json"}, method="DELETE")
            with opener.open(remove) as response:
                self.assertTrue(json.load(response)["removed"])
            self.assertNotIn("token", json.dumps(result).lower())
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=4); campus.PORT = original_port; campus.OPENAI_CONNECTION = original_connection

    def test_http_personal_provider_credentials_are_local_only_and_removable(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_port, original_vault = campus.PORT, campus.CREDENTIAL_VAULT

        class FakeProtector:
            def protect(self, value): return b"encrypted:" + value[::-1]
            def unprotect(self, value): return value[len(b"encrypted:"):][::-1]

        with tempfile.TemporaryDirectory() as temporary:
            campus.CREDENTIAL_VAULT = campus.CredentialVault(Path(temporary) / "credentials", FakeProtector())
            server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
            thread = Thread(target=server.serve_forever, daemon=True); thread.start()
            try:
                origin = f"http://127.0.0.1:{campus.PORT}"
                opener = build_opener(ProxyHandler({}))
                body = {"provider":"runpod","apiKey":"runpod-test-token-1234567890","confirmOwnAccount":True,"confirmCredentialStorage":True}
                request = Request(origin + "/api/training/provider-credentials", data=json.dumps(body).encode(), headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
                with opener.open(request) as response:
                    stored = json.load(response)
                self.assertEqual(stored["state"], "STORED_LOCALLY")
                self.assertNotIn(body["apiKey"], json.dumps(stored))
                with opener.open(origin + "/api/training/provider-credential-status") as response:
                    self.assertTrue(json.load(response)["stored"])
                remove = Request(origin + "/api/training/provider-credentials", data=b'{"provider":"runpod","confirmCredentialRemoval":true}', headers={"Origin":origin,"Content-Type":"application/json"}, method="DELETE")
                with opener.open(remove) as response:
                    self.assertTrue(json.load(response)["removed"])
                with opener.open(origin + "/api/training/provider-credential-status") as response:
                    self.assertFalse(json.load(response)["stored"])
            finally:
                server.shutdown(); server.server_close(); thread.join(timeout=4); campus.PORT = original_port; campus.CREDENTIAL_VAULT = original_vault

    def test_http_personal_provider_connection_is_explicit_and_read_only(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_port, original_connection = campus.PORT, campus.RUNPOD_CONNECTION

        class FakeReadOnlyConnection:
            def __init__(self): self.calls = []
            def check(self, provider):
                self.calls.append(provider)
                return {"state":"READ_ONLY_CONNECTED","provider":provider,"account":"authenticated",
                        "gpus":[{"id":"NVIDIA A40","name":"A40","memoryGb":48,"availability":"High","hourlyPriceUsd":0.59}],
                        "execution":"No Pod, upload, provisioning, model download, or training job was started."}

        connection = FakeReadOnlyConnection()
        campus.RUNPOD_CONNECTION = connection
        server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
        thread = Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            origin = f"http://127.0.0.1:{campus.PORT}"
            request = Request(origin + "/api/training/provider-connection", data=b'{"provider":"runpod","confirmReadOnlyConnection":true}', headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
            with build_opener(ProxyHandler({})).open(request) as response:
                result = json.load(response)
            self.assertEqual(result["state"], "READ_ONLY_CONNECTED")
            self.assertEqual(result["account"], "authenticated")
            self.assertEqual(result["gpus"][0]["hourlyPriceUsd"], 0.59)
            self.assertEqual(connection.calls, ["runpod"])
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=4); campus.PORT = original_port; campus.RUNPOD_CONNECTION = original_connection

    def test_model_guidance_static_assets_are_served_locally(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import build_opener, ProxyHandler
        original_port = campus.PORT
        server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
        thread = Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            opener = build_opener(ProxyHandler({}))
            for asset, expected in (("/static/model-guidance-data.js", "ModelGuidanceData"),
                                    ("/static/model-guidance.js", "dialog.showModal()"),
                                    ("/static/connection-dialogs.js", "connections-hub-dialog")):
                with self.subTest(asset=asset), opener.open(f"http://127.0.0.1:{campus.PORT}{asset}") as response:
                    self.assertEqual(response.status, 200)
                    self.assertIn(expected, response.read().decode("utf-8"))
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=4); campus.PORT = original_port

    def test_http_conference_routes_three_distinct_models_in_order(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_db, original_port = campus.DB_PATH, campus.PORT
        with tempfile.TemporaryDirectory() as temp:
            campus.DB_PATH = Path(temp) / "data" / "campus.sqlite3"
            campus.initialize()
            server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler)
            campus.PORT = server.server_address[1]
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            origin = f"http://127.0.0.1:{campus.PORT}"
            opener = build_opener(ProxyHandler({}))
            calls = []
            def answer(provider, model, room, role, transcript, language):
                calls.append((role, model, [item["agent"] for item in transcript]))
                return role + " response"
            try:
                with patch.object(campus, "local_models", return_value=["s:1", "a:1", "e:1"]), patch.object(campus, "provider_chat", side_effect=answer):
                    request = Request(origin + "/api/run", data=json.dumps({
                        "room": "conference", "provider": "ollama", "models": {"Strategist": "s:1", "Analyst": "a:1", "Engineer": "e:1"},
                        "prompt": "Discuss a topic"}).encode(), headers={"Origin": origin, "Content-Type": "application/json"}, method="POST")
                    with opener.open(request) as response:
                        result = json.load(response)
                        self.assertEqual(response.status, 200)
                    self.assertEqual([(c[0], c[1]) for c in calls],
                                     [("Strategist", "s:1"), ("Analyst", "a:1"), ("Engineer", "e:1")])
                    self.assertEqual(calls[-1][2], ["You", "Strategist", "Analyst"])
                    self.assertEqual([x["model"] for x in result["messages"]], ["s:1", "a:1", "e:1"])
                    with opener.open(origin + "/api/history/conference") as response:
                        saved = json.load(response)["messages"]
                    self.assertEqual([x["model"] for x in saved[1:]], ["s:1", "a:1", "e:1"])
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=4)
                campus.DB_PATH, campus.PORT = original_db, original_port

    def test_http_session_routes_four_models_and_publishes_stage_state(self):
        from http.server import ThreadingHTTPServer
        from urllib.request import Request, build_opener, ProxyHandler
        original_db, original_port = campus.DB_PATH, campus.PORT
        with tempfile.TemporaryDirectory() as temp:
            campus.DB_PATH = Path(temp) / "data" / "campus.sqlite3"; campus.initialize()
            server = ThreadingHTTPServer(("127.0.0.1", 0), campus.Handler); campus.PORT = server.server_address[1]
            thread = Thread(target=server.serve_forever, daemon=True); thread.start(); origin = f"http://127.0.0.1:{campus.PORT}"; opener = build_opener(ProxyHandler({}))
            try:
                with patch.object(campus, "local_models", return_value=["tutor:1", "student:1", "evaluator:1", "improver:1"]), patch.object(campus, "provider_chat", side_effect=lambda provider, model, room, role, transcript, language: "Score: 100\nResult: Pass" if role == "Evaluator" else role), patch.object(campus.PROVIDERS, "unload") as unload:
                    request = Request(origin+"/api/run", data=json.dumps({"room":"training","provider":"ollama","models":{"Tutor":"tutor:1","Student":"student:1","Evaluator":"evaluator:1","Improver":"improver:1"},"prompt":"Topic"}).encode(), headers={"Origin":origin,"Content-Type":"application/json"}, method="POST")
                    with opener.open(request) as response: started = json.load(response)
                    self.assertEqual(response.status, 202); self.assertIn("session_id", started)
                    for _ in range(40):
                        with opener.open(origin+"/api/training-sessions/"+str(started["session_id"])) as response: session = json.load(response)
                        if session["status"] == "completed": break
                        time.sleep(.05)
                    self.assertEqual(session["status"], "completed")
                    self.assertEqual([stage["assigned_model"] for stage in session["stages"]], ["tutor:1", "student:1", "evaluator:1", "improver:1"])
                    self.assertEqual(unload.call_count, 4)
            finally:
                server.shutdown(); server.server_close(); thread.join(timeout=4); campus.DB_PATH, campus.PORT = original_db, original_port


if __name__ == "__main__":
    unittest.main()
