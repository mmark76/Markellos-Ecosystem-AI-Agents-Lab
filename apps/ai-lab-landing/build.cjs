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
if (distribution.version !== releaseVersion) throw new Error('Release distribution version must match local Lab VERSION');
if (!/^https:\/\/pub-[a-z0-9]+\.r2\.dev\/releases\/v\d+\.\d+\.\d+\/AI-Agents-Lab-Windows\.zip$/.test(distribution.url)) throw new Error('Invalid public R2 distribution URL');
if (!/^[a-f0-9]{64}$/.test(distribution.sha256)) throw new Error('Invalid public release SHA-256');
const commit = git(['rev-parse', '--short=7', 'HEAD']);
const buildId = `v${releaseVersion}_${cyprusTimestamp(new Date())}_${commit}`;
const indexPath = join(output, 'index.html');
writeFileSync(indexPath, readFileSync(indexPath, 'utf8').replaceAll('{{BUILD_ID}}', buildId).replaceAll('{{RELEASE_VERSION}}', `v${releaseVersion}`).replaceAll('{{DISTRIBUTION_URL}}', distribution.url).replaceAll('{{RELEASE_SHA256}}', distribution.sha256));
console.log(`Built ${output} (${buildId})`);
