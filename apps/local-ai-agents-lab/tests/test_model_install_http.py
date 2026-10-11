"""HTTP boundary checks for explicit, locally initiated model installation."""
import importlib.util
import json
import tempfile
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, build_opener, ProxyHandler

SPEC = importlib.util.spec_from_file_location("model_install_http_server", Path(__file__).resolve().parents[1] / "server.py")
server = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(server)


class ModelInstallHttpTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_port, self.original_db = server.PORT, server.DB_PATH
        server.DB_PATH = Path(self.tmp.name) / "data" / "campus.sqlite3"
        server.initialize()
        self.web = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        server.PORT = self.web.server_address[1]
        self.url = f"http://127.0.0.1:{server.PORT}"
        self.thread = Thread(target=self.web.serve_forever, daemon=True)
        self.thread.start()
        self.opener = build_opener(ProxyHandler({}))

    def tearDown(self):
        self.web.shutdown()
        self.web.server_close()
        self.thread.join(timeout=4)
        server.DB_PATH, server.PORT = self.original_db, self.original_port
        self.tmp.cleanup()

    def request(self, payload, origin=True):
        headers = {"Content-Type": "application/json"}
        if origin:
            headers["Origin"] = self.url
        return Request(self.url + "/api/models/install",
                       data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    def test_status_and_allowed_post_are_local(self):
        with patch.object(server.MODEL_INSTALLER, "status", return_value={"state": "idle"}) as status:
            with self.opener.open(self.url + "/api/models/install/status") as result:
                self.assertEqual(json.load(result)["state"], "idle")
            status.assert_called_once()
        with patch.object(server.MODEL_INSTALLER, "start", return_value={"state": "running", "model": "gemma3:4b"}) as start:
            with self.opener.open(self.request({"model": "gemma3:4b"})) as result:
                self.assertEqual(result.status, 202)
                self.assertEqual(json.load(result)["model"], "gemma3:4b")
            start.assert_called_once_with("gemma3:4b")

    def test_rejects_missing_origin_and_non_model_payload(self):
        for req, expected in ((self.request({"model": "gemma3:4b"}, origin=False), 403),
                              (self.request({"model": "gemma3:4b", "url": "https://example.test"}), 400),
                              (self.request({"model": "../bad"}), 400)):
            with self.subTest(expected=expected), self.assertRaises(HTTPError) as err:
                self.opener.open(req)
            self.assertEqual(err.exception.code, expected)


if __name__ == "__main__":
    unittest.main()
