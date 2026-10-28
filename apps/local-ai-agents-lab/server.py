"""Private local AI Training Lab with five bounded, local-only Lab workflows."""
# Markellos Ecosystem AI Lab — process identity marker used by the safe Windows Stop handler.
from __future__ import annotations

import json
import logging
from logging.handlers import RotatingFileHandler
import subprocess
import sys
from contextlib import closing
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Event, Lock, Thread
from time import perf_counter
from time import gmtime
import re
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener
from urllib.parse import parse_qs, urlsplit

HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
DB_PATH = ROOT / "data" / "campus.sqlite3"
API_LOGGER = logging.getLogger("markellos_ai_lab_api")
API_LOGGER.setLevel(logging.INFO)
API_LOGGER.propagate = False
API_LOG_MAX_BYTES = 512_000
API_LOG_TAIL_BYTES = 24_000
OPENER = build_opener(ProxyHandler({}))  # No environment proxy; loopback only.
RUN_LOCK = Lock()
SESSION_CANCELS: dict[int, Event] = {}
SESSION_CANCELS_LOCK = Lock()
ROOMS = {"conference", "training", "evaluation", "advisory", "optimization"}
# The original room identifier is reconstructed only to migrate existing local
# SQLite history once. New requests and records use the approved `training` ID.
LEGACY_TRAINING_ROOM = "uni" "versity"

# The adapter owns the fixed local Ollama URL. User requests cannot supply an
# endpoint, so the Lab cannot be redirected to a remote service.
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from providers import InferenceProviders, ProviderError
from training import TrainingError, TrainingLockedError, TrainingService
from credential_vault import CredentialVault, CredentialVaultError
from personal_provider import PersonalProviderConnectionError, PersonalProviderCredentialError, PersonalProviderPlanError, build_provider_plan, connection_check_request, credential_removal_request, credential_store_request, provider_options
from runpod_readonly import RunpodReadOnlyError, RunpodReadOnlyService
from openai_connection import OpenAIConnectionError, OpenAIConnectionService, OpenAIConnectionSetupRequired
from model_install import ModelInstallError, ModelInstallBusy, OllamaModelInstaller
from evaluation_lab.http_api import EvaluationAPIError, EvaluationHTTPService
from evaluation_lab.repository import EvaluationRepository, EvaluationRepositoryError
from exercise_library import select_exercise, format_exercise

PROVIDERS = InferenceProviders()
TRAINING = TrainingService(ROOT)
MODEL_INSTALLER = OllamaModelInstaller(OPENER)
CREDENTIAL_VAULT = CredentialVault()
RUNPOD_CONNECTION = RunpodReadOnlyService(CREDENTIAL_VAULT)
OPENAI_CONNECTION = OpenAIConnectionService(CREDENTIAL_VAULT, ROOT)

LABS = {
    "conference": {"name": "Conference Room", "workflow": "Strategist → Analyst → Engineer",
                   "roles": ("Strategist", "Analyst", "Engineer")},
    "training": {"name": "Training Lab", "workflow": "Tutor → Student → Evaluator → Improver",
                 "roles": ("Tutor", "Student", "Evaluator", "Improver")},
    "evaluation": {"name": "Evaluation Lab", "workflow": "Assessment → Scoring → Benchmarking",
                   "roles": ("Assessor", "Scorer", "Benchmarker")},
    "advisory": {"name": "Advisory Lab", "workflow": "Analysis → Recommendations",
                 "roles": ("Analyst", "Advisor")},
    "optimization": {"name": "Optimization Lab", "workflow": "Diagnose → Optimize → Validate",
                     "roles": ("Diagnostician", "Optimizer", "Validator")},
}
FLOW = {room: list(spec["roles"]) for room, spec in LABS.items()}
PROMPT_ROLES = tuple(f"{room}:{role}" for room, spec in LABS.items() for role in spec["roles"])
PROMPTS = {
    role_id: (ROOT / "prompts" / f"{room}-{role.lower()}.txt").read_text(encoding="utf-8").strip()
    for room, spec in LABS.items() for role in spec["roles"]
    for role_id in (f"{room}:{role}",)
}

def agent_id(room: str, role: str) -> str:
    """Keep internal role identities Lab-scoped while preserving readable UI labels."""
    return f"{room}:{role}"

def display_role(room: str, role: str) -> str:
    """Read legacy persisted role names without retaining them in active flows."""
    legacy = {"training": {"Trainer": "Tutor"}, "conference": {"Planner": "Strategist", "Researcher": "Analyst", "Reviewer": "Engineer"}}
    return legacy.get(room, {}).get(role, role.split(":", 1)[-1])


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def configure_api_logging() -> None:
    """Keep bounded, local-only API request metadata; never log bodies or query strings."""
    path = DB_PATH.parent / "logs" / "api.log"
    path.parent.mkdir(parents=True, exist_ok=True)
    for existing in list(API_LOGGER.handlers):
        API_LOGGER.removeHandler(existing)
        existing.close()
    handler = RotatingFileHandler(path, maxBytes=API_LOG_MAX_BYTES, backupCount=2, encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s UTC [HTTP] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    formatter.converter = gmtime
    handler.setFormatter(formatter)
    API_LOGGER.addHandler(handler)


def api_log_tail() -> str:
    """Return only the newest bounded API log data, with no filesystem path exposure."""
    path = DB_PATH.parent / "logs" / "api.log"
    try:
        with path.open("rb") as source:
            source.seek(0, 2)
            start = max(0, source.tell() - API_LOG_TAIL_BYTES)
            source.seek(start)
            content = source.read(API_LOG_TAIL_BYTES).decode("utf-8", errors="replace")
        return content.split("\n", 1)[-1] if start else content
    except FileNotFoundError:
        return ""


def connect():
    con = sqlite3.connect(DB_PATH, timeout=15)
    con.row_factory = sqlite3.Row
    return con


def initialize():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect()) as db, db:
        db.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room TEXT NOT NULL,
            agent TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        columns = {row[1] for row in db.execute("PRAGMA table_info(messages)")}
        if "session_id" not in columns:
            db.execute("ALTER TABLE messages ADD COLUMN session_id INTEGER")
        if "model" not in columns:
            db.execute("ALTER TABLE messages ADD COLUMN model TEXT")
        if "exercise_id" not in columns:
            db.execute("ALTER TABLE messages ADD COLUMN exercise_id TEXT")
        db.execute("UPDATE messages SET room='training' WHERE room=?", (LEGACY_TRAINING_ROOM,))
        db.execute("""CREATE TABLE IF NOT EXISTS training_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL,
            trainer_model TEXT NOT NULL,
            student_model TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        session_columns = {row[1] for row in db.execute("PRAGMA table_info(training_sessions)")}
        for column in ("evaluator_model", "improver_model"):
            if column not in session_columns:
                db.execute(f"ALTER TABLE training_sessions ADD COLUMN {column} TEXT")
        for column, definition in (
            ("status", "TEXT NOT NULL DEFAULT 'running'"),
            ("started_at", "TEXT"), ("completed_at", "TEXT"), ("error", "TEXT"),
        ):
            if column not in session_columns:
                db.execute(f"ALTER TABLE training_sessions ADD COLUMN {column} {definition}")
        db.execute("""CREATE TABLE IF NOT EXISTS training_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            agent_role TEXT NOT NULL,
            assigned_model TEXT NOT NULL,
            execution_order INTEGER NOT NULL,
            status TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT,
            duration_ms INTEGER,
            response TEXT,
            evaluation_score INTEGER,
            evaluation_result TEXT,
            error TEXT,
            UNIQUE(session_id, agent_role),
            FOREIGN KEY(session_id) REFERENCES training_sessions(id)
        )""")
        db.execute("CREATE INDEX IF NOT EXISTS idx_room_id ON messages(room,id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_training_stages_session ON training_stages(session_id,execution_order)")
        # Advisor exchanges deliberately have their own local history boundary:
        # they are neither room messages nor input for a later cloud request.
        db.execute("""CREATE TABLE IF NOT EXISTS advisor_exchanges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        db.execute("CREATE INDEX IF NOT EXISTS idx_advisor_exchanges_id ON advisor_exchanges(id)")

    # The Evaluation Lab owns only additive tables; legacy migrations run first.
    EvaluationRepository(DB_PATH).initialize()


def auto_exercise_for_room(room: str) -> tuple[dict, str]:
    """Choose next trusted offline exercise using only prior auto-run entries."""
    with closing(connect()) as db:
        count = db.execute(
            "SELECT COUNT(*) FROM messages WHERE room=? AND agent='You' AND exercise_id IS NOT NULL",
            (room,),
        ).fetchone()[0]
    exercise = select_exercise(room, count)
    return exercise, format_exercise(exercise)


def add_message(room: str, agent: str, content: str, session_id: Optional[int] = None, model: Optional[str] = None,
                exercise_id: Optional[str] = None):
    with closing(connect()) as db, db:
        db.execute(
            "INSERT INTO messages(room,agent,content,created_at,session_id,model,exercise_id) VALUES(?,?,?,?,?,?,?)",
            (room, agent, content[:12000], utc_now(), session_id, model, exercise_id),
        )


def create_training_session(provider: str, assignments: dict[str, str]) -> int:
    """Persist a model snapshot for one Training Lab run without changing old history."""
    with closing(connect()) as db, db:
        result = db.execute(
            "INSERT INTO training_sessions(provider,trainer_model,student_model,evaluator_model,improver_model,created_at,status,started_at) VALUES(?,?,?,?,?,?,?,?)",
            (provider, assignments["Tutor"], assignments["Student"], assignments["Evaluator"],
             assignments["Improver"], utc_now(), "running", utc_now()),
        )
        session_id = result.lastrowid
        db.executemany(
            "INSERT INTO training_stages(session_id,agent_role,assigned_model,execution_order,status) VALUES(?,?,?,?,?)",
            [(session_id, agent, assignments[agent], index, "Waiting")
             for index, agent in enumerate(FLOW["training"], start=1)],
        )
    return session_id


def history(room: str, limit: int = 80) -> list[dict]:
    with closing(connect()) as db, db:
        rows = db.execute(
            "SELECT messages.id,messages.agent,messages.content,messages.created_at,messages.session_id,messages.exercise_id,"
            " COALESCE(messages.model, CASE messages.agent WHEN 'Trainer' THEN training_sessions.trainer_model WHEN 'Tutor' THEN training_sessions.trainer_model"
            " WHEN 'Student' THEN training_sessions.student_model"
            " WHEN 'Evaluator' THEN training_sessions.evaluator_model"
            " WHEN 'Improver' THEN training_sessions.improver_model END) AS model"
            " FROM (SELECT id,agent,content,created_at,session_id,model,exercise_id FROM messages WHERE room=?"
            " ORDER BY id DESC LIMIT ?) AS messages"
            " LEFT JOIN training_sessions ON training_sessions.id=messages.session_id"
            " ORDER BY messages.id ASC", (room, limit)
        ).fetchall()
    return [{**dict(row), "agent": display_role(room, row["agent"])} for row in rows]


def training_session(session_id: int) -> Optional[dict]:
    with closing(connect()) as db:
        session = db.execute(
            "SELECT id,provider,trainer_model,student_model,evaluator_model,improver_model,created_at,started_at,completed_at,status,error FROM training_sessions WHERE id=?",
            (session_id,),
        ).fetchone()
        if not session:
            return None
        stages = db.execute(
            "SELECT agent_role,assigned_model,execution_order,status,started_at,completed_at,duration_ms,response,evaluation_score,evaluation_result,error FROM training_stages WHERE session_id=? ORDER BY execution_order",
            (session_id,),
        ).fetchall()
    data = dict(session)
    data["stages"] = [{**dict(stage), "agent_role": display_role("training", stage["agent_role"])} for stage in stages]
    return data


def update_stage(session_id: int, agent: str, status: str, *, response: Optional[str] = None,
                 duration_ms: Optional[int] = None, error: Optional[str] = None,
                 score: Optional[int] = None, result: Optional[str] = None):
    fields = ["status=?"]
    values: list[object] = [status]
    if status == "Running":
        fields.append("started_at=?")
        values.append(utc_now())
    if status in {"Completed", "Failed", "Cancelled"}:
        fields.append("completed_at=?")
        values.append(utc_now())
    if response is not None:
        fields.append("response=?")
        values.append(response[:12000])
    if duration_ms is not None:
        fields.append("duration_ms=?")
        values.append(duration_ms)
    if error is not None:
        fields.append("error=?")
        values.append(error[:500])
    if score is not None:
        fields.append("evaluation_score=?")
        values.append(score)
    if result is not None:
        fields.append("evaluation_result=?")
        values.append(result)
    values.extend([session_id, agent])
    with closing(connect()) as db, db:
        db.execute(f"UPDATE training_stages SET {', '.join(fields)} WHERE session_id=? AND agent_role=?", values)


def finish_training_session(session_id: int, status: str, error: str = ""):
    with closing(connect()) as db, db:
        db.execute("UPDATE training_sessions SET status=?,completed_at=?,error=? WHERE id=?",
                   (status, utc_now(), error[:500], session_id))


def evaluation_fields(response: str) -> tuple[Optional[int], Optional[str]]:
    score_match = re.search(r"\bscore\s*:\s*(100|[1-9]?\d)\b", response, re.IGNORECASE)
    score = int(score_match.group(1)) if score_match else None
    result_match = re.search(r"\b(?:result|pass)\s*:\s*(Pass|Needs Improvement)\b", response, re.IGNORECASE)
    result = result_match.group(1).title() if result_match else None
    return score, result


def run_training_session(session_id: int, prompt: str, assignments: dict[str, str], cancel: Event,
                         exercise_id: Optional[str] = None):
    """Run one four-stage cycle serially; completed stages are durable immediately."""
    transcript = [{"agent": "You", "content": prompt}]
    add_message("training", "You", prompt, session_id, exercise_id=exercise_id)
    try:
        for agent in FLOW["training"]:
            if cancel.is_set():
                update_stage(session_id, agent, "Cancelled", error="Cancelled before inference started.")
                for remaining in FLOW["training"][FLOW["training"].index(agent) + 1:]:
                    update_stage(session_id, remaining, "Cancelled", error="Cancelled before inference started.")
                finish_training_session(session_id, "cancelled", "Cancelled by the user.")
                return
            update_stage(session_id, agent, "Loading Model")
            update_stage(session_id, agent, "Running")
            started = perf_counter()
            try:
                answer = provider_chat("ollama", assignments[agent], "training", agent, transcript, "en")
                duration_ms = int((perf_counter() - started) * 1000)
                add_message("training", agent, answer, session_id)
                score, result = evaluation_fields(answer) if agent == "Evaluator" else (None, None)
                update_stage(session_id, agent, "Completed", response=answer, duration_ms=duration_ms,
                             score=score, result=result)
                transcript.append({"agent": agent, "content": answer})
            except (TimeoutError, HTTPError, URLError, OSError, ValueError, KeyError, ProviderError) as err:
                update_stage(session_id, agent, "Failed", duration_ms=int((perf_counter() - started) * 1000),
                             error=str(err))
                for remaining in FLOW["training"][FLOW["training"].index(agent) + 1:]:
                    update_stage(session_id, remaining, "Cancelled", error="A previous stage failed.")
                finish_training_session(session_id, "failed", str(err))
                return
            finally:
                # A completed response is written before the documented unload request.
                PROVIDERS.unload("ollama", assignments[agent], OPENER)
        finish_training_session(session_id, "completed")
    finally:
        with SESSION_CANCELS_LOCK:
            SESSION_CANCELS.pop(session_id, None)
        RUN_LOCK.release()


def clear_history(room: str) -> int:
    """Delete only the saved conversation for one known local room."""
    with closing(connect()) as db, db:
        result = db.execute("DELETE FROM messages WHERE room=?", (room,))
    return result.rowcount


def save_advisor_exchange(question: str, answer: str) -> dict:
    """Persist an explicit Advisor exchange without mixing it into room history."""
    if not isinstance(question, str) or not isinstance(answer, str):
        raise ValueError("Advisor exchange must contain text.")
    question = question.strip()
    if not question or not answer:
        raise ValueError("Advisor exchange must contain a question and answer.")
    with closing(connect()) as db, db:
        result = db.execute(
            "INSERT INTO advisor_exchanges(question,answer,created_at) VALUES(?,?,?)",
            (question, answer, utc_now()),
        )
        exchange = db.execute(
            "SELECT id,question,answer,created_at FROM advisor_exchanges WHERE id=?",
            (result.lastrowid,),
        ).fetchone()
    return dict(exchange)


def advisor_history(limit: int = 80) -> list[dict]:
    with closing(connect()) as db:
        rows = db.execute(
            "SELECT id,question,answer,created_at FROM "
            "(SELECT id,question,answer,created_at FROM advisor_exchanges ORDER BY id DESC LIMIT ?) "
            "ORDER BY id ASC",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def clear_advisor_history() -> int:
    with closing(connect()) as db, db:
        result = db.execute("DELETE FROM advisor_exchanges")
    return result.rowcount


def local_models(provider: str = "ollama") -> list[str]:
    """Return models from one allow-listed local inference provider."""
    return PROVIDERS.models(provider, OPENER)


def provider_chat(provider: str, model: str, room: str, agent: str, transcript: list[dict], language: str = "en") -> str:
    system = PROMPTS[agent_id(room, agent)] + (" Do not execute commands, access files, use a terminal, or access the network. Reply exclusively in " + ("Greek" if language == "el" else "English") + ", maintaining standard technical terms. /no_think")
    dialog = [{"role": "system", "content": system}]
    for row in transcript[-12:]:
        who = row["agent"]
        dialog.append({"role": "user", "content": f"{who}: {row['content'][:1500]}"})
    return PROVIDERS.chat(provider, model, dialog, OPENER)


def ollama_chat(model: str, agent: str, transcript: list[dict], language: str = "en") -> str:
    """Compatibility wrapper for existing callers and regression tests."""
    return provider_chat("ollama", model, agent, transcript, language)


def provider_status(provider: str) -> dict:
    info = PROVIDERS.get(provider)
    try:
        return {"provider": info.identifier, "label": info.label, "available": True,
                "models": local_models(provider), "error": ""}
    except ProviderError:
        return {"provider": info.identifier, "label": info.label, "available": False,
                "models": [], "error": f"{info.label} is not running locally."}


EVALUATION = EvaluationHTTPService(lambda: DB_PATH, RUN_LOCK, lambda: local_models('ollama'))


class Handler(BaseHTTPRequestHandler):
    server_version = "LocalCampus/0.1"

    def log_message(self, fmt, *args):
        # Deliberately omit requests outside /api, bodies, query strings and path data beyond route identity.
        route = urlsplit(self.path).path
        if not route.startswith("/api/"):
            return
        for prefix in ("/api/training-sessions/", "/api/evaluation/runs/", "/api/training/jobs/"):
            if route.startswith(prefix):
                route = prefix + "{id}"
                break
        if len(route) > 120 or not re.fullmatch(r"/api/[A-Za-z0-9/_{}-]+", route):
            route = "/api/other"
        API_LOGGER.info("%s %s", self.command, route)

    def _headers(self, code=200, content_type="application/json; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'")
        self.end_headers()

    def _json(self, payload, code=200):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._headers(code)
        self.wfile.write(encoded)

    def _html(self, content, code=200):
        self._headers(code, "text/html; charset=utf-8")
        self.wfile.write(content.encode("utf-8"))

    def do_GET(self):
        if not self._host_valid():
            self._json({"error": "Invalid Host"}, 403)
            return
        parsed = urlsplit(self.path)
        if parsed.path == "/auth/callback":
            try:
                query = {name: values[0] for name, values in parse_qs(parsed.query, strict_parsing=True).items()
                         if len(values) == 1}
                OPENAI_CONNECTION.complete(query)
                self._html("<!doctype html><title>Connected</title><main><h1>ChatGPT connected</h1><p>You may close this tab and return to the Local Lab.</p></main>")
            except (OpenAIConnectionError, ValueError) as err:
                self._html(f"<!doctype html><title>Connection not completed</title><main><h1>ChatGPT connection not completed</h1><p>{str(err)}</p><p>You may close this tab and return to the Local Lab.</p></main>", 400)
            return
        if self.path == "/api/status":
            status = provider_status("ollama")
            self._json({"ollama": status["available"], "models": status["models"],
                        "storage": "local SQLite", "cloud": False, "provider": status})
            return
        if self.path == "/api/system/logs":
            self._json({"logs": api_log_tail(), "limitBytes": API_LOG_TAIL_BYTES})
            return
        if self.path == "/api/training/provider-options":
            self._json(provider_options())
            return
        if self.path == "/api/training/provider-credential-status":
            try:
                self._json(CREDENTIAL_VAULT.status("runpod"))
            except CredentialVaultError as err:
                self._json({"error": str(err)}, 503)
            return
        if self.path == "/api/openai/connection":
            try:
                self._json(OPENAI_CONNECTION.status())
            except OpenAIConnectionError as err:
                self._json({"error": str(err)}, 503)
            return
        if self.path == "/api/openai/advisor-history":
            self._json({"exchanges": advisor_history()})
            return
        if self.path.startswith("/api/evaluation/"):
            try:
                self._json(EVALUATION.get(self.path))
            except EvaluationAPIError as err:
                self._json({"error": str(err)}, err.status)
            except (sqlite3.DatabaseError, EvaluationRepositoryError) as err:
                self._json({"error": "Evaluation Lab data is unavailable."}, 500)
            return
        if self.path == "/api/models/install/status":
            self._json(MODEL_INSTALLER.status())
            return
        if self.path == "/api/training/status":
            data = TRAINING.availability()
            data.update({"datasets": TRAINING.datasets_list(), "models": TRAINING.models_list(), "paths": TRAINING.directories()})
            self._json(data)
            return
        if self.path.startswith("/api/training/jobs/"):
            try:
                self._json(TRAINING.status(self.path.rsplit("/", 1)[-1]))
            except TrainingError as err:
                self._json({"error": str(err)}, 404)
            return
        if self.path.startswith("/api/history/"):
            room = self.path[len("/api/history/"):]
            if room in ROOMS:
                self._json({"room": room, "messages": history(room)})
            else:
                self._json({"error": "Unknown room"}, 404)
            return
        if self.path.startswith("/api/training-sessions/"):
            try:
                session_id = int(self.path.rsplit("/", 1)[-1])
                session = training_session(session_id)
                if not session:
                    raise ValueError
                self._json(session)
            except ValueError:
                self._json({"error": "Unknown training session"}, 404)
            return
        pages = {"/": ("index.html", "text/html; charset=utf-8"),
                 "/fine-tuning-guide": ("fine-tuning-guide.html", "text/html; charset=utf-8"),
                 "/static/fine-tuning-guide.css": ("fine-tuning-guide.css", "text/css; charset=utf-8"),
                 "/static/style.css": ("style.css", "text/css; charset=utf-8"),
                 "/static/evaluation.css": ("evaluation.css", "text/css; charset=utf-8"),
                 "/static/app.js": ("app.js", "text/javascript; charset=utf-8"),
                 "/static/settings.js": ("settings.js", "text/javascript; charset=utf-8"),
                 "/static/api-logs.js": ("api-logs.js", "text/javascript; charset=utf-8"),
                 "/static/ecosystem-shell.js": ("ecosystem-shell.js", "text/javascript; charset=utf-8"),
                 "/static/model-guidance-data.js": ("model-guidance-data.js", "text/javascript; charset=utf-8"),
                 "/static/model-guidance.js": ("model-guidance.js", "text/javascript; charset=utf-8"),
                 "/static/ecosystem-tokens.css": ("ecosystem-tokens.css", "text/css; charset=utf-8"),
                 "/static/training.js": ("training.js", "text/javascript; charset=utf-8"),
                 "/static/personal-provider.js": ("personal-provider.js", "text/javascript; charset=utf-8"),
                 "/static/openai-connection.js": ("openai-connection.js", "text/javascript; charset=utf-8"),
                 "/static/model-install.js": ("model-install.js", "text/javascript; charset=utf-8"),
                 "/static/panel-layout.js": ("panel-layout.js", "text/javascript; charset=utf-8"),
                 "/static/connection-dialogs.js": ("connection-dialogs.js", "text/javascript; charset=utf-8"),
                 "/static/evaluation.js": ("evaluation.js", "text/javascript; charset=utf-8")}
        if parsed.path == "/assets/chatgpt-advisor-avatar.png":
            self._headers(200, "image/png")
            self.wfile.write((ROOT / "assets" / "chatgpt-advisor-avatar.png").read_bytes())
            return
        resource = pages.get(self.path)
        if not resource:
            self._json({"error": "Not found"}, 404)
            return
        content = (STATIC / resource[0]).read_bytes()
        self._headers(200, resource[1])
        self.wfile.write(content)

    def _host_valid(self):
        return self.headers.get("Host", "") in {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}

    def _origin_valid(self):
        origin = self.headers.get("Origin", "")
        return origin in {f"http://127.0.0.1:{PORT}", f"http://localhost:{PORT}"}

    def do_POST(self):
        if not self._host_valid() or not self._origin_valid():
            self._json({"error": "Cross-origin writes blocked"}, 403)
            return
        if self.path == "/api/openai/connection":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 96 or json.loads(self.rfile.read(size)) != {"confirmConnection": True}:
                    raise OpenAIConnectionError("Confirm the ChatGPT connection request.")
                self._json(OPENAI_CONNECTION.start(PORT), 202)
            except OpenAIConnectionSetupRequired as err:
                self._json({"error": str(err), "setupRequired": True}, 409)
            except (OpenAIConnectionError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/openai/connection/setup":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 96 or json.loads(self.rfile.read(size)) != {"confirmSetup": True}:
                    raise OpenAIConnectionError("Confirm the optional connection setup request.")
                script = ROOT / "scripts" / "setup-openai-connection.ps1"
                if not script.is_file():
                    raise OpenAIConnectionError("The optional connection setup script is unavailable.")
                subprocess.Popen(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script), "-LabRoot", str(ROOT)], creationflags=getattr(subprocess, "CREATE_NEW_CONSOLE", 0))
                self._json({"state": "SETUP_OPENED"}, 202)
            except (OpenAIConnectionError, ValueError, TypeError, json.JSONDecodeError, OSError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/openai/review":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 12_100:
                    raise OpenAIConnectionError("The ChatGPT question is too large.")
                body = json.loads(self.rfile.read(size))
                required = {"confirmExternalReview", "question"}
                if not isinstance(body, dict) or set(body) != required or body["confirmExternalReview"] is not True:
                    raise OpenAIConnectionError("Confirm the ChatGPT question request.")
                if not isinstance(body["question"], str):
                    raise OpenAIConnectionError("The ChatGPT question is invalid.")
                result = OPENAI_CONNECTION.ask_advisor(question=body["question"])
                exchange = save_advisor_exchange(body["question"], result["answer"])
                self._json({**result, "localHistorySaved": True, "exchange": exchange})
            except (OpenAIConnectionError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/evaluation/runs":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 4096:
                    raise EvaluationAPIError("Invalid Evaluation Lab request size.")
                payload = json.loads(self.rfile.read(size))
                self._json(EVALUATION.start(payload), 202)
            except EvaluationAPIError as err:
                self._json({"error": str(err)}, err.status)
            except (ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": "Invalid Evaluation Lab request."}, 400)
            return
        if self.path == "/api/history/clear":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 2 or size > 128:
                    raise ValueError("Invalid clear request.")
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict) or set(body) != {"room"} or body["room"] not in ROOMS:
                    raise ValueError("Select a valid room to clear.")
            except (ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
                return
            if not RUN_LOCK.acquire(blocking=False):
                self._json({"error": "Wait for the active agent session to finish before clearing this conversation."}, 409)
                return
            try:
                self._json({"room": body["room"], "deleted": clear_history(body["room"])})
            finally:
                RUN_LOCK.release()
            return
        if self.path == "/api/models/install":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 2 or size > 256:
                    raise ModelInstallError("Invalid model installation request.")
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict) or set(body) != {"model"}:
                    raise ModelInstallError("Provide exactly one Ollama model name.")
                if RUN_LOCK.locked():
                    raise ModelInstallBusy("Finish the current agent session before installing a model.")
                self._json(MODEL_INSTALLER.start(body["model"]), 202)
            except ModelInstallBusy as err:
                self._json({"error": str(err)}, 409)
            except (ModelInstallError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path.startswith("/api/training/jobs/") and self.path.endswith("/stop"):
            try:
                self._json(TRAINING.stop(self.path.split("/")[-2]))
            except TrainingError as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/training/open-directory":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 2 or size > 128:
                    raise TrainingError("Invalid folder request.")
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict) or set(body) != {"directory"} or not isinstance(body["directory"], str):
                    raise TrainingError("Select one supported local training directory.")
                self._json(TRAINING.open_directory(body["directory"]))
            except (TrainingError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/training/provider-plan":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 1024:
                    raise PersonalProviderPlanError("Invalid personal provider plan size.")
                self._json(build_provider_plan(json.loads(self.rfile.read(size))))
            except (PersonalProviderPlanError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/training/provider-credentials":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 1024:
                    raise PersonalProviderCredentialError("Invalid provider credential request size.")
                request = credential_store_request(json.loads(self.rfile.read(size)))
                CREDENTIAL_VAULT.store(request["provider"], request["apiKey"])
                self._json({"state": "STORED_LOCALLY", "provider": request["provider"], "scope": "current-windows-user", "execution": "No provider connection, upload, provisioning, or training job was started."})
            except (CredentialVaultError, PersonalProviderCredentialError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/training/provider-connection":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 256:
                    raise PersonalProviderConnectionError("Invalid provider connection request size.")
                provider = connection_check_request(json.loads(self.rfile.read(size)))
                self._json(RUNPOD_CONNECTION.check(provider))
            except (PersonalProviderConnectionError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            except RunpodReadOnlyError as err:
                self._json({"error": str(err)}, 502)
            return
        if self.path.startswith("/api/training-sessions/") and self.path.endswith("/cancel"):
            try:
                session_id = int(self.path.split("/")[-2])
                with SESSION_CANCELS_LOCK:
                    cancel = SESSION_CANCELS.get(session_id)
                if not cancel:
                    raise ValueError("This session is no longer running.")
                cancel.set()
                with closing(connect()) as db, db:
                    db.execute("UPDATE training_sessions SET status=? WHERE id=? AND status='running'", ("cancelling", session_id))
                self._json({"session_id": session_id, "status": "cancelling"}, 202)
            except ValueError as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/training/jobs":
            if not TRAINING.enabled:
                self._json({"error": "Fine-tuning is locked in this release and cannot be started."}, 423)
                return
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 2 or size > 4000:
                    raise TrainingError("Invalid training request size.")
                self._json(TRAINING.start(json.loads(self.rfile.read(size))), 202)
            except TrainingLockedError as err:
                self._json({"error": str(err)}, 423)
            except (TrainingError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path not in {"/api/run", "/api/auto-run"}:
            self._json({"error": "Unknown endpoint"}, 404)
            return
        auto_mode = self.path == "/api/auto-run"
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 2 or size > 16000:
                raise ValueError("Invalid request size")
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError("Invalid request")
            room = body.get("room", "")
            provider = body.get("provider", "ollama")
            assignments = body.get("models", {})
            raw_prompt = body.get("prompt", "")
            language = body.get("language", "en")
            if language not in ("en", "el"):
                raise ValueError("Invalid response language")
            if not isinstance(raw_prompt, str):
                raise ValueError("Invalid prompt")
            prompt = raw_prompt.strip()
            if room not in ROOMS or provider != "ollama" or (auto_mode and room != "training") or (not auto_mode and not 1 <= len(prompt) <= 2500):
                raise ValueError("Select a Lab and a topic of up to 2,500 characters.")
            if auto_mode and "prompt" in body:
                raise ValueError("Automatic Lab sessions select their exercise from the trusted local catalog.")
            if not isinstance(assignments, dict) or set(assignments) != set(FLOW[room]) or not all(isinstance(value, str) and value for value in assignments.values()):
                raise ValueError("Select one installed local model for every Lab agent.")
            PROVIDERS.get(provider)
        except (ValueError, TypeError, json.JSONDecodeError) as err:
            self._json({"error": str(err)}, 400)
            return
        if auto_mode:
            # Reserved endpoint: no exercises are available and no session may start.
            self._json({"error": "Unavailable - Under Construction"}, 503)
            return
        if not RUN_LOCK.acquire(blocking=False):
            self._json({"error": "Another session is already running."}, 409)
            return
        session_owns_lock = False
        try:
            available_models = local_models(provider)
            missing = [f"{agent} model ({assignments[agent]})" for agent in FLOW[room]
                       if assignments[agent] not in available_models]
            if missing:
                self._json({"error": "Unavailable local " + ", ".join(missing) + ". Refresh the model list and choose an available model."}, 400)
                return
            if room == "training":
                session_id = create_training_session(provider, assignments)
                cancel = Event()
                with SESSION_CANCELS_LOCK:
                    SESSION_CANCELS[session_id] = cancel
                Thread(target=run_training_session, args=(session_id, prompt, assignments, cancel),
                       name=f"training-session-{session_id}", daemon=True).start()
                session_owns_lock = True
                self._json({"room": room, "session_id": session_id, "status": "running"}, 202)
                return
            add_message(room, "You", prompt)
            transcript = history(room, 14)
            completed = []
            for agent in FLOW[room]:
                answer = provider_chat(provider, assignments[agent], room, agent, transcript, language)
                add_message(room, agent, answer, model=assignments[agent])
                item = {"agent": agent, "content": answer, "created_at": utc_now(), "model": assignments[agent]}
                completed.append(item)
                transcript.append(item)
            self._json({"messages": completed, "room": room, "session_id": None})
        except (TimeoutError, HTTPError, URLError, OSError, ValueError, KeyError, ProviderError) as err:
            self._json({"error": f"The session stopped. Answers already produced were saved. {err}"}, 502)
        finally:
            if not session_owns_lock:
                RUN_LOCK.release()

    def do_DELETE(self):
        if not self._host_valid() or not self._origin_valid():
            self._json({"error": "Cross-origin writes blocked"}, 403)
            return
        if self.path == "/api/openai/connection":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 96 or json.loads(self.rfile.read(size)) != {"confirmRemoval": True}:
                    raise OpenAIConnectionError("Confirm local ChatGPT connection removal.")
                self._json(OPENAI_CONNECTION.remove())
            except (OpenAIConnectionError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path == "/api/openai/advisor-history":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 2 <= size <= 96 or json.loads(self.rfile.read(size)) != {"confirmClearAdvisorHistory": True}:
                    raise ValueError("Confirm local Advisor history deletion.")
                self._json({"state": "CLEARED_LOCALLY", "deleted": clear_advisor_history()})
            except (ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path != "/api/training/provider-credentials":
            self._json({"error": "Unknown endpoint"}, 404)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 2 <= size <= 256:
                raise PersonalProviderCredentialError("Invalid provider credential removal request size.")
            provider = credential_removal_request(json.loads(self.rfile.read(size)))
            removed = CREDENTIAL_VAULT.remove(provider)
            self._json({"state": "REMOVED_LOCALLY", "provider": provider, "removed": removed})
        except (CredentialVaultError, PersonalProviderCredentialError, ValueError, TypeError, json.JSONDecodeError) as err:
            self._json({"error": str(err)}, 400)


def main():
    initialize()
    configure_api_logging()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    API_LOGGER.info("Local API server started on %s:%s", HOST, PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        API_LOGGER.info("Local API server stopped")
        server.server_close()


if __name__ == "__main__":
    main()
