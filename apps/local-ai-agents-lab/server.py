"""Private local Markellos Ecosystem AI Agents Lab + Conference Room starter."""
from __future__ import annotations

import json
import sys
from contextlib import closing
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener

HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
DB_PATH = ROOT / "data" / "campus.sqlite3"
OPENER = build_opener(ProxyHandler({}))  # No environment proxy; loopback only.
RUN_LOCK = Lock()
ROOMS = {"university", "conference"}

# The adapter owns the fixed local Ollama URL. User requests cannot supply an
# endpoint, so the Lab cannot be redirected to a remote service.
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from providers import InferenceProviders, ProviderError
from training import TrainingError, TrainingService
from model_install import ModelInstallError, ModelInstallBusy, OllamaModelInstaller

PROVIDERS = InferenceProviders()
TRAINING = TrainingService(ROOT)
MODEL_INSTALLER = OllamaModelInstaller(OPENER)

PROMPTS = {
    "Trainer": (
        "You are a trainer in the local Markellos Ecosystem AI Agents Lab. "
        "Give a concise practical lesson on the user's topic and one specific exercise. "
        "State clear success criteria. Reply exclusively in English. Maximum 150 words."
    ),
    "Student": (
        "You are an AI student agent studying software engineering. "
        "Read the lesson and solve the exercise practically. "
        "Separate what you know from what you assume. You have no access to the filesystem or GitHub. "
        "Reply exclusively in English. Maximum 150 words."
    ),
    "Planner": (
        "You are a Planner in an AI Conference Room. "
        "Break the topic into clear goals, options, uncertainties, and a practical next step. "
        "Do not claim access to projects or files. Reply exclusively in English. Maximum 150 words."
    ),
    "Researcher": (
        "You are a Researcher in an AI Conference Room. Read the Planner's view. "
        "Add helpful explanations, examples, alternative perspectives, and any uncertainty. "
        "Do not claim access to external sources or files. Reply exclusively in English. Maximum 150 words."
    ),
    "Reviewer": (
        "You are an independent Reviewer in an AI Conference Room. "
        "Review the other proposals for clarity, consistency, missing points, and a safe next step. "
        "Reply exclusively in English. Maximum 150 words."
    ),
}
FLOW = {
    "university": ["Trainer", "Student"],
    "conference": ["Planner", "Researcher", "Reviewer"],
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


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
        db.execute("""CREATE TABLE IF NOT EXISTS training_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL,
            trainer_model TEXT NOT NULL,
            student_model TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        db.execute("CREATE INDEX IF NOT EXISTS idx_room_id ON messages(room,id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)")


def add_message(room: str, agent: str, content: str, session_id: Optional[int] = None):
    with closing(connect()) as db, db:
        db.execute(
            "INSERT INTO messages(room,agent,content,created_at,session_id) VALUES(?,?,?,?,?)",
            (room, agent, content[:12000], utc_now(), session_id),
        )


def create_training_session(provider: str, trainer_model: str, student_model: str) -> int:
    """Persist a model snapshot for one Training Lab run without changing old history."""
    with closing(connect()) as db, db:
        result = db.execute(
            "INSERT INTO training_sessions(provider,trainer_model,student_model,created_at) VALUES(?,?,?,?)",
            (provider, trainer_model, student_model, utc_now()),
        )
    return result.lastrowid


def history(room: str, limit: int = 80) -> list[dict]:
    with closing(connect()) as db, db:
        rows = db.execute(
            "SELECT messages.id,messages.agent,messages.content,messages.created_at,messages.session_id,"
            " CASE messages.agent WHEN 'Trainer' THEN training_sessions.trainer_model"
            " WHEN 'Student' THEN training_sessions.student_model END AS model"
            " FROM (SELECT id,agent,content,created_at,session_id FROM messages WHERE room=?"
            " ORDER BY id DESC LIMIT ?) AS messages"
            " LEFT JOIN training_sessions ON training_sessions.id=messages.session_id"
            " ORDER BY messages.id ASC", (room, limit)
        ).fetchall()
    return [dict(row) for row in rows]


def clear_history(room: str) -> int:
    """Delete only the saved conversation for one known local room."""
    with closing(connect()) as db, db:
        result = db.execute("DELETE FROM messages WHERE room=?", (room,))
    return result.rowcount


def local_models(provider: str = "ollama") -> list[str]:
    """Return models from one allow-listed local inference provider."""
    return PROVIDERS.models(provider, OPENER)


def provider_chat(provider: str, model: str, agent: str, transcript: list[dict], language: str = "en") -> str:
    system = PROMPTS[agent] + (" Do not execute commands. Reply exclusively in " + ("Greek" if language == "el" else "English") + ", maintaining standard technical terms. /no_think")
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


class Handler(BaseHTTPRequestHandler):
    server_version = "LocalCampus/0.1"

    def log_message(self, fmt, *args):
        # Deliberately avoid request body logging.
        print("[HTTP]", fmt % args)

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

    def do_GET(self):
        if not self._host_valid():
            self._json({"error": "Invalid Host"}, 403)
            return
        if self.path == "/api/status":
            status = provider_status("ollama")
            self._json({"ollama": status["available"], "models": status["models"],
                        "storage": "local SQLite", "cloud": False, "provider": status})
            return
        if self.path == "/api/models/install/status":
            self._json(MODEL_INSTALLER.status())
            return
        if self.path == "/api/training/status":
            data = TRAINING.availability()
            data.update({"datasets": TRAINING.datasets_list(), "models": TRAINING.models_list()})
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
        pages = {"/": ("index.html", "text/html; charset=utf-8"),
                 "/static/style.css": ("style.css", "text/css; charset=utf-8"),
                 "/static/app.js": ("app.js", "text/javascript; charset=utf-8"),
                 "/static/settings.js": ("settings.js", "text/javascript; charset=utf-8"),
                 "/static/ecosystem-shell.js": ("ecosystem-shell.js", "text/javascript; charset=utf-8"),
                 "/static/ecosystem-tokens.css": ("ecosystem-tokens.css", "text/css; charset=utf-8"),
                 "/static/training.js": ("training.js", "text/javascript; charset=utf-8"),
                 "/static/model-install.js": ("model-install.js", "text/javascript; charset=utf-8"),
                 "/static/panel-layout.js": ("panel-layout.js", "text/javascript; charset=utf-8")}
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
        if self.path == "/api/training/jobs":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 2 or size > 4000:
                    raise TrainingError("Invalid training request size.")
                self._json(TRAINING.start(json.loads(self.rfile.read(size))), 202)
            except (TrainingError, ValueError, TypeError, json.JSONDecodeError) as err:
                self._json({"error": str(err)}, 400)
            return
        if self.path != "/api/run":
            self._json({"error": "Unknown endpoint"}, 404)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 2 or size > 16000:
                raise ValueError("Invalid request size")
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError("Invalid request")
            room = body.get("room", "")
            provider = body.get("provider", "ollama")
            model = body.get("model", "")
            trainer_model = body.get("trainer_model", model)
            student_model = body.get("student_model", model)
            raw_prompt = body.get("prompt", "")
            language = body.get("language", "en")
            if language not in ("en", "el"):
                raise ValueError("Invalid response language")
            if not isinstance(raw_prompt, str):
                raise ValueError("Invalid prompt")
            prompt = raw_prompt.strip()
            if room not in ROOMS or provider != "ollama" or not isinstance(model, str) or not 1 <= len(prompt) <= 2500:
                raise ValueError("Select a room, model, and topic of up to 2,500 characters.")
            if room == "university" and (not isinstance(trainer_model, str) or not isinstance(student_model, str)):
                raise ValueError("Select both a Trainer model and a Student model.")
            PROVIDERS.get(provider)
        except (ValueError, TypeError, json.JSONDecodeError) as err:
            self._json({"error": str(err)}, 400)
            return
        if not RUN_LOCK.acquire(blocking=False):
            self._json({"error": "Another session is already running."}, 409)
            return
        try:
            available_models = local_models(provider)
            assigned_models = ({"Trainer": trainer_model, "Student": student_model}
                               if room == "university" else {agent: model for agent in FLOW[room]})
            missing = [f"{agent} model ({assigned_models[agent]})" for agent in FLOW[room]
                       if assigned_models[agent] not in available_models]
            if missing:
                self._json({"error": "Unavailable local " + ", ".join(missing) + ". Refresh the model list and choose an available model."}, 400)
                return
            session_id = (create_training_session(provider, trainer_model, student_model)
                          if room == "university" else None)
            add_message(room, "You", prompt, session_id)
            transcript = history(room, 14)
            completed = []
            for agent in FLOW[room]:
                answer = provider_chat(provider, assigned_models[agent], agent, transcript, language)
                add_message(room, agent, answer, session_id)
                item = {"agent": agent, "content": answer, "created_at": utc_now(),
                        "model": assigned_models[agent], "session_id": session_id}
                completed.append(item)
                transcript.append(item)
            self._json({"messages": completed, "room": room, "session_id": session_id})
        except (TimeoutError, HTTPError, URLError, OSError, ValueError, KeyError, ProviderError) as err:
            self._json({"error": f"The session stopped. Answers already produced were saved. {err}"}, 502)
        finally:
            RUN_LOCK.release()


def main():
    initialize()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Markellos Ecosystem AI Agents Lab — http://{HOST}:{PORT}/")
    print(f"Database: {DB_PATH}")
    print("Local operation only. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
