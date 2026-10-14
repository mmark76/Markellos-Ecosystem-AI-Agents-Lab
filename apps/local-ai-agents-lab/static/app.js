'use strict';
const $ = id => document.getElementById(id);
const roles = ['Trainer','Student','Evaluator','Improver','Planner','Researcher','Reviewer'];
const selectFor = Object.fromEntries(roles.map(role => [role, $(role.toLowerCase() + '-model')]));
let room = 'conference';
let localModels = [];
let activePoll = null;

function preference(role) { return 'agents-lab-' + role.toLowerCase() + '-model'; }
function selected(role) { return selectFor[role].value; }
function setStatus(message) { $('status').textContent = message; }
function setRoom(next) {
  room = next;
  clearInterval(activePoll); activePoll = null;
  document.querySelectorAll('[data-room]').forEach(button => button.classList.toggle('selected', button.dataset.room === room));
  document.querySelectorAll('[data-models-for]').forEach(group => { group.hidden = group.dataset.modelsFor !== room; });
  const meta = {
    conference: ['Conference Room', 'Planner → Researcher → Reviewer · Shared discussion context'],
    training: ['Training Lab', 'Trainer → Student · Immutable Chat Log'],
    evaluation: ['Evaluation Lab', 'Independent read-only assessment of completed training records'],
    optimization: ['Optimization Lab', 'Approval-gated prompt proposals; this does not train model weights']
  }[room];
  $('room-title').textContent = meta[0]; $('room-description').textContent = meta[1];
  render();
}
function selectOptions() {
  for (const role of roles) {
    const select = selectFor[role], saved = localStorage.getItem(preference(role));
    select.replaceChildren();
    if (!localModels.length) select.append(new Option('No local models found', ''));
    for (const model of localModels) select.append(new Option(model, model, false, model === saved || (!saved && model === localModels[0])));
    select.disabled = !localModels.length;
    select.onchange = () => localStorage.setItem(preference(role), select.value);
  }
}
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw Error(body.error || 'Local request failed.');
  return body;
}
async function refreshModels() {
  try {
    const status = await request('/api/status');
    localModels = status.models || []; selectOptions();
    setStatus(status.ollama ? (localModels.length + ' local Ollama models available') : 'Ollama is not running locally.');
  } catch { setStatus('Local service is not responding.'); }
}
function empty(message) { const node = document.createElement('p'); node.className = 'empty'; node.textContent = message; return node; }
function card(title, text) { const node = document.createElement('article'); node.className = 'department-card'; const heading = document.createElement('h2'); heading.textContent = title; const body = document.createElement('p'); body.textContent = text; node.append(heading, body); return node; }
function button(label, action) { const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.addEventListener('click', action); return node; }
function promptForm(label, placeholder, actionLabel, submit) {
  const form = document.createElement('form'); form.className = 'composer';
  const title = document.createElement('label'); title.htmlFor = 'department-task'; title.textContent = label;
  const input = document.createElement('textarea'); input.id = 'department-task'; input.rows = 4; input.maxLength = 2500; input.required = true; input.placeholder = placeholder;
  const actions = document.createElement('div'); actions.className = 'actions'; const run = document.createElement('button'); run.type = 'submit'; run.textContent = actionLabel; actions.append(run);
  form.append(title, input, actions); form.addEventListener('submit', event => { event.preventDefault(); submit(input.value.trim(), run); }); return form;
}
function render() {
  const view = $('department-view'); view.replaceChildren();
  if (room === 'conference') return renderConference(view);
  if (room === 'training') return renderTraining(view);
  if (room === 'evaluation') return renderEvaluation(view);
  renderOptimization(view);
}
function renderConference(view) {
  view.append(promptForm('Discussion topic', 'e.g. Compare two approaches to a local AI workflow.', 'Start discussion', async (task, run) => {
    if (!task) return; run.disabled = true;
    try {
      await request('/api/run', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({room:'conference',provider:'ollama',model:selected('Planner'),planner_model:selected('Planner'),researcher_model:selected('Researcher'),reviewer_model:selected('Reviewer'),prompt:task,language:'en'})});
      await renderConferenceHistory(view);
    } catch (error) { setStatus(error.message); } finally { run.disabled = false; }
  }));
  const log = document.createElement('section'); log.id = 'conference-log'; log.className = 'chat-panel'; view.append(log); renderConferenceHistory(view);
}
async function renderConferenceHistory(view) {
  const host = view.querySelector('#conference-log'); if (!host) return;
  try { const result = await request('/api/history/conference'); host.replaceChildren();
    if (!result.messages.length) host.append(empty('No conference discussions yet.'));
    for (const item of result.messages) { const entry = document.createElement('article'); entry.className = 'message'; const heading = document.createElement('strong'); heading.textContent = item.agent + (item.model ? ' · ' + item.model : ''); const content = document.createElement('p'); content.textContent = item.content; entry.append(heading, content); host.append(entry); }
  } catch (error) { host.replaceChildren(empty(error.message)); }
}
function renderTraining(view) {
  view.append(card('Training session record', 'Only Trainer and Student participate. The completed Chat Log is immutable and is handed to Evaluation Lab without alteration.'));
  view.append(promptForm('Training task requirements', 'e.g. Teach a beginner how to recognize a misleading claim.', 'Run Training Lab', async (task, run) => {
    if (!task) return; run.disabled = true;
    try { const started = await request('/api/departments/training-sessions', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,trainer_model:selected('Trainer'),student_model:selected('Student')})}); pollTraining(started.session_id, view); }
    catch(error) { setStatus(error.message); run.disabled = false; }
  }));
  const records = document.createElement('section'); records.id = 'training-records'; records.className = 'chat-panel'; view.append(records); showTrainingRecords(records);
}
async function showTrainingRecords(host) {
  try { const result = await request('/api/departments/training-sessions'); host.replaceChildren();
    if (!result.sessions.length) host.append(empty('No four-department Training Lab sessions yet. Legacy records remain preserved separately.'));
    for (const row of result.sessions) { const item = document.createElement('article'); item.className='department-record'; const title=document.createElement('h2'); title.textContent = row.session_key + ' · ' + row.status; const task=document.createElement('p'); task.textContent=row.task_requirements; item.append(title,task); if(row.completed_at){const meta=document.createElement('small');meta.textContent='Completed '+row.completed_at+' · '+row.trainer_model+' / '+row.student_model;item.append(meta);} host.append(item); }
  } catch(error) { host.replaceChildren(empty(error.message)); }
}
function pollTraining(id, view) { clearInterval(activePoll); const host = view.querySelector('#training-records'); const tick = async () => { const record = await request('/api/departments/training-sessions/' + id); await showTrainingRecords(host); if (record.status !== 'running') { clearInterval(activePoll); activePoll = null; setStatus(record.status === 'completed' ? 'Training record completed and ready for Evaluation Lab.' : record.error || 'Training failed.'); } }; tick(); activePoll = setInterval(tick, 1000); }
function renderEvaluation(view) {
  view.append(card('Independent scorecard', 'Evaluation Lab reads a completed Training Lab record without modifying it. Scores are model judgments; source records and evidence remain traceable.'));
  const host = document.createElement('section'); host.className='chat-panel'; host.id='evaluation-records'; view.append(host); showEvaluation(host);
}
async function showEvaluation(host) {
  try { const [trainings, scorecards] = await Promise.all([request('/api/departments/training-sessions'), request('/api/departments/scorecards')]); host.replaceChildren();
    const select = document.createElement('select'); const ready = trainings.sessions.filter(row => row.status === 'completed'); select.append(new Option(ready.length ? 'Select completed Training Lab session' : 'No completed Training Lab sessions', '')); ready.forEach(row => select.append(new Option(row.session_key + ' · ' + row.task_requirements.slice(0,80), row.id)));
    const run = button('Create independent scorecard', async () => { try { const started=await request('/api/departments/scorecards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({training_session_id:Number(select.value),evaluator_model:selected('Evaluator')})}); pollEvaluation(started.scorecard_id, host); } catch(error) { setStatus(error.message); } }); run.disabled = !ready.length; host.append(select,run);
    scorecards.scorecards.forEach(row => { const item=document.createElement('article');item.className='department-record';const title=document.createElement('h2');title.textContent='Scorecard '+row.id+' · '+row.status;const meta=document.createElement('p');meta.textContent=row.session_key+' · '+row.evaluator_model;item.append(title,meta);host.append(item); });
  } catch(error) { host.replaceChildren(empty(error.message)); }
}
function pollEvaluation(id, host) { clearInterval(activePoll); const tick=async()=>{const card=await request('/api/departments/scorecards/'+id);if(card.status!=='running'){clearInterval(activePoll);activePoll=null;setStatus(card.status==='completed'?'Scorecard ready for Optimization Lab.':card.error||'Evaluation failed.');}await showEvaluation(host);};tick();activePoll=setInterval(tick,1000); }
function renderOptimization(view) {
  view.append(card('Controlled prompt improvement', 'Optimization analyzes a scorecard and creates versioned proposals. It never trains model weights. A proposal must be explicitly approved and then explicitly applied.'));
  const host=document.createElement('section');host.className='chat-panel';host.id='optimization-records';view.append(host);showOptimization(host);
}
async function showOptimization(host) {
  try { const [scorecards, proposals] = await Promise.all([request('/api/departments/scorecards'),request('/api/departments/proposals')]); host.replaceChildren(); const ready=scorecards.scorecards.filter(row=>row.status==='completed'); const select=document.createElement('select');select.append(new Option(ready.length?'Select completed scorecard':'No completed scorecards',''));ready.forEach(row=>select.append(new Option('Scorecard '+row.id+' · '+row.session_key,row.id)));const run=button('Generate draft proposal',async()=>{try{await request('/api/departments/proposals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scorecard_id:Number(select.value),improver_model:selected('Improver')})});setStatus('Optimization is running; refresh this department shortly.');setTimeout(()=>showOptimization(host),1200);}catch(error){setStatus(error.message);}});run.disabled=!ready.length;host.append(select,run);
    proposals.proposals.forEach(row=>{const item=document.createElement('article');item.className='department-record';const title=document.createElement('h2');title.textContent='Proposal '+row.id+' · '+row.status;const analysis=document.createElement('p');analysis.textContent=row.analysis;item.append(title,analysis);if(row.status==='draft')item.append(button('Approve proposal',async()=>{await request('/api/departments/proposals/'+row.id+'/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});showOptimization(host);}));if(row.status==='approved')item.append(button('Apply approved revision',async()=>{await request('/api/departments/proposals/'+row.id+'/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});setStatus('Approved prompt revision applied for future Training Lab sessions.');showOptimization(host);}));host.append(item);});
    proposals.revisions.forEach(revision=>{const item=document.createElement('article');item.className='department-record';const title=document.createElement('h2');title.textContent=revision.role+' prompt v'+revision.version+' · '+revision.status;item.append(title);if(revision.status!=='active')item.append(button('Roll back to this revision',async()=>{await request('/api/departments/prompt-revisions/rollback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:revision.role,revision_id:revision.id})});setStatus('Prompt rollback applied for future Training Lab sessions.');showOptimization(host);}));host.append(item);});
  } catch(error) { host.replaceChildren(empty(error.message)); }
}
document.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => setRoom(button.dataset.room)));
refreshModels().then(() => setRoom('conference'));
