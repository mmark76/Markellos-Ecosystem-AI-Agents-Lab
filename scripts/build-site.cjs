// Build the static dashboard and its existing documentation from one commit.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const SITE_FILE_MAX_BUFFER = 16 * 1024 * 1024;
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const [ref, destination] = process.argv.slice(2);
if (!ref || !destination) throw new Error('Usage: node scripts/build-site.cjs <commit> <new-output-directory>');
const sha = git('rev-parse', '--verify', `${ref}^{commit}`);
const output = path.resolve(destination);
if (fs.existsSync(output)) throw new Error('Output directory must not exist');
const files = git('ls-tree', '-r', '--name-only', sha).split('\n').filter(file =>
  !file.startsWith('.') && !/^(scripts|tests)\//.test(file) &&
  (/\.(html|css|md|svg|png|ico)$/.test(file) || file === 'dashboard.js' || file === 'design-system/tokens/tokens.json' || file === 'TEMPLATE_VERSION')
);
fs.mkdirSync(output, { recursive: true });
for (const file of files) {
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, execFileSync('git', ['show', `${sha}:${file}`], { cwd: root, maxBuffer: SITE_FILE_MAX_BUFFER }));
}
const version = git('show', `${sha}:TEMPLATE_VERSION`);
const timestamp = git('show', '-s', '--format=%cI', sha);
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Nicosia', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
}).formatToParts(new Date(timestamp)).map(part => [part.type, part.value]));
const date = `${parts.year}${parts.month}${parts.day}`;
const time = `${parts.hour}${parts.minute}`;
const buildId = `v${version}_${date}_${time}_${sha.slice(0, 7)}`;
const index = path.join(output, 'index.html');
let html = fs.readFileSync(index, 'utf8');
for (const [name, value] of Object.entries({ 'build-version': version, 'build-date': date, 'build-time': time, 'build-commit': sha.slice(0, 7) })) {
  html = html.replace(new RegExp(`(<meta name="${name}" content=")[^"]*(">)`), (_, before, after) => before + value + after);
}
html = html.replace(/v\d+\.\d+\.\d+_\d{8}_\d{4}_[0-9a-f]{7}/g, buildId);
fs.writeFileSync(index, html);
fs.writeFileSync(path.join(output, 'deployment.json'), JSON.stringify({ repository: 'mmark76/integrated-project-template', commit: sha, buildId, timestamp }, null, 2) + '\n');
console.log(JSON.stringify({ output, commit: sha, buildId, fileCount: files.length + 1 }));
