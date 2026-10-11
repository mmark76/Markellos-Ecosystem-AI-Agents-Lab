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
                     'id="settings-toggle"', 'id="ui-language"',
                     'id="response-language"', 'id="provider"', 'id="model"',
                     'id="provider-help"',
                     'id="composer"'):
            with self.subTest(name=name):
                self.assertIn(name, html)

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
        for name in ('mint', 'blue', 'purple', 'orange', 'rose'):
            with self.subTest(name=name):
                self.assertIn(f'data-accent="{name}"', html)
                self.assertIn(f'button[data-accent="{name}"] .swatch-dot', css)
        self.assertNotIn('style="--swatch:', html)

    def test_script_is_local_and_has_accessible_info_dialog(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        js = (STATIC / "ecosystem-shell.js").read_text(encoding="utf-8")
        self.assertIn('/static/ecosystem-shell.js', html)
        self.assertIn('aria-labelledby="lab-info-title"', html)
        self.assertIn('showModal()', js)
        self.assertIn("info.close()", js)

if __name__ == "__main__":
    unittest.main()
