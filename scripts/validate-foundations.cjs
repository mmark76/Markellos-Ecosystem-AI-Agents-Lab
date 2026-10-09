'use strict';

const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const requiredFiles = [
  'FOUNDATION_SOURCES.md', 'FOUNDATION_VERSIONS', 'TEMPLATE_VERSION',
  'foundations/engineering-standards/ENGINEERING-REQUIREMENTS.md',
  'foundations/shield/model/security-capabilities.json',
  'foundations/shield/templates/strong-room/docker/compose.yaml.template',
  'foundations/shield/checks/strong-room/verify-container-hardening.cjs',
  'foundations/shield/tests/strong-room.test.cjs',
  'foundations/infrastructure/README.md'
];
const prohibitedFile = new RegExp('(^|/)(?:[.]env(?:[.].*)?|id_rsa(?:[.]pub)?|credentials(?:[.]json)?|.*[.](?:pem|key|p12|pfx))$', 'i');
const secretShapes = [
  /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/
];
const publicIpv4 = /\b(?!(?:0|10|127|169|172|192)\.)(?:1?\d?\d|2[0-4]\d|25[0-5])(?:\.(?:1?\d?\d|2[0-4]\d|25[0-5])){3}\b/g;

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function validate() {
  const failures = [];
  for (const file of requiredFiles) if (!existsSync(join(root, file))) failures.push(`Missing required import: ${file}`);
  const versions = readFileSync(join(root, 'FOUNDATION_VERSIONS'), 'utf8');
  for (const name of ['DNA', 'ENGINEERING_STANDARDS', 'SHIELD', 'INFRASTRUCTURE']) {
    if (!new RegExp(`^${name}_REVISION=[a-f0-9]{40}$`, 'm').test(versions)) failures.push(`Invalid ${name} revision pin.`);
  }
  for (const file of walk(join(root, 'foundations'))) {
    const name = relative(root, file).replaceAll('\\', '/');
    if (prohibitedFile.test(name)) failures.push(`Prohibited sensitive file name: ${name}`);
    const text = readFileSync(file, 'utf8');
    if (secretShapes.some(shape => shape.test(text))) failures.push(`Credential-shaped content: ${name}`);
    if (publicIpv4.test(text)) failures.push(`Public IPv4 literal: ${name}`);
    publicIpv4.lastIndex = 0;
  }
  if (failures.length) throw new Error(failures.join('\n'));
  return { checkedFiles: walk(join(root, 'foundations')).length };
}

if (require.main === module) console.log(JSON.stringify({ status: 'PASS', ...validate() }));
module.exports = { validate };
