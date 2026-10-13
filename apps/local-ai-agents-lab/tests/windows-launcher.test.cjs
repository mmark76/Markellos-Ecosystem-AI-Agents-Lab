'use strict';

const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const assert=require('node:assert/strict');

const sourceRoot=path.resolve(__dirname,'..');
const launcherNames=['start-windows.bat','Start AI Agents Lab.bat'];
const testDirectories=[
  ['AI-Lab'],
  ['My Projects','AI Agents Lab'],
  ['Test User','Documents','AI Agents Lab'],
  ['Δοκιμές','AI Agents Lab'],
  ['Χρήστης','Τα Έργα μου','AI Agents Lab'],
  ['nested','directories','AI Agents Lab']
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
    const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'ai-agents-lab-launcher-'));
    try {
      for(const segments of testDirectories){
        const root=path.join(workspace,...segments);
        writeFixture(root);
        execFileSync('cmd.exe',['/d','/c','Start AI Agents Lab.bat'],{
          cwd:root,
          encoding:'utf8',
          input:'\r\n',
          timeout:15000
        });
        const expected=path.resolve(root);
        const easyStart=readPaths(root,'easy-start-paths.txt');
        const shortcut=readPaths(root,'shortcut-paths.txt');
        assert.equal(easyStart[0],expected+'\\.');
        assert.equal(easyStart[1],expected);
        assert.equal(shortcut[0],expected+'\\.');
        assert.equal(shortcut[1],expected);
        assert.match(fs.readFileSync(path.join(root,'python-invocation.txt'),'utf8'),/-3 server\.py/);
      }
    } finally {
      fs.rmSync(workspace,{recursive:true,force:true});
    }
  });
