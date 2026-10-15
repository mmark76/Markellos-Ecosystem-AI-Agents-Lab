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
const commit = git(['rev-parse', '--short=7', 'HEAD']);
const buildId = `v${releaseVersion}_${cyprusTimestamp(new Date())}_${commit}`;
const indexPath = join(output, 'index.html');
const legacy = currentRelease.version === '1.1.8' ? null : releaseHistory.find(entry => entry.version === '1.1.8');
const legacyButton = legacy ? '<a id="zip-download-v118" class="secondary-button" data-zip-version="v1.1.8" data-zip-sha256="'+legacy.sha256+'" href="'+legacy.url+'">Download v1.1.8</a>' : '';
const releaseLinks = previousReleases.map(({ version, url, sha256 }) => `<li><a data-zip-version="v${version}" data-zip-sha256="${sha256}" href="${url}">v${version}</a><code title="SHA-256: ${sha256}">${sha256.slice(0, 7)}</code></li>`).join('');
writeFileSync(indexPath, readFileSync(indexPath, 'utf8').replaceAll('{{BUILD_ID}}', buildId).replaceAll('{{RELEASE_VERSION}}', `v${currentRelease.version}`).replaceAll('{{DISTRIBUTION_URL}}', currentRelease.url).replaceAll('{{RELEASE_SHA256}}', currentRelease.sha256).replaceAll('{{LEGACY_DOWNLOAD_BUTTON}}', legacyButton).replaceAll('{{ARCHIVE_COUNT}}', String(previousReleases.length)).replaceAll('{{RELEASE_HISTORY}}', releaseLinks));
console.log(`Built ${output} (${buildId})`);
