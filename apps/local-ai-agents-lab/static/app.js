'use strict';
const $ = id => document.getElementById(id);
let room = 'university';
let running = false;
const uiLanguage = 'en';
const responseLanguage = 'en';
const providerIds = ['ollama', 'lm-studio', 'vllm'];
let provider = providerIds.includes(localStorage.getItem('agents-lab-provider')) ? localStorage.getItem('agents-lab-provider') : 'ollama';
let statusData = null;
let statusError = false;
let hintError = '';
const words = {
  en: {
    training:'Agent Training', collaboration:'Agent Collaboration',
    tip:'AI Agents Training Lab<br>1 AI Trainer · 1 AI Student<br>3 AI Experts · Conference Room',
    note:'Stored locally in SQLite.<br>No GitHub or cloud API access.',
    providerLabel:'Inference Engine', modelLabel:'Local AI Model',
    universityDescription:'Learn → Practice → Evaluate → Improve',
    conferenceDescription:'Architect → Developer → Reviewer · Shared history',
    universityLabel:'Training Topic', conferenceLabel:'Discussion Topic',
    universityPlaceholder:'e.g. Teach the agents how to review a pull request safely...',
    conferencePlaceholder:'e.g. Discuss adding a reporting module without regressions...',
    empty:'No sessions yet. Enter a topic below.', hint:'Agents have no access to files or commands.',
    working:'Agents are responding sequentially. This may take some time.',
    startUniversity:'Start Training ↗', startConference:'Start Discussion ↗', running:'Running...',
    clearConversation:'Clear conversation / Start new session', cleared:'Conversation cleared. A new session is ready.',
    checking:'Checking local inference engine...', databaseError:'Unable to read local database.',
    serviceError:'Local service is not responding.', offline:name=>name+' is not running locally. See README.',
    noModels:name=>name+' is online · No compatible local models found.',
    modelCount:(name,n)=>name+' online · '+n+' local models',
    providerHelpTitle:'Which inference engine should I use?',
    providerHelp:'<h2>Ollama — Simple Local AI</h2><p>Use it for easy installation, switching models, and automatic model loading.</p><h2>LM Studio — Local AI Experimentation</h2><p>Use its graphical interface to download, configure, and compare models manually.</p><h2>vLLM — High-Performance GPU Inference</h2><p>Use it for shared, concurrent GPU inference on Linux, compatible WSL2, or a GPU server. vLLM is not natively supported on Windows; RunPod requires separate remote-infrastructure approval.</p>',
    failed:'Session failed', you:'You',
    agents:{'You':'You','Trainer':'Trainer','Student':'Student','Agent A':'Student','Agent B':'Student','Trainer · Feedback':'Trainer · Feedback','\u0395\u03c3\u03cd':'You','\u039a\u03b1\u03b8\u03b7\u03b3\u03b7\u03c4\u03ae\u03c2':'Trainer','\u03a6\u03bf\u03b9\u03c4\u03b7\u03c4\u03ae\u03c2 \u0391':'Student','\u03a6\u03bf\u03b9\u03c4\u03b7\u03c4\u03ae\u03c2 \u0392':'Student','\u039a\u03b1\u03b8\u03b7\u03b3\u03b7\u03c4\u03ae\u03c2 · Feedback':'Trainer · Feedback'}
  }
};
const t = () => words[uiLanguage];
function labelAgent(name) { return t().agents[name] || name; }
function setStatus() {
  if (statusError) { $('status').textContent=t().serviceError; return; }
  if (!statusData) { $('status').textContent=t().checking; return; }
  $('status').textContent= !statusData.available ? t().offline(statusData.label) : !statusData.models.length ? t().noModels(statusData.label) : t().modelCount(statusData.label,statusData.models.length);
}
function updateUI() {
  document.documentElement.lang=uiLanguage;
  $('provider').value=provider;
  $('provider-label').textContent=t().providerLabel;
  $('model-label').textContent=t().modelLabel;
  $('nav-training').textContent=t().training;
  $('nav-conference').textContent=t().collaboration;
  $('phase-tip').innerHTML=t().tip;
  $('sidebar-note').innerHTML=t().note;
  $('room-title').textContent=room==='university'?t().training:t().collaboration;
  $('room-description').textContent=room==='university'?t().universityDescription:t().conferenceDescription;
  $('prompt-label').textContent=room==='university'?t().universityLabel:t().conferenceLabel;
  $('prompt').placeholder=room==='university'?t().universityPlaceholder:t().conferencePlaceholder;
  $('send').textContent=running?t().running:room==='university'?t().startUniversity:t().startConference;
  $('clear-conversation').textContent=t().clearConversation;
  $('clear-conversation').disabled=running;
  $('hint').textContent=hintError|| (running?t().working:t().hint);
  document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('selected',b.dataset.room===room));
  setStatus();
  document.querySelectorAll('.message').forEach(el=>{
    const name=el.querySelector('.agent-name');
    if(name)name.textContent=labelAgent(el.dataset.agent);
  });
  const empty=$('messages').querySelector('.empty');
  if(empty)empty.textContent=t().empty;
  $('provider-help-title').textContent=t().providerHelpTitle;
  $('provider-help-content').innerHTML=t().providerHelp;
}
function makeMessage(message) {
  const wrap=document.createElement('article');
  wrap.className='message'+(message.agent==='\u0395\u03c3\u03cd'||message.agent==='You'?' mine':'');
  wrap.dataset.agent=message.agent;
  const avatar=document.createElement('div');avatar.className='avatar';avatar.textContent=wrap.classList.contains('mine')?'M':labelAgent(message.agent)[0].toUpperCase();
  const body=document.createElement('div');body.className='message-body';
  const header=document.createElement('div');header.className='message-head';
  const name=document.createElement('span');name.className='agent-name';name.textContent=labelAgent(message.agent);
  const time=document.createElement('small');time.textContent=message.created_at||'';
  const content=document.createElement('div');content.className='message-text';content.textContent=message.content;
  header.append(name,time);body.append(header,content);wrap.append(avatar,body);
  return wrap;
}
async function refreshHistory() {
  const requestedRoom=room;
  try {
    const res=await fetch('/api/history/'+requestedRoom);
    if(!res.ok)throw new Error('History failed');
    const result=await res.json();
    if(requestedRoom!==room)return;
    const el=$('messages');el.replaceChildren();
    if(!result.messages.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=t().empty;el.append(empty);}
    else result.messages.forEach(m=>el.append(makeMessage(m)));
    el.parentElement.scrollTop=el.parentElement.scrollHeight;
  } catch { $('status').textContent=t().databaseError; }
}
async function refreshStatus() {
  try {
    const res=await fetch('/api/providers/'+encodeURIComponent(provider)+'/status');if(!res.ok)throw new Error('Status failed');
    statusData=await res.json();statusError=false;
    const select=$('model'),old=select.value;select.replaceChildren();
    for(const model of statusData.models){const opt=document.createElement('option');opt.value=model;opt.textContent=model;select.append(opt);}
    if(statusData.models.includes(old))select.value=old;
    select.disabled=!statusData.models.length;
    if(!running)$('send').disabled=!statusData.models.length;
  } catch { statusError=true;statusData=null;$('model').disabled=true;$('send').disabled=true; }
  setStatus();
}
function switchRoom(next){if(running||!['university','conference'].includes(next))return;room=next;hintError='';updateUI();refreshHistory();}
$('provider').addEventListener('change',e=>{if(!providerIds.includes(e.target.value))return;provider=e.target.value;localStorage.setItem('agents-lab-provider',provider);hintError='';statusData=null;updateUI();refreshStatus();});
document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>switchRoom(b.dataset.room)));
$('composer').addEventListener('submit',async ev=>{
  ev.preventDefault();if(running)return;
  const prompt=$('prompt').value.trim(),model=$('model').value;
  if(!prompt||!model)return;
  running=true;hintError='';$('send').disabled=true;updateUI();
  try {
    const result=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room,provider,model,prompt,language:responseLanguage})});
    const payload=await result.json();
    if(!result.ok)throw new Error(payload.error||t().failed);
    $('prompt').value='';
  } catch(err){hintError=err.message;}
  finally {
    running=false;await refreshHistory();await refreshStatus();updateUI();
  }
});
$('clear-conversation').addEventListener('click',async()=>{
  if(running||!confirm('Clear this room\'s conversation? This cannot be undone.'))return;
  $('clear-conversation').disabled=true;
  try {
    const result=await fetch('/api/history/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room})});
    const payload=await result.json();
    if(!result.ok)throw new Error(payload.error||'Unable to clear this conversation.');
    $('prompt').value='';hintError=t().cleared;await refreshHistory();
  } catch(err) { hintError=err.message; }
  finally { updateUI(); }
});
updateUI();refreshHistory();refreshStatus();
