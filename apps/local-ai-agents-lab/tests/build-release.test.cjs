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
  assert.match(wizard,/\$null = & py "-\$version" --version/);
  assert.match(wizard,/CPU, \[2\] NVIDIA CUDA/);
  assert.match(wizard,/Install these CPU training libraries now/);
  assert.match(wizard,/No CPU fallback/);
});
test('packaged README is English only',()=>{
  const root=path.resolve(__dirname,'..');
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
  assert.doesNotMatch(readme,/[\u0370-\u03ff]/);
  assert.match(readme,/^# Markellos Ecosystem AI Agents Lab$/m);
  assert.match(readme,new RegExp(`Version: v${version.replaceAll('.', '\\.')} · Private local starter`));
  assert.match(readme,/## Run the Lab on a laptop/);
  assert.match(readme,/## Privacy and boundaries/);
});
test('Windows launcher packages the AI Training Lab desktop shortcut and valid icon',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'start-windows.bat'),'utf8');
  const shortcut=fs.readFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/create-desktop-shortcut\.ps1/);
  assert.match(shortcut,/Markellos Ecosystem AI Agents Lab\.lnk/);
  assert.match(shortcut,/assets\\ai-training-lab\.ico/);
  assert.match(packager,/'assets\/ai-training-lab\.ico'/);
  const icon=fs.readFileSync(path.join(root,'assets','ai-training-lab.ico'));
  assert.equal(icon.readUInt16LE(0),0);
  assert.equal(icon.readUInt16LE(2),1);
  assert.equal(icon.readUInt16LE(4),7);
  assert.ok(icon.length > 100000);
});
test('Easy Start is packaged, readiness-first, and requires explicit approval for each device change',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'start-windows.bat'),'utf8');
  const friendlyLauncher=fs.readFileSync(path.join(root,'Start AI Agents Lab.bat'),'utf8');
  const easyStart=fs.readFileSync(path.join(root,'scripts','easy-start.ps1'),'utf8');
  const shortcut=fs.readFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/easy-start\.ps1/);
  assert.match(launcher,/-LabRoot "%~dp0\."/g);
  assert.match(launcher,/--launch-server/);
  assert.match(friendlyLauncher,/start-windows\.bat/);
  assert.match(shortcut,/Start AI Agents Lab\.bat/);
  assert.match(packager,/Start AI Agents Lab\.bat/);
  assert.match(packager,/easy-start\.ps1/);
  assert.match(easyStart,/Python\.Python\.3\.12/);
  assert.match(easyStart,/Ollama\.Ollama/);
  assert.match(easyStart,/http:\/\/127\.0\.0\.1:11434\/api\/tags/);
  assert.match(easyStart,/http:\/\/127\.0\.0\.1:11434\/api\/pull/);
  assert.match(easyStart,/qwen2\.5:0\.5b/);
  assert.ok((easyStart.match(/Require-Approval/g)||[]).length >= 5);
  for(const forbidden of ['Invoke-Expression','DownloadString','Start-BitsTransfer','Invoke-WebRequest']){
    assert.doesNotMatch(easyStart,new RegExp(forbidden));
  }
});
test('three-panel interaction script is included in the Windows release',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const server=fs.readFileSync(path.join(root,'server.py'),'utf8');
  assert.match(packager,/'static\/panel-layout\.js'/);
  assert.match(server,/"\/static\/panel-layout\.js"/);
});
test('Model Guidance modules are included in the Windows release',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const html=fs.readFileSync(path.join(root,'static','index.html'),'utf8');
  assert.match(packager,/'static\/model-guidance-data\.js'/);
  assert.match(packager,/'static\/model-guidance\.js'/);
  assert.match(html,/\/static\/model-guidance-data\.js/);
  assert.match(html,/\/static\/model-guidance\.js/);
});
test('packaged UI identifies the ZIP version rather than a build identifier',()=>{
  const root=path.resolve(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'static','index.html'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const verifier=fs.readFileSync(path.join(root,'scripts','verify-release.cjs'),'utf8');
  assert.equal(html.split('ZIP version: ZIP_VERSION').length,3);
  assert.match(packager,/replaceAll\(placeholder,'v'\+version\)/);
  assert.match(verifier,/ZIP version: '\+zipVersion/);
});
test('a VERSION bump on main automatically creates the matching release ZIP',()=>{
  const root=path.resolve(__dirname,'..','..','..');
  const workflow=fs.readFileSync(path.join(root,'.github','workflows','publish-local-ai-agents-lab-release.yml'),'utf8');
  assert.match(workflow,/push:\s+branches: \[main\]/);
  assert.match(workflow,/'apps\/local-ai-agents-lab\/VERSION'/);
  assert.match(workflow,/gh release create/);
  assert.match(workflow,/--target "\$GITHUB_SHA"/);
  assert.match(workflow,/AI-Agents-Lab-Windows\.zip/);
});
