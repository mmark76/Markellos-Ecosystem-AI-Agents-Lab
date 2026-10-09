'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readFileSync, rmSync, unlinkSync, symlinkSync, readdirSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve, dirname, relative } = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyBinding } = require('../checks/strong-room/verify-origin-binding.cjs');
const { verifyHardening } = require('../checks/strong-room/verify-container-hardening.cjs');
const { verifyArtifact, sha256, safePath } = require('../checks/strong-room/verify-runtime-artifact.cjs');
const base = resolve(__dirname, '..');
const expected = {
  network: 'example-private', image: 'example.invalid/static@sha256:' + 'a'.repeat(64),
  user: '1001:1001', release: '/srv/example/releases/test', nginx: '/srv/example/nginx.conf'
};
function container() {
  return {
    State: { Running: true, Health: { Status: 'healthy' } },
    Config: { User: expected.user, Image: expected.image, Labels: { 'traefik.enable': 'false' } },
    HostConfig: {
      NetworkMode: 'example-private', Privileged: false, ReadonlyRootfs: true,
      CapDrop: ['ALL'], CapAdd: [], SecurityOpt: ['no-new-privileges:true'],
      Memory: 64 * 1024 * 1024, PidsLimit: 64, NanoCpus: 250000000,
      Tmpfs: { '/tmp': 'size=16m,mode=1777,noexec,nosuid,nodev' },
      PortBindings: { '8080/tcp': [{ HostIp: '127.0.0.1', HostPort: '15080' }] }
    },
    NetworkSettings: {
      Networks: { 'example-private': {} },
      Ports: { '8080/tcp': [{ HostIp: '127.0.0.1', HostPort: '15080' }] }
    },
    Mounts: [
      { Type: 'bind', RW: false, Source: expected.release, Destination: '/usr/share/nginx/html' },
      { Type: 'bind', RW: false, Source: expected.nginx, Destination: '/etc/nginx/nginx.conf' }
    ]
  };
}
test('loopback binding passes only its metadata scope', () => {
  assert.match(verifyBinding(container(), 15080, 8080), /external probes still required/);
});
for (const [name, change] of [
  ['ineffective requested-only binding', c => { c.NetworkSettings.Ports['8080/tcp'] = null; }],
  ['wildcard IPv4', c => { c.NetworkSettings.Ports['8080/tcp'][0].HostIp = '0.0.0.0'; }],
  ['wildcard IPv6', c => { c.NetworkSettings.Ports['8080/tcp'][0].HostIp = '::'; }],
  ['extra published port', c => { c.NetworkSettings.Ports['9000/tcp'] = [{ HostIp: '127.0.0.1', HostPort: '15081' }]; }],
  ['host networking', c => { c.HostConfig.NetworkMode = 'host'; }],
  ['wrong host port', c => { c.NetworkSettings.Ports['8080/tcp'][0].HostPort = '15081'; }],
  ['stopped container', c => { c.State.Running = false; }]
]) test('binding rejects ' + name, () => {
  const c = container(); change(c);
  assert.throws(() => verifyBinding(c, 15080, 8080), { status: 'FAIL' });
});
test('invalid expected port is BLOCKED', () => {
  assert.throws(() => verifyBinding(container(), 0, 8080), { status: 'BLOCKED' });
});
test('hardened static metadata passes with explicit limits', () => {
  assert.match(verifyHardening(container(), expected), /configuration predicates only/);
});
for (const [name, change] of [
  ['root', c => { c.Config.User = '0:0'; }],
  ['writable root', c => { c.HostConfig.ReadonlyRootfs = false; }],
  ['privileged', c => { c.HostConfig.Privileged = true; }],
  ['capability addition', c => { c.HostConfig.CapAdd = ['SYS_ADMIN']; }],
  ['missing capability drop', c => { c.HostConfig.CapDrop = []; }],
  ['privilege escalation', c => { c.HostConfig.SecurityOpt = []; }],
  ['unconfined', c => { c.HostConfig.SecurityOpt.push('seccomp=unconfined'); }],
  ['shared proxy network', c => { c.NetworkSettings.Networks.proxy = {}; }],
  ['writable content', c => { c.Mounts[0].RW = true; }],
  ['wrong release', c => { c.Mounts[0].Source = '/srv/example/other'; }],
  ['extra socket mount', c => { c.Mounts.push({ Type: 'bind', Source: '/var/run/docker.sock', Destination: '/var/run/docker.sock', RW: true }); }],
  ['unbounded memory', c => { c.HostConfig.Memory = 0; }],
  ['unsafe temp', c => { c.HostConfig.Tmpfs['/tmp'] = 'size=16m'; }],
  ['unhealthy', c => { c.State.Health.Status = 'unhealthy'; }],
  ['proxy route', c => { c.Config.Labels['traefik.http.routers.example.rule'] = 'Host(example.invalid)'; }],
  ['unreviewed image', c => { c.Config.Image = 'example.invalid/static:latest'; }],
  ['host process namespace', c => { c.HostConfig.PidMode = 'host'; }],
  ['device access', c => { c.HostConfig.Devices = [{}]; }]
]) test('hardening rejects ' + name, () => {
  const c = container(); change(c);
  assert.throws(() => verifyHardening(c, expected), { status: 'FAIL' });
});
function artifact(t) {
  const root = mkdtempSync(join(tmpdir(), 'strong-room-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const data = Buffer.from('<p>synthetic private content</p>');
  writeFileSync(join(root, 'index.html'), data);
  const manifest = {
    schema_version: '1.0.0', artifact: 'example-app', application_version: '1.0.0',
    source_git_sha: 'b'.repeat(40),
    files: [{ path: 'index.html', bytes: data.length, sha256: sha256(data) }]
  };
  const exp = { app: 'example-app', version: '1.0.0', source: 'b'.repeat(40) };
  function save() {
    const text = JSON.stringify(manifest);
    writeFileSync(join(root, 'deployment-manifest.json'), text);
    exp.manifestHash = sha256(Buffer.from(text));
  }
  save();
  return { root, manifest, exp, save };
}
test('complete artifact with independent expectations passes', t => {
  const f = artifact(t);
  assert.match(verifyArtifact(f.root, f.exp), /running\/served mapping still requires/);
});
for (const [name, change] of [
  ['modified file', f => writeFileSync(join(f.root, 'index.html'), 'changed')],
  ['missing file', f => unlinkSync(join(f.root, 'index.html'))],
  ['missing manifest', f => unlinkSync(join(f.root, 'deployment-manifest.json'))],
  ['extra file', f => writeFileSync(join(f.root, 'extra.txt'), 'extra')],
  ['wrong source', f => { f.exp.source = 'c'.repeat(40); }],
  ['wrong app', f => { f.exp.app = 'another-app'; }],
  ['wrong version', f => { f.exp.version = '2.0.0'; }],
  ['substituted manifest', f => { f.manifest.application_version = '2.0.0'; writeFileSync(join(f.root, 'deployment-manifest.json'), JSON.stringify(f.manifest)); }],
  ['traversal', f => { f.manifest.files[0].path = '../index.html'; f.save(); }],
  ['duplicate member', f => { f.manifest.files.push(f.manifest.files[0]); f.save(); }],
  ['incorrect recorded size', f => { f.manifest.files[0].bytes += 1; f.save(); }],
  ['incorrect recorded hash', f => { f.manifest.files[0].sha256 = 'd'.repeat(64); f.save(); }]
]) test('artifact rejects ' + name, t => {
  const f = artifact(t); change(f);
  assert.throws(() => verifyArtifact(f.root, f.exp), { status: 'FAIL' });
});
test('untrusted or missing expected digest is BLOCKED', t => {
  const f = artifact(t); delete f.exp.manifestHash;
  assert.throws(() => verifyArtifact(f.root, f.exp), { status: 'BLOCKED' });
});
test('directory symlink/junction inside artifact is rejected', t => {
  const f = artifact(t);
  // Windows junctions need no symlink privilege. Target is our own disposable root.
  try {
    symlinkSync(f.root, join(f.root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (error?.code === 'EPERM') return t.skip('The current environment does not permit symlink or junction creation.');
    throw error;
  }
  assert.throws(() => verifyArtifact(f.root, f.exp), { status: 'FAIL' });
});
test('unsafe portable paths fail before access', () => {
  for (const path of ['../x', '/x', 'C:/x', 'a\\b', 'a//b', 'a/./b', 'a:stream', 'deployment-manifest.json', 'a.'])
    assert.throws(() => safePath(path), { status: 'FAIL' });
});
test('CLI exits zero only on complete verification, one on mismatch, two on missing input', t => {
  const f = artifact(t);
  const script = join(base, 'checks/strong-room/verify-runtime-artifact.cjs');
  const args = [script, f.root, f.exp.app, f.exp.version, f.exp.source, f.exp.manifestHash];
  const run = argv => spawnSync(process.execPath, argv, { encoding: 'utf8' });
  assert.equal(run(args).status, 0);
  writeFileSync(join(f.root, 'index.html'), 'changed');
  const failure = run(args);
  assert.equal(failure.status, 1);
  assert.equal(JSON.parse(failure.stdout).status, 'FAIL');
  assert.equal(run([script]).status, 2);
});
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.name === '.git' ? [] : e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]);
}
test('relative Markdown links resolve', () => {
  for (const file of files(base).filter(p => p.endsWith('.md'))) {
    for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^https?:|^#/.test(link)) continue;
      assert.ok(existsSync(resolve(dirname(file), link.split('#')[0])), relative(base, file) + ' -> ' + link);
    }
  }
});
test('every template placeholder is documented', () => {
  const doc = readFileSync(join(base, 'templates/strong-room/README.md'), 'utf8');
  for (const file of files(join(base, 'templates')).filter(p => p.endsWith('.template'))) {
    for (const match of readFileSync(file, 'utf8').matchAll(/<([A-Z][A-Z0-9_]*)>/g))
      assert.ok(doc.includes(match[1]), match[1]);
  }
});
test('templates carry fail-closed controls without production defaults', () => {
  const compose = readFileSync(join(base, 'templates/strong-room/docker/compose.yaml.template'), 'utf8');
  assert.match(compose, /<LOCAL_BIND_ADDRESS>:<LOCAL_PORT>:<CONTAINER_PORT>/);
  assert.match(compose, /image: "<IMAGE_REFERENCE>"/);
  assert.match(compose, /create_host_path: false/);
  assert.doesNotMatch(compose, /internal:\s*true|privileged:\s*true|external:\s*true/);
  const ingress = readFileSync(join(base, 'templates/strong-room/tunnel/ingress.yaml.template'), 'utf8');
  assert.match(ingress, /required: true/);
  assert.match(ingress, /audTag:\s*\n\s*- "<ACCESS_AUD>"/);
  const nginx = readFileSync(join(base, 'templates/strong-room/nginx/nginx.conf.template'), 'utf8');
  assert.match(nginx, /try_files \$uri \$uri\/ =404/);
  assert.match(nginx, /private, no-store/);
  assert.match(nginx, /return 405/);
});
