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
test('all fifteen Lab-scoped role prompt files are packaged and release-verified',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const verifier=fs.readFileSync(path.join(root,'scripts','verify-release.cjs'),'utf8');
  for(const role of [
    "conference-strategist","conference-analyst","conference-engineer",
    "training-tutor","training-student","training-evaluator","training-improver",
    "evaluation-assessor","evaluation-scorer","evaluation-benchmarker",
    "advisory-analyst","advisory-advisor",
    "optimization-diagnostician","optimization-optimizer","optimization-validator"
  ]){
    const name='prompts/'+role+'.txt';
    assert.ok(fs.readFileSync(path.join(root,name),'utf8').trim());
    assert.ok(packager.includes("'"+name+"'"));
    assert.ok(verifier.includes('"'+role+'"'));
  }
});
test('next Windows ZIP bundles both approved learning documents without runtime imports',()=>{
  const root=path.resolve(__dirname,'..','..','..');
  const packager=fs.readFileSync(path.join(root,'apps','local-ai-agents-lab','scripts','build-release.cjs'),'utf8');
  const verifier=fs.readFileSync(path.join(root,'apps','local-ai-agents-lab','scripts','verify-release.cjs'),'utf8');
  for(const name of ['EDUCATIONAL_RESOURCE_LIBRARY.md','STARTER_EXERCISES.md']){
    assert.ok(fs.readFileSync(path.join(root,'docs','learning',name),'utf8').trim(),name);
    assert.ok(packager.includes("'"+name+"'"),name+' missing from build');
    assert.ok(verifier.includes("'"+name+"'"),name+' missing from release verification');
  }
  assert.match(packager,/text\.replace\(original,'\.\.\/\.\.\/prompts\/'\)/);
  assert.match(verifier,/library\.includes\('\.\.\/\.\.\/prompts\/'\)/);
});

test('Windows training wizard is packaged and opt-in',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'setup-training-environment.bat'),'utf8');
  const wizard=fs.readFileSync(path.join(root,'scripts','setup-training.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/setup-training\.ps1/);
  assert.match(wizard,/\$null = & py "-\$version" --version/);
  assert.match(wizard,/CPU, \[2\] NVIDIA CUDA/);
  assert.match(wizard,/Install these CPU training libraries now/);
  assert.match(wizard,/No CPU fallback/);
  assert.match(packager,/'training\/job_contract\.py'/);
  assert.match(packager,/'training\/readiness\.py'/);
});
test('packaged README is English only',()=>{
  const root=path.resolve(__dirname,'..');
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
  assert.doesNotMatch(readme,/[\u0370-\u03ff]/);
  assert.match(readme,/^# Markellos Ecosystem AI Lab$/m);
  assert.match(readme,new RegExp(`Version: v${version.replaceAll('.', '\\.')} · Private local starter`));
  assert.match(readme,/## Run the Lab on a laptop/);
  assert.match(readme,/## Privacy and boundaries/);
});
test('Windows launcher packages the AI Lab desktop shortcut and valid icon',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'Start AI Training Lab.bat'),'utf8');
  const shortcut=fs.readFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/create-desktop-shortcut\.ps1/);
  const icon=fs.readFileSync(path.join(root,'assets','ai-training-lab.ico'));
  assert.match(shortcut,/AI Training Lab v\$version\.lnk/);
  assert.match(shortcut,/Get-LabVersion \$root/);
  assert.match(shortcut,/assets\\ai-training-lab\.ico/);
  assert.match(packager,/'assets\/ai-training-lab\.ico'/);
  assert.match(packager,/'assets\/chatgpt-advisor-avatar\.png'/);
  assert.match(packager,/'scripts\/get-lab-version\.ps1'/);
  assert.match(packager,/RELEASE_FILE_MAX_BUFFER=16\*1024\*1024/);
  assert.match(packager,/maxBuffer:RELEASE_FILE_MAX_BUFFER/);
  assert.equal(icon.readUInt16LE(0),0);
  assert.equal(icon.readUInt16LE(2),1);
  assert.equal(icon.readUInt16LE(4),7);
  assert.ok(icon.length > 100000);
});
test('Easy Start is packaged, readiness-first, and requires explicit approval for each device change',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'Start AI Training Lab.bat'),'utf8');
  const easyStart=fs.readFileSync(path.join(root,'scripts','easy-start.ps1'),'utf8');
  const shortcut=fs.readFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/easy-start\.ps1/);
  assert.match(launcher,/-LabRoot "%~dp0\."/g);
  assert.match(launcher,/--launch-server/);
  assert.doesNotMatch(launcher,/start-windows\.bat/);
  assert.doesNotMatch(packager,/'start-windows\.bat'/);
  assert.doesNotMatch(packager,/'setup-training-windows\.bat'/);
  assert.match(packager,/'setup-training-environment\.bat'/);
  assert.match(shortcut,/Start AI Training Lab\.bat/);
  assert.match(packager,/Start AI Training Lab\.bat/);
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
test('first-run setup remembers the optional shortcut choice and leaves dashboard protocols independent',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'Start AI Training Lab.bat'),'utf8');
  const finish=fs.readFileSync(path.join(root,'scripts','finish-setup.ps1'),'utf8');
  const shortcut=fs.readFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),'utf8');
  const protocols=fs.readFileSync(path.join(root,'scripts','register-dashboard-protocols.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/finish-setup\.ps1/);
  assert.match(launcher,/register-dashboard-protocols\.ps1/);
  assert.match(launcher,/create-desktop-shortcut\.ps1/);
  assert.match(finish,/setup-preferences\.json/);
  assert.match(finish,/Create a Desktop shortcut/);
  assert.match(finish,/Finish & Start/);
  assert.match(finish,/DialogResult\]::Cancel/);
  assert.match(finish,/if \(\$result -ne \[System\.Windows\.Forms\.DialogResult\]::OK\) \{ exit 1 \}/);
  assert.match(finish,/desktopShortcut = \$createShortcut/);
  assert.match(shortcut,/if \(-not \$preferences\.desktopShortcut\) \{ exit 0 \}/);
  assert.doesNotMatch(shortcut,/HKCU:\\Software\\Classes/);
  assert.match(protocols,/HKCU:\\Software\\Classes/);
  assert.match(packager,/'scripts\/finish-setup\.ps1'/);
  assert.match(packager,/'scripts\/register-dashboard-protocols\.ps1'/);
});
test('Windows installer and shortcut display the version from the packaged VERSION file',()=>{
  const root=path.resolve(__dirname,'..');
  const read=name=>fs.readFileSync(path.join(root,name),'utf8');
  const versionReader=read('scripts/get-lab-version.ps1');
  const shortcut=read('scripts/create-desktop-shortcut.ps1');
  const finish=read('scripts/finish-setup.ps1');
  const easyStart=read('scripts/easy-start.ps1');
  const training=read('scripts/setup-training.ps1');
  const protocols=read('scripts/register-dashboard-protocols.ps1');
  const preflight=read('scripts/prepare-local-server.ps1');
  const launcher=read('Start AI Training Lab.bat');
  assert.match(versionReader,/Join-Path \$Root 'VERSION'/);
  assert.match(versionReader,/\^\\d\+\\\.\\d\+\\\.\\d\+\$/);
  for(const script of [shortcut,finish,easyStart,training,protocols,preflight]){
    assert.match(script,/get-lab-version\.ps1/);
    assert.match(script,/Get-LabVersion/);
    assert.match(script,/v\$version/);
  }
  assert.match(shortcut,/"AI Training Lab v\$version\.lnk"/);
  assert.match(shortcut,/\$shortcut\.Description = "Set up and open AI Training Lab v\$version/);
  assert.match(finish,/Create a Desktop shortcut: AI Training Lab v\$version/);
  assert.match(launcher,/%%V in \("%~dp0VERSION"\)/);
  assert.match(launcher,/AI Training Lab v%LAB_VERSION%/);
});
test('Windows PowerShell 5.1 can decode Easy Start Unicode labels',()=>{
  const root=path.resolve(__dirname,'..');
  const script=fs.readFileSync(path.join(root,'scripts','easy-start.ps1'));
  assert.equal(script.subarray(0,3).toString('hex'),'efbbbf','powershell.exe requires a UTF-8 BOM to read non-ASCII script text correctly');
  const source=script.toString('utf8');
  assert.match(source,/AI Training Lab v\$version — Easy Start/);
  assert.match(source,/Starting Ollama locally…/);
});
test('three-panel interaction script is included in the Windows release',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const server=fs.readFileSync(path.join(root,'server.py'),'utf8');
  const styles=fs.readFileSync(path.join(root,'static','style.css'),'utf8');
  assert.match(packager,/'static\/panel-layout\.js'/);
  assert.match(server,/"\/static\/panel-layout\.js"/);
  assert.match(packager,/'static\/connection-dialogs\.js'/);
  assert.match(fs.readFileSync(path.join(root,'static','index.html'),'utf8'),/\/static\/connection-dialogs\.js/);
  assert.match(server,/"\/static\/connection-dialogs\.js"/);
  assert.match(styles,/#open-connections-hub\{position:relative;min-height:68px/);
  assert.match(styles,/content:"Open ›"/);
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
test('Evaluation Lab Python dependencies and browser assets are included in Windows packaging',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const html=fs.readFileSync(path.join(root,'static','index.html'),'utf8');
  const server=fs.readFileSync(path.join(root,'server.py'),'utf8');
  const required=[
    'evaluation_lab/__init__.py','evaluation_lab/contracts.py',
    'evaluation_lab/repository.py','evaluation_lab/execution.py',
    'evaluation_lab/model_adapter.py','evaluation_lab/prompt.py',
    'evaluation_lab/response.py','evaluation_lab/http_api.py',
    'static/evaluation.js','static/evaluation.css'
  ];
  for (const file of required) {
    assert.ok(fs.readFileSync(path.join(root,file),'utf8').trim(),file+' must exist');
    assert.ok(packager.includes("'"+file+"'"),file+' is absent from release manifest');
  }
  for (const asset of ['evaluation.js','evaluation.css']) {
    assert.ok(html.includes('/static/'+asset),'HTML must reference '+asset);
    assert.ok(server.includes('"/static/'+asset+'"'),'Local server must serve '+asset);
  }
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
  assert.match(workflow,/AI-Agents-Lab-Windows-v\$\{version\}\.zip/);
  assert.match(workflow,/AI-Agents-Lab-Windows-\$\{\{ steps\.version\.outputs\.tag \}\}\.zip/);
  assert.doesNotMatch(workflow,/AI-Agents-Lab-Windows\.zip/);
});


test('Dashboard launcher registers separate Open, Refresh and Stop actions with a stop-only preflight',()=>{
  const root=path.resolve(__dirname,'..');
  const register=fs.readFileSync(path.join(root,'scripts','register-dashboard-protocols.ps1'),'utf8');
  const handler=fs.readFileSync(path.join(root,'scripts','launch-from-dashboard.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(register,/HKCU:\\Software\\Classes\\' \+ \$registration\.Name/);
  assert.match(register,/Name = 'markellos-ai-training-lab'/);
  assert.match(register,/markellos-ai-training-lab-refresh/);
  assert.match(register,/Name = 'markellos-ai-training-lab-stop'/);
  assert.match(register,/Action = 'Stop'/);
  assert.match(register,/URL Protocol/);
  assert.match(register,/launch-from-dashboard\.ps1/);
  assert.match(register,/-Action ' \+ \$registration\.Action/);
  assert.match(handler,/Start AI Training Lab\.bat/);
  assert.match(handler,/http:\/\/127\.0\.0\.1:8765\//);
  assert.match(handler,/ValidateSet\('Open', 'Refresh', 'Stop'\)/);
  assert.match(handler,/if \(\$Action -eq 'Stop'\)/);
  assert.match(handler,/prepare-local-server\.ps1/);
  assert.match(handler,/-StopOnly/);
  assert.match(handler,/\$Action -eq 'Refresh'/);
  assert.doesNotMatch(handler,/ProtocolUri|Request\.Url|\$args/);
  assert.match(packager,/'scripts\/launch-from-dashboard\.ps1'/);
});

test('Windows background server startup preserves process identity and bounded local API log access',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'Start AI Training Lab.bat'),'utf8');
  const startup=fs.readFileSync(path.join(root,'scripts','start-background-server.ps1'),'utf8');
  const preflight=fs.readFileSync(path.join(root,'scripts','prepare-local-server.ps1'),'utf8');
  const server=fs.readFileSync(path.join(root,'server.py'),'utf8');
  const ui=fs.readFileSync(path.join(root,'static','index.html'),'utf8');
  const script=fs.readFileSync(path.join(root,'static','api-logs.js'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(launcher,/start-background-server\.ps1/);
  assert.doesNotMatch(launcher,/py -3 "%~dp0server\.py"|python "%~dp0server\.py"/);
  assert.match(startup,/Start-Process -FilePath \$python/);
  assert.match(startup,/-WindowStyle Hidden/);
  assert.match(startup,/-RedirectStandardError \$errors/);
  assert.match(startup,/Get-NetTCPConnection -LocalPort 8765/);
  assert.match(startup,/\$listeners\[0\]\.OwningProcess -eq \$process\.Id/);
  assert.match(preflight,/pythonw\.exe/);
  assert.match(server,/Markellos Ecosystem AI Lab/);
  assert.match(server,/RotatingFileHandler/);
  assert.match(server,/API_LOG_TAIL_BYTES = 24_000/);
  assert.match(server,/"\/api\/system\/logs"/);
  assert.match(ui,/id="view-api-logs"/);
  assert.match(ui,/id="api-logs-dialog"/);
  assert.match(ui,/<script defer src="\/static\/api-logs\.js"><\/script>/);
  assert.match(script,/fetch\('\/api\/system\/logs'/);
  assert.match(script,/output\.textContent/);
  assert.doesNotMatch(script,/innerHTML/);
  assert.match(packager,/'scripts\/start-background-server\.ps1'/);
  assert.match(packager,/'static\/api-logs\.js'/);
});


test('beginner fine-tuning guide and personal provider planner are bundled while training remains locked',()=>{
  const root=path.resolve(__dirname,'..');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  const page=fs.readFileSync(path.join(root,'static','fine-tuning-guide.html'),'utf8');
  const html=fs.readFileSync(path.join(root,'static','index.html'),'utf8');
  const server=fs.readFileSync(path.join(root,'server.py'),'utf8');
  assert.match(packager,/'static\/fine-tuning-guide.html'/);
  assert.match(packager,/'static\/fine-tuning-guide.css'/);
  assert.match(packager,/'personal_provider.py'/);
  assert.match(packager,/'credential_vault.py'/);
  assert.match(packager,/'openai_connection.py'/);
  assert.match(packager,/'openai-connection-requirements.txt'/);
  assert.match(packager,/'scripts\/setup-openai-connection\.ps1'/);
  assert.match(packager,/'runpod_readonly.py'/);
  assert.match(packager,/'static\/personal-provider.js'/);
  assert.match(packager,/'static\/openai-connection.js'/);
  assert.match(server,/"\/fine-tuning-guide": \("fine-tuning-guide.html", "text\/html; charset=utf-8"\)/);
  assert.match(server,/"\/api\/training\/provider-plan"/);
  assert.match(server,/"\/api\/training\/provider-credentials"/);
  assert.match(html,/href="\/fine-tuning-guide" target="_blank" rel="noopener noreferrer"/);
  assert.match(html,/id="personal-provider-plan"/);
  assert.match(html,/Your provider account/);
  assert.match(html,/No paid job is started automatically\./);
  assert.match(html,/RunPod API tokens and SSH public keys are credentials that only enable a direct connection to your own RunPod account or an already-running server\./);
  assert.match(html,/By themselves, they cannot create a server, start a job, or charge your account\./);
  assert.match(html,/Use the official RunPod Console to connect to and manage your own RunPod servers;/);
  assert.match(html,/the Lab cannot create a provider resource or charge your account\./);
  assert.match(html,/id="open-runpod-console"[^>]*href="https:\/\/console\.runpod\.io\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(html,/OpenAI API keys are not accepted, stored, or used by this Lab\./);
  assert.match(html,/This user-approved connection does not use an API key\./);
  assert.match(html,/Connecting alone does not send prompts, make an AI request, or create a charge\./);
  assert.match(html,/ChatGPT Advisor/);
  assert.match(html,/Connect with ChatGPT/);
  assert.match(html,/Your Question/);
  assert.match(html,/Ask ChatGPT/);
  assert.match(html,/ChatGPT Answer/);
  assert.doesNotMatch(html,/openai-review-room/);
  assert.doesNotMatch(html,/openai-review-mode/);
  assert.doesNotMatch(html,/openai-review-content/);
  assert.doesNotMatch(html,/openai-review-model/);
  assert.match(html,/id="open-openai-platform"[^>]*href="https:\/\/platform\.openai\.com\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(html,/id="auto-exercise-feature"[\s\S]*?Unavailable - Under Construction/);
  assert.equal((html.match(/Under Construction/g)||[]).length,1);
  assert.doesNotMatch(page,/Under Construction/);
  assert.match(page,/Fine-Tuning versus the Learning Lab/);
});


test('Windows replacement preflight is bundled and never indiscriminately kills port owners',()=>{
  const root=path.resolve(__dirname,'..');
  const launcher=fs.readFileSync(path.join(root,'Start AI Training Lab.bat'),'utf8');
  const preflight=fs.readFileSync(path.join(root,'scripts','prepare-local-server.ps1'),'utf8');
  const packager=fs.readFileSync(path.join(root,'scripts','build-release.cjs'),'utf8');
  assert.match(packager,/'scripts\/prepare-local-server\.ps1'/);
  assert.match(launcher,/prepare-local-server\.ps1/);
  assert.match(launcher,/if errorlevel 1/);
  assert.match(launcher,/start-background-server\.ps1/);
  assert.match(preflight,/Get-NetTCPConnection -LocalPort 8765/);
  assert.match(preflight,/Get-LabServerIdentity/);
  assert.match(preflight,/LEGACY_CANDIDATE/);
  assert.match(preflight,/Stop-Process -Id \$ownerPid -Force/);
  assert.match(preflight,/\[switch\]\$StopOnly/);
  assert.match(preflight,/if \(\$StopOnly\)/);
  assert.match(preflight,/Stop it without restarting\?/);
  assert.match(preflight,/MessageBoxDefaultButton\]::Button2/);
  assert.doesNotMatch(preflight,/Stop-Process -Name|taskkill|netsh/);
});
