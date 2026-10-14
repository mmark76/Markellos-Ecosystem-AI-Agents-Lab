import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "static"


class FourDepartmentShellTests(unittest.TestCase):
    def test_conference_is_first_and_default(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertLess(html.index('data-room="conference"'), html.index('data-room="training"'))
        self.assertIn('data-room="conference" type="button">▤', html)
        self.assertIn("let room = 'conference'", app)
        self.assertIn("setRoom('conference')", app)

    def test_departments_have_independent_controls_and_routes(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        for room in ('conference', 'training', 'evaluation', 'optimization'):
            self.assertIn(f'data-room="{room}"', html)
        for role in ('planner', 'researcher', 'reviewer', 'trainer', 'student', 'evaluator', 'improver'):
            self.assertIn(f'id="{role}-model"', html)
        for endpoint in ('/api/departments/training-sessions', '/api/departments/scorecards', '/api/departments/proposals'):
            self.assertIn(endpoint, app)

    def test_optimization_is_explicitly_approval_gated_and_not_weight_training(self):
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertIn('Approve proposal', app)
        self.assertIn('Apply approved revision', app)
        self.assertIn('Roll back to this revision', app)
        self.assertIn('does not train model weights', app)

    def test_local_shell_preserves_tokens_and_local_only_boundary(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        self.assertIn('/static/ecosystem-tokens.css', html)
        self.assertIn('LOCAL ONLY', html)
        self.assertIn('var(--font-sans', css)


if __name__ == "__main__":
    unittest.main()
