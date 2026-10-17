"""Static Local Lab shell contracts."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "static"


class EcosystemShellTests(unittest.TestCase):
    def setUp(self):
        self.html = (STATIC / "index.html").read_text(encoding="utf-8")
        self.app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.css = (STATIC / "style.css").read_text(encoding="utf-8")

    def test_five_active_lab_navigation_has_no_unavailable_room(self):
        navigation = self.html.split('<div class="label">WORKSPACE</div>', 1)[1].split('<div class="label section-gap">', 1)[0]
        rooms = ("conference", "training", "evaluation", "advisory", "optimization")
        names = ("Conference Room", "Training Lab", "Evaluation Lab", "Advisory Lab", "Optimization Lab")
        for room, name in zip(rooms, names):
            self.assertIn(f'data-room="{room}"', navigation)
            self.assertIn(name, navigation)
        self.assertNotIn("workspace-nav-unavailable", navigation)

    def test_approved_workflows_and_dynamic_agent_model_controls(self):
        for workflow in (
            "Strategist → Analyst → Engineer",
            "Tutor → Student → Evaluator → Improver",
            "Assessment → Scoring → Benchmarking",
            "Analysis → Recommendations",
            "Diagnose → Optimize → Validate",
        ):
            self.assertIn(workflow, self.app)
        self.assertIn('id="room-model-selects"', self.html)
        self.assertIn("Object.fromEntries(LABS[room].roles.map", self.app)
        self.assertIn("localStorage", self.app)

    def test_local_only_boundaries_remain_visible(self):
        installer = (STATIC / "model-install.js").read_text(encoding="utf-8")
        self.assertIn('Inference Engine: <strong>Ollama</strong>', self.html)
        self.assertIn("Agents have no access to files, commands, or network services.", self.app)
        for removed in ("LM Studio", "vLLM", 'id="provider"', "$('provider')"):
            self.assertNotIn(removed, self.html + self.app + installer)

    def test_existing_shell_controls_and_training_progress_remain(self):
        for item in ('id="settings-toggle"', 'id="composer"', 'id="training-stages"',
                     'id="cancel-training"', '/api/training-sessions/',
                     'setInterval(refreshTrainingSession,1000)'):
            self.assertIn(item, self.html + self.app)
        self.assertIn('/static/ecosystem-tokens.css', self.html)
        self.assertIn('var(--font-sans', self.css)

    def test_personal_provider_surface_is_visible_but_training_remains_locked(self):
        planner = (STATIC / "personal-provider.js").read_text(encoding="utf-8")
        for label in (
            "Advanced: Personal Fine-Tuning Provider",
            "Your provider account",
            "Personal spending currency",
            "EUR (€)",
            "USD ($)",
            "RunPod's listed GPU prices are shown in USD; no currency conversion is performed.",
            "Set a plan, then connect your own provider account. No paid job is started automatically.",
            "I will use my own provider account and accept its charges.",
            "RunPod API tokens and SSH public keys are credentials that only enable a direct connection to your own RunPod account or an already-running server.",
            "By themselves, they cannot create a server, start a job, or charge your account.",
            "Use the official RunPod Console to connect to and manage your own RunPod servers;",
            "the Lab cannot create a provider resource or charge your account.",
            "An OpenAI API key is also a connection credential.",
            "This Lab does not accept, store, or use OpenAI API keys, and it cannot make OpenAI API requests or charges.",
            "OpenAI API usage is managed directly in your own OpenAI API Platform account.",
            "Check your RunPod account",
            "Check RunPod connection",
        ):
            with self.subTest(label=label):
                self.assertIn(label, self.html)
        self.assertIn('/static/personal-provider.js', self.html)
        self.assertIn('id="open-runpod-console"', self.html)
        self.assertIn('href="https://console.runpod.io/" target="_blank" rel="noopener noreferrer"', self.html)
        self.assertIn('id="open-openai-platform"', self.html)
        self.assertIn('href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer"', self.html)
        self.assertIn('.personal-credential-remove{', self.css)
        self.assertIn('background:var(--color-error)!important', self.css)
        self.assertIn('color:#fff!important', self.css)
        for path in (
            '/api/training/provider-plan',
            '/api/training/provider-credentials',
            '/api/training/provider-connection',
        ):
            with self.subTest(path=path):
                self.assertIn(path, planner)
        self.assertNotIn('localStorage', planner)
        self.assertNotIn('console.', planner)
        self.assertNotIn('api.runpod.io', planner)

    def test_legacy_roles_are_not_present_in_active_browser_workflow(self):
        for retired in ("Planner", "Researcher", "Reviewer", "Trainer"):
            self.assertNotIn(retired, self.app)
        self.assertNotRegex(self.html.lower(), r"uni" r"versity")
        self.assertNotRegex(self.app.lower(), r"uni" r"versity")


if __name__ == "__main__":
    unittest.main()
