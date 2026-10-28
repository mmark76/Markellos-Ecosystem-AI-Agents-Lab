'use strict';

const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const net=require('node:net');
const path=require('node:path');
const {test}=require('node:test');
const assert=require('node:assert/strict');

const sourceRoot=path.resolve(__dirname,'..');
const launcherNames=['Start Local Server.bat'];
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
  fs.copyFileSync(path.join(sourceRoot,'VERSION'),path.join(root,'VERSION'));
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
  fs.writeFileSync(path.join(root,'scripts','finish-setup.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\finish-paths.txt"), @($LabRoot, $normalized), $encoding)',
    'exit 0'
  ].join('\r\n')+'\r\n',{encoding:'utf8'});
  fs.writeFileSync(path.join(root,'scripts','register-dashboard-protocols.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\protocol-paths.txt"), @($LabRoot, $normalized), $encoding)',
    'exit 0'
  ].join('\r\n')+'\r\n',{encoding:'utf8'});
  fs.writeFileSync(path.join(root,'scripts','start-background-server.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\background-paths.txt"), @($LabRoot, $normalized), $encoding)',
    'exit 0'
  ].join('\r\n')+'\r\n',{encoding:'utf8'});
}

function readPaths(root,file){
  return fs.readFileSync(path.join(root,file),'utf8').trimEnd().split(/\r?\n/);
}

test('Windows launcher passes a non-trailing LabRoot to every setup and integration script',
  {skip:process.platform!=='win32'},()=>{
    const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'ai-training-lab-launcher-'));
    try {
      for(const segments of testDirectories){
        const root=path.join(workspace,...segments);
        writeFixture(root);
        const output=execFileSync('cmd.exe',['/d','/c','Start Local Server.bat'],{
          cwd:root,
          encoding:'utf8',
          input:'\r\n',
          timeout:15000
        });
        assert.match(output,new RegExp(`AI Training Lab v${fs.readFileSync(path.join(root,'VERSION'),'utf8').trim().replaceAll('.', '\\.')}\\b`));
        const expected=fs.realpathSync.native(root);
        const preflight=readPaths(root,'preflight-paths.txt');
        assert.match(preflight[0],/\\\.$/);
        assert.equal(preflight[1],expected);
        const easyStart=readPaths(root,'easy-start-paths.txt');
        const finish=readPaths(root,'finish-paths.txt');
        const shortcut=readPaths(root,'shortcut-paths.txt');
        const protocols=readPaths(root,'protocol-paths.txt');
        assert.match(easyStart[0],/\\\.$/);
        assert.equal(easyStart[1],expected);
        assert.match(finish[0],/\\\.$/);
        assert.equal(finish[1],expected);
        assert.match(shortcut[0],/\\\.$/);
        assert.equal(shortcut[1],expected);
        assert.match(protocols[0],/\\\.$/);
        assert.equal(protocols[1],expected);
        const background=readPaths(root,'background-paths.txt');
        assert.match(background[0],/\\\.$/);
        assert.equal(background[1],expected);
      }
    } finally {
      fs.rmSync(workspace,{recursive:true,force:true});
    }
  });

test('Windows PowerShell setup scripts parse and read the packaged release version',
  {skip:process.platform!=='win32'},()=>{
    const files=[
      'get-lab-version.ps1','easy-start.ps1','finish-setup.ps1',
      'create-desktop-shortcut.ps1','register-dashboard-protocols.ps1','launch-from-dashboard.ps1',
      'prepare-local-server.ps1','start-background-server.ps1','setup-training.ps1'
    ].map(name=>path.join(sourceRoot,'scripts',name));
    const quote=value=>value.replaceAll("'","''");
    const expression=[
      ...files.map(file=>`$tokens=$null; $errors=$null; [System.Management.Automation.Language.Parser]::ParseFile('${quote(file)}',[ref]$tokens,[ref]$errors) | Out-Null; if($errors.Count){ throw "PowerShell parse error: ${path.basename(file)}" }`),
      `. '${quote(files[0])}'`,
      `Get-LabVersion '${quote(sourceRoot)}'`
    ].join('; ');
    const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',expression],{encoding:'utf8'}).trim();
    assert.equal(output,fs.readFileSync(path.join(sourceRoot,'VERSION'),'utf8').trim());
  });

test('Open AI Lab BAT passes Open to the local dashboard handler even in spaced paths',
  {skip:process.platform!=='win32'},()=>{
    const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-open-bat-'));
    try{
      const root=path.join(workspace,'AI Lab Test');
      const scripts=path.join(root,'scripts');
      fs.mkdirSync(scripts,{recursive:true});
      fs.copyFileSync(path.join(sourceRoot,'Open AI Lab.bat'),path.join(root,'Open AI Lab.bat'));
      fs.writeFileSync(path.join(scripts,'launch-from-dashboard.ps1'),[
        'param([string]$Action)',
        'if ($Action -ne "Open") { exit 2 }',
        '[IO.File]::WriteAllText((Join-Path $PSScriptRoot "..\\opened.txt"), $Action)',
        'exit 0'
      ].join('\r\n')+'\r\n',{encoding:'ascii'});
      execFileSync('cmd.exe',['/d','/c','Open AI Lab.bat'],{cwd:root,encoding:'utf8',timeout:30000});
      assert.equal(fs.readFileSync(path.join(root,'opened.txt'),'utf8'),'Open');
    }finally{
      fs.rmSync(workspace,{recursive:true,force:true});
    }
  });

test('dashboard Stop calls only the bounded local stop preflight, without starting the Lab',
  {skip:process.platform!=='win32'},()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-stop-action-'));
    try{
      const scripts=path.join(root,'scripts');
      fs.mkdirSync(scripts,{recursive:true});
      fs.copyFileSync(path.join(sourceRoot,'scripts','launch-from-dashboard.ps1'),path.join(scripts,'launch-from-dashboard.ps1'));
      fs.writeFileSync(path.join(root,'Start Local Server.bat'),'@echo off\r\necho STARTED> "%~dp0started.txt"\r\n',{encoding:'ascii'});
      fs.writeFileSync(path.join(scripts,'prepare-local-server.ps1'),[
        'param([string]$LabRoot,[switch]$StopOnly)',
        'if (-not $StopOnly) { exit 2 }',
        '[System.IO.File]::WriteAllText((Join-Path $LabRoot "stop-only.txt"), "STOP_ONLY")',
        'exit 0'
      ].join('\r\n')+'\r\n',{encoding:'ascii'});
      execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
        path.join(scripts,'launch-from-dashboard.ps1'),'-Action','Stop'],{encoding:'utf8',timeout:30000});
      assert.equal(fs.readFileSync(path.join(root,'stop-only.txt'),'utf8'),'STOP_ONLY');
      assert.equal(fs.existsSync(path.join(root,'started.txt')),false,'Stop must never start the server');
    }finally{
      fs.rmSync(root,{recursive:true,force:true});
    }
  });

test('background launcher leaves a reachable Python server running after PowerShell exits',
  {skip:process.platform!=='win32'},async()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-background-'));
    const scripts=path.join(root,'scripts');
    const serverPath=path.join(root,'server.py');
    let failure;
    let childPid=0;
    try{
      fs.mkdirSync(scripts,{recursive:true});
      fs.copyFileSync(path.join(sourceRoot,'scripts','start-background-server.ps1'),path.join(scripts,'start-background-server.ps1'));
      fs.writeFileSync(serverPath,[
        'from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer',
        'class Handler(BaseHTTPRequestHandler):',
        '    def do_GET(self):',
        '        self.send_response(200)',
        '        self.end_headers()',
        '        self.wfile.write(b"BACKGROUND_OK")',
        '    def log_message(self, *args): pass',
        'ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()'
      ].join('\n')+'\n',{encoding:'utf8'});
      let output;
      try{
        output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',
          path.join(scripts,'start-background-server.ps1'),'-LabRoot',root],{encoding:'utf8',timeout:15000});
      }catch(error){
        const started=String(error.stdout||'').match(/background \(PID (\d+)\)/);
        if(started)childPid=Number(started[1]);
        let service='unreachable';
        try{
          const response=await fetch('http://127.0.0.1:8765/',{signal:AbortSignal.timeout(2000)});
          service=String(response.status)+' '+await response.text();
        }catch{}
        throw new Error(`Background launcher did not exit: ${error.message}; service=${service}; stdout=${String(error.stdout||'')}; stderr=${String(error.stderr||'')}`);
      }
      const match=output.match(/background \(PID (\d+)\)/);
      assert.ok(match,'The launcher must report the detached Python server PID');
      childPid=Number(match[1]);
      const response=await fetch('http://127.0.0.1:8765/',{signal:AbortSignal.timeout(3000)});
      assert.equal(response.status,200);
      assert.equal(await response.text(),'BACKGROUND_OK');
    }catch(error){
      failure=error;
    }finally{
      try{
        // The launcher itself verified this returned PID owns the fixture's
        // loopback listener, so it is the only process this test may stop.
        if(childPid){
          try{process.kill(childPid);}catch(error){if(error.code!=='ESRCH')throw error;}
          await new Promise(resolve=>setTimeout(resolve,1000));
        }
        fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:300});
      }catch(error){
        if(!failure)failure=error;
      }
    }
    if(failure)throw failure;
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
        '  if ($result.Kind -ne $expected) { throw "Expected $expected but got $($result.Kind) for $line; currentRoot=$root; expectedPath=$(Join-Path $root server.py); detectedScript=$($result.ScriptPath)" }',
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


test('preflight refuses to terminate a real unrelated TCP listener',
  {skip:process.platform!=='win32'},async()=>{
    const listener=net.createServer();
    await new Promise((resolve,reject)=>{
      listener.once('error',reject);
      listener.listen(8765,'127.0.0.1',resolve);
    });
    try{
      const script=path.join(sourceRoot,'scripts','prepare-local-server.ps1');
      for(const stopOnly of [false,true]){
        let failure;
        try{
          execFileSync('powershell.exe',[
            '-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
            script,'-LabRoot',sourceRoot,...(stopOnly?['-StopOnly']:[])
          ],{encoding:'utf8',timeout:30000});
        }catch(error){ failure=error; }
        assert.ok(failure,'Expected the preflight to reject an unrelated process');
        assert.equal(failure.status,1);
        assert.match(failure.stdout,/cannot be verified as an AI Lab server/i);
        assert.equal(listener.listening,true,'Preflight must not stop the unrelated listener');
      }
    }finally{
      await new Promise(resolve=>listener.close(resolve));
    }
  });
