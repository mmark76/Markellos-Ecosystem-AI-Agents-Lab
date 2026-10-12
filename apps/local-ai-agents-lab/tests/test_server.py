import importlib.util
import tempfile
import unittest
from pathlib import Path
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
        self.tmp.cleanup()

    def test_rooms_separate_and_persist(self):
        campus.add_message('university', 'Trainer', 'Exercise 1')
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

    def test_openai_compatible_provider_model_discovery(self):
        class Reply:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, *_): return b'{"data":[{"id":"local-model"}]}'
        with patch.object(campus.OPENER, 'open', return_value=Reply()) as open_request:
            self.assertEqual(campus.local_models('lm-studio'), ['local-model'])
            self.assertEqual(campus.local_models('vllm'), ['local-model'])
        self.assertEqual(open_request.call_args_list[0].args[0].full_url, 'http://127.0.0.1:1234/v1/models')
        self.assertEqual(open_request.call_args_list[1].args[0].full_url, 'http://127.0.0.1:8000/v1/models')

    def test_openai_compatible_provider_chat_routing(self):
        class Reply:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, *_): return b'{"data":[{"id":"local-model"}]}'
        class ChatReply(Reply):
            def read(self, *_): return b'{"choices":[{"message":{"content":"Local reply"}}]}'
        for provider, endpoint in (
            ('lm-studio', 'http://127.0.0.1:1234/v1/chat/completions'),
            ('vllm', 'http://127.0.0.1:8000/v1/chat/completions'),
        ):
            with self.subTest(provider=provider), patch.object(campus.OPENER, 'open', side_effect=[Reply(), ChatReply()]) as open_request:
                answer = campus.PROVIDERS.chat(provider, 'local-model', [{'role':'user','content':'hello'}], campus.OPENER)
            self.assertEqual(answer, 'Local reply')
            request = open_request.call_args_list[1].args[0]
            self.assertEqual(request.full_url, endpoint)
            self.assertIn(b'"model": "local-model"', request.data)

    def test_unavailable_provider_is_reported_without_fallback(self):
        with patch.object(campus.OPENER, 'open', side_effect=URLError('offline')):
            status = campus.provider_status('vllm')
        self.assertFalse(status['available'])
        self.assertEqual(status['models'], [])

    def test_agent_prompts_exist(self):
        for flow in campus.FLOW.values():
            for agent in flow:
                self.assertIn(agent, campus.PROMPTS)

    def test_training_flow_defaults_to_one_trainer_and_one_student(self):
        self.assertEqual(campus.FLOW['university'], ['Trainer', 'Student'])

if __name__ == '__main__':
    unittest.main()

class HttpIntegrationTests(unittest.TestCase):
    def test_update_route_returns_only_server_checked_metadata(self):
        from http.server import ThreadingHTTPServer
        from threading import Thread
        from urllib.request import build_opener, ProxyHandler
        import json
        original_port = campus.PORT
        srv = ThreadingHTTPServer(('127.0.0.1', 0), campus.Handler)
        campus.PORT = srv.server_address[1]
        origin = f'http://127.0.0.1:{campus.PORT}'
        thread = Thread(target=srv.serve_forever, daemon=True)
        thread.start()
        try:
            checked = {
                'currentVersion': '0.1.2', 'latestVersion': '0.1.3',
                'available': True,
                'releaseUrl': 'https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/tag/v0.1.3',
                'downloadUrl': '',
            }
            with patch.object(campus, 'check_for_update', return_value=checked) as check:
                with build_opener(ProxyHandler({})).open(origin + '/api/updates') as response:
                    self.assertEqual(json.load(response), checked)
                    self.assertEqual(response.headers['Content-Security-Policy'].split('connect-src ')[1].split(';')[0], "'self'")
            check.assert_called_once_with(campus.APP_VERSION, campus.OPENER)
        finally:
            srv.shutdown(); srv.server_close(); thread.join(timeout=4)
            campus.PORT = original_port

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
                     patch.object(campus, 'provider_chat', side_effect=lambda provider, model, role, previous, language='en': 'Response ' + role):
                    with opener.open(origin + '/api/status') as response:
                        status = json.load(response)
                    self.assertEqual(status['models'], ['qwen3:4b'])
                    with opener.open(origin + '/api/providers/lm-studio/status') as response:
                        lm_studio_status = json.load(response)
                    self.assertEqual(lm_studio_status['provider'], 'lm-studio')
                    self.assertTrue(lm_studio_status['available'])
                    post = json.dumps({'room':'university', 'provider':'ollama', 'model':'qwen3:4b', 'prompt':'Safe code review'}).encode()
                    req = Request(origin + '/api/run', data=post, headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(req) as response:
                        result = json.load(response)
                    self.assertEqual(len(result['messages']), 2)
                    self.assertEqual(len(campus.history('university')), 3)
                    self.assertEqual(len(campus.history('conference')), 0)
                    no_origin = Request(origin + '/api/run', data=post, headers={'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(no_origin)
                    self.assertEqual(error.exception.code, 403)
                    wrong = Request(origin + '/api/run', data=json.dumps({'room':'conference','model':'qwen3:4b','prompt':123}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(wrong)
                    self.assertEqual(error.exception.code, 400)
                    invalid_provider = Request(origin + '/api/run', data=json.dumps({'room':'conference','provider':'remote','model':'qwen3:4b','prompt':'test'}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(invalid_provider)
                    self.assertEqual(error.exception.code, 400)
            finally:
                srv.shutdown(); srv.server_close(); thread.join(timeout=4)
                campus.DB_PATH, campus.PORT = original_db, original_port
