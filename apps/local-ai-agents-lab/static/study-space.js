'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const trigger = $('student-study-space-open');
  const dialog = $('student-study-space-dialog');
  const status = $('student-study-space-status');
  let triggerBeforeOpen = null;
  let space = null;

  function setStatus(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Study Space request failed.');
    return data;
  }

  function renderMaterials() {
    const list = $('student-study-materials');
    list.replaceChildren();
    if (!space.materials.length) {
      const empty = document.createElement('p');
      empty.className = 'student-study-empty';
      empty.textContent = 'No study material yet. Add a short text excerpt below.';
      list.append(empty);
      return;
    }
    for (const material of space.materials) {
      const item = document.createElement('article');
      item.className = 'student-study-material';
      const label = document.createElement('label');
      label.className = 'student-study-material-choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'student-study-selected-material';
      radio.value = String(material.id);
      radio.required = true;
      const heading = document.createElement('strong');
      heading.textContent = material.title;
      label.append(radio, heading);
      const excerpt = document.createElement('p');
      excerpt.textContent = material.content;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'student-study-remove';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${material.title}`);
      remove.addEventListener('click', async () => {
        if (!confirm(`Remove “${material.title}” from Student Alpha's Study Space? This cannot be undone.`)) return;
        try {
          space = await request(`/api/study-space/materials/${material.id}`, {
            method: 'DELETE', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({confirmRemoval:true})
          });
          renderMaterials();
          setStatus('Material removed from this device.', 'success');
        } catch (error) { setStatus(error.message, 'error'); }
      });
      item.append(label, excerpt, remove);
      list.append(item);
    }
  }

  function renderSpace(data) {
    space = data;
    $('student-study-notes').value = data.notes;
    $('student-study-material-title').maxLength = data.limits.title;
    $('student-study-material-content').maxLength = data.limits.content;
    $('student-study-notes').maxLength = data.limits.notes;
    $('student-study-material-content-count').textContent = `0 / ${data.limits.content}`;
    $('student-study-notes-count').textContent = `${data.notes.length} / ${data.limits.notes}`;
    renderMaterials();
  }

  async function loadSpace() {
    setStatus('Loading this device’s local Study Space…');
    try { renderSpace(await request('/api/study-space')); setStatus('Saved only in this device’s local Lab database.'); }
    catch (error) { setStatus(error.message, 'error'); }
  }

  trigger.addEventListener('click', async () => {
    triggerBeforeOpen = trigger;
    dialog.showModal();
    await loadSpace();
  });
  $('student-study-space-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => triggerBeforeOpen?.focus());

  $('student-study-material-content').addEventListener('input', event => {
    event.target.nextElementSibling.textContent = `${event.target.value.length} / ${event.target.maxLength}`;
  });
  $('student-study-notes').addEventListener('input', event => {
    event.target.nextElementSibling.textContent = `${event.target.value.length} / ${event.target.maxLength}`;
  });

  $('student-study-material-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      renderSpace(await request('/api/study-space/materials', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title:$('student-study-material-title').value, content:$('student-study-material-content').value})
      }));
      form.reset();
      $('student-study-material-content-count').textContent = `0 / ${space.limits.content}`;
      setStatus('Material added to Student Alpha’s Study Space.', 'success');
    } catch(error) { setStatus(error.message, 'error'); }
    finally { submit.disabled = false; }
  });

  $('student-study-notes-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      renderSpace(await request('/api/study-space/notes', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({notes:$('student-study-notes').value})
      }));
      setStatus('Notes saved on this device.', 'success');
    } catch(error) { setStatus(error.message, 'error'); }
    finally { submit.disabled = false; }
  });

  $('student-study-start-form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = dialog.querySelector('input[name="student-study-selected-material"]:checked');
    if (!selected) { setStatus('Choose one material to study.', 'error'); return; }
    const material = space.materials.find(item => item.id === Number(selected.value));
    if (!material) { setStatus('Choose an available study material.', 'error'); return; }
    const focus = $('student-study-focus').value.trim();
    const includeNotes = $('student-study-include-notes').checked && space.notes;
    const sections = [
      'Student Alpha, study the selected material. Explain the key ideas, identify uncertainties, and answer the focus question using only the material below.',
      focus ? `Focus question: ${focus}` : '',
      includeNotes ? `Student notes:\n${space.notes}` : '',
      `Material: ${material.title}\n${material.content}`
    ].filter(Boolean);
    const prompt = sections.join('\n\n');
    if (prompt.length > 2500) { setStatus('This study prompt exceeds the Training Lab’s 2,500-character limit. Shorten the focus question or turn off notes.', 'error'); return; }
    $('prompt').value = prompt;
    dialog.close();
    $('prompt').focus();
    $('hint').textContent = 'Study material has been placed in the Training Topic. Review it, then select Start Training.';
    $('prompt').scrollIntoView({block:'center',behavior:'smooth'});
  });

  document.addEventListener('lab-room-change', event => {
    trigger.hidden = event.detail.room !== 'training';
  });
})();
