const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync, rmSync } = require('node:fs');
const { join, resolve } = require('node:path');
const test = require('node:test');

const app = resolve(__dirname, '..');
const output = join(app, 'dist');
const distributionMonitor = resolve(app, '..', '..', '.github', 'workflows', 'verify-public-ai-lab-distribution.yml');
const releaseVersion = readFileSync(join(app, '..', 'local-ai-agents-lab', 'VERSION'), 'utf8').trim();
const distribution = JSON.parse(readFileSync(join(app, 'release-distribution.json'), 'utf8'));
const escapedReleaseVersion = releaseVersion.replaceAll('.', '\\.');
const [currentDistribution, ...previousDistributions] = distribution.releases;
const escapedDistributionVersion = currentDistribution.version.replaceAll('.', '\\.');

test('build truthfully presents the current public state of the Local Lab', () => {
  rmSync(output, { recursive: true, force: true });
  execFileSync(process.execPath, ['build.cjs'], { cwd: app, stdio: 'pipe' });
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  const guide = readFileSync(join(output, 'simple-guide.html'), 'utf8');
  const description = readFileSync(join(output, 'app-description.html'), 'utf8');
  const script = readFileSync(join(output, 'dashboard.js'), 'utf8');
  const styles = readFileSync(join(output, 'styles.css'), 'utf8');

  assert.match(html, new RegExp(`v${escapedReleaseVersion}_\\d{8}_\\d{4}_[0-9a-f]{7}`));
  assert.doesNotMatch(html, /\{\{BUILD_ID\}\}|\{\{RELEASE_VERSION\}\}/);
  assert.match(html, /styles\.css\?v=v\d+\.\d+\.\d+_\d{8}_\d{4}_[a-f0-9]{7}/);
  assert.match(html, new RegExp(`CURRENT RELEASE · v${escapedDistributionVersion} · LOCAL \\+ OPTIONAL INTERNET CONNECTIONS`));
  assert.match(html, new RegExp(`<h1 id="page-title">AI Lab v${escapedDistributionVersion}<\\/h1>`));
  assert.match(html, /<img class="brand-mark" src="\.\/ai-training-lab-mark\.png" alt="AI Lab">/);
  assert.match(html, /class="beta-badge">BETA<\/span>/);
  assert.match(styles, /\.beta-badge/);
  assert.equal(currentDistribution.version, releaseVersion, 'the public ZIP must match the current Local Lab version');
  assert.equal(new Set(distribution.releases.map(({ version }) => version)).size, distribution.releases.length);
  for (const release of distribution.releases) {
    assert.match(release.version, /^\d+\.\d+\.\d+$/);
    assert.match(release.url, new RegExp(`/releases/v${release.version.replaceAll('.', '\\.')}/AI-Agents-Lab-Windows\\.zip$`));
    assert.match(release.sha256, /^[a-f0-9]{64}$/);
  }
  assert.match(html, new RegExp(`Public BETA download:<\\/strong> The v${escapedDistributionVersion} Windows ZIP is available\\.`));
  assert.doesNotMatch(html, /available without GitHub sign-in/);
  assert.doesNotMatch(html, /Download access note|private GitHub repository.*authorized GitHub access/);
  assert.match(html, new RegExp(`id="zip-download" class="primary-button release-download" data-zip-version="v${escapedDistributionVersion}" data-zip-sha256="${currentDistribution.sha256}"`));
  assert.match(html, new RegExp(`Download v${escapedDistributionVersion} <span aria-hidden="true">↓<\/span><\/span><small>Local \\+ optional internet connections<\/small>`));
  assert.match(html, /id="zip-download-v204" class="secondary-button release-download" data-zip-version="v2\.0\.4"[^>]*><span>Download v2\.0\.4<\/span><small>Local only<\/small><\/a>/);
  assert.match(html, /id="zip-download-v118" class="secondary-button release-download" data-zip-version="v1\.1\.8"[^>]*><span>Download v1\.1\.8<\/span><small>Local only<\/small><\/a>/);
  assert.match(styles, /\.hero-actions\{display:flex;flex-wrap:wrap;gap:var\(--space-3\);margin-top:var\(--space-5\)\}/);
  assert.match(styles, /#launch-local-lab,html\[data-color-mode="light"\] #launch-local-lab/);
  assert.match(styles, /background:#2563eb;color:#ffffff;border-color:#2563eb/);
  assert.match(styles, /#launch-local-lab:hover,html\[data-color-mode="light"\] #launch-local-lab:hover/);
  assert.match(styles, /background:#1d4ed8;border-color:#1d4ed8;filter:none/);
  assert.match(styles, /#launch-local-lab:focus-visible\{outline:3px solid #93c5fd/);
  assert.match(styles, /#refresh-local-server\{align-items:flex-start;flex-direction:column/);
  assert.match(html, /id="refresh-local-server" class="secondary-button" href="markellos-ai-training-lab-refresh:\/\/open"/);
  assert.match(html, /<span>Refresh Local Server<\/span><small>Before launching the app<\/small><\/a>/);
  assert.match(html, new RegExp(currentDistribution.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /Release archive/);
  assert.match(html, new RegExp(`${previousDistributions.length} earlier Windows ZIPs`));
  assert.match(html, /Verified historical releases are retained for reference and future agent studies\./);
  assert.match(styles, /\.release-history details/);
  assert.match(styles, /margin-right: clamp\(8rem, 15vw, 16rem\)/);
  // The 3-column card grid has one gap between the second and third columns;
  // (container width + grid gap) / 3 is the right margin required for alignment.
  assert.match(styles, /@media \(min-width: 80rem\) \{\s*\.header-actions \{ margin-right: calc\(\(100% \+ var\(--space-5\)\) \/ 3\); \}/);
  assert.doesNotMatch(styles, /margin-right: clamp\(15rem, 24vw, 26rem\)/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  for (const release of previousDistributions) {
    const escapedVersion = release.version.replaceAll('.', '\\.');
    assert.match(html, new RegExp(`data-zip-version="v${escapedVersion}"`));
    assert.match(html, new RegExp(release.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(`data-zip-sha256="${release.sha256}"`));
    assert.match(html, new RegExp(`<code title="SHA-256: ${release.sha256}">${release.sha256.slice(0, 7)}</code>`));
    assert.doesNotMatch(html, new RegExp(`<code>${release.sha256}</code>`));
  }
  assert.doesNotMatch(html, /id="zip-update"/);
  assert.match(html, /Trainer → Student → Evaluator → Improver/);
  assert.match(html, /AVAILABLE IN v1.1.8<\/p><h2>Agent Collaboration \/ Conference Room/);
  assert.match(html, /Agent Collaboration \/ Conference Room/);
  assert.match(html, /Start in three simple steps/);
  assert.match(html, /Start AI Training Lab\.bat/);
  assert.match(html, /id="launch-local-lab" class="secondary-button" href="markellos-ai-training-lab:\/\/open"/);
  assert.match(html, /Launch Local Lab after download and extract zip<\/a>/);
  assert.doesNotMatch(html, /Launch Local Lab <span aria-hidden="true">\?<\/span>/);
  assert.match(html, /Both actions work after the first Easy Start setup/);
  assert.match(html, /Refresh starts a clean local server without opening the app\./);
  assert.match(guide, /Refresh Local Server/);
  assert.doesNotMatch(html, /\{\{LEGACY_DOWNLOAD_BUTTON\}\}/);
  assert.match(html, /Starter AI Model/);
  assert.match(guide, /Easy Start creates an AI Lab shortcut on the Windows Desktop/);

  assert.match(html, /asks separately before installing Python, Ollama, or the initial local model/);
  assert.doesNotMatch(html, /You do not need a GitHub account/);
  assert.doesNotMatch(html, /Verify and extract the ZIP|disable_ollama_cloud|ollama pull qwen3:4b/);
  assert.doesNotMatch(html, /card-label">SUPPORTED PROVIDER|<h2>Ollama only<\/h2>|LM Studio and vLLM are not supported/);
  assert.doesNotMatch(html, /NOT YET OPERATIONAL|Advanced model fine-tuning|NOT IMPLEMENTED|Manual update check in the Local App/);
  assert.match(html, /https:\/\/ollama\.com\/download/);
  assert.doesNotMatch(html, /https:\/\/lmstudio\.ai\/download|https:\/\/docs\.vllm\.ai/);
  assert.match(html, /href="http:\/\/127\.0\.0\.1:8765\/"/);
  assert.equal((html.match(/Open Local Lab/g) || []).length, 1);
  assert.match(html, /id="settings-dialog"/);
  assert.match(html, /id="info-dialog"/);
  assert.match(html, /id="analytics-consent-banner"/);
  assert.match(html, /id="accept-analytics"/);
  assert.match(html, /id="reject-analytics"/);
  assert.match(html, /id="analytics-dialog"/);
  assert.match(html, /id="manage-analytics"/);
  assert.match(html, /Google Analytics 4 measures page use, traffic source, approximate geographic distribution, and Windows ZIP download interactions/);
  assert.match(styles, /\.analytics-consent-banner\[hidden\] \{ display: none !important; \}/);
  assert.doesNotMatch(html, /googletagmanager\.com\/gtag/);
  assert.doesNotMatch(html, /data-language|language-selector|language-button|Lab Assistant|assistant-button|assistant-dialog/);
  assert.match(guide, /Before you begin/);
  assert.match(guide, /Start in three steps/);
  assert.match(guide, /Start AI Training Lab\.bat/);
  assert.match(guide, /asks separately before installing Python, Ollama, or the first local AI model/);
  assert.doesNotMatch(guide, /You do not need a GitHub account/);
  assert.match(guide, /Conference Room - available/);
  assert.match(guide, /Training Lab - available/);
  assert.match(guide, /Evaluation Lab - available/);
  assert.match(guide, /Advisory Lab - available/);
  assert.match(guide, /Optimization Lab - available/);
  assert.match(guide, new RegExp(`Rooms and their current status \\(v${escapedDistributionVersion}\\)`));
  assert.match(guide, /Tutor → Student → Evaluator → Improver/);
  assert.doesNotMatch(guide, /Under Construction|v2\.0\.2/);
  assert.match(guide, /What is Fine-Tuning\? A simple guide/);
  assert.doesNotMatch(guide, /Conference Room is not yet available/);
  assert.match(guide, /Quick Start \(Windows\)/);
  assert.match(guide, /Which Windows \.bat file should I use/);
  assert.match(guide, /Start AI Training Lab\.bat/);
  assert.doesNotMatch(html, /Start AI Agents Lab\.bat/);
  assert.doesNotMatch(guide, /Start AI Agents Lab\.bat/);
  assert.match(guide, /start-windows\.bat/);
  assert.match(guide, /setup-training-windows\.bat/);
  assert.match(guide, /Technical Documentation/);
  assert.match(guide, /Advanced: Model Fine-Tuning/);
  assert.match(guide, /README\.md/);
  assert.match(guide, /After the initial setup and local model downloads/);
  assert.doesNotMatch(html, /Read the current-state guide/);
  assert.match(html, /href="\.\/simple-guide\.html"[^>]*>README \/ Installation Guide/);
  assert.match(html, /README \/ Installation Guide <span aria-hidden="true">↗<\/span><\/a><a class="secondary-button" href="\.\/app-description\.html" target="_blank" rel="noopener noreferrer">Detailed App Description/);
  assert.match(guide, /href="\.\/app-description\.html">Detailed App Description/);
  assert.match(description, /Five workspaces, fifteen specialized agents/);
  for (const role of ["Strategist → Analyst → Engineer", "Tutor → Student → Evaluator → Improver", "Assessor → Scorer → Benchmarker", "Analyst → Advisor", "Diagnostician → Optimizer → Validator"]) assert.ok(description.includes(role), `Missing agent workflow: ${role}`);
  assert.match(description, /fine-tuning \(including LoRA training\) is <strong>not enabled<\/strong>/);
  for (const page of [guide, description]) {
    assert.match(page, new RegExp(`v${escapedDistributionVersion}`));
    assert.match(page, new RegExp(`v${escapedReleaseVersion}_\\d{8}_\\d{4}_[0-9a-f]{7}`));
    assert.doesNotMatch(page, /\{\{RELEASE_VERSION\}\}|\{\{BUILD_ID\}\}/);
  }
  assert.doesNotMatch(script, /checkForZipUpdate|scheduleZipUpdateChecks|downloaded-zip-version/);
  assert.match(script, /const ANALYTICS_CONSENT_KEY = 'markellos\.ai-lab\.analytics-consent\.v1'/);
  assert.match(script, /const GA_MEASUREMENT_ID = 'G-ZEPZK1T1YQ'/);
  assert.match(script, /send\('consent','default',CONSENT_DENIED\)/);
  assert.match(script, /send\('consent','update',CONSENT_GRANTED\)/);
  assert.match(script, /script\.src=`https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{encodeURIComponent\(GA_MEASUREMENT_ID\)\}`/);
  assert.doesNotMatch(script, /send\('config',GA_MEASUREMENT_ID,\{send_page_view:false\}\)/);
  assert.match(script, /window\.gtag\('config',GA_MEASUREMENT_ID\)/);
  assert.match(script, /window\.gtag\('event','page_view'/);
  assert.match(script, /window\.gtag\('event','zip_download'/);
  assert.match(script, /window\.addEventListener\('hashchange',trackPageView\)/);
  assert.match(script, /window\[`ga-disable-\$\{GA_MEASUREMENT_ID\}`\]=true/);
  assert.match(script, /typeof module !== 'undefined'/);
  for (const file of ['styles.css', 'tokens.css', 'dashboard.js', '_headers', 'README.md', 'simple-guide.html', 'app-description.html', 'ai-training-lab-mark.png']) assert.equal(existsSync(join(output, file)), true, `${file} is missing`);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /public current-state documentation/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Quick Start \(Windows\)/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Understanding the three Windows \.bat files/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Start AI Training Lab\.bat/);
  assert.doesNotMatch(readFileSync(join(output, 'README.md'), 'utf8'), /Start AI Agents Lab\.bat/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Technical documentation/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Manual update checking inside the Local App: not implemented/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /script-src 'self' https:\/\/www\.googletagmanager\.com/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /connect-src 'self' https:\/\/www\.google-analytics\.com https:\/\/region1\.google-analytics\.com/);
});

test('analytics stays unloaded until consent and sends only approved events after acceptance', () => {
  const listeners = new Map();
  const createElement = () => ({
    dataset: {}, hidden: true, style: { setProperty() {} }, listeners: new Map(),
    addEventListener(type, handler) { this.listeners.set(type, handler); },
    setAttribute() {}, querySelector() { return null; }, closest() { return this; },
    close() {}, showModal() {}, value: '',
  });
  const ids = ['theme-toggle','accent-color','font-choice','text-size','spacing-choice','appearance-status','reset-appearance','settings-button','info-button','analytics-consent-banner','analytics-dialog','analytics-consent-status','accept-analytics','reject-analytics','accept-analytics-dialog','reject-analytics-dialog','manage-analytics','privacy-analytics-choices','zip-download'];
  const elements = Object.fromEntries(ids.map(id => [id, createElement()]));
  elements['zip-download'].dataset.zipVersion = 'v1.1.0';
  const scripts = [];
  const values = new Map();
  const originalWindow = global.window;
  const originalDocument = global.document;
  global.window = {
    location: { href: 'https://example.test/' }, dataLayer: [],
    localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    addEventListener(type, handler) { listeners.set(type, handler); },
  };
  global.document = {
    title: 'AI Lab', documentElement: { dataset: {}, style: { setProperty() {} } },
    addEventListener(type, handler) { if (type === 'DOMContentLoaded') handler(); },
    getElementById: id => elements[id] || null, querySelectorAll: () => [], querySelector: () => null,
    createElement, head: { append: script => scripts.push(script) },
  };
  try {
    const modulePath = resolve(output, 'dashboard.js');
    delete require.cache[modulePath];
    require(modulePath);
    assert.equal(scripts.length, 0, 'Google tag must not load before consent');
    elements['accept-analytics'].listeners.get('click')();
    assert.equal(scripts.length, 1, 'acceptance loads one Google tag');
    window.gtag = (...args) => {
      window.dataLayer.push(args);
      if (args[0] === 'config') window.dataLayer.push(['event', 'page_view']);
    };
    scripts[0].listeners.get('load')();
    elements['zip-download'].listeners.get('click')();
    const events = window.dataLayer.filter(entry => entry[0] === 'event');
    assert.deepEqual(events.map(entry => entry[1]), ['page_view', 'zip_download']);
    elements['reject-analytics'].listeners.get('click')();
    assert.equal(window['ga-disable-G-ZEPZK1T1YQ'], true, 'rejection disables future analytics events');
    elements['zip-download'].listeners.get('click')();
    assert.equal(window.dataLayer.filter(entry => entry[0] === 'event' && entry[1] === 'zip_download').length, 1);
  } finally {
    global.window = originalWindow;
    global.document = originalDocument;
  }
});

test('public distribution monitoring verifies the reviewed current R2 ZIP on a schedule', () => {
  const workflow = readFileSync(distributionMonitor, 'utf8');
  const monitor = readFileSync(join(app, 'scripts', 'verify-public-distribution.cjs'), 'utf8');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /17 \*\/6 \* \* \*/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /verify-public-distribution\.cjs/);
  assert.match(monitor, /release-distribution\.json/);
  assert.match(monitor, /Public ZIP returned HTTP/);
  assert.match(monitor, /application\/x-zip-compressed/);
  assert.match(monitor, /Public ZIP SHA-256 mismatch/);
  assert.match(monitor, /Public ZIP length mismatch/);
});
