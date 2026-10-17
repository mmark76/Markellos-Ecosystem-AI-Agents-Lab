'use strict';

const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const assert=require('node:assert/strict');

const sourceRoot=path.resolve(__dirname,'..');
const launcherNames=['start-windows.bat','Start AI Training Lab.bat'];
const testDirectories=[
  ['AI-Lab'],
  ['My Projects','AI Training Lab'],
  ['Test User','Documents','AI Training Lab'],
  ['Δοκιμές','AI Training Lab'],
  ['Χρήστης','Τα Έργα μου','AI Training Lab'],
  ['nested','directories','AI Training Lab']
];

function writeFixture(root){
  fs.mkdirSync(path.join(root,'scripts'),{recursive:true});
  for(const launcher of launcherNames){
    fs.copyFileSync(path.join(sourceRoot,launcher),path.join(root,launcher));
  }
  fs.writeFileSync(path.join(root,'scripts','easy-start.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\easy-start-paths.txt"), @($LabRoot, $normalized), $encoding)',
    'exit 0'
  ].join('\r\n')+'\r\n',{encoding:'utf8'});
  fs.writeFileSync(path.join(root,'scripts','prepare-local-server.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\preflight-paths.txt"), @($LabRoot, $normalized), $encoding)',
    'exit 0'
  ].join('\r\n')+'\r\n',{encoding:'utf8'});
  fs.writeFileSync(path.join(root,'scripts','create-desktop-shortcut.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\shortcut-paths.txt"), @($LabRoot, $normalized), $encoding)',
    'exit 0'
  ].join('\r\n')+'\r\n',{encoding:'utf8'});
  fs.writeFileSync(path.join(root,'py.cmd'),'@echo off\r\necho %*>> "%~dp0python-invocation.txt"\r\nexit /b 0\r\n',{encoding:'ascii'});
}

function readPaths(root,file){
  return fs.readFileSync(path.join(root,file),'utf8').trimEnd().split(/\r?\n/);
}

test('Windows launchers pass a non-trailing LabRoot to PowerShell and preserve its normalized path',
  {skip:process.platform!=='win32'},()=>{
    const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'ai-training-lab-launcher-'));
    try {
      for(const segments of testDirectories){
        const root=path.join(workspace,...segments);
        writeFixture(root);
        execFileSync('cmd.exe',['/d','/c','Start AI Training Lab.bat'],{
          cwd:root,
          encoding:'utf8',
          input:'\r\n',
          timeout:15000
        });
        const expected=fs.realpathSync.native(root);
        const preflight=readPaths(root,'preflight-paths.txt');
        assert.match(preflight[0],/\\\.$/);
        assert.equal(preflight[1],expected);
        const easyStart=readPaths(root,'easy-start-paths.txt');
        const shortcut=readPaths(root,'shortcut-paths.txt');
        assert.match(easyStart[0],/\\\.$/);
        assert.equal(easyStart[1],expected);
        assert.match(shortcut[0],/\\\.$/);
        assert.equal(shortcut[1],expected);
        assert.ok(fs.readFileSync(path.join(root,'python-invocation.txt'),'utf8').includes(path.join(root,'server.py')));
      }
    } finally {
      fs.rmSync(workspace,{recursive:true,force:true});
    }
  });


test('server identity policy recognizes Labs and rejects unrelated Python processes',
  {skip:process.platform!=='win32'},()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-process-policy-'));
    try{
      const other=path.join(root,'older','server.py');
      fs.mkdirSync(path.dirname(other),{recursive:true});
      const source='PORT = 8765\n# Markellos Ecosystem AI Lab\n# ThreadingHTTPServer\n';
      fs.writeFileSync(path.join(root,'server.py'),source);
      fs.writeFileSync(other,source);
      const script=path.join(sourceRoot,'scripts','prepare-local-server.ps1');
      const quote=value=>value.replaceAll("'","''");
      const ps=[
        ". '" + quote(script) + "' -PolicyOnly",
        "$root = '" + quote(root) + "'",
        'function Assert-Kind([string]$line, [string]$name, [string]$expected) {',
        '  $proc = [pscustomobject]@{ Name=$name; CommandLine=$line }',
        '  $result = Get-LabServerIdentity -Process $proc -CurrentRoot $root',
        '  if ($result.Kind -ne $expected) { throw "Expected $expected but got $($result.Kind) for $line" }',
        '}',
        'Assert-Kind ' + "('\"C:\\Python314\\python.exe\" \"' + '" + quote(path.join(root,'server.py')) + "' + '\"')" + " 'python.exe' 'CURRENT_LAB'",
        'Assert-Kind ' + "('\"C:\\Python314\\python.exe\" \"' + '" + quote(other) + "' + '\"')" + " 'python.exe' 'OLDER_LAB'",
        "Assert-Kind '\"C:\\Python314\\python.exe\" server.py' 'python.exe' 'LEGACY_CANDIDATE'",
        "Assert-Kind '\"C:\\Python314\\python.exe\" -m http.server' 'python.exe' 'UNRELATED'",
        "Assert-Kind '\"C:\\Python314\\python.exe\" server.py' 'node.exe' 'UNRELATED'",
        "Write-Output 'policy:ok'"
      ].join('\n');
      const result=execFileSync('powershell.exe',[
        '-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass',
        '-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')
      ],{encoding:'utf8',timeout:25000});
      assert.match(result,/policy:ok/);
    }finally{
      fs.rmSync(root,{recursive:true,force:true});
    }
  });
