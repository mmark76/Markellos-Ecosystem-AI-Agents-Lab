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
        self.settings = (STATIC / "settings.js").read_text(encoding="utf-8")

    def test_five_active_lab_navigation_has_no_unavailable_room(self):
        navigation = self.html.split('<div class="room-navigation"', 1)[1].split('</div>', 1)[0]
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

    def test_font_choices_remain_accessible_without_native_hover_labels(self):
        for name in ("System", "Modern", "Serif", "Monospace"):
            with self.subTest(name=name):
                self.assertIn(f'aria-label="{name}"', self.html)
        self.assertIn("storageWrite(fontKey, font)", self.settings)
        self.assertIn("el.setAttribute('aria-label',label.fonts[el.dataset.font])", self.settings)
        self.assertNotIn("el.setAttribute('title',label.fonts[el.dataset.font])", self.settings)

    def test_background_choices_remain_accessible_without_native_hover_labels(self):
        for name in ("Default", "Midnight", "Navy", "Forest", "Plum"):
            with self.subTest(name=name):
                self.assertIn(f'aria-label="{name}"', self.html)
        self.assertIn("storageWrite(backgroundKey, background)", self.settings)
        self.assertIn("el.setAttribute('aria-label',label.backgrounds[el.dataset.background])", self.settings)
        self.assertNotIn("el.setAttribute('title',label.backgrounds[el.dataset.background])", self.settings)
        # Preserve the separate accent controls and their existing behavior.
        self.assertIn("el.setAttribute('title',label.colors[el.dataset.accent])", self.settings)

    def test_active_training_stage_has_subtle_full_frame_signal(self):
        self.assertIn("training-stage status-${String(stage.status||'').toLowerCase().replace(/\\s+/g,'-')}", self.app)
        self.assertIn('.training-stage.status-running', self.css)
        self.assertIn('background:color-mix(in srgb,var(--accent) 8%,var(--surface))', self.css)
        self.assertIn('host.append(card);if(response&&scrollTop!==undefined)response.scrollTop=scrollTop', self.app)

    def test_personal_provider_surface_is_visible_but_training_remains_locked(self):
        planner = (STATIC / "personal-provider.js").read_text(encoding="utf-8")
        chatgpt = (STATIC / "openai-connection.js").read_text(encoding="utf-8")
        for label in (
            "Personal Fine-Tuning Provider",
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
            "OpenAI API keys are not accepted, stored, or used by this Lab.",
            "This user-approved connection does not use an API key.",
            "Connecting alone does not send prompts, make an AI request, or create a charge.",
            "ChatGPT Advisor",
            "Connect with ChatGPT",
            "Connect and ask one question",
            "Only the question you submit is sent to ChatGPT.",
            "Your Question",
            "Ask ChatGPT",
            "ChatGPT Answer",
            "Copy Answer",
            "Local Advisor history",
            "Saved on this PC only. It is never sent automatically to ChatGPT.",
            "Clear local history",
            "Check your RunPod account",
            "Check RunPod connection",
        ):
            with self.subTest(label=label):
                self.assertIn(label, self.html)
        self.assertIn('/static/personal-provider.js', self.html)
        self.assertIn('/static/openai-connection.js', self.html)
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
        for path in ('/api/openai/connection', '/api/openai/connection/setup', '/api/openai/review', '/api/openai/advisor-history'):
            with self.subTest(path=path):
                self.assertIn(path, chatgpt)
        self.assertNotIn('localStorage', chatgpt)
        self.assertIn("const advisorSessionKey = 'ai-lab:chatgpt-advisor:last-exchange';", chatgpt)
        self.assertIn('sessionStorage.setItem(advisorSessionKey', chatgpt)
        self.assertIn('sessionStorage.removeItem(advisorSessionKey)', chatgpt)
        self.assertIn('Last answer restored for this browser tab.', chatgpt)
        self.assertIn('refreshAdvisorHistory()', chatgpt)
        self.assertIn('renderAdvisorHistory', chatgpt)
        self.assertIn('confirmClearAdvisorHistory', chatgpt)
        self.assertIn('id="openai-advisor-history"', self.html)
        self.assertIn('id="openai-advisor-history-clear"', self.html)
        self.assertIn('.advisor-local-history{', self.css)
        self.assertNotIn('console.', chatgpt)
        self.assertIn("window.addEventListener('focus', refreshChatgptStatus)", chatgpt)
        self.assertIn("visibilitychange", chatgpt)
        self.assertIn("ask.disabled = true", chatgpt)
        self.assertIn("navigator.clipboard.writeText", chatgpt)
        self.assertIn("document.createElement", chatgpt)
        self.assertNotIn("innerHTML", chatgpt)
        self.assertNotIn('/api/openai/models', chatgpt)
        for obsolete in ('openai-review-room', 'openai-review-mode', 'openai-review-content', 'openai-review-model'):
            with self.subTest(obsolete=obsolete):
                self.assertNotIn(obsolete, self.html + chatgpt)

    def test_connections_open_in_separate_modals_and_rooms_remain_with_agents(self):
        dialogs = (STATIC / "connection-dialogs.js").read_text(encoding="utf-8")
        for item in (
            'id="open-connections-hub"',
            'class="new-feature-badge">NEW FEATURE</span>',
            'id="connections-hub-dialog"',
            'id="open-chatgpt-connection"',
            'id="open-personal-provider"',
            'id="chatgpt-connection-dialog"',
            'id="personal-provider-dialog"',
            '<div class="room-navigation"',
            'Rooms &amp; agents',
        ):
            with self.subTest(item=item):
                self.assertIn(item, self.html)
        self.assertIn("dialog.showModal()", dialogs)
        self.assertIn("dialog.close()", dialogs)
        self.assertIn('#open-connections-hub .new-feature-badge', self.css)
        self.assertIn("a[href=\"/fine-tuning-guide\"]", dialogs)
        self.assertIn("guide) providerSection.querySelector('h3')?.after(guide)", dialogs)
        self.assertIn("connectionsHub?.open", dialogs)

    def test_legacy_roles_are_not_present_in_active_browser_workflow(self):
        for retired in ("Planner", "Researcher", "Reviewer", "Trainer"):
            self.assertNotIn(retired, self.app)
        self.assertNotRegex(self.html.lower(), r"uni" r"versity")
        self.assertNotRegex(self.app.lower(), r"uni" r"versity")


if __name__ == "__main__":
    unittest.main()
