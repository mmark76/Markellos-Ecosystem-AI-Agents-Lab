import importlib.util
import json
import tempfile
import time
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

    def test_ollama_unavailable_is_reported_without_fallback(self):
        with patch.object(campus.OPENER, 'open', side_effect=URLError('offline')):
            status = campus.provider_status('ollama')
        self.assertFalse(status['available'])
        self.assertEqual(status['models'], [])

    def test_non_ollama_provider_is_not_supported(self):
        with self.assertRaises(campus.ProviderError):
            campus.PROVIDERS.get('lm-studio')

    def test_agent_prompts_exist(self):
        for flow in campus.FLOW.values():
            for agent in flow:
                self.assertIn(agent, campus.PROMPTS)

    def test_training_flow_defaults_to_one_trainer_and_one_student(self):
        self.assertEqual(campus.FLOW['university'], ['Trainer', 'Student'])

    def test_training_session_status_migration_preserves_existing_history(self):
        session_id = campus.create_training_session('ollama', 'gpt-oss:20b', 'qwen3:8b')
        campus.add_message('university', 'You', 'Teach chess', session_id)
        campus.initialize()
        session = campus.training_session(session_id)
        self.assertEqual(session['status'], 'running')
        self.assertEqual(session['trainer_model'], 'gpt-oss:20b')
        self.assertEqual(campus.history('university')[0]['content'], 'Teach chess')

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
    def wait_for_session(self, opener, origin, session_id):
        for _ in range(40):
            with opener.open(origin + '/api/runs/' + str(session_id)) as response:
                result = json.load(response)
            if result['session']['status'] != 'running':
                return result
            time.sleep(.02)
        self.fail('training session did not finish')

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
                    with opener.open(origin + '/static/panel-layout.js') as response:
                        panel_layout = response.read().decode('utf-8')
                    self.assertIn("setupResizer('resize-left','left')", panel_layout)
                    post = json.dumps({'room':'university', 'provider':'ollama', 'trainer_model':'qwen3:8b', 'student_model':'gemma3:4b', 'prompt':'Safe code review'}).encode()
                    req = Request(origin + '/api/run', data=post, headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(req) as response:
                        result = json.load(response)
                    self.assertEqual(result['status'], 'running')
                    result = self.wait_for_session(opener, origin, result['session_id'])
                    self.assertEqual(result['session']['status'], 'completed')
                    self.assertEqual(len(result['messages']), 3)
                    self.assertEqual([call.args[1] for call in chat.call_args_list], ['qwen3:8b', 'gemma3:4b'])
                    self.assertEqual([message['model'] for message in result['messages'][1:]], ['qwen3:8b', 'gemma3:4b'])
                    self.assertIsInstance(result['session']['id'], int)
                    self.assertEqual([message['model'] for message in campus.history('university')], [None, 'qwen3:8b', 'gemma3:4b'])
                    self.assertEqual(len(campus.history('conference')), 0)
                    legacy_post = json.dumps({'room':'university', 'provider':'ollama', 'model':'qwen3:8b', 'prompt':'Shared model session'}).encode()
                    legacy_request = Request(origin + '/api/run', data=legacy_post, headers={'Origin':origin, 'Content-Type':'application/json'}, method='POST')
                    with opener.open(legacy_request) as response:
                        legacy_result = json.load(response)
                    legacy_result = self.wait_for_session(opener, origin, legacy_result['session_id'])
                    self.assertEqual(legacy_result['session']['status'], 'completed')
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

    def test_student_failure_preserves_trainer_response_and_session_error(self):
        from http.server import ThreadingHTTPServer
        from threading import Thread
        from urllib.request import Request, build_opener, ProxyHandler
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
                def infer(provider, model, role, previous, language='en'):
                    if role == 'Student':
                        raise campus.ProviderError('simulated local provider failure')
                    return 'Trainer response'
                with patch.object(campus, 'local_models', return_value=['gpt-oss:20b', 'qwen3:8b']), \
                     patch.object(campus, 'provider_chat', side_effect=infer):
                    request = Request(origin + '/api/run', data=json.dumps({
                        'room': 'university', 'provider': 'ollama', 'trainer_model': 'gpt-oss:20b',
                        'student_model': 'qwen3:8b', 'prompt': 'Teach chess'}).encode(),
                        headers={'Origin': origin, 'Content-Type': 'application/json'}, method='POST')
                    with opener.open(request) as response:
                        started = json.load(response)
                    result = self.wait_for_session(opener, origin, started['session_id'])
                self.assertEqual(result['session']['status'], 'failed')
                self.assertIn('Student', result['session']['error'])
                self.assertEqual([message['agent'] for message in result['messages']], ['You', 'Trainer'])
                self.assertEqual(result['messages'][1]['model'], 'gpt-oss:20b')
            finally:
                srv.shutdown(); srv.server_close(); thread.join(timeout=4)
                campus.DB_PATH, campus.PORT = original_db, original_port
