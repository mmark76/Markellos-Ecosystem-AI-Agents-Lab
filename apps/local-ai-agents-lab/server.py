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

# The adapter registry owns the fixed local provider URLs. User requests cannot
# supply an endpoint, so the Lab cannot be redirected to a remote service.
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from providers import InferenceProviders, ProviderError

PROVIDERS = InferenceProviders()

PROMPTS = {
    "Καθηγητής": (
        "Είσαι καθηγητής στο τοπικό Markellos Ecosystem AI Agents Lab. "
        "Δώσε σύντομο πρακτικό μάθημα πάνω στο θέμα του χρήστη και μία συγκεκριμένη άσκηση. "
        "Διατύπωσε σαφή κριτήρια επιτυχίας. Maximum 150 words."
    ),
    "Φοιτητής Α": (
        "Είσαι AI agent που σπουδάζει software engineering. "
        "Διάβασε το μάθημα και λύσε πρακτικά την άσκηση. "
        "Ξεχώρισε τι γνωρίζεις από τι υποθέτεις. Δεν έχεις πρόσβαση στο filesystem ή GitHub. "
        "Maximum 150 words."
    ),
    "Φοιτητής Β": (
        "Είσαι δεύτερος AI agent-φοιτητής. "
        "Διάβασε όσα ειπώθηκαν, εντόπισε σφάλματα ή κενά και πρότεινε εναλλακτική λύση. "
        "Δεν διαθέτεις εξωτερικά εργαλεία. Maximum 150 words."
    ),
    "Καθηγητής · Feedback": (
        "Είσαι καθηγητής που αξιολογεί τις προηγούμενες απαντήσεις στην άσκηση. "
        "Δώσε ανατροφοδότηση, συγκεκριμένα σωστά/λάθη και ένα μικρό επόμενο βήμα. "
        "Μη δηλώνεις βελτίωση εάν δεν αποδεικνύεται από ανεξάρτητο τεστ. "
        "Maximum 150 words."
    ),
    "Architect": (
        "Είσαι Software Architect σε AI Conference Room. "
        "Ανάλυσε το αίτημα με μικρό ελεγχόμενο scope, τεχνικά boundaries και κινδύνους. "
        "Μη δηλώνεις πρόσβαση σε έργα ή αρχεία. Maximum 150 words."
    ),
    "Developer": (
        "Είσαι Developer σε AI Conference Room. Διάβασε την άποψη του Architect. "
        "Πρότεινε ρεαλιστικά βήματα υλοποίησης, tests και τυχόν διαφωνίες. "
        "Δεν εκτελείς κώδικα ούτε αλλάζεις αρχεία. Maximum 150 words."
    ),
    "Reviewer": (
        "Είσαι ανεξάρτητος Reviewer σε AI Conference Room. "
        "Έλεγξε όσα πρότειναν οι άλλοι για ασφάλεια, regressions, κενά τεκμηρίωσης και verification. "
        "Κατέγραψε τι απαιτεί έγκριση του χρήστη. Maximum 150 words."
    ),
}
FLOW = {
    "university": ["Καθηγητής", "Φοιτητής Α", "Φοιτητής Β", "Καθηγητής · Feedback"],
    "conference": ["Architect", "Developer", "Reviewer"],
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
        db.execute("CREATE INDEX IF NOT EXISTS idx_room_id ON messages(room,id)")


def add_message(room: str, agent: str, content: str):
    with closing(connect()) as db, db:
        db.execute(
            "INSERT INTO messages(room,agent,content,created_at) VALUES(?,?,?,?)",
            (room, agent, content[:12000], utc_now()),
        )


def history(room: str, limit: int = 80) -> list[dict]:
    with closing(connect()) as db, db:
        rows = db.execute(
            "SELECT id,agent,content,created_at FROM ("
            " SELECT id,agent,content,created_at FROM messages WHERE room=?"
            " ORDER BY id DESC LIMIT ?) ORDER BY id ASC", (room, limit)
        ).fetchall()
    return [dict(row) for row in rows]


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
        if self.path.startswith("/api/providers/") and self.path.endswith("/status"):
            provider = self.path[len("/api/providers/"):-len("/status")].strip("/")
            try:
                self._json(provider_status(provider))
            except ProviderError:
                self._json({"error": "Unknown inference provider"}, 404)
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
                 "/static/ecosystem-tokens.css": ("ecosystem-tokens.css", "text/css; charset=utf-8")}
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
            raw_prompt = body.get("prompt", "")
            language = body.get("language", "en")
            if language not in ("en", "el"):
                raise ValueError("Invalid response language")
            if not isinstance(raw_prompt, str):
                raise ValueError("Invalid prompt")
            prompt = raw_prompt.strip()
            if room not in ROOMS or not isinstance(provider, str) or not isinstance(model, str) or not 1 <= len(prompt) <= 2500:
                raise ValueError("Επιλέξτε δωμάτιο, μοντέλο και θέμα έως 2.500 χαρακτήρες.")
            PROVIDERS.get(provider)
        except (ValueError, TypeError, json.JSONDecodeError) as err:
            self._json({"error": str(err)}, 400)
            return
        if not RUN_LOCK.acquire(blocking=False):
            self._json({"error": "Άλλη συνεδρία εκτελείται ήδη."}, 409)
            return
        try:
            if model not in local_models(provider):
                self._json({"error": "Select a model exposed by the chosen local provider."}, 400)
                return
            add_message(room, "Εσύ", prompt)
            transcript = history(room, 14)
            completed = []
            for agent in FLOW[room]:
                answer = provider_chat(provider, model, agent, transcript, language)
                add_message(room, agent, answer)
                item = {"agent": agent, "content": answer, "created_at": utc_now()}
                completed.append(item)
                transcript.append(item)
            self._json({"messages": completed, "room": room})
        except (TimeoutError, HTTPError, URLError, OSError, ValueError, KeyError, ProviderError) as err:
            self._json({"error": f"Η συνεδρία διακόπηκε. Οι ήδη παραχθείσες απαντήσεις αποθηκεύτηκαν. {err}"}, 502)
        finally:
            RUN_LOCK.release()


def main():
    initialize()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Markellos Ecosystem AI Agents Lab — http://{HOST}:{PORT}/")
    print(f"Database: {DB_PATH}")
    print("Τοπική λειτουργία μόνο. Ctrl+C για διακοπή.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
