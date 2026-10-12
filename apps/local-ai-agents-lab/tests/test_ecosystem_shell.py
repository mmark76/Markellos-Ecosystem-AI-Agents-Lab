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
        for name in ('data-room="university"', 'data-room="conference"',
                     'id="settings-toggle"', 'id="provider"', 'id="model"',
                     'id="provider-help"',
                     'id="composer"'):
            with self.subTest(name=name):
                self.assertIn(name, html)

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
        for source in (html, app, settings, shell, (STATIC / "updates.js").read_text(encoding="utf-8")):
            self.assertNotRegex(source, r'[\u0370-\u03ff]')

    def test_canonical_header_and_footer_elements(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        for name in ('href="https://markellosecosystem.com/"',
                     'id="quick-mode"', 'id="info-toggle"',
                     'id="lab-info"', 'class="build-id"',
                     'Markellos Markides. All rights reserved.'):
            with self.subTest(name=name):
                self.assertIn(name, html)

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
        self.assertIn("value !== 'ollama'", js)

    def test_update_check_is_explicit_and_never_installs_automatically(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        script = (STATIC / "updates.js").read_text(encoding="utf-8")
        self.assertIn('id="update-check"', html)
        self.assertIn('id="update-status"', html)
        self.assertIn('/static/updates.js', html)
        self.assertIn('/api/updates', script)
        self.assertIn('noopener noreferrer', script)
        self.assertNotIn('window.location', script)
        self.assertNotIn('download=', script)

    def test_training_workspace_is_local_and_english_only(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        script = (STATIC / "training.js").read_text(encoding="utf-8")
        for name in ('Model Training', 'training-dataset',
                     'training-model', 'training-device', 'Which technology should I use?'):
            with self.subTest(name=name): self.assertIn(name, html)
        self.assertIn('/api/training/jobs', script)

if __name__ == "__main__":
    unittest.main()
