'use strict';
// Generalizes Control's exact-membership verifier. Expected values are supplied
// from independently trusted build/review evidence, never derived from the release.
const { createHash } = require('node:crypto');
const { lstatSync, readFileSync, readdirSync } = require('node:fs');
const { resolve, join, parse } = require('node:path');
const { CheckError, requireCondition: check, cli } = require('./check-support.cjs');
const MANIFEST = 'deployment-manifest.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function safePath(value) {
  check(typeof value === 'string' && value.length > 0 && !/[\\:\x00-\x1f<>|?*]/.test(value) &&
    value.split('/').every(s => s && s !== '.' && s !== '..' && !/[. ]$/.test(s)) &&
    value !== MANIFEST, 'Unsafe or self-attesting manifest path.');
}
function noLinkAncestors(path) {
  const full = resolve(path);
  let current = parse(full).root;
  for (const segment of full.slice(current.length).split(/[\\/]/).filter(Boolean)) {
    current = join(current, segment);
    check(!lstatSync(current).isSymbolicLink(), 'Use a resolved immutable directory without symlink ancestors.');
  }
}
function verifyArtifact(directory, expected) {
  if (!/^[a-f0-9]{40}$/.test(expected.source || '') ||
      !/^[a-f0-9]{64}$/.test(expected.manifestHash || '') ||
      !expected.app || !expected.version)
    throw new CheckError('BLOCKED', 'Supply independently trusted app, version, full source SHA and manifest digest.');
  noLinkAncestors(directory);
  const root = resolve(directory);
  check(lstatSync(root).isDirectory(), 'Release root is not a directory.');
  const actual = [];
  function walk(dir, prefix = '') {
    for (const item of readdirSync(dir)) {
      const path = prefix + item;
      const stat = lstatSync(join(dir, item));
      check(!stat.isSymbolicLink(), 'Artifact contains a symlink.');
      if (stat.isDirectory()) walk(join(dir, item), path + '/');
      else {
        check(stat.isFile(), 'Artifact contains a non-regular file.');
        actual.push(path);
      }
    }
  }
  walk(root);
  check(actual.includes(MANIFEST), 'Artifact manifest is missing.');
  const bytes = readFileSync(join(root, MANIFEST));
  check(sha256(bytes) === expected.manifestHash, 'Manifest differs from independently trusted digest.');
  let manifest;
  try { manifest = JSON.parse(bytes.toString('utf8')); }
  catch { throw new CheckError('FAIL', 'Manifest is not valid JSON.'); }
  check(manifest && manifest.schema_version === '1.0.0' &&
    manifest.artifact === expected.app && manifest.application_version === expected.version &&
    manifest.source_git_sha === expected.source, 'Manifest identity/version/source mismatch.');
  check(Array.isArray(manifest.files) && manifest.files.length > 0, 'Manifest files must be nonempty.');
  const names = new Set();
  for (const file of manifest.files) {
    check(file && typeof file === 'object', 'Invalid manifest entry.');
    safePath(file.path);
    check(!names.has(file.path.toLowerCase()), 'Duplicate or case-colliding manifest path.');
    names.add(file.path.toLowerCase());
    check(Number.isSafeInteger(file.bytes) && file.bytes >= 0 &&
      /^[a-f0-9]{64}$/.test(file.sha256 || ''), 'Invalid file size or digest.');
  }
  const declared = manifest.files.map(f => f.path).concat(MANIFEST).sort();
  check(JSON.stringify(actual.sort()) === JSON.stringify(declared), 'Missing or extra artifact file.');
  for (const file of manifest.files) {
    const data = readFileSync(join(root, ...file.path.split('/')));
    check(data.length === file.bytes && sha256(data) === file.sha256, 'File size/hash mismatch.');
  }
  return 'Immutable release directory matches trusted manifest, expected identity/source and exact file membership; running/served mapping still requires verification.';
}
if (require.main === module) cli(args => {
  if (args.length !== 5) throw new CheckError('BLOCKED', 'Usage: node verify-runtime-artifact.cjs RELEASE_PATH APP_NAME APP_VERSION SOURCE_GIT_SHA MANIFEST_SHA256');
  return verifyArtifact(args[0], { app: args[1], version: args[2], source: args[3], manifestHash: args[4] });
});
module.exports = { verifyArtifact, safePath, sha256 };
