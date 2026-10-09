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
  for (const file of ['styles.css', 'tokens.css', '_headers']) assert.equal(existsSync(join(output, file)), true, `${file} is missing`);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /connect-src 'none'/);
});
