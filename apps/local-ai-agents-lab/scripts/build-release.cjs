'use strict';
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const prefix='apps/local-ai-agents-lab/';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const files=['VERSION','README.md','.gitignore','server.py','start-windows.bat','static/app.js','static/index.html','static/settings.js','static/style.css','static/ecosystem-shell.js','static/ecosystem-tokens.css'];
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
    let bytes=execFileSync('git',['show',sha+':'+prefix+file],{cwd:root});
    if(file==='static/index.html'){
      const html=bytes.toString('utf8'), placeholder='v0.1.1_YYYYMMDD_HHMM_SHA';
      if(html.split(placeholder).length!==3)throw Error('Expected two build-ID placeholders');
      bytes=Buffer.from(html.replaceAll(placeholder,buildId));
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
