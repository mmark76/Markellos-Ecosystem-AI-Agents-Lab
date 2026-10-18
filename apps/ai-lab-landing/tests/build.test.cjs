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
  assert.doesNotMatch(html, /\{\{BUILD_ID\}\}|\{\{RELEASE_VERSION\}\}|\{\{GITHUB_RELEASE_URL\}\}|\{\{GITHUB_RELEASE_VERSION\}\}|\{\{GITHUB_RELEASE_SHA256\}\}/);
  assert.match(html, /styles\.css\?v=v\d+\.\d+\.\d+_\d{8}_\d{4}_[a-f0-9]{7}/);
  assert.match(html, new RegExp(`CURRENT RELEASE · v${escapedDistributionVersion} · LOCAL \\+ OPTIONAL INTERNET CONNECTIONS`));
  assert.match(html, new RegExp(`<h1 id="page-title">AI Lab v${escapedDistributionVersion}<\\/h1>`));
  assert.match(html, /<img class="brand-mark" src="\.\/ai-training-lab-mark\.png" alt="AI Lab">/);
  assert.match(html, /class="beta-badge">BETA<\/span>/);
  assert.match(styles, /\.beta-badge/);
  const subscriptionNotice = 'Using the optional ChatGPT Advisor may require an eligible paid ChatGPT subscription. Availability and usage limits are determined by OpenAI.';
  assert.match(html, /<p class="advisor-plan-notice"><strong>ChatGPT Advisor — Subscription Requirements\.<\/strong>/);
  assert.ok(html.includes(subscriptionNotice), 'The main landing page must show the ChatGPT eligibility notice.');
  assert.ok(description.includes(subscriptionNotice), 'Keep the same eligibility notice in Detailed App Description.');
  assert.doesNotMatch(html, /<nav class="primary-nav"|class="nav-link/);
  assert.ok(styles.includes('.advisor-plan-notice { margin: var(--space-3) 0 var(--space-4);'));
  assert.ok(styles.includes('font-size: var(--font-size-sm); line-height: var(--line-height-normal); text-align: left; overflow-wrap: anywhere; }'));
  assert.doesNotMatch(styles, /\.primary-nav\s*\{|\.nav-link\s*\{/);
  assert.match(currentDistribution.version, /^\d+\.\d+\.\d+$/, 'the verified public ZIP may lag the local application release');
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
  const expectedGitHubFallback = 'https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v2.0.17/AI-Agents-Lab-Windows.zip';
  assert.ok(html.includes(`id="github-release-download" class="secondary-button release-download github-release-download" data-zip-version="v2.0.17" data-zip-sha256="fd19ca26c78a2baf374389edf8c3b210c47afab6d2fb9e66d995b18340f40c73" data-download-source="github-release" href="${expectedGitHubFallback}"`));
  assert.match(html, /<span>Download v2\.0\.17 BETA<\/span><small>GitHub · newer BETA ZIP<\/small>/);
  assert.match(html, new RegExp(`Download v${escapedDistributionVersion} <span aria-hidden="true">↓<\/span><\/span><small>Local \\+ optional internet connections<\/small>`));
  // While a new package is being published, the distribution manifest still
  // names v2.0.15 as current.  It becomes the secondary milestone only when
  // v2.0.16 is published to the manifest in the follow-up deployment.
  const v2015Milestone = /id="zip-download-v2015" class="secondary-button release-download" data-zip-version="v2\.0\.15"[^>]*><span>Download v2\.0\.15<\/span><small>Previous milestone · local \+ optional internet connections<\/small><\/a>/;
  if (currentDistribution.version === '2.0.15') {
    assert.doesNotMatch(html, v2015Milestone);
  } else {
    assert.match(html, v2015Milestone);
  }
  assert.match(html, /id="zip-download-v204" class="secondary-button release-download" data-zip-version="v2\.0\.4"[^>]*><span>Download v2\.0\.4<\/span><small>Local only<\/small><\/a>/);
  assert.doesNotMatch(html, /id="zip-download-v2010"/);
  assert.doesNotMatch(html, /id="zip-download-v118"/);
  assert.match(html, /class="hero-actions" aria-label="Download, local launch, and documentation actions"/);
  assert.match(html, /class="hero-action-group download-actions"/);
  assert.match(html, /class="hero-action-group local-actions"/);
  assert.match(html, /class="hero-action-group documentation-actions"/);
  assert.match(styles, /\.header-inner \{ width: min\(calc\(100% - 2rem\), 54rem\); margin-inline: auto; padding-top: var\(--space-5\); \}/);
  assert.match(styles, /\.hero-card \{ width: min\(100%, 54rem\); margin-bottom: 0; \}/);
  assert.match(styles, /\.main-content \{ flex: 1; padding-block: var\(--space-8\); text-align: center; \}/);
  assert.match(styles, /\.hero \{ max-width: none; margin-bottom: var\(--space-3\); \}/);
  assert.match(styles, /\.shell-notice \{ width: fit-content; max-width: 100%; margin: var\(--space-5\) auto 0; padding: var\(--space-3\) var\(--space-4\); border-inline-start: 3px solid var\(--app-accent\);/);
  assert.match(styles, /\.hero > \.eyebrow, \.hero h1 \{ text-align: center; \}/);
  assert.match(styles, /\.hero-actions\{display:grid;width:min\(100%,50rem\);gap:var\(--space-4\);margin:var\(--space-5\) auto 0\}/);
  assert.match(styles, /\.hero-action-group\{display:grid;grid-auto-rows:3\.75rem;gap:var\(--space-4\);align-items:stretch;justify-content:center\}/);
  assert.match(styles, /\.download-actions,\.local-actions,\.documentation-actions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(styles, /\.hero-action-group \.primary-button,\.hero-action-group \.secondary-button\{justify-content:center;text-align:center\}/);
  assert.match(styles, /\.hero-action-group \.release-download,\.hero-action-group #refresh-local-server\{align-items:center;justify-content:center;text-align:center\}/);
  assert.match(styles, /@media \(max-width:48rem\) \{ \.hero-actions \{ width:min\(100%,26rem\); \} \.download-actions, \.local-actions, \.documentation-actions \{ grid-template-columns: minmax\(0, 1fr\); width: 100%; \}/);
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
  assert.match(styles, /\.release-history \{ margin-top: 0; \}/);
  assert.match(styles, /\.release-history details/);
  assert.doesNotMatch(styles, /margin-right: clamp\(8rem, 15vw, 16rem\)|margin-right: calc\(\(100% \+ var\(--space-5\)\) \/ 3\)/);
  assert.match(styles, /\.card-grid \{ width: min\(100%, 54rem\); display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: var\(--space-4\); margin-inline: auto; \}/);
  assert.ok(styles.includes('.card-grid .dashboard-card, .content-card-grid .dashboard-card { text-align: justify; }'));
  assert.ok(styles.includes('.card-grid .dashboard-card h2, .content-card-grid .dashboard-card h2, .card-grid .card-label { text-align: left; }'));
  assert.match(html, /<section id="overview" class="card-grid"/);
  assert.match(html, /<div class="content-card-grid">/);
  assert.match(styles, /\.simple-section \{ max-width: none; margin-top: var\(--space-3\); \}/);
  assert.match(styles, /\.simple-section > \.eyebrow, \.simple-section > h2 \{ text-align: center; \}/);
  assert.ok(styles.includes('.guide > p:not(.eyebrow):not(.guide-navigation), .guide li { text-align: justify; }'));
  assert.ok(styles.includes('.simple-section.guide > .eyebrow, .simple-section.guide > h1, .simple-section.guide > h2 { text-align: left; }'));
  assert.match(guide, /<p class="guide-navigation"><a class="inline-link" href="#technical-documentation">/);
  assert.match(description, /<p class="guide-navigation"><a class="inline-link" href="\.\/simple-guide\.html">/);
  assert.match(styles, /\.release-history summary \{ display: flex; align-items: baseline; justify-content: center;/);
  assert.match(styles, /\.release-history li \{ min-width: 0; display: flex; align-items: baseline; justify-content: center;/);
  assert.match(styles, /\.engine-card \.primary-button \{ width: fit-content; margin: auto auto 0; \}/);
  assert.match(styles, /\.steps ol \{ display: grid; gap: var\(--space-4\); padding-left: 0; list-style-position: inside; \}/);
  assert.match(styles, /#overview \.dashboard-card \{ min-height: 15rem; \}/);
  assert.match(styles, /\.content-card \{ width: min\(100%, var\(--content-narrow\)\); min-height: 0; margin-inline: auto; \}/);
  assert.match(styles, /\.archive-card, \.section-intro-card \{ border-color: transparent; background: transparent; \}/);
  assert.match(styles, /\.section-intro-card \{ padding-block: var\(--space-3\); margin-bottom: var\(--space-2\); \}/);
  assert.match(styles, /\.content-card-grid \{ width: min\(100%, 54rem\); display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: var\(--space-4\); margin: var\(--space-3\) auto 0; \}/);
  assert.match(styles, /\.engine-card \{ min-height: 13\.5rem; \}/);
  assert.match(styles, /\.footer-inner \{ display: grid; justify-items: center; gap: var\(--space-1\); padding-block: var\(--space-5\); color: var\(--color-text-muted\); font-size: var\(--font-size-sm\); text-align: center; \}/);
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
  const overview = html.slice(html.indexOf('<section id="overview"'), html.indexOf('</section>', html.indexOf('<section id="overview"')));
  assert.doesNotMatch(overview, /card-label">AVAILABLE IN/);
  assert.match(html, /Agent Collaboration \/ Conference Room/);
  assert.match(html, /Start in three simple steps/);
  assert.match(html, /<section class="hero"[^>]*>\s*<article class="dashboard-card content-card hero-card">/);
  assert.match(html, /<details class="dashboard-card content-card archive-card">/);
  assert.match(html, /<header class="dashboard-card content-card section-intro-card"><p class="eyebrow">EASY START COMPONENTS/);
  assert.match(html, /<section id="start" class="simple-section steps"[^>]*>\s*<article class="dashboard-card content-card">/);
  assert.match(html, /<section id="privacy" class="simple-section"[^>]*>\s*<article class="dashboard-card content-card">/);
  assert.match(html, /<div class="content-card-grid">\s*<section id="start"/);
  assert.match(html, /Start AI Training Lab\.bat/);
  assert.match(html, /id="launch-local-lab" class="secondary-button" href="markellos-ai-training-lab:\/\/open"/);
  assert.match(html, /Launch Local Lab after download and extract zip<\/a>/);
  assert.doesNotMatch(html, /Launch Local Lab <span aria-hidden="true">\?<\/span>/);
  assert.match(html, /Both actions work after the first Easy Start setup/);
  assert.match(html, /Refresh starts a clean local server without opening the app\./);
  assert.match(guide, /Refresh Local Server/);
  assert.doesNotMatch(html, /\{\{LEGACY_DOWNLOAD_BUTTON\}\}/);
  assert.match(html, /Starter AI Model/);
  assert.match(guide, /Easy Start creates or updates a Windows Desktop shortcut/);

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
  assert.match(guide, /Install or update in five steps \(Windows\)/);
  assert.doesNotMatch(guide, /Start in three steps/);
  const stepHeading = '<h2 id="quick-start">Install or update in five steps (Windows)</h2>';
  assert.ok(guide.indexOf(stepHeading) > guide.indexOf('<h1 id="guide-title">'));
  assert.ok(guide.indexOf(stepHeading) < guide.indexOf('Detailed App Description'), 'five steps should appear before other guide links');
  const fiveStepList = guide.slice(guide.indexOf('<ol>', guide.indexOf(stepHeading)), guide.indexOf('</ol>', guide.indexOf(stepHeading)) + 5);
  assert.equal((fiveStepList.match(/<li>/g) || []).length, 5);
  const stepNames = ['Download.', 'Stop &amp; Backup.', 'Extract.', 'Start AI Training Lab.bat.', 'Launch.'];
  let previous = -1;
  for (const step of stepNames) {
    const index = fiveStepList.indexOf('<strong>' + step + '</strong>');
    assert.ok(index > previous, 'Missing or out-of-order install step: ' + step);
    previous = index;
  }
  assert.match(fiveStepList, /data\/campus\.sqlite3/);
  assert.match(fiveStepList, /new extracted folder/);
  assert.match(fiveStepList, /Refresh Local Server → Launch Local Lab/);
  assert.match(guide, /Start AI Training Lab\.bat/);
  assert.match(guide, /asks separately before installing Python, Ollama, or the first local AI model when needed/);
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
  assert.match(guide, /Install or update in five steps \(Windows\)/);
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
  const optionalServices = description.slice(description.indexOf('<h2>Optional external services</h2>'), description.indexOf('<h2>Local-first design and privacy</h2>'));
  assert.match(optionalServices, /Using the optional ChatGPT Advisor may require an eligible paid ChatGPT subscription\./);
  assert.match(optionalServices, /Availability and usage limits are determined by OpenAI\./);
  assert.match(optionalServices, /AI Training Lab's local Ollama-powered features remain free to use without a ChatGPT subscription\./);
  for (const page of [guide, description]) {
    assert.match(page, new RegExp(`v${escapedDistributionVersion}`));
    assert.match(page, new RegExp(`v${escapedReleaseVersion}_\\d{8}_\\d{4}_[0-9a-f]{7}`));
    assert.doesNotMatch(page, /\{\{RELEASE_VERSION\}\}|\{\{BUILD_ID\}\}/);
  }
  assert.doesNotMatch(script, /checkForZipUpdate|scheduleZipUpdateChecks|downloaded-zip-version/);
  assert.match(script, /const ANALYTICS_CONSENT_KEY = 'markellos\.ai-lab\.analytics-consent\.v1'/);
  assert.match(script, /const GA_MEASUREMENT_ID = 'G-ZEPZK1T1YQ'/);
  const analyticsBootstrap = readFileSync(join(output, 'analytics-consent.js'), 'utf8');
  assert.match(analyticsBootstrap, /window\.gtag\('consent', 'default', \{/);
  assert.match(analyticsBootstrap, /analytics_storage: 'denied'/);
  assert.match(script, /send\('consent','update',CONSENT_GRANTED\)/);
  assert.match(script, /script\.src=`https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{encodeURIComponent\(GA_MEASUREMENT_ID\)\}`/);
  assert.match(script, /window\.gtag\('config',GA_MEASUREMENT_ID,\{send_page_view:false\}\)/);
  assert.match(script, /window\.gtag\('event','page_view'/);
  assert.match(script, /window\.gtag\('event','zip_download'/);
  assert.match(script, /window\.addEventListener\('hashchange',trackPageView\)/);
  assert.match(script, /window\[`ga-disable-\$\{GA_MEASUREMENT_ID\}`\]=true/);
  assert.match(script, /typeof module !== 'undefined'/);
  for (const file of ['styles.css', 'tokens.css', 'analytics-consent.js', 'dashboard.js', '_headers', 'README.md', 'simple-guide.html', 'app-description.html', 'ai-training-lab-mark.png']) assert.equal(existsSync(join(output, file)), true, `${file} is missing`);
  assert.match(html, /<script src="\.\/analytics-consent\.js"><\/script>/);
  assert.ok(html.indexOf('analytics-consent.js') < html.indexOf('dashboard.js'), 'consent defaults must load before the application script');
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /public current-state documentation/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Quick Start \(Windows\)/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Understanding the three Windows \.bat files/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Start AI Training Lab\.bat/);
  assert.doesNotMatch(readFileSync(join(output, 'README.md'), 'utf8'), /Start AI Agents Lab\.bat/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Technical documentation/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Manual update checking inside the Local App: not implemented/);
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /version-matched direct GitHub Release asset as a fallback/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /script-src 'self' https:\/\/www\.googletagmanager\.com/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /img-src 'self' data: https:\/\/www\.googletagmanager\.com https:\/\/\*\.google-analytics\.com/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /connect-src 'self' https:\/\/www\.googletagmanager\.com https:\/\/\*\.google-analytics\.com https:\/\/www\.google\.com/);
});

test('analytics stays unloaded until consent and sends only approved events after acceptance', () => {
  const listeners = new Map();
  const createElement = () => ({
    dataset: {}, hidden: true, style: { setProperty() {} }, listeners: new Map(),
    addEventListener(type, handler) { this.listeners.set(type, handler); },
    setAttribute() {}, querySelector() { return null; }, closest() { return this; },
    close() {}, showModal() {}, value: '',
  });
  const ids = ['theme-toggle','accent-color','font-choice','text-size','spacing-choice','appearance-status','reset-appearance','settings-button','info-button','analytics-consent-banner','analytics-dialog','analytics-consent-status','accept-analytics','reject-analytics','accept-analytics-dialog','reject-analytics-dialog','manage-analytics','privacy-analytics-choices','zip-download','github-release-download'];
  const elements = Object.fromEntries(ids.map(id => [id, createElement()]));
  elements['zip-download'].dataset.zipVersion = 'v1.1.0';
  elements['zip-download'].dataset.downloadSource = 'cloudflare-r2';
  elements['github-release-download'].dataset.zipVersion = 'v1.1.0';
  elements['github-release-download'].dataset.downloadSource = 'github-release';
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
    getElementById: id => elements[id] || null, querySelectorAll: selector => selector === '.release-download' ? [elements['zip-download'], elements['github-release-download']] : [], querySelector: () => null,
    createElement, head: { append: script => scripts.push(script) },
  };
  try {
    const consentModulePath = resolve(output, 'analytics-consent.js');
    const modulePath = resolve(output, 'dashboard.js');
    delete require.cache[consentModulePath];
    delete require.cache[modulePath];
    require(consentModulePath);
    require(modulePath);
    assert.equal(scripts.length, 0, 'Google tag must not load before consent');
    assert.deepEqual(Array.from(window.dataLayer[0]), ['consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);
    elements['accept-analytics'].listeners.get('click')();
    assert.equal(scripts.length, 1, 'acceptance loads one Google tag');
    window.gtag = (...args) => window.dataLayer.push(args);
    scripts[0].listeners.get('load')();
    elements['zip-download'].listeners.get('click')({currentTarget:elements['zip-download']});
    const events = window.dataLayer.filter(entry => entry[0] === 'event');
    assert.deepEqual(events.map(entry => entry[1]), ['page_view', 'zip_download']);
    assert.deepEqual(events[1][2], {release_version:'v1.1.0',delivery_source:'cloudflare-r2'});
    elements['github-release-download'].listeners.get('click')({currentTarget:elements['github-release-download']});
    assert.deepEqual(window.dataLayer.filter(entry => entry[0] === 'event' && entry[1] === 'zip_download').map(entry => entry[2].delivery_source), ['cloudflare-r2','github-release']);
    elements['reject-analytics'].listeners.get('click')();
    assert.equal(window['ga-disable-G-ZEPZK1T1YQ'], true, 'rejection disables future analytics events');
    elements['zip-download'].listeners.get('click')({currentTarget:elements['zip-download']});
    assert.equal(window.dataLayer.filter(entry => entry[0] === 'event' && entry[1] === 'zip_download').length, 2);
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
