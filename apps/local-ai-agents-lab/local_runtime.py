"""Loopback listener selection and installation-local runtime discovery."""
import errno
import json
import os
import secrets
import socket
import tempfile
from http.server import ThreadingHTTPServer

HOST = "127.0.0.1"
DEFAULT_PORT = 8765


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
