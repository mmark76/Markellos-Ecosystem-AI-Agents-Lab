'use strict';
const $ = id => document.getElementById(id);
let room = 'university';
let running = false;
const uiLanguage = localStorage.getItem('agents-lab-ui-language') === 'el' ? 'el' : 'en';
const responseLanguage = localStorage.getItem('agents-lab-response-language') === 'el' ? 'el' : 'en';
const providerIds = ['ollama', 'lm-studio', 'vllm'];
let provider = providerIds.includes(localStorage.getItem('agents-lab-provider')) ? localStorage.getItem('agents-lab-provider') : 'ollama';
let statusData = null;
let statusError = false;
let hintError = '';
const words = {
  en: {
    training:'Agent Training', collaboration:'Agent Collaboration',
    tip:'AI Agents Training Lab<br>1 AI Trainer · 2 AI Trainees<br>3 AI Experts · Conference Room',
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
    checking:'Checking local inference engine...', databaseError:'Unable to read local database.',
    serviceError:'Local service is not responding.', offline:name=>name+' is not running locally. See README.',
    noModels:name=>name+' is online · No compatible local models found.',
    modelCount:(name,n)=>name+' online · '+n+' local models',
    providerHelpTitle:'Which inference engine should I use?',
    providerHelp:'<h2>Ollama — Simple Local AI</h2><p>Use it for easy installation, switching models, and automatic model loading.</p><h2>LM Studio — Local AI Experimentation</h2><p>Use its graphical interface to download, configure, and compare models manually.</p><h2>vLLM — High-Performance GPU Inference</h2><p>Use it for shared, concurrent GPU inference on Linux, compatible WSL2, or a GPU server. vLLM is not natively supported on Windows; RunPod requires separate remote-infrastructure approval.</p>',
    failed:'Session failed', you:'You',
    agents:{'Εσύ':'You','Καθηγητής':'Trainer','Φοιτητής Α':'Agent A','Φοιτητής Β':'Agent B','Καθηγητής · Feedback':'Trainer · Feedback'}
  },
  el: {
    training:'Εκπαίδευση Agents', collaboration:'Συνεργασία Agents',
    tip:'Εργαστήριο Εκπαίδευσης AI Agents<br>1 AI Trainer · 2 AI Trainees<br>3 AI Experts · Conference Room',
    note:'Τοπική αποθήκευση σε SQLite.<br>Χωρίς πρόσβαση σε GitHub ή cloud APIs.',
    providerLabel:'Inference Engine', modelLabel:'Τοπικό AI Model',
    universityDescription:'Μάθηση → Εξάσκηση → Αξιολόγηση → Βελτίωση',
    conferenceDescription:'Architect → Developer → Reviewer · Κοινό ιστορικό',
    universityLabel:'Θέμα εκπαίδευσης', conferenceLabel:'Θέμα συζήτησης',
    universityPlaceholder:'π.χ. Εκπαίδευση Agents σε ασφαλές Code Review...',
    conferencePlaceholder:'π.χ. Συζητήστε ένα Reporting Module χωρίς regressions...',
    empty:'Δεν υπάρχουν συνεδρίες ακόμη. Καταχώρισε ένα θέμα παρακάτω.',
    hint:'Οι Agents δεν έχουν πρόσβαση σε αρχεία ή εντολές.',
    working:'Οι Agents απαντούν διαδοχικά. Η διαδικασία μπορεί να διαρκέσει.',
    startUniversity:'Έναρξη εκπαίδευσης ↗', startConference:'Έναρξη συζήτησης ↗', running:'Εκτέλεση...',
    checking:'Έλεγχος τοπικού inference engine...', databaseError:'Αδυναμία ανάγνωσης τοπικής βάσης.',
    serviceError:'Η τοπική υπηρεσία δεν ανταποκρίνεται.', offline:name=>name+' δεν λειτουργεί τοπικά. Δες το README.',
    noModels:name=>name+' ενεργό · Δεν βρέθηκαν συμβατά τοπικά μοντέλα.',
    modelCount:(name,n)=>name+' ενεργό · '+n+' τοπικά μοντέλα',
    providerHelpTitle:'Ποιο inference engine να χρησιμοποιήσω;',
    providerHelp:'<h2>Ollama — Απλό Local AI</h2><p>Χρησιμοποίησέ το για εύκολη εγκατάσταση, εναλλαγή μοντέλων και αυτόματη φόρτωση μοντέλων.</p><h2>LM Studio — Πειραματισμός με Local AI</h2><p>Χρησιμοποίησέ το με το γραφικό περιβάλλον του για χειροκίνητη λήψη, ρύθμιση και σύγκριση μοντέλων.</p><h2>vLLM — GPU Inference Υψηλής Απόδοσης</h2><p>Χρησιμοποίησέ το για κοινό, ταυτόχρονο GPU inference σε Linux, συμβατό WSL2 ή GPU server. Το vLLM δεν υποστηρίζεται εγγενώς στα Windows· το RunPod απαιτεί ξεχωριστή έγκριση remote infrastructure.</p>',
    failed:'Αποτυχία συνεδρίας', you:'Εσύ',
    agents:{'Εσύ':'Εσύ','Καθηγητής':'Εκπαιδευτής','Φοιτητής Α':'Agent A','Φοιτητής Β':'Agent B','Καθηγητής · Feedback':'Εκπαιδευτής · Ανατροφοδότηση'}
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
updateUI();refreshHistory();refreshStatus();
