'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {formatBuildId}=require('./build-release.cjs');
function verify(dir,expectedSha){
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'release.json'),'utf8'));
  if(!/^[a-f0-9]{40}$/.test(expectedSha)||manifest.commit!==expectedSha)
    throw Error('Release SHA mismatch');
  const expectedId=formatBuildId(manifest.version,manifest.commit,manifest.commitTime);
  if(manifest.timeZone!=='Europe/Nicosia'||manifest.buildId!==expectedId)
    throw Error('Release metadata mismatch');
  const html=fs.readFileSync(path.join(dir,'static','index.html'),'utf8');
  const zipVersion='v'+manifest.version;
  if(html.split('ZIP version: '+zipVersion).length!==3||html.includes('ZIP_VERSION'))
    throw Error('ZIP version not stamped in both UI locations');
  const version=fs.readFileSync(path.join(dir,'VERSION'),'utf8').trim();
  if(version!==manifest.version)throw Error('Package VERSION mismatch');
  if(fs.existsSync(path.join(dir,'data')))throw Error('Runtime data bundled');
  for(const role of [
    "conference-strategist","conference-analyst","conference-engineer",
    "training-tutor","training-student","training-evaluator","training-improver",
    "evaluation-assessor","evaluation-scorer","evaluation-benchmarker",
    "advisory-analyst","advisory-advisor",
    "optimization-diagnostician","optimization-optimizer","optimization-validator"
  ]){
    const file=path.join(dir,'prompts',role+'.txt');
    if(!fs.existsSync(file)||!fs.readFileSync(file,'utf8').trim())
      throw Error('Missing or empty agent prompt: '+role);
  }
  console.log('RELEASE_VERIFIED '+expectedId);
}
if(require.main===module){
  if(process.argv.length!==4)throw Error('Usage: node scripts/verify-release.cjs RELEASE_DIR EXPECTED_SHA');
  verify(process.argv[2],process.argv[3]);
}
module.exports={verify};
