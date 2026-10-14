'use strict';
const $ = id => document.getElementById(id);
let room = 'training';
let running = false;
let activeTrainingSession = null;
let stagePoll = null;
const provider = 'ollama';
const responseLanguage = 'en';
const easyStartModel = 'qwen2.5:0.5b';
const modelPreference = {Trainer:'agents-lab-trainer-model',Student:'agents-lab-student-model',Evaluator:'agents-lab-evaluator-model',Improver:'agents-lab-improver-model',Planner:'agents-lab-planner-model',Researcher:'agents-lab-researcher-model',Reviewer:'agents-lab-reviewer-model',Collaboration:'agents-lab-model'};
const selectors = {Trainer:'trainer-model',Student:'student-model',Evaluator:'evaluator-model',Improver:'improver-model',Planner:'planner-model',Researcher:'researcher-model',Reviewer:'reviewer-model'};
let statusData = null, statusError = false, hintError = '';
const stageNames = {Trainer:'LEARN - Trainer',Student:'PRACTICE - Student',Evaluator:'EVALUATE - Evaluator',Improver:'IMPROVE - Improver'};
function agentName(name) { return name; }
async function copyMessageText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const fallback=document.createElement('textarea'); fallback.value=text; fallback.setAttribute('readonly',''); fallback.style.position='fixed'; fallback.style.opacity='0'; document.body.append(fallback); fallback.select();
  const copied=document.execCommand('copy'); fallback.remove(); if(!copied) throw Error('Copy is unavailable.');
}
function messageActionButton(label, icon) {
  const button=document.createElement('button'); button.className='message-action'; button.type='button'; button.setAttribute('aria-label',label); button.title=label;
  button.innerHTML=icon; return button;
}
function setStatus() {
  $('status').textContent = statusError ? 'Local service is not responding.' : !statusData ? 'Checking local inference engine...' : !statusData.available ? statusData.label+' is not running locally. See README.' : !statusData.models.length ? statusData.label+' is available locally · No compatible local models found.' : statusData.label+' available locally · '+statusData.models.length+' local models';
}
function updateUI() {
  $('training-model-selects').hidden=room!=='training'; $('collaboration-model-select').hidden=room==='training';
  $('room-title').textContent=room==='training'?'Training Room':'Conference Room';
  $('room-description').textContent=room==='training'?'Learn → Practice → Evaluate → Improve':'Planner → Researcher → Reviewer · Shared history';
  $('prompt-label').textContent=room==='training'?'Training Topic':'Discussion Topic';
  $('prompt').placeholder=room==='training'?'e.g. Teach your AI agent how to...':'e.g. Explore the causes and effects of climate change...';
  $('send').textContent=running?'Running...':room==='training'?'Start Training ↗':'Start Discussion ↗';
  $('clear-conversation').disabled=running; $('cancel-training').hidden=!activeTrainingSession; $('cancel-training').disabled=!activeTrainingSession;
  $('hint').textContent=hintError||(running?'Stages run strictly one at a time. Slow local CPU inference is allowed to finish.':'Agents have no access to files or commands.');
  document.querySelectorAll('[data-room]').forEach(button=>button.classList.toggle('selected',button.dataset.room===room)); setStatus();
}
function makeMessage(message) {
  const wrap=document.createElement('article'); wrap.className='message'+(message.agent==='You'?' mine':''); wrap.dataset.agent=message.agent;
  const avatar=document.createElement('div'); avatar.className='avatar'; avatar.textContent=message.agent==='You'?'M':agentName(message.agent)[0].toUpperCase();
  const body=document.createElement('div'); body.className='message-body'; const header=document.createElement('div'); header.className='message-head';
  const name=document.createElement('span'); name.className='agent-name'; name.textContent=agentName(message.agent);
  const model=document.createElement('span'); model.className='model-name'; model.textContent=message.model?' · '+message.model:'';
  const time=document.createElement('small'); time.textContent=message.created_at||''; const content=document.createElement('div'); content.className='message-text'; content.textContent=message.content;
  header.append(name,model,time); body.append(header,content);
  if(message.agent!=='You'){
    const actions=document.createElement('div'); actions.className='message-actions'; actions.setAttribute('aria-label','Response actions');
    const actionStatus=document.createElement('span'); actionStatus.className='message-action-status'; actionStatus.setAttribute('role','status'); actionStatus.setAttribute('aria-live','polite');
    const copy=messageActionButton('Copy agent response','<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path></svg>');
    copy.addEventListener('click',async()=>{try{await copyMessageText(message.content);actionStatus.textContent='Response copied.';}catch(error){actionStatus.textContent='Could not copy the response.';}});
    const share=messageActionButton('Share agent response','<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M12 16V3"></path><path d="m7 8 5-5 5 5"></path><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"></path></svg>');
    share.addEventListener('click',async()=>{const text=agentName(message.agent)+': '+message.content;try{if(navigator.share){await navigator.share({title:'AI Agents Lab response',text});actionStatus.textContent='Response shared.';}else{await copyMessageText(text);actionStatus.textContent='Sharing is unavailable. Response copied.';}}catch(error){if(error?.name!=='AbortError')actionStatus.textContent='Could not share the response.';}});
    actions.append(copy,share,actionStatus); body.append(actions);
  }
  wrap.append(avatar,body); return wrap;
}
async function refreshHistory() {
  const requestedRoom=room;
  try { const response=await fetch('/api/history/'+requestedRoom); if(!response.ok)throw new Error(); const result=await response.json(); if(requestedRoom!==room)return;
    const element=$('messages'); element.replaceChildren(); if(!result.messages.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='No sessions yet. Enter a topic above.';element.append(empty);} else result.messages.forEach(message=>element.append(makeMessage(message))); element.parentElement.scrollTop=element.parentElement.scrollHeight;
  } catch { $('status').textContent='Unable to read local database.'; }
}
function formatDuration(stage) {
  if (typeof stage.duration_ms==='number') return (stage.duration_ms/1000).toFixed(1)+' s';
  if (stage.status==='Running' && stage.started_at) { const started=Date.parse(stage.started_at.replace(' UTC','Z')); if(!Number.isNaN(started)) return ((Date.now()-started)/1000).toFixed(0)+' s elapsed'; }
  return '—';
}
function renderTrainingStages(session) {
  const host=$('training-stages');const scrollPositions=new Map([...host.querySelectorAll('.stage-response')].map(response=>[response.dataset.agentRole,response.scrollTop]));host.replaceChildren();host.hidden=!session;if(!session)return;
  for(const stage of session.stages){const card=document.createElement('article');card.className='training-stage status-'+stage.status.toLowerCase().replaceAll(' ','-');const title=document.createElement('h2');title.textContent=stage.execution_order+'. '+(stageNames[stage.agent_role]||stage.agent_role);const meta=document.createElement('p');meta.className='stage-meta';meta.textContent='Model: '+stage.assigned_model+' · '+stage.status+' · '+formatDuration(stage);card.append(title,meta);if(stage.response){const response=document.createElement('pre');response.className='stage-response';response.dataset.agentRole=stage.agent_role;response.textContent=stage.response;const scrollTop=scrollPositions.get(stage.agent_role);if(scrollTop!==undefined)response.scrollTop=scrollTop;card.append(response);}if(stage.evaluation_score!==null||stage.evaluation_result){const evaluation=document.createElement('p');evaluation.className='stage-evaluation';evaluation.textContent='Evaluation: '+(stage.evaluation_score===null?'not structurally reported':stage.evaluation_score+'/100')+(stage.evaluation_result?' · '+stage.evaluation_result:'');card.append(evaluation);}if(stage.error){const error=document.createElement('p');error.className='stage-error';error.textContent=stage.error;card.append(error);}host.append(card);}
}
async function refreshTrainingSession() {
  if(!activeTrainingSession)return;
  try {const response=await fetch('/api/training-sessions/'+activeTrainingSession);if(!response.ok)throw new Error('Unable to read training status.');const session=await response.json();renderTrainingStages(session);await refreshHistory();if(['completed','failed','cancelled'].includes(session.status)){clearInterval(stagePoll);stagePoll=null;activeTrainingSession=null;running=false;hintError=session.status==='completed'?'Four-stage learning cycle completed.':(session.error||'Training session '+session.status+'.');await refreshStatus();updateUI();}}catch(error){hintError=error.message;updateUI();}
}
async function refreshStatus() {
  try {const response=await fetch('/api/status');if(!response.ok)throw new Error();const status=await response.json();statusData=status.provider;statusError=false;const legacy=localStorage.getItem(modelPreference.Collaboration);for(const [agent,id] of Object.entries(selectors)){const select=$(id),old=select.value,stored=localStorage.getItem(modelPreference[agent]);select.replaceChildren();for(const model of statusData.models){const option=document.createElement('option');option.value=model;option.textContent=model;select.append(option);}const selected=[stored,legacy,old,easyStartModel,statusData.models[0]].find(value=>statusData.models.includes(value));if(selected)select.value=selected;select.disabled=running||!statusData.models.length;}if(!running)$('send').disabled=!statusData.models.length;}catch{statusError=true;statusData=null;Object.values(selectors).forEach(id=>$(id).disabled=true);$('send').disabled=true;}setStatus();
}
function switchRoom(next){if(running||!['training','conference'].includes(next))return;room=next;hintError='';updateUI();refreshHistory();}
Object.entries(selectors).forEach(([agent,id])=>$(id).addEventListener('change',event=>localStorage.setItem(modelPreference[agent],event.target.value)));
document.querySelectorAll('[data-room]').forEach(button=>button.addEventListener('click',()=>switchRoom(button.dataset.room)));
$('composer').addEventListener('submit',async event=>{
  event.preventDefault();
  if(running)return;
  const prompt=$('prompt').value.trim();
  const assignments=room==='training'
    ? {trainer_model:$('trainer-model').value,student_model:$('student-model').value,evaluator_model:$('evaluator-model').value,improver_model:$('improver-model').value}
    : {planner_model:$('planner-model').value,researcher_model:$('researcher-model').value,reviewer_model:$('reviewer-model').value};
  if(!prompt||Object.values(assignments).some(model=>!model))return;
  running=true;hintError='';$('send').disabled=true;updateUI();
  try{
    const request={room,provider,...assignments,prompt,language:responseLanguage};
    const response=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.error||'Session failed');
    $('prompt').value='';
    if(room==='training'){
      activeTrainingSession=payload.session_id;
      await refreshTrainingSession();
      stagePoll=setInterval(refreshTrainingSession,1000);
      return;
    }
  }catch(error){hintError=error.message;}
  finally{
    if(!activeTrainingSession){
      running=false;
      await refreshHistory();
      await refreshStatus();
      updateUI();
    }
  }
});
$('cancel-training').addEventListener('click',async()=>{if(!activeTrainingSession)return;try{const response=await fetch('/api/training-sessions/'+activeTrainingSession+'/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Unable to cancel this session.');hintError='Cancellation requested. The current model call is allowed to finish safely.';}catch(error){hintError=error.message;}updateUI();});
$('clear-conversation').addEventListener('click',async()=>{if(running||!confirm('Clear this room\'s conversation? This cannot be undone.'))return;$('clear-conversation').disabled=true;try{const response=await fetch('/api/history/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Unable to clear this conversation.');$('prompt').value='';hintError='Conversation cleared. A new session is ready.';renderTrainingStages(null);await refreshHistory();}catch(error){hintError=error.message;}finally{updateUI();}});
updateUI();refreshHistory();refreshStatus();
