const { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const root = resolve(__dirname, '../..');
const output = resolve(__dirname, 'dist');
const source = resolve(__dirname, 'src');

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function cyprusTimestamp(date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Nicosia', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}${values.month}${values.day}_${values.hour}${values.minute}`;
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(source, output, { recursive: true });
cpSync(join(source, 'PUBLIC_DOCUMENTATION.md'), join(output, 'README.md'));
cpSync(join(root, 'design-system', 'tokens', 'tokens.css'), join(output, 'tokens.css'));
cpSync(join(__dirname, '_headers'), join(output, '_headers'));

const releaseVersion = readFileSync(join(root, 'apps', 'local-ai-agents-lab', 'VERSION'), 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(releaseVersion)) throw new Error('Invalid local Lab VERSION');
const distribution = JSON.parse(readFileSync(join(__dirname, 'release-distribution.json'), 'utf8'));
if (!Array.isArray(distribution.releases) || distribution.releases.length < 1) throw new Error('At least one public ZIP release is required');
const releaseHistory = distribution.releases;
const seenVersions = new Set();
for (const release of releaseHistory) {
  if (!/^\d+\.\d+\.\d+$/.test(release.version) || seenVersions.has(release.version)) throw new Error('Invalid or duplicate public distribution version');
  if (!/^https:\/\/pub-[a-z0-9]+\.r2\.dev\/releases\/v\d+\.\d+\.\d+\/AI-Agents-Lab-Windows\.zip$/.test(release.url)) throw new Error('Invalid public R2 distribution URL');
  if (!/^[a-f0-9]{64}$/.test(release.sha256)) throw new Error('Invalid public release SHA-256');
  seenVersions.add(release.version);
}
const [currentRelease, ...previousReleases] = releaseHistory;
// Explicit, owner-approved channel pins must not change when a new ZIP is archived.
const channels = JSON.parse(readFileSync(join(__dirname, 'release-channels.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(channels.currentStableGithubVersion) || !/^\d+\.\d+\.\d+$/.test(channels.previousStableR2Version))
  throw new Error('Invalid STABLE channel versions');
const previousStable = releaseHistory.find(release => release.version === channels.previousStableR2Version);
if (!previousStable) throw new Error('Previous STABLE is missing from verified R2 releases');
// README.md is generated from the existing public Technical README source.
// Display the local source version independently from the owner-designated previous STABLE.
const technicalReadmePath = join(output, 'README.md');
const technicalReadmeSource = readFileSync(technicalReadmePath, 'utf8');
for (const placeholder of ['{{LOCAL_LAB_VERSION}}', '{{PUBLIC_MILESTONE_VERSION}}']) {
  if (!technicalReadmeSource.includes(placeholder)) throw new Error(`Technical README missing ${placeholder}`);
}
writeFileSync(technicalReadmePath, technicalReadmeSource
  .replaceAll('{{LOCAL_LAB_VERSION}}', `v${releaseVersion}`)
  .replaceAll('{{PUBLIC_MILESTONE_VERSION}}', `v${previousStable.version}`));
// The public R2 and legacy-named GitHub release manifests have separate ownership.
const betaDistribution = JSON.parse(readFileSync(join(__dirname, 'github-beta-releases.json'), 'utf8'));
if (!Array.isArray(betaDistribution.releases) || betaDistribution.releases.length === 0)
  throw new Error('At least one verified GitHub release is required');
const betaHistory = betaDistribution.releases;
const betaVersions = new Set();
for (const release of betaHistory) {
  if (!/^\d+\.\d+\.\d+$/.test(release.version) || betaVersions.has(release.version) || seenVersions.has(release.version))
    throw new Error('Invalid, duplicate or R2-overlapping GitHub release version');
  if (!/^[a-f0-9]{64}$/.test(release.sha256)) throw new Error('Invalid GitHub release SHA-256');
  if (release.assetName !== undefined && release.assetName !== `AI-Agents-Lab-Windows-v${release.version}.zip`)
    throw new Error('Invalid GitHub release versioned ZIP asset name');
  betaVersions.add(release.version);
}
const currentStable = betaHistory.find(release => release.version === channels.currentStableGithubVersion);
if (!currentStable) throw new Error('Current STABLE is missing from verified GitHub releases');
const commit = git(['rev-parse', '--short=7', 'HEAD']);
const buildId = `v${releaseVersion}_${cyprusTimestamp(new Date())}_${commit}`;
const indexPath = join(output, 'index.html');
const githubReleaseAssetUrl = release => `https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v${release.version}/${release.assetName || 'AI-Agents-Lab-Windows.zip'}`;
const releaseItem = ({ version, url, sha256 }) => `<li><a data-zip-version="v${version}" data-zip-sha256="${sha256}" href="${url}">v${version}</a><code title="SHA-256: ${sha256}">${sha256.slice(0, 7)}</code></li>`;
const featuredR2 = [currentRelease, ...['2.0.15', '2.0.4'].map(version => releaseHistory.find(release => release.version === version)).filter(Boolean)];
const featuredVersions = new Set(featuredR2.map(release => release.version));
const historicalR2 = releaseHistory.filter(release => !featuredVersions.has(release.version));
const milestoneLinks = featuredR2.map(releaseItem).join('');
const releaseLinks = historicalR2.map(releaseItem).join('');
const betaLinks = betaHistory.map(release => releaseItem({...release, url:githubReleaseAssetUrl(release)})).join('');
const injectPageIdentity = html => html.replaceAll('{{BUILD_ID}}', buildId).replaceAll('{{RELEASE_VERSION}}', `v${currentStable.version}`);
writeFileSync(indexPath, injectPageIdentity(readFileSync(indexPath, 'utf8')).replaceAll('{{PUBLIC_MILESTONE_VERSION}}', `v${previousStable.version}`).replaceAll('{{PREVIOUS_STABLE_URL}}', previousStable.url).replaceAll('{{PREVIOUS_STABLE_SHA256}}', previousStable.sha256).replaceAll('{{GITHUB_RELEASE_URL}}', githubReleaseAssetUrl(currentStable)).replaceAll('{{GITHUB_RELEASE_VERSION}}', 'v'+currentStable.version).replaceAll('{{GITHUB_RELEASE_SHA256}}', currentStable.sha256).replaceAll('{{R2_MILESTONE_HISTORY}}', milestoneLinks).replaceAll('{{R2_LEGACY_COUNT}}', String(historicalR2.length)).replaceAll('{{RELEASE_HISTORY}}', releaseLinks).replaceAll('{{GITHUB_BETA_HISTORY}}', betaLinks));
for (const page of ['simple-guide.html', 'app-description.html']) {
  const pagePath = join(output, page);
  writeFileSync(pagePath, injectPageIdentity(readFileSync(pagePath, 'utf8')));
}
console.log(`Built ${output} (${buildId})`);
