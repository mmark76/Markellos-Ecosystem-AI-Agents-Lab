'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const panel = byId('evaluation-lab');
  const feedback = byId('evaluation-feedback');
  let active = false;
  let selectedRun = null;
  let poll = null;
  let pending = false;

  function node(tag, value, className) {
    const element = document.createElement(tag);
    if (value !== undefined) element.textContent = String(value);
    if (className) element.className = className;
    return element;
  }

  async function request(path, options) {
    const response = await fetch(path, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Evaluation Lab request failed.');
    return data;
  }

  async function refresh() {
    if (!active) return;
    try {
      const [sessions, runs, provider] = await Promise.all([
        request('/api/evaluation/sessions'),
        request('/api/evaluation/runs'),
        request('/api/status'),
      ]);
      const sessionSelect = byId('evaluation-session');
      const previousSession = sessionSelect.value;
      sessionSelect.replaceChildren();
      for (const session of sessions.sessions) {
        const option = node('option', '#' + session.id + ' · ' + session.created_at);
        option.value = session.id;
        sessionSelect.append(option);
      }
      if (sessions.sessions.some(item => String(item.id) === previousSession)) sessionSelect.value = previousSession;

      const modelSelect = byId('evaluation-model');
      const previousModel = modelSelect.value;
      modelSelect.replaceChildren();
      for (const model of provider.models || []) {
        const option = node('option', model);
        option.value = model;
        modelSelect.append(option);
      }
      if ((provider.models || []).includes(previousModel)) modelSelect.value = previousModel;

      const host = byId('evaluation-runs');
      host.replaceChildren();
      for (const run of runs.runs) {
        const button = node('button', '#' + run.id + ' · Session ' + run.source_training_session_id + ' · ' + run.status + ' · ' + run.evaluator_model);
        button.type = 'button';
        button.className = 'evaluation-run';
        button.addEventListener('click', () => showRun(run.id));
        host.append(button);
      }
      if (!runs.runs.length) host.append(node('p', 'No evaluation runs yet.'));
      const running = runs.runs.some(item => item.status === 'running' || item.status === 'pending');
      if (selectedRun) await showRun(selectedRun);
      byId('evaluation-start').disabled = pending || running || !sessions.sessions.length || !(provider.models || []).length;
      if (running && !poll) poll = setInterval(refresh, 2500);
      if (!running && poll) { clearInterval(poll); poll = null; }
    } catch (error) {
      feedback.textContent = error.message;
    }
  }

  async function showRun(id) {
    selectedRun = id;
    try {
      const run = await request('/api/evaluation/runs/' + id);
      const host = byId('evaluation-details');
      host.replaceChildren();
      host.append(node('h4', 'Run #' + run.id + ' · ' + run.status));
      host.append(node('p', 'Session #' + run.source_training_session_id + ' · Model: ' + run.evaluator_model));
      if (run.error) host.append(node('p', 'Failure: ' + run.error));
      if (run.scorecard) {
        host.append(node('h4', 'Scores (model assessments, 0–100)'));
        const list = node('ul');
        for (const criterion of run.criteria) list.append(node('li', criterion + ': ' + run.scorecard.scores[criterion] + '/100'));
        host.append(list, node('p', run.scorecard.summary));
      }
      if (run.findings.length) {
        host.append(node('h4', 'Findings and provenance'));
        for (const finding of run.findings) {
          const item = node('article');
          item.append(node('strong', finding.description));
          item.append(node('p', finding.supporting_evidence));
          item.append(node('small', finding.evidence_classification + (finding.evidence_reference ? ' · ' + finding.evidence_reference : '')));
          host.append(item);
        }
      }
    } catch (error) {
      feedback.textContent = error.message;
    }
  }

  document.addEventListener('lab-room-change', event => {
    active = event.detail.room === 'evaluation';
    panel.hidden = !active;
    if (active) refresh();
    if (!active && poll) { clearInterval(poll); poll = null; }
  });
  byId('evaluation-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const criteria = byId('evaluation-criteria').value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (criteria.length < 1 || criteria.length > 8 || new Set(criteria).size !== criteria.length) {
      feedback.textContent = 'Enter 1–8 distinct criteria, one per line.';
      return;
    }
    pending = true;
    byId('evaluation-start').disabled = true;
    feedback.textContent = 'Starting local evaluation...';
    try {
      const result = await request('/api/evaluation/runs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          source_training_session_id: Number(byId('evaluation-session').value),
          evaluator_model: byId('evaluation-model').value,
          criteria,
        }),
      });
      selectedRun = result.id;
      feedback.textContent = 'Evaluation run #' + result.id + ' created. Execution status updates automatically.';
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      pending = false;
      await refresh();
    }
  });
})();
