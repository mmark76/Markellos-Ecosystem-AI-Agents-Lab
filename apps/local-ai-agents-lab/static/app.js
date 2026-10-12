'use strict';
const $ = id => document.getElementById(id);
let room = 'university';
let running = false;
let activeTrainingSession = null;
let stagePoll = null;
const provider = 'ollama';
const responseLanguage = 'en';
const modelPreference = {Trainer:'agents-lab-trainer-model',Student:'agents-lab-student-model',Evaluator:'agents-lab-evaluator-model',Improver:'agents-lab-improver-model',Collaboration:'agents-lab-model'};
const selectors = {Trainer:'trainer-model',Student:'student-model',Evaluator:'evaluator-model',Improver:'improver-model',Collaboration:'model'};
let statusData = null, statusError = false, hintError = '';
const stageNames = {Trainer:'LEARN - Trainer',Student:'PRACTICE - Student',Evaluator:'EVALUATE - Evaluator',Improver:'IMPROVE - Improver'};
function agentName(name) { return name; }
function setStatus() {
  $('status').textContent = statusError ? 'Local service is not responding.' : !statusData ? 'Checking local inference engine...' : !statusData.available ? statusData.label+' is not running locally. See README.' : !statusData.models.length ? statusData.label+' is online · No compatible local models found.' : statusData.label+' online · '+statusData.models.length+' local models';
}
function updateUI() {
  $('training-model-selects').hidden=room!=='university'; $('collaboration-model-select').hidden=room==='university';
  $('room-title').textContent=room==='university'?'Agent Training':'Agent Collaboration';
  $('room-description').textContent=room==='university'?'Learn → Practice → Evaluate → Improve':'Planner → Researcher → Reviewer · Shared history';
  $('prompt-label').textContent=room==='university'?'Training Topic':'Discussion Topic';
  $('prompt').placeholder=room==='university'?'e.g. Teach your AI agent how to...':'e.g. Explore the causes and effects of climate change...';
  $('send').textContent=running?'Running...':room==='university'?'Start Training ↗':'Start Discussion ↗';
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
  header.append(name,model,time); body.append(header,content); wrap.append(avatar,body); return wrap;
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
  const host=$('training-stages');host.replaceChildren();host.hidden=!session;if(!session)return;
  for(const stage of session.stages){const card=document.createElement('article');card.className='training-stage status-'+stage.status.toLowerCase().replaceAll(' ','-');const title=document.createElement('h2');title.textContent=stage.execution_order+'. '+(stageNames[stage.agent_role]||stage.agent_role);const meta=document.createElement('p');meta.className='stage-meta';meta.textContent='Model: '+stage.assigned_model+' · '+stage.status+' · '+formatDuration(stage);card.append(title,meta);if(stage.response){const response=document.createElement('pre');response.className='stage-response';response.textContent=stage.response;card.append(response);}if(stage.evaluation_score!==null||stage.evaluation_result){const evaluation=document.createElement('p');evaluation.className='stage-evaluation';evaluation.textContent='Evaluation: '+(stage.evaluation_score===null?'not structurally reported':stage.evaluation_score+'/100')+(stage.evaluation_result?' · '+stage.evaluation_result:'');card.append(evaluation);}if(stage.error){const error=document.createElement('p');error.className='stage-error';error.textContent=stage.error;card.append(error);}host.append(card);}
}
async function refreshTrainingSession() {
  if(!activeTrainingSession)return;
  try {const response=await fetch('/api/training-sessions/'+activeTrainingSession);if(!response.ok)throw new Error('Unable to read training status.');const session=await response.json();renderTrainingStages(session);await refreshHistory();if(['completed','failed','cancelled'].includes(session.status)){clearInterval(stagePoll);stagePoll=null;activeTrainingSession=null;running=false;hintError=session.status==='completed'?'Four-stage learning cycle completed.':(session.error||'Training session '+session.status+'.');await refreshStatus();updateUI();}}catch(error){hintError=error.message;updateUI();}
}
async function refreshStatus() {
  try {const response=await fetch('/api/status');if(!response.ok)throw new Error();const status=await response.json();statusData=status.provider;statusError=false;const legacy=localStorage.getItem(modelPreference.Collaboration);for(const [agent,id] of Object.entries(selectors)){const select=$(id),old=select.value,stored=localStorage.getItem(modelPreference[agent]);select.replaceChildren();for(const model of statusData.models){const option=document.createElement('option');option.value=model;option.textContent=model;select.append(option);}const selected=[stored,legacy,old,statusData.models[0]].find(value=>statusData.models.includes(value));if(selected)select.value=selected;select.disabled=running||!statusData.models.length;}if(!running)$('send').disabled=!statusData.models.length;}catch{statusError=true;statusData=null;Object.values(selectors).forEach(id=>$(id).disabled=true);$('send').disabled=true;}setStatus();
}
function switchRoom(next){if(running||!['university','conference'].includes(next))return;room=next;hintError='';updateUI();refreshHistory();}
Object.entries(selectors).forEach(([agent,id])=>$(id).addEventListener('change',event=>localStorage.setItem(modelPreference[agent],event.target.value)));
document.querySelectorAll('[data-room]').forEach(button=>button.addEventListener('click',()=>switchRoom(button.dataset.room)));
$('composer').addEventListener('submit',async event=>{event.preventDefault();if(running)return;const prompt=$('prompt').value.trim(),model=$('model').value,trainerModel=$('trainer-model').value,studentModel=$('student-model').value,evaluatorModel=$('evaluator-model').value,improverModel=$('improver-model').value;if(!prompt||(room==='university'&&(!trainerModel||!studentModel||!evaluatorModel||!improverModel))||(room==='conference'&&!model))return;running=true;hintError='';$('send').disabled=true;updateUI();try{const request=room==='university'?{room,provider,trainer_model:trainerModel,student_model:studentModel,evaluator_model:evaluatorModel,improver_model:improverModel,prompt,language:responseLanguage}:{room,provider,model,prompt,language:responseLanguage};const response=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Session failed');$('prompt').value='';if(room==='university'){activeTrainingSession=payload.session_id;await refreshTrainingSession();stagePoll=setInterval(refreshTrainingSession,1000);return;}}catch(error){hintError=error.message;}finally{if(!activeTrainingSession){running=false;await refreshHistory();await refreshStatus();updateUI();}}});
$('cancel-training').addEventListener('click',async()=>{if(!activeTrainingSession)return;try{const response=await fetch('/api/training-sessions/'+activeTrainingSession+'/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Unable to cancel this session.');hintError='Cancellation requested. The current model call is allowed to finish safely.';}catch(error){hintError=error.message;}updateUI();});
$('clear-conversation').addEventListener('click',async()=>{if(running||!confirm('Clear this room\'s conversation? This cannot be undone.'))return;$('clear-conversation').disabled=true;try{const response=await fetch('/api/history/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Unable to clear this conversation.');$('prompt').value='';hintError='Conversation cleared. A new session is ready.';renderTrainingStages(null);await refreshHistory();}catch(error){hintError=error.message;}finally{updateUI();}});
updateUI();refreshHistory();refreshStatus();
