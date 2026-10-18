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
// A separately verified GitHub BETA release can be newer than the R2 public ZIP.
// Keep the R2 registry and its primary download unchanged until R2 publication.
const githubBetaRelease = Object.freeze({
  version: '2.0.18',
  sha256: '8ab769da535517d5f02a3e6b7e1e24b1e81e62221aa5fde3fe29b65be2e05c0e',
});
if (!/^\d+\.\d+\.\d+$/.test(githubBetaRelease.version) || !/^[a-f0-9]{64}$/.test(githubBetaRelease.sha256))
  throw new Error('Invalid verified GitHub BETA release metadata');
const commit = git(['rev-parse', '--short=7', 'HEAD']);
const buildId = `v${releaseVersion}_${cyprusTimestamp(new Date())}_${commit}`;
const indexPath = join(output, 'index.html');
const githubReleaseAssetUrl = version => `https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/v${version}/AI-Agents-Lab-Windows.zip`;
const milestoneButton=(version,scope)=>{
  const release=currentRelease.version===version?null:releaseHistory.find(entry=>entry.version===version);
  return release?'<a id="zip-download-v'+version.replaceAll('.','')+'" class="secondary-button release-download" data-zip-version="v'+version+'" data-zip-sha256="'+release.sha256+'" data-download-source="cloudflare-r2" href="'+release.url+'"><span>Download v'+version+'</span><small>'+scope+'</small></a>':'';
};
const legacyButton=[milestoneButton('2.0.15','Previous milestone · local + optional internet connections'),milestoneButton('2.0.4','Local only')].join('');
const releaseLinks = previousReleases.map(({ version, url, sha256 }) => `<li><a data-zip-version="v${version}" data-zip-sha256="${sha256}" href="${url}">v${version}</a><code title="SHA-256: ${sha256}">${sha256.slice(0, 7)}</code></li>`).join('');
const injectPageIdentity = html => html.replaceAll('{{BUILD_ID}}', buildId).replaceAll('{{RELEASE_VERSION}}', `v${currentRelease.version}`);
writeFileSync(indexPath, injectPageIdentity(readFileSync(indexPath, 'utf8')).replaceAll('{{DISTRIBUTION_URL}}', currentRelease.url).replaceAll('{{GITHUB_RELEASE_URL}}', githubReleaseAssetUrl(githubBetaRelease.version)).replaceAll('{{GITHUB_RELEASE_VERSION}}', 'v'+githubBetaRelease.version).replaceAll('{{GITHUB_RELEASE_SHA256}}', githubBetaRelease.sha256).replaceAll('{{RELEASE_SHA256}}', currentRelease.sha256).replaceAll('{{LEGACY_DOWNLOAD_BUTTON}}', legacyButton).replaceAll('{{ARCHIVE_COUNT}}', String(previousReleases.length)).replaceAll('{{RELEASE_HISTORY}}', releaseLinks));
for (const page of ['simple-guide.html', 'app-description.html']) {
  const pagePath = join(output, page);
  writeFileSync(pagePath, injectPageIdentity(readFileSync(pagePath, 'utf8')));
}
console.log(`Built ${output} (${buildId})`);
