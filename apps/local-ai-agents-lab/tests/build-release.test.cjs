'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {formatBuildId}=require('../scripts/build-release.cjs');
const fs=require('node:fs');
const path=require('node:path');
const sha='abcdef0123456789abcdef0123456789abcdef01';

test('EET winter uses Europe/Nicosia (+02:00)',()=>{
  assert.equal(formatBuildId('0.1.1',sha,'2026-01-15T12:00:00Z'),'v0.1.1_20260115_1400_abcdef0');
});
test('EEST summer uses Europe/Nicosia (+03:00)',()=>{
  assert.equal(formatBuildId('1.2.3',sha,'2026-07-15T12:00:00Z'),'v1.2.3_20260715_1500_abcdef0');
});
test('invalid version, SHA, and time are rejected',()=>{
  assert.throws(()=>formatBuildId('1.0.0-beta',sha,'2026-01-15T12:00:00Z'));
  assert.throws(()=>formatBuildId('1.0.0','not-a-git-sha','2026-01-15T12:00:00Z'));
  assert.throws(()=>formatBuildId('1.0.0',sha,'nonsense'));
});
test('Windows training wizard is packaged and opt-in',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'setup-training-windows.bat'),'utf8');
  const wizard=fs.readFileSync(path.join(root,'scripts','setup-training.ps1'),'utf8');
  assert.match(launcher,/setup-training\.ps1/);
  assert.match(wizard,/CPU, \[2\] NVIDIA CUDA/);
  assert.match(wizard,/Install these CPU training libraries now/);
  assert.match(wizard,/No CPU fallback/);
});
test('packaged README is English only',()=>{
  const root=path.resolve(__dirname,'..');
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  assert.doesNotMatch(readme,/[\u0370-\u03ff]/);
  assert.match(readme,/## Run the Lab on a laptop/);
  assert.match(readme,/## Privacy and boundaries/);
});
test('Windows launcher packages the University Lab desktop shortcut and icon',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'start-windows.bat'),'utf8');
  const shortcut=fs.readFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/create-desktop-shortcut\.ps1/);
  assert.match(shortcut,/Markellos AI Agents University Lab\.lnk/);
  assert.match(shortcut,/assets\\university-lab\.ico/);
  assert.match(packager,/'assets\/university-lab\.ico'/);
  assert.ok(fs.statSync(path.join(root,'assets','university-lab.ico')).size > 0);
});
test('safe update-check inputs are packaged',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const updates=fs.readFileSync(path.join(root,'updates.py'),'utf8');
  assert.match(packager,/'updates\.py'/);
  assert.match(packager,/'static\/updates\.js'/);
  assert.match(updates,/releases\/latest/);
  assert.match(updates,/never downloads, installs, or executes an/);
});
