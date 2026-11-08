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
  fs.writeFileSync(path.join(root,'scripts','start-console-server.ps1'),[
    'param([string]$LabRoot)',
    '$normalized = [System.IO.Path]::GetFullPath($LabRoot)',
    '$encoding = [System.Text.UTF8Encoding]::new($false)',
    '[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot "..\\console-paths.txt"), @($LabRoot, $normalized), $encoding)',
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
        const consolePaths=readPaths(root,'console-paths.txt');
        assert.match(consolePaths[0],/\\\.$/);
        assert.equal(consolePaths[1],expected);
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
      'prepare-local-server.ps1','get-local-lab-url.ps1','get-local-listeners.ps1','start-background-server.ps1','start-console-server.ps1','setup-training.ps1',
      'show-training-setup-result.ps1'
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

test('foreground console runner waits for the Python server to exit',
  {skip:process.platform!=='win32'},()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-foreground-'));
    try{
      fs.mkdirSync(path.join(root,'scripts'),{recursive:true});
      fs.copyFileSync(path.join(sourceRoot,'scripts','start-console-server.ps1'),path.join(root,'scripts','start-console-server.ps1'));
      fs.writeFileSync(path.join(root,'server.py'),[
        'import time',
        'print("FOREGROUND_READY", flush=True)',
        'time.sleep(1.2)',
        'print("FOREGROUND_STOPPED", flush=True)'
      ].join('\n')+'\n',{encoding:'utf8'});
      const started=Date.now();
      const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',
        path.join(root,'scripts','start-console-server.ps1'),'-LabRoot',root],
        {encoding:'utf8',timeout:10000});
      assert.match(output,/FOREGROUND_READY[\s\S]*FOREGROUND_STOPPED/);
      assert.ok(Date.now()-started>=900,'PowerShell must wait for Python instead of detaching it');
    }finally{
      fs.rmSync(root,{recursive:true,force:true});
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
      fs.writeFileSync(path.join(scripts,'offer-preferred-port-stop.ps1'), '[IO.File]::WriteAllText((Join-Path $PSScriptRoot "../offered.txt"), "OFFERED"); exit 0', {encoding:'ascii'});
      execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
        path.join(scripts,'launch-from-dashboard.ps1'),'-Action','Stop'],{encoding:'utf8',timeout:30000});
      assert.equal(fs.readFileSync(path.join(root,'stop-only.txt'),'utf8'),'STOP_ONLY');
      assert.equal(fs.readFileSync(path.join(root,'offered.txt'),'utf8'),'OFFERED');
      assert.equal(fs.existsSync(path.join(root,'started.txt')),false,'Stop must never start the server');
    }finally{
      fs.rmSync(root,{recursive:true,force:true});
    }
  });

test('background launcher leaves a reachable Python server running after PowerShell exits',
  {skip:process.platform!=='win32'},async()=>{
    const root=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-background-')));
    const scripts=path.join(root,'scripts');
    const serverPath=path.join(root,'server.py');
    let failure;
    let childPid=0;
    try{
      fs.mkdirSync(scripts,{recursive:true});
      for (const file of ['start-background-server.ps1','prepare-local-server.ps1','get-local-lab-url.ps1','get-local-listeners.ps1','launch-from-dashboard.ps1']) fs.copyFileSync(path.join(sourceRoot,'scripts',file),path.join(scripts,file));
      fs.writeFileSync(path.join(root,'Start Local Server.bat'),'@echo off\r\nexit /b 1\r\n');
      fs.copyFileSync(path.join(sourceRoot,'local_runtime.py'),path.join(root,'local_runtime.py'));
      fs.writeFileSync(serverPath,[
        'from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer',
        'from local_runtime import bind_server, publish_state',
        '# Markellos Ecosystem AI Lab',
        'PORT = 8765',
        'from pathlib import Path',
        'class Handler(BaseHTTPRequestHandler):',
        '    def do_GET(self):',
        '        self.send_response(200)',
        '        self.send_header("Content-Type", "text/html; charset=utf-8")',
        '        self.end_headers()',
        '        self.wfile.write(b"AI Lab BACKGROUND_OK")',
        '    def log_message(self, *args): pass',
        'server = bind_server(Handler, PORT)',
        'publish_state(Path(__file__).parent / "data", server.server_address[1])',
        'server.serve_forever()'
      ].join('\n')+'\n',{encoding:'utf8'});
      let output;
      try{
        output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',
          path.join(scripts,'start-background-server.ps1'),'-LabRoot',root],{encoding:'utf8',timeout:60000});
      }catch(error){
        const started=String(error.stdout||'').match(/background \(PID (\d+)\)/);
        if(started)childPid=Number(started[1]);
        const statePath=path.join(root,'data','runtime.json');
        if(!childPid && fs.existsSync(statePath)) childPid=Number(JSON.parse(fs.readFileSync(statePath,'utf8')).pid);
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
      const state=JSON.parse(fs.readFileSync(path.join(root,'data','runtime.json'),'utf8'));
      assert.equal(state.pid,childPid);
      const response=await fetch(`http://127.0.0.1:${state.port}/`,{signal:AbortSignal.timeout(3000)});
      assert.equal(response.status,200);
      assert.equal(await response.text(),'AI Lab BACKGROUND_OK');
      const opened=path.join(root,'opened.txt');
      const quote=value=>value.replaceAll("'","''");
      const ps=`function Start-Process { param($FilePath) [IO.File]::WriteAllText('${quote(opened)}',[string]$FilePath) }; & '${quote(path.join(scripts,'launch-from-dashboard.ps1'))}' -Action Open`;
      execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
      assert.equal(fs.readFileSync(opened,'utf8'),`http://127.0.0.1:${state.port}/`);
    }catch(error){
      failure=error;
    }finally{
      try{
        // The launcher itself verified this returned PID owns the fixture's
        // loopback listener, so it is the only process this test may stop.
        if(childPid){
          const quoted=serverPath.replaceAll("'","''");
          const check=`$p=Get-CimInstance Win32_Process -Filter "ProcessId=${childPid}"; if ($p -and $p.Name -eq 'python.exe' -and $p.CommandLine.IndexOf('${quoted}', [StringComparison]::OrdinalIgnoreCase) -ge 0) { Stop-Process -Id ${childPid} -Force -ErrorAction Stop } elseif ($p) { throw 'Fixture process identity changed' }`;
          execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',check],{encoding:'utf8',timeout:10000});
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


test('Stop preflight leaves a real unrelated TCP listener untouched',
  {skip:process.platform!=='win32'},async()=>{
    const listener=net.createServer();
    await new Promise((resolve,reject)=>{ listener.once('error',reject); listener.listen(0,'127.0.0.1',resolve); });
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-unrelated-'));
    try{
      fs.copyFileSync(path.join(sourceRoot,'VERSION'),path.join(root,'VERSION'));
      const script=path.join(sourceRoot,'scripts','prepare-local-server.ps1');
      const result=execFileSync('powershell.exe',[
        '-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
        script,'-LabRoot',root,'-StopOnly'
      ],{encoding:'utf8',timeout:60000});
      assert.match(result,/already stopped/i);
      assert.equal(listener.listening,true);
    }finally{
      await new Promise(resolve=>listener.close(resolve));
      fs.rmSync(root,{recursive:true,force:true});
    }
  });


test('native TCP table identifies a real IPv4 listener and its owning process',
  {skip:process.platform!=='win32'},async()=>{
    const listener=net.createServer();
    await new Promise((resolve,reject)=>{ listener.once('error',reject); listener.listen(0,'127.0.0.1',resolve); });
    try{
      const script=path.join(sourceRoot,'scripts','get-local-listeners.ps1').replaceAll("'","''");
      const port=listener.address().port;
      const ps=`. '${script}'; $rows=@(Get-LocalListeners -Port ${port} | Where-Object { $_.LocalAddress -eq '127.0.0.1' -and $_.OwningProcess -eq ${process.pid} }); if ($rows.Count -ne 1) { throw 'Listener owner did not match' }; 'owner:ok'`;
      const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
      assert.match(output,/owner:ok/);
      assert.equal(listener.listening,true);
    }finally{ await new Promise(resolve=>listener.close(resolve)); }
  });

test('native TCP table preserves IPv6 listeners in port ownership checks',
  {skip:process.platform!=='win32'},async(t)=>{
    const listener=net.createServer();
    try{
      await new Promise((resolve,reject)=>{ listener.once('error',reject); listener.listen({port:0,host:'::1',ipv6Only:true},resolve); });
    }catch(error){
      if(['EADDRNOTAVAIL','EAFNOSUPPORT'].includes(error.code)){ t.skip('IPv6 loopback is unavailable'); return; }
      throw error;
    }
    try{
      const script=path.join(sourceRoot,'scripts','get-local-listeners.ps1').replaceAll("'","''");
      const port=listener.address().port;
      const ps=`. '${script}'; $rows=@(Get-LocalListeners -Port ${port} | Where-Object { $_.LocalAddress -eq '::1' -and $_.OwningProcess -eq ${process.pid} }); if ($rows.Count -ne 1) { throw 'IPv6 listener owner did not match' }; 'owner:ok'`;
      const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
      assert.match(output,/owner:ok/);
    }finally{ await new Promise(resolve=>listener.close(resolve)); }
  });

test('Open uses only a verified current listener and ignores stale runtime state',
  {skip:process.platform!=='win32'},()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-open-state-'));
    try{
      const scripts=path.join(root,'scripts'), data=path.join(root,'data');
      fs.mkdirSync(scripts); fs.mkdirSync(data);
      for(const file of ['launch-from-dashboard.ps1','prepare-local-server.ps1','get-local-lab-url.ps1'])
        fs.copyFileSync(path.join(sourceRoot,'scripts',file),path.join(scripts,file));
      fs.writeFileSync(path.join(scripts,'get-local-listeners.ps1'),
        'function Get-LocalListeners { param([int]$Port) Get-NetTCPConnection -LocalPort $Port -State Listen }\n');
      fs.writeFileSync(path.join(root,'Start Local Server.bat'),'@echo off\r\n');
      const server=path.join(root,'server.py');
      fs.writeFileSync(server,'# Markellos Ecosystem AI Lab\n# ThreadingHTTPServer\nPORT = 8765\n');
      const state={pid:12345,port:43123,nonce:'ab'.repeat(16)};
      fs.writeFileSync(path.join(data,'runtime.json'),JSON.stringify(state));
      const q=s=>s.replaceAll("'","''");
      const output=path.join(root,'opened.txt');
      const checks=path.join(root,'checks.txt');
      const base=[
        `function Get-NetTCPConnection { [CmdletBinding()] param($LocalPort,$State) Add-Content -LiteralPath '${q(checks)}' -Value 'check'; [pscustomobject]@{LocalAddress='127.0.0.1';LocalPort=43123;OwningProcess=12345} }`,
        `function Get-CimInstance { [CmdletBinding()] param($ClassName,$Filter) [pscustomobject]@{Name='python.exe';CommandLine='"C:\\Python\\python.exe" -u "${q(server)}"'} }`,
        `function Invoke-WebRequest { [CmdletBinding()] param([switch]$UseBasicParsing,$Uri,$TimeoutSec) [pscustomobject]@{StatusCode=200;Content='AI Lab'} }`,
        `function Start-Process { param($FilePath,$WorkingDirectory) [IO.File]::WriteAllText('${q(output)}',[string]$FilePath) }`
      ];
      const open=[...base,`& '${q(path.join(scripts,'launch-from-dashboard.ps1'))}' -Action Open`].join('; ');
      execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(open,'utf16le').toString('base64')],{timeout:15000});
      assert.equal(fs.readFileSync(output,'utf8'),'http://127.0.0.1:43123/');
      assert.equal(fs.readFileSync(checks,'utf8').trim().split(/\r?\n/).length,1,'Open should verify the listener once');
      state.pid=22222; fs.writeFileSync(path.join(data,'runtime.json'),JSON.stringify(state));
      const stale=[...base,`. '${q(path.join(scripts,'prepare-local-server.ps1'))}' -PolicyOnly`,`. '${q(path.join(scripts,'get-local-lab-url.ps1'))}'`,`if (Get-LocalLabUrl -LabRoot '${q(root)}') { throw 'stale state accepted' }`].join('; ');
      execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(stale,'utf16le').toString('base64')],{timeout:15000});
    }finally{ fs.rmSync(root,{recursive:true,force:true}); }
  });

test('preferred-port stop honors consent and rejects unsafe or changed owners', {skip:process.platform!=='win32'},()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lab-owner-policy-'));
  try {
    const script=path.join(root,'offer-preferred-port-stop.ps1');
    fs.copyFileSync(path.join(sourceRoot,'scripts','offer-preferred-port-stop.ps1'),script);
    fs.writeFileSync(path.join(root,'get-local-listeners.ps1'), `function Get-LocalListeners { param($Port) $global:checks++; if ($scenario -ne 'free' -and ($global:checks -lt 3 -or $scenario -ne 'confirmed')) { [pscustomobject]@{LocalAddress='127.0.0.1';LocalPort=8765;OwningProcess=12345} } }`);
    const q=s=>s.replaceAll("'","''"), marker=path.join(root,'stopped.txt');
    for (const scenario of ['free','declined','protected','other-user','changed','confirmed']) {
      if(fs.existsSync(marker)) fs.unlinkSync(marker);
      const code=[
        `$scenario='${scenario}'; $global:checks=0; $global:owners=0; $created=[datetime]'2026-01-01'`,
        `. '${q(script)}' -PolicyOnly`,
        `function Show-PortMessage { param($Message,[switch]$Confirm,[switch]$Warning) if ($Confirm) { return ($scenario -ne 'declined') } }`,
        `function Get-CimInstance { [CmdletBinding()] param($ClassName,$Filter) $global:owners++; $date=if ($scenario -eq 'changed' -and $global:owners -gt 1) { $created.AddSeconds(1) } else { $created }; $name=if ($scenario -eq 'protected') {'explorer.exe'} else {'app.exe'}; [pscustomobject]@{Name=$name;CreationDate=$date;CommandLine='C:\\Apps\\app.exe';ExecutablePath='C:\\Apps\\app.exe'} }`,
        `function Invoke-CimMethod { [CmdletBinding()] param($InputObject,$MethodName) $parts=[Security.Principal.WindowsIdentity]::GetCurrent().Name.Split('\\',2); if ($scenario -eq 'other-user') { [pscustomobject]@{ReturnValue=0;Domain='other';User='other'} } else { [pscustomobject]@{ReturnValue=0;Domain=$parts[0];User=$parts[1]} } }`,
        `function Stop-Process { [CmdletBinding()] param($Id) [IO.File]::WriteAllText('${q(marker)}',[string]$Id) }`,
        `exit (Invoke-PreferredPortStop)`
      ].join('; ');
      const result=require('node:child_process').spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(code,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
      assert.equal(result.status,['protected','other-user','changed'].includes(scenario)?1:0, `${scenario}: ${result.stdout} ${result.stderr}`);
      assert.equal(fs.existsSync(marker),scenario==='confirmed',scenario);
    }
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
