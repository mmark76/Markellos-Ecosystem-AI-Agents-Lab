"""Static contracts for the approved five-Lab, fifteen-agent architecture."""
import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("five_lab_server", ROOT / "server.py")
server = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(server)


class FiveLabArchitectureTests(unittest.TestCase):
    def test_exactly_five_labs_and_fifteen_scoped_agents(self):
        expected = {
            "conference": ("Strategist", "Analyst", "Engineer"),
            "training": ("Tutor", "Student", "Evaluator", "Improver"),
            "evaluation": ("Assessor", "Scorer", "Benchmarker"),
            "advisory": ("Analyst", "Advisor"),
            "optimization": ("Diagnostician", "Optimizer", "Validator"),
        }
        self.assertEqual(set(server.LABS), set(expected))
        self.assertEqual({name: tuple(server.FLOW[name]) for name in expected}, expected)
        self.assertEqual(len(server.PROMPT_ROLES), 15)
        self.assertEqual(set(server.PROMPTS), {f"{lab}:{role}" for lab, roles in expected.items() for role in roles})
        self.assertEqual(len(set(server.PROMPTS)), 15)

    def test_prompts_are_distinct_and_keep_execution_boundaries(self):
        for role_id, prompt in server.PROMPTS.items():
            with self.subTest(role_id=role_id):
                self.assertTrue(prompt)
                self.assertTrue((ROOT / "prompts" / (role_id.replace(":", "-").lower() + ".txt")).is_file())
        for role_id in ("conference:Engineer", "advisory:Advisor", "optimization:Optimizer"):
            self.assertIn(role_id, server.PROMPTS)

    def test_all_lab_navigation_and_dynamic_model_selection_are_active(self):
        html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
        app = (ROOT / "static" / "app.js").read_text(encoding="utf-8")
        for room in server.LABS:
            self.assertIn(f'data-room="{room}"', html)
            self.assertIn(f"{room}: {{", app)
        navigation = html.split('<div class="room-navigation"', 1)[1].split('</div>', 1)[0]
        self.assertNotIn("Under Construction", navigation)
        self.assertIn("room-model-selects", html)
        self.assertIn("models,prompt", app)

    def test_legacy_roles_are_displayed_compatibly(self):
        self.assertEqual(server.display_role("training", "Trainer"), "Tutor")
        self.assertEqual(server.display_role("conference", "Planner"), "Strategist")
        self.assertEqual(server.agent_id("advisory", "Analyst"), "advisory:Analyst")


if __name__ == "__main__":
    unittest.main()
