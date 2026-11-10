"""Loopback listener selection and installation-local runtime discovery."""
import errno
import json
import os
import secrets
import socket
import tempfile
from http.server import ThreadingHTTPServer
from threading import Lock, Timer

HOST = "127.0.0.1"
DEFAULT_PORT = 8765


class TabLifecycle:
    """Track Lab documents; allow a short interval for reload/navigation."""

    def __init__(self, on_last_tab, grace_seconds=10):
        self._on_last_tab = on_last_tab
        self._grace_seconds = grace_seconds
        self._lock = Lock()
        self._active = set()
        self._closed = set()
        self._timer = None
        self._stopping = False

    def enter(self, tab_id):
        with self._lock:
            if self._stopping or tab_id in self._closed:
                return False
            self._active.add(tab_id)
            if self._timer:
                self._timer.cancel()
                self._timer = None
            return True

    def leave(self, tab_id):
        with self._lock:
            if self._stopping:
                return
            self._closed.add(tab_id)  # A late enter must not resurrect this document.
            self._active.discard(tab_id)
            if not self._active and not self._timer:
                marker = object()
                self._timer_marker = marker
                self._timer = Timer(self._grace_seconds, self._finish, args=(marker,))
                self._timer.daemon = True
                self._timer.start()

    def _finish(self, marker):
        with self._lock:
            if self._active or self._stopping or not self._timer or self._timer_marker is not marker:
                return
            self._timer = None
            self._stopping = True
        self._on_last_tab()


class LocalServer(ThreadingHTTPServer):
    # SO_REUSEADDR on Windows can allow a second process to bind the same port.
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def bind_server(handler, preferred=DEFAULT_PORT):
    try:
        return LocalServer((HOST, preferred), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE and getattr(error, "winerror", None) != 10048:
            raise
        return LocalServer((HOST, 0), handler)


def publish_state(data_dir, port):
    """Publish only after bind; consumers must independently verify the PID and listener."""
    data_dir.mkdir(parents=True, exist_ok=True)
    state = {"pid": os.getpid(), "port": port, "nonce": secrets.token_hex(16)}
    fd, name = tempfile.mkstemp(prefix=".runtime-", suffix=".tmp", dir=data_dir)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            json.dump(state, output)
        os.replace(name, data_dir / "runtime.json")
    finally:
        if os.path.exists(name):
            os.unlink(name)
    return state
