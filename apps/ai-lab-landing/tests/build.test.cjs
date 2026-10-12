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
  assert.match(html, /https:\/\/ollama\.com\/download/);
  assert.match(html, /https:\/\/lmstudio\.ai\/download/);
  assert.match(html, /https:\/\/docs\.vllm\.ai\/en\/latest\/getting_started\/quickstart\//);
  assert.match(html, /not a native Windows desktop download/);
  assert.match(html, /href="http:\/\/127\.0\.0\.1:8765\/"/);
  assert.match(html, /Open Local Lab/);
  assert.match(html, /Download AI-Agents-Lab-Windows\.zip/);
  assert.doesNotMatch(html, /data-language|language-selector|language-button/);
  assert.match(html, /Only after the local server has started/);
  assert.match(html, /start-windows.bat/);
  assert.match(html, /cannot start the Lab by itself/);
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="primary-nav"/);
  assert.match(html, /href="#privacy"/);
  assert.match(html, /class="footer-inner"/);
  assert.match(html, /<script src="\.\/dashboard\.js"><\/script>/);
  assert.doesNotMatch(html, /Lab Assistant|assistant-button|assistant-dialog/);
  assert.match(html, /id="settings-dialog"/);
  assert.match(html, /id="info-dialog"/);
  for (const file of ['styles.css', 'tokens.css', 'dashboard.js', '_headers']) assert.equal(existsSync(join(output, file)), true, `${file} is missing`);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /connect-src 'none'/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /script-src 'self'/);
});
