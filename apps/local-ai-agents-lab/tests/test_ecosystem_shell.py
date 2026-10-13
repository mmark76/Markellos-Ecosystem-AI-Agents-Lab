import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "static"

class EcosystemShellTests(unittest.TestCase):
    def test_local_shell_uses_shared_tokens(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        self.assertIn('/static/ecosystem-tokens.css', html)
        self.assertIn('var(--font-sans', css)
        self.assertIn('var(--sidebar-default', css)

    def test_project_navigation_and_local_controls_preserved(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        for name in ('data-room="training"', 'data-room="conference"',
                     'id="settings-toggle"', 'id="model"',
                     'id="trainer-model"', 'id="student-model"', 'id="evaluator-model"', 'id="improver-model"',
                     'id="composer"'):
            with self.subTest(name=name):
                self.assertIn(name, html)
        self.assertIn("Planner", app)
        self.assertIn("Reviewer", app)
        self.assertNotIn('Architect → Developer → Reviewer', app)

    def test_agent_collaboration_remains_visible_but_is_temporarily_unavailable(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertIn('data-room="conference" type="button" disabled', html)
        self.assertIn('Agent Collaboration', html)
        self.assertIn('Under Construction', html)
        self.assertIn("'conference'", app)

    def test_training_topic_precedes_the_scrollable_conversation(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        self.assertLess(html.index('id="composer"'), html.index('class="chat-panel"'))
        self.assertIn('class="beta-badge">BETA</span>', html)
        self.assertIn('.chat-panel{min-height:0;overflow-x:hidden;overflow-y:auto', css)

    def test_training_surfaces_use_clearer_panel_borders(self):
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        self.assertIn('--panel-border:#3f5b66', css)
        self.assertIn('--panel-border:#b6c6d0', css)
        self.assertIn('.composer,textarea,.empty,.training-stage{border-color:var(--panel-border)}', css)

    def test_lab_is_ollama_only_without_a_provider_selector(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        installer = (STATIC / "model-install.js").read_text(encoding="utf-8")
        self.assertIn('Inference Engine: <strong>Ollama</strong>', html)
        for removed in ('id="provider"', 'LM Studio', 'vLLM', 'providerIds', "$('provider')"):
            with self.subTest(removed=removed):
                self.assertNotIn(removed, html + app + installer)

    def test_training_models_are_independent_and_persisted_locally(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        for selector in ('Trainer Model', 'Student Model', 'Evaluator Model', 'Improver Model', 'id="training-model-selects"'):
            with self.subTest(selector=selector): self.assertIn(selector, html)
        for key in ('agents-lab-trainer-model', 'agents-lab-student-model', 'agents-lab-evaluator-model', 'agents-lab-improver-model', 'agents-lab-model'):
            with self.subTest(key=key): self.assertIn(key, app)
        self.assertIn('trainer_model:trainerModel', app)
        self.assertIn('student_model:studentModel', app)
        self.assertIn('evaluator_model:evaluatorModel', app)
        self.assertIn('improver_model:improverModel', app)
        self.assertIn("model.className='model-name'", app)

    def test_four_stage_progress_and_cancellation_are_visible(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        for name in ('id="training-stages"', 'id="cancel-training"'):
            with self.subTest(name=name): self.assertIn(name, html)
        for name in ('LEARN - Trainer', 'PRACTICE - Student', 'EVALUATE - Evaluator', 'IMPROVE - Improver',
                     '/api/training-sessions/', 'setInterval(refreshTrainingSession,1000)'):
            with self.subTest(name=name): self.assertIn(name, app)

    def test_language_selectors_are_removed_and_runtime_is_english_only(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        settings = (STATIC / "settings.js").read_text(encoding="utf-8")
        shell = (STATIC / "ecosystem-shell.js").read_text(encoding="utf-8")
        for selector in ('id="ui-language"', 'id="response-language"',
                         'id="ui-language-label"', 'id="response-language-label"'):
            with self.subTest(selector=selector):
                self.assertNotIn(selector, html)
        for script in (app, settings, shell):
            with self.subTest(script=script[:24]):
                self.assertNotIn("$('ui-language')", script)
                self.assertNotIn("$('response-language')", script)
        self.assertNotIn("agents-lab-ui-language", app)
        self.assertNotIn("agents-lab-response-language", app)
        self.assertIn('language:responseLanguage', app)
        self.assertNotIn('document.documentElement.lang', settings)
        self.assertNotIn('document.documentElement.lang', shell)
        for source in (html, app, settings, shell):
            self.assertNotRegex(source, r'[\u0370-\u03ff]')

    def test_canonical_header_and_footer_elements(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        for name in ('href="https://markellosecosystem.com/"',
                     'id="quick-mode"', 'id="info-toggle"',
                     'id="lab-info"', 'class="build-id"',
                     'Markellos Markides. All rights reserved.'):
            with self.subTest(name=name):
                self.assertIn(name, html)

    def test_application_controls_are_in_the_left_sidebar(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        sidebar = html[html.index('<aside class="sidebar"'):html.index('</aside>')]
        header = html[html.index('<header class="top">'):html.index('</header>')]
        for control in ('id="quick-mode"', 'id="info-toggle"', 'id="settings-toggle"'):
            with self.subTest(control=control):
                self.assertIn(control, sidebar)
                self.assertNotIn(control, header)
        self.assertIn('class="sidebar-utility-actions"', sidebar)
        self.assertIn('id="ecosystem-link"', header)

    def test_three_panel_workspace_controls_are_packaged(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        script = (STATIC / "panel-layout.js").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        for name in ('id="left-panel"', 'id="right-panel"', 'id="resize-left"', 'id="resize-right"',
                     'id="toggle-left"', 'id="toggle-right"', '/static/panel-layout.js'):
            with self.subTest(name=name): self.assertIn(name, html)
        self.assertIn("localStorage", script)
        self.assertIn("window.addEventListener('pointermove'", script)
        self.assertIn("setWidth(widthProperty,expanded?stored(storageKey,fallback):0)", script)
        self.assertIn("setWidth(resizerProperty,expanded?14:0)", script)
        self.assertIn("window.addEventListener('pointerup'", script)
        self.assertIn("event.preventDefault();activeResize={resize}", script)
        for name in ('class="panel-toggle-icon"', 'aria-label="Hide left sidebar"', 'aria-label="Hide right sidebar"'):
            with self.subTest(name=name): self.assertIn(name, html)
        self.assertIn("const action=`${expanded?'Hide':'Show'} ${side} sidebar`", script)
        self.assertIn("toggle.setAttribute('aria-label',action)", script)
        self.assertNotIn('panel-toggle-label', html)
        self.assertNotIn('◀', html)
        self.assertNotIn('▶', html)
        self.assertIn('height:calc(100% - 48px)', css)
        self.assertIn('margin-top:48px', css)
        self.assertIn('.workspace-main.main{overflow:hidden}', css)
        self.assertIn('.panel-content{min-height:0;overflow-x:hidden;overflow-y:auto;scrollbar-gutter:stable}', css)
        self.assertIn('.workspace-main .chat-panel{min-height:0;overflow-x:hidden;overflow-y:auto;scrollbar-gutter:stable}', css)
        self.assertIn('.shell.left-collapsed{--left-panel:0px;--left-resizer:0px}', css)
        self.assertIn('.shell.right-collapsed{--right-panel:0px;--right-resizer:0px}', css)
        self.assertIn('.shell.left-collapsed .sidebar,.shell.right-collapsed .inspector{z-index:5;overflow:visible}', css)
        self.assertIn('.shell.left-collapsed .sidebar .panel-toggle{position:fixed;top:18px;right:auto;left:8px;z-index:30}', css)
        self.assertIn('.shell.right-collapsed .inspector .panel-toggle{position:fixed;top:18px;right:8px;left:auto;z-index:30}', css)
        for removed in ('id="update-check"', 'id="update-status"', '/static/updates.js'):
            with self.subTest(removed=removed):
                self.assertNotIn(removed, html)

    def test_swatches_are_csp_compatible(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        for name in ('mint', 'blue', 'purple', 'orange', 'rose', 'white'):
            with self.subTest(name=name):
                self.assertIn(f'data-accent="{name}"', html)
                self.assertIn(f'button[data-accent="{name}"] .swatch-dot', css)
        self.assertNotIn('style="--swatch:', html)

    def test_white_accent_is_the_default_and_desktop_choices_share_one_row(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        settings = (STATIC / "settings.js").read_text(encoding="utf-8")
        self.assertIn('<html lang="en" data-accent="white">', html)
        self.assertIn('data-accent="white" aria-label="White" aria-pressed="true"', html)
        self.assertIn(" : 'white';", settings)
        self.assertIn("accent = 'white';", settings)
        self.assertIn('grid-template-columns:repeat(6,minmax(110px,1fr))', css)

    def test_background_and_font_preferences_are_local_and_have_defaults(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "style.css").read_text(encoding="utf-8")
        settings = (STATIC / "settings.js").read_text(encoding="utf-8")
        for selector in ('id="background-options"', 'data-background="midnight"', 'data-background="navy"',
                         'data-background="forest"', 'data-background="plum"', 'id="font-options"',
                         'data-font="modern"', 'data-font="serif"', 'data-font="mono"'):
            with self.subTest(selector=selector): self.assertIn(selector, html)
        for key in ('agents-lab-background', 'agents-lab-font'):
            with self.subTest(key=key): self.assertIn(key, settings)
        self.assertIn("background = 'default';", settings)
        self.assertIn("font = 'system';", settings)
        self.assertIn(':root[data-background="midnight"]', css)
        self.assertIn(':root[data-font="serif"]', css)
        self.assertIn('--bg:#000000', css)
        self.assertIn('data-background="default"] .swatch-dot{background:#000}', css)

    def test_script_is_local_and_has_accessible_info_dialog(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        js = (STATIC / "ecosystem-shell.js").read_text(encoding="utf-8")
        self.assertIn('/static/ecosystem-shell.js', html)
        self.assertIn('aria-labelledby="lab-info-title"', html)
        self.assertIn('showModal()', js)
        self.assertIn("info.close()", js)

    def test_ollama_model_installer_is_opt_in_and_local(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        js = (STATIC / "model-install.js").read_text(encoding="utf-8")
        for name in ('id="model-installer"', 'id="model-install-form"',
                     'id="model-install-name"', 'id="model-install-status"',
                     '/static/model-install.js'):
            with self.subTest(name=name):
                self.assertIn(name, html)
        self.assertIn('/api/models/install', js)
        self.assertIn("confirm(", js)
        self.assertNotIn("$('provider')", js)

    def test_advanced_model_training_is_visible_but_locked(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertIn('placeholder="e.g. Teach your AI agent how to..."', html)
        self.assertIn("'e.g. Teach your AI agent how to...'", app)
        for name in ('Advanced: Train a model (optional)', 'This option is temporarily locked.',
                     'confirmed training-worker compatibility issue', 'Under Construction'):
            with self.subTest(name=name): self.assertIn(name, html)
        self.assertIn('<section class="training-workspace training-unavailable"', html)
        self.assertNotIn('<details class="training-workspace"', html)
        self.assertNotIn('/static/training.js', html)
        self.assertNotIn('id="training-form"', html)
        self.assertNotIn('Review and start training', html)
        self.assertIn('class="nav-status training-status">Under Construction</span>', html)
        self.assertIn('.training-workspace.training-unavailable', (STATIC / "style.css").read_text(encoding="utf-8"))

    def test_local_model_status_does_not_imply_internet_connectivity(self):
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertIn("available locally · '+statusData.models.length+' local models", app)
        self.assertNotIn(" online · ", app)

    def test_user_visible_local_shell_has_no_retired_branding(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertNotRegex(html.lower(), r"uni" r"versity")
        self.assertNotRegex(app.lower(), r"uni" r"versity")

    def test_easy_start_default_model_is_offered_to_each_training_role(self):
        app = (STATIC / "app.js").read_text(encoding="utf-8")
        self.assertIn("const easyStartModel = 'qwen2.5:0.5b';", app)
        self.assertIn('[stored,legacy,old,easyStartModel,statusData.models[0]]', app)

if __name__ == "__main__":
    unittest.main()
