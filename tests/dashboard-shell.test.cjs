'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const shell = require('../dashboard.js');
const repositoryRoot = join(__dirname, '..');
const html = readFileSync(join(repositoryRoot, 'index.html'), 'utf8');
const css = readFileSync(join(repositoryRoot, 'dashboard.css'), 'utf8');
const javascript = readFileSync(join(repositoryRoot, 'dashboard.js'), 'utf8');
const templateVersion = readFileSync(join(repositoryRoot, 'TEMPLATE_VERSION'), 'utf8').trim();
const tokenJson = JSON.parse(readFileSync(join(repositoryRoot, 'design-system', 'tokens', 'tokens.json'), 'utf8'));
const tokenCss = readFileSync(join(repositoryRoot, 'design-system', 'tokens', 'tokens.css'), 'utf8');
const designSystemDoc = readFileSync(join(repositoryRoot, 'docs', 'design', 'UI_UX_DESIGN_SYSTEM.md'), 'utf8');
const siteBuilder = readFileSync(join(repositoryRoot, 'scripts', 'build-site.cjs'), 'utf8');

function metaContent(name) {
  return html.match(new RegExp(`<meta name="${name}" content="([^"]*)">`))?.[1] ?? '';
}

test('Cyprus build timestamps use Europe/Nicosia and respect seasonal offsets', () => {
  assert.deepEqual(shell.formatCyprusBuildTimestamp(new Date('2026-01-15T12:30:00Z')), {
    date: '20260115',
    time: '1430',
    timeZone: 'Europe/Nicosia'
  });
  assert.deepEqual(shell.formatCyprusBuildTimestamp(new Date('2026-08-15T12:30:00Z')), {
    date: '20260815',
    time: '1530',
    timeZone: 'Europe/Nicosia'
  });
});

test('a populated build ID uses a real repository SHA and canonical format', () => {
  const commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim();
  const timestamp = shell.formatCyprusBuildTimestamp(new Date());
  const buildId = shell.formatBuildId({ version: templateVersion, commit, ...timestamp });

  assert.match(buildId, shell.BUILD_ID_PATTERN);
  assert.match(buildId, /^v[0-9]+\.[0-9]+\.[0-9]+_[0-9]{8}_[0-9]{4}_[0-9a-f]{7}$/);
  assert.ok(buildId.endsWith(`_${commit}`));
});

test('site builder can package binary assets larger than Node default output buffers', () => {
  assert.match(siteBuilder, /SITE_FILE_MAX_BUFFER = 16 \* 1024 \* 1024/);
  assert.match(siteBuilder, /maxBuffer: SITE_FILE_MAX_BUFFER/);
});

test('missing or invalid build metadata produces an explicit non-fabricated template ID', () => {
  assert.equal(shell.formatBuildId({ version: templateVersion }), `v${templateVersion}_YYYYMMDD_HHMM_SHA`);
  assert.equal(shell.formatBuildId({
    version: templateVersion,
    date: '20260828',
    time: '0952',
    commit: 'cd95d3c',
    timeZone: 'UTC+3'
  }), `v${templateVersion}_YYYYMMDD_HHMM_SHA`);
});

test('appearance preferences accept only the documented bounded values', () => {
  assert.deepEqual(shell.normalizeAppearance({
    colorMode: 'dark',
    accent: '#ABCDEF',
    background: '#123456',
    font: 'serif',
    textSize: 125,
    spacing: 'spacious',
    ignored: 'not persisted'
  }), {
    colorMode: 'dark',
    accent: '#abcdef',
    background: '#123456',
    font: 'serif',
    textSize: '125',
    spacing: 'spacious'
  });

  assert.deepEqual(shell.normalizeAppearance({
    colorMode: 'automatic',
    accent: 'javascript:alert(1)',
    background: 'url(https://example.invalid)',
    font: 'remote-font',
    textSize: '500',
    spacing: 'zero'
  }), shell.DEFAULT_APPEARANCE);
});

test('custom colour foreground selection preserves the WCAG contrast crossover', () => {
  assert.equal(shell.isDarkColor('#757575'), true);
  assert.equal(shell.isDarkColor('#777777'), false);
  assert.equal(shell.isDarkColor('#000000'), true);
  assert.equal(shell.isDarkColor('#ffffff'), false);
});

test('local persistence writes appearance data under one namespaced key', () => {
  const writes = [];
  const storage = {
    getItem: () => null,
    setItem: (key, value) => writes.push({ key, value })
  };

  assert.equal(shell.saveAppearance(storage, { ...shell.DEFAULT_APPEARANCE, colorMode: 'dark' }), true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].key, 'markellos.dashboard.appearance.v1');
  assert.deepEqual(Object.keys(JSON.parse(writes[0].value)).sort(), [
    'accent',
    'background',
    'colorMode',
    'font',
    'spacing',
    'textSize'
  ]);

  const blockedStorage = {
    setItem: () => {
      throw new Error('storage blocked');
    }
  };
  assert.equal(shell.saveAppearance(blockedStorage, shell.DEFAULT_APPEARANCE), false);
  assert.equal(shell.saveAppearance(null, shell.DEFAULT_APPEARANCE), false);
  assert.match(javascript, /persisted \? TRANSLATIONS\[language\]\.saved : TRANSLATIONS\[language\]\.notPersisted/);
  assert.match(javascript, /resetPersisted \? TRANSLATIONS\[language\]\.reset : TRANSLATIONS\[language\]\.resetNotPersisted/);
});

test('canonical header utilities appear in the required logical order', () => {
  const identifiers = [
    'assistant-button',
    'language-gr',
    'language-en',
    'ecosystem-link',
    'theme-toggle',
    'settings-button',
    'info-button'
  ];
  const positions = identifiers.map((identifier) => html.indexOf(`id="${identifier}"`));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((left, right) => left - right), positions);
  assert.match(html, /href="https:\/\/markellosecosystem\.com\/"/);
});

test('Integrated template identity replaces copied Framework identity', () => {
  assert.match(html, /<span class="brand-mark" aria-hidden="true">IP<\/span>/);
  assert.match(html, /<span class="project-name">Integrated Project Template<\/span>/);
  assert.match(html, /Template Assistant/);
  assert.match(javascript, /assistantName: 'Template Assistant'/);
  assert.doesNotMatch(html, /Ecosystem Framework — The DNA/);
});

test('Settings, Info and footer contracts are complete', () => {
  for (const label of [
    'Accent colour',
    'Background colour',
    'Font',
    'Text size',
    'Spacing',
    'Reset appearance',
    'Close'
  ]) {
    assert.ok(html.includes(label), `Missing Settings label: ${label}`);
  }

  for (const label of [
    'Important Info',
    'Feedback',
    'License',
    'Privacy',
    'Analytics choices',
    'Copyright protected'
  ]) {
    assert.ok(html.includes(label), `Missing Info item: ${label}`);
  }

  assert.equal((html.match(/data-footer-line=/g) ?? []).length, 2);

  const sourceBuildId = shell.formatBuildId({
    version: metaContent('build-version'),
    date: metaContent('build-date'),
    time: metaContent('build-time'),
    timeZone: metaContent('build-time-zone'),
    commit: metaContent('build-commit')
  });
  assert.match(sourceBuildId, shell.BUILD_ID_PATTERN);
  assert.ok(html.includes(sourceBuildId));
});

test('user-facing source exposes no GitHub link or unsafe DOM injection primitive', () => {
  assert.doesNotMatch(html, /github/i);
  assert.doesNotMatch(javascript, /\.innerHTML\s*=|insertAdjacentHTML|document\.write\(|\beval\s*\(/);

  const scriptSources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(scriptSources, ['./dashboard.js']);
});

test('responsive and accessibility source contracts remain present', () => {
  assert.match(css, /@media \(max-width: 80rem\)/);
  assert.match(css, /@media \(max-width: 48rem\)/);
  assert.match(css, /@media \(max-width: 30rem\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-height: var\(--touch-target-min\)/);
  assert.match(html, /<dialog id="settings-dialog"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-haspopup="dialog"/);

  for (const key of [
    'dashboardHome',
    'dashboardUtilities',
    'language',
    'greekLanguage',
    'englishLanguage',
    'primaryNavigation',
    'versionInformation'
  ]) {
    assert.ok(html.includes(`data-i18n-aria-label="${key}"`), `Missing localized aria-label hook: ${key}`);
    assert.equal((javascript.match(new RegExp(`\\b${key}:`, 'g')) ?? []).length, 2, `Missing EN/EL aria-label translations: ${key}`);
  }
});

test('build metadata declares the required IANA timezone', () => {
  assert.equal(shell.BUILD_TIME_ZONE, 'Europe/Nicosia');
  assert.equal(metaContent('build-time-zone'), 'Europe/Nicosia');
});

test('template and design-system component versions are internally consistent', () => {
  assert.equal(templateVersion, '0.2.0');
  assert.equal(metaContent('build-version'), templateVersion);
  assert.equal(tokenJson.meta.version, '1.2.0');
  assert.match(tokenCss, /Markellos Ecosystem Design Tokens v1\.2\.0/);
  assert.match(designSystemDoc, /\*\*Version:\*\* 1\.2\.0/);
  assert.match(tokenCss, /--color-neutral-950: #111827;/);
  assert.match(tokenCss, /--color-neutral-0: #ffffff;/);
});

test('dashboard exposes integrated foundation adoption entry points', () => {
  assert.match(html, /Integrated Project Template/);
  for (const doc of ['FOUNDATION_SOURCES.md','engineering/requirements/ENG_ADOPTION_MATRIX.md','security/baseline/README.md','docs/infrastructure/INFRASTRUCTURE_PROFILE.md','docs/INDEX.md','FRAMEWORK.md','checklists/INITIALIZATION_GATE.md','checklists/DEVELOPMENT_READINESS.md','checklists/FINAL_COMPLETION_GATE.md']) {
    assert.ok(html.includes('href="./' + doc + '"'), 'Missing template link: ' + doc);
    assert.ok(require('node:fs').existsSync(join(repositoryRoot,doc)), 'Broken template document: ' + doc);
  }
});
