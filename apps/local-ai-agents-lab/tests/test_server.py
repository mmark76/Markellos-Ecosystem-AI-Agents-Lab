import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

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
        self.tmp.cleanup()

    def test_rooms_separate_and_persist(self):
        campus.add_message('university', 'Καθηγητής', 'Άσκηση 1')
        campus.add_message('conference', 'Architect', 'Design review')
        self.assertEqual(len(campus.history('university')), 1)
        self.assertEqual(campus.history('conference')[0]['agent'], 'Architect')

    def test_cloud_models_filtered(self):
        class Reply:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, *_):
                return b'{"models":[{"name":"qwen3:4b"},{"name":"other:cloud"},{"name":"remote-cloud"}]}'
        with patch.object(campus.OPENER, 'open', return_value=Reply()):
            self.assertEqual(campus.local_models(), ['qwen3:4b'])

    def test_agent_prompts_exist(self):
        for flow in campus.FLOW.values():
            for agent in flow:
                self.assertIn(agent, campus.PROMPTS)

if __name__ == '__main__':
    unittest.main()

class HttpIntegrationTests(unittest.TestCase):
    def test_routes_origin_and_agent_turns(self):
        from http.server import ThreadingHTTPServer
        from threading import Thread
        from urllib.request import Request, build_opener, ProxyHandler
        from urllib.error import HTTPError
        import json
        original_db, original_port = campus.DB_PATH, campus.PORT
        with tempfile.TemporaryDirectory() as temp:
            campus.DB_PATH = Path(temp) / 'data' / 'campus.sqlite3'
            campus.initialize()
            srv = ThreadingHTTPServer(('127.0.0.1', 0), campus.Handler)
            campus.PORT = srv.server_address[1]
            origin = f'http://127.0.0.1:{campus.PORT}'
            thread = Thread(target=srv.serve_forever, daemon=True)
            thread.start()
            opener = build_opener(ProxyHandler({}))
            try:
                with patch.object(campus, 'local_models', return_value=['qwen3:4b']), \
                     patch.object(campus, 'ollama_chat', side_effect=lambda model, role, previous, language='en': 'Απάντηση ' + role):
                    with opener.open(origin + '/api/status') as response:
                        status = json.load(response)
                    self.assertEqual(status['models'], ['qwen3:4b'])
                    post = json.dumps({'room':'university', 'model':'qwen3:4b', 'prompt':'Safe code review'}).encode()
                    req = Request(origin + '/api/run', data=post, headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(req) as response:
                        result = json.load(response)
                    self.assertEqual(len(result['messages']), 4)
                    self.assertEqual(len(campus.history('university')), 5)
                    self.assertEqual(len(campus.history('conference')), 0)
                    no_origin = Request(origin + '/api/run', data=post, headers={'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(no_origin)
                    self.assertEqual(error.exception.code, 403)
                    wrong = Request(origin + '/api/run', data=json.dumps({'room':'conference','model':'qwen3:4b','prompt':123}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(wrong)
                    self.assertEqual(error.exception.code, 400)
            finally:
                srv.shutdown(); srv.server_close(); thread.join(timeout=4)
                campus.DB_PATH, campus.PORT = original_db, original_port
