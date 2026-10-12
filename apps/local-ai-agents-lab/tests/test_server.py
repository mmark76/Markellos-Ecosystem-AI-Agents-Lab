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
        campus.add_message('conference', 'Planner', 'Discussion plan')
        self.assertEqual(len(campus.history('university')), 1)
        self.assertEqual(campus.history('conference')[0]['agent'], 'Planner')

    def test_clear_history_only_removes_the_selected_room(self):
        campus.add_message('university', 'Trainer', 'Exercise 1')
        campus.add_message('conference', 'Planner', 'Discussion plan')
        self.assertEqual(campus.clear_history('university'), 1)
        self.assertEqual(campus.history('university'), [])
        self.assertEqual(len(campus.history('conference')), 1)

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

    def test_initialize_migrates_existing_messages_without_losing_history(self):
        campus.add_message('university', 'Trainer', 'Existing lesson')
        campus.initialize()
        self.assertEqual(campus.history('university')[0]['content'], 'Existing lesson')
        with campus.closing(campus.connect()) as db:
            columns = {row[1] for row in db.execute('PRAGMA table_info(messages)')}
        self.assertIn('session_id', columns)

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
                with patch.object(campus, 'local_models', return_value=['qwen3:8b', 'gemma3:4b']), \
                     patch.object(campus, 'provider_chat', side_effect=lambda provider, model, role, previous, language='en': 'Response ' + role) as chat:
                    with opener.open(origin + '/api/status') as response:
                        status = json.load(response)
                    self.assertEqual(status['models'], ['qwen3:8b', 'gemma3:4b'])
                    with opener.open(origin + '/api/providers/lm-studio/status') as response:
                        lm_studio_status = json.load(response)
                    self.assertEqual(lm_studio_status['provider'], 'lm-studio')
                    self.assertTrue(lm_studio_status['available'])
                    with opener.open(origin + '/static/panel-layout.js') as response:
                        panel_layout = response.read().decode('utf-8')
                    self.assertIn("setupResizer('resize-left','left')", panel_layout)
                    post = json.dumps({'room':'university', 'provider':'ollama', 'trainer_model':'qwen3:8b', 'student_model':'gemma3:4b', 'prompt':'Safe code review'}).encode()
                    req = Request(origin + '/api/run', data=post, headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(req) as response:
                        result = json.load(response)
                    self.assertEqual(len(result['messages']), 2)
                    self.assertEqual([call.args[1] for call in chat.call_args_list], ['qwen3:8b', 'gemma3:4b'])
                    self.assertEqual([message['model'] for message in result['messages']], ['qwen3:8b', 'gemma3:4b'])
                    self.assertIsInstance(result['session_id'], int)
                    self.assertEqual([message['model'] for message in campus.history('university')], [None, 'qwen3:8b', 'gemma3:4b'])
                    self.assertEqual(len(campus.history('conference')), 0)
                    legacy_post = json.dumps({'room':'university', 'provider':'ollama', 'model':'qwen3:8b', 'prompt':'Shared model session'}).encode()
                    legacy_request = Request(origin + '/api/run', data=legacy_post, headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(legacy_request) as response:
                        legacy_result = json.load(response)
                    self.assertEqual([message['model'] for message in legacy_result['messages']], ['qwen3:8b', 'qwen3:8b'])
                    self.assertEqual([message['model'] for message in campus.history('university')][-2:], ['qwen3:8b', 'qwen3:8b'])
                    unavailable = Request(origin + '/api/run', data=json.dumps({'room':'university', 'provider':'ollama', 'trainer_model':'missing:1b', 'student_model':'gemma3:4b', 'prompt':'Safe code review'}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(unavailable)
                    self.assertEqual(error.exception.code, 400)
                    self.assertIn('Trainer model (missing:1b)', error.exception.read().decode())
                    clear = Request(origin + '/api/history/clear', data=json.dumps({'room':'university'}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(clear) as response:
                        self.assertEqual(json.load(response), {'room':'university', 'deleted':6})
                    self.assertEqual(campus.history('university'), [])
                    no_origin = Request(origin + '/api/run', data=post, headers={'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(no_origin)
                    self.assertEqual(error.exception.code, 403)
                    wrong = Request(origin + '/api/run', data=json.dumps({'room':'conference','model':'qwen3:8b','prompt':123}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(wrong)
                    self.assertEqual(error.exception.code, 400)
                    invalid_provider = Request(origin + '/api/run', data=json.dumps({'room':'conference','provider':'remote','model':'qwen3:8b','prompt':'test'}).encode(), headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with self.assertRaises(HTTPError) as error:
                        opener.open(invalid_provider)
                    self.assertEqual(error.exception.code, 400)
            finally:
                srv.shutdown(); srv.server_close(); thread.join(timeout=4)
                campus.DB_PATH, campus.PORT = original_db, original_port
