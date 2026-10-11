const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync, rmSync } = require('node:fs');
const { join, resolve } = require('node:path');
const test = require('node:test');

const app = resolve(__dirname, '..');
const output = join(app, 'dist');

test('build creates a self-contained Pages artifact with a populated build ID', () => {
  rmSync(output, { recursive: true, force: true });
  execFileSync(process.execPath, ['build.cjs'], { cwd: app, stdio: 'pipe' });
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  assert.match(html, /v0\.1\.0_\d{8}_\d{4}_[0-9a-f]{7}/);
  assert.doesNotMatch(html, /\{\{BUILD_ID\}\}/);
  assert.match(html, /https:\/\/www\.python\.org\/downloads\/windows\//);
  assert.match(html, /https:\/\/ollama\.com\/download\/windows/);
  assert.match(html, /https:\/\/lmstudio\.ai\/download/);
  assert.match(html, /It is not required and does not replace Ollama/);
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="primary-nav"/);
  assert.match(html, /href="#privacy"/);
  assert.match(html, /class="footer-inner"/);
  assert.match(html, /<script src="\.\/dashboard\.js"><\/script>/);
  assert.match(html, /id="assistant-button"/);
  assert.match(html, /id="settings-dialog"/);
  assert.match(html, /id="info-dialog"/);
  for (const file of ['styles.css', 'tokens.css', 'dashboard.js', '_headers']) assert.equal(existsSync(join(output, file)), true, `${file} is missing`);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /connect-src 'none'/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /script-src 'self'/);
});
