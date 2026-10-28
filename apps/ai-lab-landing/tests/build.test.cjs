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
const betaDistribution = JSON.parse(readFileSync(join(app, 'github-beta-releases.json'), 'utf8'));
const channels = JSON.parse(readFileSync(join(app, 'release-channels.json'), 'utf8'));
const escapedReleaseVersion = releaseVersion.replaceAll('.', '\\.');
const [currentDistribution, ...previousDistributions] = distribution.releases;
const currentStable = betaDistribution.releases.find(release => release.version === channels.currentStableGithubVersion);
const currentBeta = betaDistribution.releases.find(release => release.version === channels.currentBetaGithubVersion);
const previousStable = distribution.releases.find(release => release.version === channels.previousStableR2Version);
const escapedStableVersion = currentStable.version.replaceAll('.', '\\.');

test('build truthfully presents the current public state of the Local Lab', () => {
  rmSync(output, { recursive: true, force: true });
  execFileSync(process.execPath, ['build.cjs'], { cwd: app, stdio: 'pipe' });
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  const guide = readFileSync(join(output, 'simple-guide.html'), 'utf8');
  const description = readFileSync(join(output, 'app-description.html'), 'utf8');
  const script = readFileSync(join(output, 'dashboard.js'), 'utf8');
  const styles = readFileSync(join(output, 'styles.css'), 'utf8');

  assert.match(html, new RegExp(`v${escapedReleaseVersion}_\\d{8}_\\d{4}_[0-9a-f]{7}`));
  assert.doesNotMatch(html, /\{\{BUILD_ID\}\}|\{\{RELEASE_VERSION\}\}|\{\{PUBLIC_MILESTONE_VERSION\}\}|\{\{PREVIOUS_STABLE_URL\}\}|\{\{PREVIOUS_STABLE_SHA256\}\}|\{\{GITHUB_RELEASE_URL\}\}|\{\{GITHUB_RELEASE_VERSION\}\}|\{\{GITHUB_RELEASE_SHA256\}\}|\{\{BETA_RELEASE_URL\}\}|\{\{BETA_RELEASE_VERSION\}\}|\{\{BETA_RELEASE_SHA256\}\}/);
  assert.match(html, /styles\.css\?v=v\d+\.\d+\.\d+_\d{8}_\d{4}_[a-f0-9]{7}/);
  assert.match(html, new RegExp(`CURRENT STABLE · v${escapedStableVersion} · LOCAL \\+ OPTIONAL INTERNET CONNECTIONS`));
  assert.match(html, new RegExp(`<h1 id="page-title">AI Lab v${escapedStableVersion}<\\/h1>`));
  assert.match(html, /<img class="brand-mark" src="\.\/ai-training-lab-mark\.png" alt="AI Lab">/);
  assert.match(html, /<span class="project-name">AI Lab<\/span>/);
  assert.doesNotMatch(html, /class="beta-badge"/);
  assert.doesNotMatch(styles, /\.beta-badge/);
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
  const easyStartNotice = '<p class="shell-notice"><strong>First setup (Easy Start):</strong> After extracting, run <code>Start AI Training Lab.bat</code> (STABLE) or <code>Start Local Server.bat</code> (BETA).</p>';
  assert.ok(html.includes(easyStartNotice), 'First setup must appear in the highlighted notice');
  assert.ok(easyStartNotice.includes('Start AI Training Lab.bat</code> (STABLE)'), 'Keep the correct STABLE filename');
  assert.ok(easyStartNotice.includes('Start Local Server.bat</code> (BETA)'), 'Show the renamed BETA filename');
  assert.ok(html.indexOf(easyStartNotice) < html.indexOf('class="hero-actions"'), 'First setup must appear above the download buttons');
  assert.equal((html.match(/First setup \(Easy Start\):/g) || []).length, 1, 'Do not duplicate the Easy Start notice');
  assert.doesNotMatch(html, /Choose a stable release:/);
  assert.doesNotMatch(html, /available without GitHub sign-in/);
  assert.doesNotMatch(html, /Download access note|private GitHub repository.*authorized GitHub access/);
  const expectedGitHubFallback = `https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v${currentStable.version}/${currentStable.assetName || 'AI-Agents-Lab-Windows.zip'}`;
  assert.ok(html.includes(`id="github-release-download" class="primary-button release-download github-release-download" data-zip-version="v${currentStable.version}" data-zip-sha256="${currentStable.sha256}" data-download-source="github-release" href="${expectedGitHubFallback}"`));
  assert.ok(html.includes(`<span>Download v${currentStable.version} STABLE <span aria-hidden="true">↓</span></span><small>GitHub · current stable release</small>`));
  const expectedBetaUrl = `https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v${currentBeta.version}/${currentBeta.assetName}`;
  assert.ok(html.includes(`id="github-beta-download" class="secondary-button release-download github-beta-download" data-zip-version="v${currentBeta.version}" data-zip-sha256="${currentBeta.sha256}" data-download-source="github-beta-release" href="${expectedBetaUrl}"`));
  assert.ok(html.includes(`<span>Download v${currentBeta.version} BETA <span aria-hidden="true">↓</span></span><small>GitHub · testing release</small>`));
  assert.match(styles, /\.github-beta-download\{color:#f87171\}html\[data-color-mode="light"\] \.github-beta-download\{color:#b91c1c\}/);
  const downloadGroup = html.match(/<div class="hero-action-group download-actions">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(downloadGroup, 'Download group must remain present');
  const buttonOrder = [...downloadGroup.matchAll(/id="([^"]+)" class="(?:primary|secondary)-button release-download/g)].map(match => match[1]);
  assert.deepEqual(buttonOrder, ['github-release-download', 'github-beta-download'], 'Owner-approved STABLE and BETA downloads must remain visible');
  assert.equal((downloadGroup.match(/data-download-source="github-beta-release"/g) || []).length, 1, 'BETA must link to the verified GitHub ZIP');
  assert.equal((downloadGroup.match(/data-download-source="github-release"/g) || []).length, 1);
  assert.doesNotMatch(downloadGroup, /PREVIOUS STABLE|v2\.0\.16/);
  assert.doesNotMatch(html, /id="zip-download(?:-|\")/);
  assert.match(html, /class="hero-actions" aria-label="Download, local launch, and documentation actions"/);
  assert.match(html, /class="hero-action-group download-actions"/);
  assert.match(html, /class="hero-action-group local-actions"/);
  assert.match(html, /class="hero-action-group documentation-actions"/);
  assert.match(styles, /\.header-inner \{ width: min\(calc\(100% - 2rem\), 72rem\); margin-inline: auto; padding-top: var\(--space-5\); \}/);
  assert.match(styles, /\.hero-card \{ width: min\(100%, 72rem\); margin-bottom: 0; \}/);
  assert.match(styles, /\.main-content \{ flex: 1; padding-block: var\(--space-8\); text-align: center; \}/);
  assert.match(styles, /\.hero \{ max-width: none; margin-bottom: var\(--space-3\); \}/);
  assert.match(styles, /\.shell-notice \{ width: fit-content; max-width: 100%; margin: var\(--space-5\) auto 0; padding: var\(--space-3\) var\(--space-4\); border-inline-start: 3px solid var\(--app-accent\);/);
  assert.match(styles, /\.hero > \.eyebrow, \.hero h1 \{ text-align: center; \}/);
  assert.match(styles, /\.hero-actions\{display:grid;width:min\(100%,64rem\);gap:var\(--space-4\);margin:var\(--space-5\) auto 0\}/);
  assert.match(styles, /\.hero-action-group\{display:grid;grid-auto-rows:3\.75rem;gap:var\(--space-4\);align-items:stretch;justify-content:center\}/);
  assert.match(styles, /\.download-actions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);width:100%;justify-self:center\}/);
  assert.match(styles, /\.local-actions,\.documentation-actions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(styles, /\.hero-action-group \.primary-button,\.hero-action-group \.secondary-button\{justify-content:center;text-align:center\}/);
  assert.match(styles, /\.hero-action-group \.release-download,\.hero-action-group #stop-local-server\{align-items:center;justify-content:center;text-align:center\}/);
  assert.match(styles, /@media \(max-width:48rem\) \{ \.hero-actions \{ width:min\(100%,26rem\); \} \.download-actions, \.local-actions, \.documentation-actions \{ grid-template-columns: minmax\(0, 1fr\); width: 100%; \}/);
  assert.match(styles, /#launch-local-lab,html\[data-color-mode="light"\] #launch-local-lab/);
  assert.match(styles, /background:#2563eb;color:#ffffff;border-color:#2563eb/);
  assert.match(styles, /#launch-local-lab:hover,html\[data-color-mode="light"\] #launch-local-lab:hover/);
  assert.match(styles, /background:#1d4ed8;border-color:#1d4ed8;filter:none/);
  assert.match(styles, /#launch-local-lab:focus-visible\{outline:3px solid #93c5fd/);
  assert.match(styles, /#launch-local-lab\{flex-direction:column;gap:1px;padding-block:var\(--space-2\)\}/);
  assert.match(styles, /#launch-local-lab small\{font-size:var\(--font-size-xs\)/);
  assert.match(styles, /#stop-local-server\{align-items:flex-start;flex-direction:column/);
  assert.match(html, /id="stop-local-server" class="secondary-button" href="markellos-ai-training-lab-stop:\/\/open"/);
  assert.match(html, /<span>Stop Local Server<\/span><small>No automatic restart<\/small><\/a>/);
  assert.doesNotMatch(html, /id="refresh-local-server"|markellos-ai-training-lab-refresh:\/\/open/);
  assert.match(html, new RegExp(currentDistribution.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /Release archive/);
  assert.match(html, /Cloudflare R2 milestones · GitHub releases/);
  assert.match(html, /Milestones · Cloudflare R2/);
  assert.match(html, /Releases · GitHub/);
  assert.match(html, /Earlier Cloudflare R2 releases/);
  assert.match(html, /id="r2-milestone-history"/);
  assert.match(html, /id="r2-legacy-history"/);
  assert.match(html, /id="github-beta-history"/);
  assert.match(html, /id="github-beta-status"/);
  assert.match(html, /github-release-archive\.js/);
  assert.match(html, new RegExp(`${distribution.releases.length - 3} ZIPs`));
  assert.match(html, /Earlier verified R2 releases are retained without treating them as new milestones\./);
  assert.match(styles, /\.release-history \{ margin-top: 0; \}/);
  assert.match(styles, /\.release-history details/);
  assert.doesNotMatch(styles, /margin-right: clamp\(8rem, 15vw, 16rem\)|margin-right: calc\(\(100% \+ var\(--space-5\)\) \/ 3\)/);
  assert.match(styles, /\.card-grid \{ width: min\(100%, 72rem\); display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: var\(--space-4\); margin-inline: auto; \}/);
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
  assert.ok(html.includes('Ollama supports AI Training Lab which is currently available for Windows only and connects to local Ollama at <code>127.0.0.1:11434</code>.'));
  assert.doesNotMatch(html, /A local runtime for Windows, macOS, and Linux/);
  assert.match(styles, /\.engine-card \.primary-button \{ width: fit-content; margin: auto auto 0; \}/);
  assert.match(styles, /\.steps ol \{ display: grid; gap: var\(--space-4\); padding-left: 0; list-style-position: inside; \}/);
  assert.match(styles, /#overview \.dashboard-card \{ min-height: 12rem; \}/);
  assert.match(styles, /\.content-card \{ width: min\(100%, var\(--content-narrow\)\); min-height: 0; margin-inline: auto; \}/);
  assert.match(styles, /\.archive-card, \.section-intro-card \{ border-color: transparent; background: transparent; \}/);
  assert.match(styles, /\.section-intro-card \{ padding-block: var\(--space-3\); margin-bottom: var\(--space-2\); \}/);
  assert.match(styles, /\.content-card-grid \{ width: min\(100%, 72rem\); display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: var\(--space-4\); margin: var\(--space-3\) auto 0; \}/);
  assert.match(styles, /\.engine-card \{ min-height: 12rem; \}/);
  assert.match(styles, /\.footer-inner \{ display: grid; justify-items: center; gap: var\(--space-1\); padding-block: var\(--space-5\); color: var\(--color-text-muted\); font-size: var\(--font-size-sm\); text-align: center; \}/);
  for (const release of previousDistributions) {
    const escapedVersion = release.version.replaceAll('.', '\\.');
    assert.match(html, new RegExp(`data-zip-version="v${escapedVersion}"`));
    assert.match(html, new RegExp(release.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(`data-zip-sha256="${release.sha256}"`));
    assert.match(html, new RegExp(`<code title="SHA-256: ${release.sha256}">${release.sha256.slice(0, 7)}</code>`));
    assert.doesNotMatch(html, new RegExp(`<code>${release.sha256}</code>`));
  }
  // The R2 manifest is unchanged: three featured milestones and all older R2 entries.
  const milestoneSection = html.split('id="r2-milestone-history">', 2)[1].split('</ul>', 1)[0];
  const olderR2Section = html.split('id="r2-legacy-history">', 2)[1].split('</ul>', 1)[0];
  for (const version of ['2.0.16', '2.0.15', '2.0.4']) {
    assert.match(milestoneSection, new RegExp('data-zip-version="v' + version.replaceAll('.', '\\.') + '"'));
    assert.doesNotMatch(olderR2Section, new RegExp('data-zip-version="v' + version.replaceAll('.', '\\.') + '"'));
  }
  assert.equal((milestoneSection.match(/<li>/g) || []).length, 3);
  assert.equal((olderR2Section.match(/<li>/g) || []).length, distribution.releases.length - 3);
  // The initial GitHub history works without a network request.
  const betaSection = html.split('id="github-beta-history">', 2)[1].split('</ul>', 1)[0];
  assert.equal((betaSection.match(/<li>/g) || []).length, betaDistribution.releases.length);
  for (const release of betaDistribution.releases) {
    assert.ok(!distribution.releases.some(item => item.version === release.version), 'GitHub BETA must not duplicate R2 versions');
    assert.match(release.version, /^\d+\.\d+\.\d+$/);
    assert.match(release.sha256, /^[a-f0-9]{64}$/);
    assert.ok(betaSection.includes('releases/download/v' + release.version + '/' + (release.assetName || 'AI-Agents-Lab-Windows.zip')));
    assert.ok(betaSection.includes('data-zip-sha256="' + release.sha256 + '"'));
  }
  assert.equal(channels.currentStableGithubVersion, '2.0.26', 'the approved STABLE channel must be pinned independently of GitHub release order');
  assert.equal(channels.currentBetaGithubVersion, '2.0.29', 'the approved BETA channel must be pinned independently of GitHub release order');
  assert.equal(channels.previousStableR2Version, '2.0.16', 'preserve the owner-approved previous STABLE');
  assert.equal(currentStable.sha256, '32639b2c8da3df5ac0c3e0ffb078c5f3aafa5ba160187d9e6731393a42878584');
  assert.equal(currentStable.assetName, 'AI-Agents-Lab-Windows-v2.0.26.zip');
  assert.equal(currentBeta.sha256, 'fdf47120dd73fdf8f3242723a7ae573be7b8cfbe0585c19837fd8f1975d6fe2f');
  assert.equal(currentBeta.assetName, 'AI-Agents-Lab-Windows-v2.0.29.zip');
  assert.ok(betaDistribution.releases.some(release => release.version === '2.0.28' && release.sha256 === '1fb0e033a9a49ae4439a4c5e8eccaebe58ec4c9c69a1037c8128efcc24f04b36'), 'retain the previous BETA release in the archive');
  assert.ok(betaDistribution.releases.some(release => release.version === '2.0.27' && release.sha256 === 'bb86e96de628a5c4e4b0bd8e10792281c846138e8edda12ee74f5790694827c4'), 'retain the previous BETA release in the archive');
  assert.notEqual(currentStable.version, currentBeta.version, 'STABLE and BETA cannot designate the same ZIP');
  const channelSync = readFileSync(join(app, '..', '..', '.github', 'workflows', 'sync-ai-lab-release-channels.yml'), 'utf8');
  assert.match(channelSync, /release-channels\.json/);
  assert.match(channelSync, /gh release edit "v\$beta" .* --prerelease/);
  assert.match(channelSync, /gh release edit "v\$stable" .* --latest/);
  assert.doesNotMatch(channelSync, /gh release upload|gh release delete/);
  assert.equal(previousStable.sha256, 'da636fae45b7547f002a0ea72c55cf5041ef59a3bfc3feea9c0d3199f1a0af72');
  assert.ok(betaDistribution.releases.some(release => release.version === '2.0.24' && release.sha256 === 'a6f3b0ed736901ddb0516b93b75c9e5696ba96f4b4cfe86da80248a535d5e5e3'), 'retain the previously featured ZIP in the archive');
  assert.ok(betaDistribution.releases.some(release => release.version === '2.0.25' && release.sha256 === '85d601d697ecf2afa1b98db6c7b1a62cfb24aafa701612efca7da7d2bf2d8964'), 'retain the earlier stable ZIP in the archive');
  assert.doesNotMatch(html, /id="zip-update"/);
  assert.match(html, /Trainer → Student → Evaluator → Improver/);
  const overview = html.slice(html.indexOf('<section id="overview"'), html.indexOf('</section>', html.indexOf('<section id="overview"')));
  assert.doesNotMatch(overview, /card-label">AVAILABLE IN/);
  assert.match(html, /Agent Collaboration \/ Conference Room/);
  assert.match(html, /Start in three simple steps/);
  assert.match(html, /<section class="hero"[^>]*>\s*<article class="dashboard-card content-card hero-card">/);
  assert.match(html, /<details class="dashboard-card content-card archive-card" id="release-archive">/);
  assert.match(html, /<header class="dashboard-card content-card section-intro-card"><p class="eyebrow">EASY START COMPONENTS/);
  assert.match(html, /<section id="start" class="simple-section steps"[^>]*>\s*<article class="dashboard-card content-card">/);
  assert.match(html, /<section id="privacy" class="simple-section"[^>]*>\s*<article class="dashboard-card content-card">/);
  assert.match(html, /<div class="content-card-grid">\s*<section id="start"/);
  assert.match(html, /Start AI Training Lab\.bat/);
  assert.match(html, /id="launch-local-lab" class="secondary-button" href="markellos-ai-training-lab:\/\/open"/);
  assert.match(html, /<span>Open AI Lab<\/span><small>Quick start after first-time setup<\/small><\/a>/);
  assert.doesNotMatch(html, /Launch Local Lab <span aria-hidden="true">\?<\/span>/);
  assert.match(html, /<strong>First setup \(Easy Start\):<\/strong> After extracting, run <code>Start AI Training Lab\.bat<\/code> \(STABLE\) or <code>Start Local Server\.bat<\/code> \(BETA\)\./);
  assert.match(guide, /Stop Local Server/);
  assert.match(guide, /Stop requires v2\.0\.26 or later/);
  const localActions = html.split('class="hero-action-group local-actions">', 2)[1].split('</div>', 1)[0];
  assert.ok(localActions.indexOf('id="stop-local-server"') < localActions.indexOf('id="launch-local-lab"'), 'preserve Stop left / Open right');
  assert.doesNotMatch(html, /\{\{LEGACY_DOWNLOAD_BUTTON\}\}/);
  assert.match(html, /Starter AI Model/);
  assert.match(guide, /Easy Start remembers your Windows Desktop shortcut choice/);
  assert.match(guide, /setup-training-environment\.bat/);
  assert.doesNotMatch(guide, /start-windows\.bat|setup-training-windows\.bat/);

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
  assert.match(html, /No analytics cookies are used/);
  assert.match(html, /aggregate visit counts by UTC hour, domain, and country/);
  assert.doesNotMatch(html, /Google Analytics|Analytics choices|accept-analytics|reject-analytics/);
  assert.doesNotMatch(html, /data-language|language-selector|language-button|Lab Assistant|assistant-button|assistant-dialog/);
  assert.match(guide, /Before you begin/);
  assert.match(guide, /Install or update in five steps \(Windows\)/);
  assert.doesNotMatch(guide, /Start in three steps/);
  const stepHeading = '<h2 id="quick-start">Install or update in five steps (Windows)</h2>';
  assert.ok(guide.indexOf(stepHeading) > guide.indexOf('<h1 id="guide-title">'));
  assert.ok(guide.indexOf(stepHeading) < guide.indexOf('Detailed App Description'), 'five steps should appear before other guide links');
  const fiveStepList = guide.slice(guide.indexOf('<ol>', guide.indexOf(stepHeading)), guide.indexOf('</ol>', guide.indexOf(stepHeading)) + 5);
  assert.equal((fiveStepList.match(/<li>/g) || []).length, 5);
  const stepNames = ['Download.', 'Stop &amp; Backup.', 'Extract.', 'Start your server.', 'Launch.'];
  let previous = -1;
  for (const step of stepNames) {
    const index = fiveStepList.indexOf('<strong>' + step + '</strong>');
    assert.ok(index > previous, 'Missing or out-of-order install step: ' + step);
    previous = index;
  }
  assert.match(fiveStepList, /data\/campus\.sqlite3/);
  assert.match(fiveStepList, /new extracted folder/);
  assert.match(fiveStepList, /Open AI Lab/);
  assert.match(guide, /Start AI Training Lab\.bat/);
  assert.match(guide, /Start Local Server\.bat/);
  assert.match(guide, /Open AI Lab\.bat/);
  assert.match(guide, /requests separate approval before installing missing components or the initial local model/);
  assert.doesNotMatch(guide, /You do not need a GitHub account/);
  assert.match(guide, /Conference Room - available/);
  assert.match(guide, /Training Lab - available/);
  assert.match(guide, /Evaluation Lab - available/);
  assert.match(guide, /Advisory Lab - available/);
  assert.match(guide, /Optimization Lab - available/);
  assert.match(guide, new RegExp(`Rooms and their current status \\(v${escapedStableVersion}\\)`));
  assert.match(guide, /Tutor → Student → Evaluator → Improver/);
  assert.doesNotMatch(guide, /Under Construction|v2\.0\.2(?!\d)/);
  assert.match(guide, /What is Fine-Tuning\? A simple guide/);
  assert.doesNotMatch(guide, /Conference Room is not yet available/);
  assert.match(guide, /Install or update in five steps \(Windows\)/);
  assert.match(guide, /Which Windows \.bat file should I use/);
  assert.match(guide, /Start AI Training Lab\.bat/);
  assert.doesNotMatch(html, /Start AI Agents Lab\.bat/);
  assert.doesNotMatch(guide, /Start AI Agents Lab\.bat/);
  assert.match(guide, /setup-training-environment\.bat/);
  assert.doesNotMatch(guide, /start-windows\.bat|setup-training-windows\.bat/);
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
    assert.match(page, new RegExp(`v${escapedStableVersion}`));
    assert.match(page, new RegExp(`v${escapedReleaseVersion}_\\d{8}_\\d{4}_[0-9a-f]{7}`));
    assert.doesNotMatch(page, /\{\{RELEASE_VERSION\}\}|\{\{BUILD_ID\}\}/);
  }
  assert.doesNotMatch(script, /checkForZipUpdate|scheduleZipUpdateChecks|downloaded-zip-version/);
  assert.match(script, /const ANALYTICS_SCRIPT_URL = 'https:\/\/analytics\.markellosecosystem\.com\/v1\/script\.js'/);
  assert.match(script, /const PRODUCTION_HOSTNAME = 'ai-lab\.markellosecosystem\.com'/);
  assert.match(script, /function initializeAnalytics\(\)/);
  assert.doesNotMatch(script, /googletagmanager|gtag\(|dataLayer|zip_download|ANALYTICS_CONSENT_KEY/);
  assert.match(script, /typeof module !== 'undefined'/);
  for (const file of ['styles.css', 'tokens.css', 'dashboard.js', '_headers', 'README.md', 'simple-guide.html', 'app-description.html', 'ai-training-lab-mark.png']) assert.equal(existsSync(join(output, file)), true, `${file} is missing`);
  const technical = readFileSync(join(output, 'README.md'), 'utf8');
  assert.match(guide, /href="\.\/README\.md">public technical README<\/a>/);
  assert.match(technical, /^# AI Training Lab — Technical README/m);
  assert.match(technical, /Public current-state documentation/);
  assert.ok(technical.includes('**Local application source version:** v' + releaseVersion));
  assert.ok(technical.includes('**Previous STABLE Cloudflare R2 milestone:** v' + previousStable.version));
  assert.doesNotMatch(technical, /\{\{LOCAL_LAB_VERSION\}\}|\{\{PUBLIC_MILESTONE_VERSION\}\}/);
  assert.match(technical, /Quick Start \(Windows\)/);
  assert.match(technical, /Understanding the Windows \.bat files/);
  assert.match(technical, /Start AI Training Lab\.bat/);
  assert.match(technical, /Start Local Server\.bat/);
  assert.match(technical, /Open AI Lab\.bat/);
  assert.doesNotMatch(technical, /Start AI Agents Lab\.bat/);
  assert.match(technical, /Technical README/);
  for (const topic of [
    'Only supported agent inference engine',
    'Conference Room', 'Training Lab', 'Evaluation Lab', 'Advisory Lab', 'Optimization Lab',
    'Tutor → Student → Evaluator → Improver',
    'ChatGPT Advisor', 'RunPod', 'Windows DPAPI', 'SQLite',
    'PyTorch', 'Transformers', 'PEFT', 'TRL', 'Accelerate', 'Datasets',
    'LM Studio', 'vLLM', 'Cloudflare Pages', 'GitHub Actions',
    'Automatic Exercise Engine',
  ]) assert.ok(technical.includes(topic), 'Technical README missing: ' + topic);
  assert.match(technical, /PyJWT\[crypto\]==2\.10\.1/);
  assert.match(technical, /training-job endpoint remains \*\*locked\*\*/);
  assert.match(technical, /Manual update checking inside the Local App: not implemented/);
  assert.match(technical, /GitHub releases have their \*\*own independently verified versions/);
  assert.doesNotMatch(technical, /v0\.1\.30|Trainer → Student → Evaluator → Improver/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /script-src 'self' https:\/\/analytics\.markellosecosystem\.com/);
  assert.match(readFileSync(join(output, '_headers'), 'utf8'), /connect-src 'self' https:\/\/analytics\.markellosecosystem\.com https:\/\/api\.github\.com/);
});

test('cookie-less analytics loads once only on the production hostname', () => {
  const listeners = new Map();
  const createElement = () => ({
    dataset: {}, hidden: true, style: { setProperty() {} }, listeners: new Map(),
    addEventListener(type, handler) { this.listeners.set(type, handler); },
    setAttribute() {}, querySelector() { return null; }, closest() { return this; },
    close() { this.open = false; }, showModal() { this.open = true; }, value: '',
  });
  const ids = ['theme-toggle','accent-color','font-choice','text-size','spacing-choice','appearance-status','reset-appearance','settings-button','info-button','info-dialog','analytics-notice-dialog','analytics-notice-button','analytics-notice-close','analytics-notice-acknowledge'];
  const elements = Object.fromEntries(ids.map(id => [id, createElement()]));
  const scripts = [];
  const storedValues = new Map();
  const originalWindow = global.window;
  const originalDocument = global.document;
  global.window = {
    location: { href: 'https://ai-lab.markellosecosystem.com/', hostname: 'ai-lab.markellosecosystem.com', protocol: 'https:' },
    localStorage: { getItem: key => storedValues.get(key) || null, setItem(key, value) { storedValues.set(key, String(value)); }, removeItem(key) { storedValues.delete(key); } },
    requestAnimationFrame(callback) { callback(); },
    addEventListener(type, handler) { listeners.set(type, handler); },
  };
  global.document = {
    title: 'AI Lab', documentElement: { dataset: {}, style: { setProperty() {} } },
    addEventListener(type, handler) { if (type === 'DOMContentLoaded') handler(); },
    getElementById: id => elements[id] || null, querySelectorAll: () => [], querySelector: () => null,
    createElement, head: { append: script => { scripts.push(script); elements[script.id] = script; } },
  };
  try {
    const modulePath = resolve(output, 'dashboard.js');
    delete require.cache[modulePath];
    const {ANALYTICS_NOTICE_KEY, dismissAnalyticsNotice, initializeAnalytics, initializeAnalyticsNotice, isAnalyticsNoticeDismissed} = require(modulePath);
    assert.equal(scripts.length, 1, 'production initialization adds one collector script');
    assert.equal(scripts[0].src, 'https://analytics.markellosecosystem.com/v1/script.js');
    assert.equal(initializeAnalytics(), false, 'collector is not inserted twice');
    assert.equal(elements['analytics-notice-dialog'].open, true, 'first visit opens the informational notice');
    elements['analytics-notice-close'].listeners.get('click')();
    assert.equal(storedValues.get(ANALYTICS_NOTICE_KEY), 'true', 'closing persists only notice dismissal');
    assert.equal(elements['analytics-notice-dialog'].open, false);
    assert.equal(initializeAnalyticsNotice(), true, 'dismissed notice remains initialized for manual reopening');
    assert.equal(elements['analytics-notice-dialog'].open, false, 'dismissed notice does not reopen automatically');
    elements['analytics-notice-button'].listeners.get('click')();
    assert.equal(elements['analytics-notice-dialog'].open, true, 'Important Info reopens the notice without clearing dismissal');
    global.window.localStorage = { getItem() { throw new Error('storage blocked'); }, setItem() { throw new Error('storage blocked'); } };
    assert.equal(isAnalyticsNoticeDismissed(), false, 'blocked storage is treated as a first visit');
    assert.doesNotThrow(() => dismissAnalyticsNotice(), 'blocked storage does not break dismissal');
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

test('GitHub release archive filters R2 versions and invalid assets without duplicates', () => {
  const {githubOnlyReleases} = require(join(app, 'src', 'github-release-archive.js'));
  const digest = 'sha256:' + 'a'.repeat(64);
  const valid = version => ({tag_name:'v'+version, draft:false, assets:[{name:'AI-Agents-Lab-Windows.zip',state:'uploaded',digest}]});
  const result = githubOnlyReleases([
    valid('2.0.17'), valid('2.0.16'), valid('2.0.19'), valid('2.0.19'),
    valid('2.0.18'), {tag_name:'v2.0.20',draft:true,assets:valid('2.0.20').assets},
    {tag_name:'unsafe',draft:false,assets:valid('2.0.20').assets},
    {tag_name:'v2.0.21',draft:false,assets:[{name:'AI-Agents-Lab-Windows.zip',state:'uploaded',digest:'sha256:bad'}]},
    {tag_name:'v2.0.22',draft:false,assets:[{name:'other.zip',state:'uploaded',digest}]},
    {tag_name:'v2.0.24',draft:false,assets:[{name:'AI-Agents-Lab-Windows-v2.0.24.zip',state:'uploaded',digest}]},
  ], new Set(['2.0.16']));
  assert.deepEqual(result.map(item => item.version), ['2.0.24','2.0.19','2.0.18','2.0.17']);
  assert.ok(result[0].url.endsWith('/v2.0.24/AI-Agents-Lab-Windows-v2.0.24.zip'));
  assert.ok(result[1].url.endsWith('/v2.0.19/AI-Agents-Lab-Windows.zip'));
  assert.ok(result.every(item => item.sha256 === 'a'.repeat(64)));
  assert.ok(result.every(item => item.url.startsWith('https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v')));
  const headers = readFileSync(join(app, '_headers'), 'utf8');
  assert.match(headers, /connect-src '[^;]*https:\/\/api\.github\.com;/);
  assert.match(headers, /default-src 'self'/);
  assert.match(headers, /script-src 'self' https:\/\/analytics\.markellosecosystem\.com/);
  const source = readFileSync(join(app, 'src', 'github-release-archive.js'), 'utf8');
  assert.match(source, /archive\.addEventListener\('toggle'/);
  assert.match(source, /if \(!archive\.open \|\| requested\) return/);
  assert.match(source, /Showing verified release snapshot/);
  assert.match(source, /list\.replaceChildren/);
});
