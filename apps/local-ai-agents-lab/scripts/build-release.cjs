'use strict';
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const prefix='apps/local-ai-agents-lab/';
const RELEASE_FILE_MAX_BUFFER=16*1024*1024;
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const files=['VERSION','README.md','openai-connection-requirements.txt','prompts/conference-strategist.txt','prompts/conference-analyst.txt','prompts/conference-engineer.txt','prompts/training-tutor.txt','prompts/training-student.txt','prompts/training-evaluator.txt','prompts/training-improver.txt','prompts/evaluation-assessor.txt','prompts/evaluation-scorer.txt','prompts/evaluation-benchmarker.txt','prompts/advisory-analyst.txt','prompts/advisory-advisor.txt','prompts/optimization-diagnostician.txt','prompts/optimization-optimizer.txt','prompts/optimization-validator.txt','.gitignore','server.py','providers.py','model_install.py','personal_provider.py','credential_vault.py','openai_connection.py','runpod_readonly.py','training.py','evaluation_lab/__init__.py','evaluation_lab/contracts.py','evaluation_lab/repository.py','evaluation_lab/execution.py','evaluation_lab/model_adapter.py','evaluation_lab/prompt.py','evaluation_lab/response.py','evaluation_lab/http_api.py','training/requirements.txt','training/job_contract.py','training/readiness.py','training/training_worker.py','assets/ai-training-lab.ico','assets/chatgpt-advisor-avatar.png','Start AI Training Lab.bat','start-windows.bat','setup-training-windows.bat','scripts/create-desktop-shortcut.ps1','scripts/launch-from-dashboard.ps1','scripts/easy-start.ps1','scripts/setup-training.ps1','scripts/setup-openai-connection.ps1','static/app.js','static/model-install.js','static/personal-provider.js','static/openai-connection.js','static/training.js','static/panel-layout.js','static/connection-dialogs.js','static/model-guidance-data.js','static/model-guidance.js','static/index.html','static/settings.js','static/style.css','static/evaluation.js','static/evaluation.css','static/fine-tuning-guide.html','static/fine-tuning-guide.css','static/ecosystem-shell.js','static/ecosystem-tokens.css'];
const BUILD_ID=/^v\d+\.\d+\.\d+_\d{8}_\d{4}_[0-9a-f]{7}$/;

function formatBuildId(version,sha,timestamp){
  if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid VERSION');
  if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Invalid commit SHA');
  const date=new Date(timestamp);
  if(!Number.isFinite(date.getTime()))throw Error('Invalid commit time');
  const pts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/Nicosia',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(date).map(part=>[part.type,part.value]));
  const buildId='v'+version+'_'+pts.year+pts.month+pts.day+'_'+pts.hour+pts.minute+'_'+sha.slice(0,7);
  if(!BUILD_ID.test(buildId))throw Error('Invalid build ID');
  return buildId;
}

function build(ref,destination){
  const sha=git('rev-parse','--verify',ref+'^{commit}');
  const version=git('show',sha+':'+prefix+'VERSION');
  const commitTime=git('show','-s','--format=%cI',sha);
  const buildId=formatBuildId(version,sha,commitTime);
  const target=path.resolve(destination);
  if(fs.existsSync(target))throw Error('Output must be new');
  const manifest={version,commit:sha,buildId,timeZone:'Europe/Nicosia',commitTime};
  // All release inputs are read from the exact commit, not from dirty working files.
  const content=new Map();
  for(const file of files){
    let bytes=execFileSync('git',['show',sha+':'+prefix+file],{cwd:root,maxBuffer:RELEASE_FILE_MAX_BUFFER});
    if(file==='static/index.html'){
      const html=bytes.toString('utf8'), placeholder='ZIP_VERSION';
      if(html.split(placeholder).length!==3)throw Error('Expected two build-ID placeholders');
      bytes=Buffer.from(html.replaceAll(placeholder,'v'+version));
    }
    content.set(file,bytes);
  }
  const output=path.join(target,'local-ai-agents-lab');
  fs.mkdirSync(output,{recursive:true});
  for(const [file,bytes] of content){
    const dest=path.join(output,file);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,bytes);
  }
  fs.writeFileSync(path.join(output,'release.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({output,...manifest}));
  return manifest;
}

if(require.main===module){
  if(process.argv.length!==4)throw Error('Usage: node scripts/build-release.cjs COMMIT NEW_OUTPUT');
  build(process.argv[2],process.argv[3]);
}
module.exports={formatBuildId,build};
