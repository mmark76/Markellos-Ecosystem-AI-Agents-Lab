'use strict';
const $ = id => document.getElementById(id);
let room = 'university';
let running = false;
let uiLanguage = localStorage.getItem('agents-lab-ui-language') === 'el' ? 'el' : 'en';
let responseLanguage = localStorage.getItem('agents-lab-response-language') === 'el' ? 'el' : 'en';
let statusData = null;
let statusError = false;
let hintError = '';
const words = {
  en: {
    training:'Agent Training', collaboration:'Agent Collaboration',
    tip:'AI Agents Training Lab<br>1 AI Trainer · 2 AI Trainees<br>3 AI Experts · Conference Room',
    note:'Stored locally in SQLite.<br>No GitHub or cloud API access.',
    uiLabel:'Interface', responseLabel:'Agent responses', modelLabel:'Local AI Model',
    universityDescription:'Learn → Practice → Evaluate → Improve',
    conferenceDescription:'Architect → Developer → Reviewer · Shared history',
    universityLabel:'Training Topic', conferenceLabel:'Discussion Topic',
    universityPlaceholder:'e.g. Teach the agents how to review a pull request safely...',
    conferencePlaceholder:'e.g. Discuss adding a reporting module without regressions...',
    empty:'No sessions yet. Enter a topic below.', hint:'Agents have no access to files or commands.',
    working:'Agents are responding sequentially. This may take some time.',
    startUniversity:'Start Training ↗', startConference:'Start Discussion ↗', running:'Running...',
    checking:'Checking local model...', databaseError:'Unable to read local database.',
    serviceError:'Local service is not responding.', offline:'Ollama is not running. See README.',
    noModels:'Ollama online · No installed local models found.',
    modelCount:n=>'Ollama online · '+n+' local models',
    failed:'Session failed', you:'You',
    agents:{'Εσύ':'You','Καθηγητής':'Trainer','Φοιτητής Α':'Agent A','Φοιτητής Β':'Agent B','Καθηγητής · Feedback':'Trainer · Feedback'}
  },
  el: {
    training:'Εκπαίδευση Agents', collaboration:'Συνεργασία Agents',
    tip:'Εργαστήριο Εκπαίδευσης AI Agents<br>1 AI Trainer · 2 AI Trainees<br>3 AI Experts · Conference Room',
    note:'Τοπική αποθήκευση σε SQLite.<br>Χωρίς πρόσβαση σε GitHub ή cloud APIs.',
    uiLabel:'Περιβάλλον', responseLabel:'Απαντήσεις Agents', modelLabel:'Τοπικό AI Model',
    universityDescription:'Μάθηση → Εξάσκηση → Αξιολόγηση → Βελτίωση',
    conferenceDescription:'Architect → Developer → Reviewer · Κοινό ιστορικό',
    universityLabel:'Θέμα εκπαίδευσης', conferenceLabel:'Θέμα συζήτησης',
    universityPlaceholder:'π.χ. Εκπαίδευση Agents σε ασφαλές Code Review...',
    conferencePlaceholder:'π.χ. Συζητήστε ένα Reporting Module χωρίς regressions...',
    empty:'Δεν υπάρχουν συνεδρίες ακόμη. Καταχώρισε ένα θέμα παρακάτω.',
    hint:'Οι Agents δεν έχουν πρόσβαση σε αρχεία ή εντολές.',
    working:'Οι Agents απαντούν διαδοχικά. Η διαδικασία μπορεί να διαρκέσει.',
    startUniversity:'Έναρξη εκπαίδευσης ↗', startConference:'Έναρξη συζήτησης ↗', running:'Εκτέλεση...',
    checking:'Έλεγχος τοπικού μοντέλου...', databaseError:'Αδυναμία ανάγνωσης τοπικής βάσης.',
    serviceError:'Η τοπική υπηρεσία δεν ανταποκρίνεται.', offline:'Το Ollama δεν λειτουργεί. Δες το README.',
    noModels:'Ollama ενεργό · Δεν βρέθηκαν εγκατεστημένα τοπικά μοντέλα.',
    modelCount:n=>'Ollama ενεργό · '+n+' τοπικά μοντέλα',
    failed:'Αποτυχία συνεδρίας', you:'Εσύ',
    agents:{'Εσύ':'Εσύ','Καθηγητής':'Εκπαιδευτής','Φοιτητής Α':'Agent A','Φοιτητής Β':'Agent B','Καθηγητής · Feedback':'Εκπαιδευτής · Ανατροφοδότηση'}
  }
};
const t = () => words[uiLanguage];
function labelAgent(name) { return t().agents[name] || name; }
function setStatus() {
  if (statusError) { $('status').textContent=t().serviceError; return; }
  if (!statusData) { $('status').textContent=t().checking; return; }
  $('status').textContent= !statusData.ollama ? t().offline : !statusData.models.length ? t().noModels : t().modelCount(statusData.models.length);
}
function updateUI() {
  document.documentElement.lang=uiLanguage;
  $('ui-language').value=uiLanguage;
  $('response-language').value=responseLanguage;
  $('ui-language-label').textContent=t().uiLabel;
  $('response-language-label').textContent=t().responseLabel;
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
  $('hint').textContent=hintError|| (running?t().working:t().hint);
  document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('selected',b.dataset.room===room));
  setStatus();
  document.querySelectorAll('.message').forEach(el=>{
    const name=el.querySelector('.agent-name');
    if(name)name.textContent=labelAgent(el.dataset.agent);
  });
  const empty=$('messages').querySelector('.empty');
  if(empty)empty.textContent=t().empty;
}
function makeMessage(message) {
  const wrap=document.createElement('article');
  wrap.className='message'+(message.agent==='Εσύ'||message.agent==='You'?' mine':'');
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
    const res=await fetch('/api/status');if(!res.ok)throw new Error('Status failed');
    statusData=await res.json();statusError=false;
    const select=$('model'),old=select.value;select.replaceChildren();
    for(const model of statusData.models){const opt=document.createElement('option');opt.value=model;opt.textContent=model;select.append(opt);}
    if(statusData.models.includes(old))select.value=old;
    if(!running)$('send').disabled=!statusData.models.length;
  } catch { statusError=true;$('send').disabled=true; }
  setStatus();
}
function switchRoom(next){if(running||!['university','conference'].includes(next))return;room=next;hintError='';updateUI();refreshHistory();}
$('ui-language').addEventListener('change',e=>{uiLanguage=e.target.value;localStorage.setItem('agents-lab-ui-language',uiLanguage);updateUI();});
$('response-language').addEventListener('change',e=>{responseLanguage=e.target.value;localStorage.setItem('agents-lab-response-language',responseLanguage);});
document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>switchRoom(b.dataset.room)));
$('composer').addEventListener('submit',async ev=>{
  ev.preventDefault();if(running)return;
  const prompt=$('prompt').value.trim(),model=$('model').value;
  if(!prompt||!model)return;
  running=true;hintError='';$('send').disabled=true;updateUI();
  try {
    const result=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room,model,prompt,language:responseLanguage})});
    const payload=await result.json();
    if(!result.ok)throw new Error(payload.error||t().failed);
    $('prompt').value='';
  } catch(err){hintError=err.message;}
  finally {
    running=false;await refreshHistory();await refreshStatus();updateUI();
  }
});
updateUI();refreshHistory();refreshStatus();
