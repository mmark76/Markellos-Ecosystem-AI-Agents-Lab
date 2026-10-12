'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const panel = $('model-installer'), form = $('model-install-form'), input = $('model-install-name');
  const button = $('model-install-submit'), output = $('model-install-status'), progress = $('model-install-progress');
  let wasRunning = false, lastCompleted = '', checking = false;
  const showForProvider = () => { panel.hidden = false; };
  const api = async (path, options) => {
    const response = await fetch(path, options);
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Unable to contact local model installer.');
    return data;
  };
  async function refreshInstallation() {
    if (checking) return;
    checking = true;
    try {
      const job = await api('/api/models/install/status');
      const busy = job.state === 'running';
      button.disabled = busy;
      input.disabled = busy;
      progress.hidden = job.percent === null || !busy;
      if (!progress.hidden) progress.value = job.percent;
      if (busy) {
        wasRunning = true;
        output.textContent = 'Downloading ' + job.model + ': ' + job.status +
          (job.percent === null ? '' : ' (' + job.percent + '%)');
      } else if (job.state === 'completed') {
        output.textContent = job.model + ' installed in Ollama. Ready to use.';
        if (wasRunning || lastCompleted !== job.model) {
          await refreshStatus();
          if (Array.from($('model').options).some(option => option.value === job.model)) $('model').value = job.model;
        }
        lastCompleted = job.model;
        wasRunning = false;
      } else if (job.state === 'failed') {
        output.textContent = 'Download failed: ' + (job.error || 'Check Ollama and your connection.');
        wasRunning = false;
      } else {
        output.textContent = 'Enter a model name from the Ollama library to install it locally.';
      }
    } catch (error) {
      output.textContent = error.message;
    } finally {
      checking = false;
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const model = input.value.trim();
    if (!model) return;
    if (!confirm('Install ' + model + ' via Ollama? This downloads model files from the internet and may use several GB of disk space.')) return;
    button.disabled = true;
    try {
      const job = await api('/api/models/install', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({model})
      });
      wasRunning = true;
      output.textContent = 'Starting download of ' + job.model + '...';
      await refreshInstallation();
    } catch (error) {
      output.textContent = error.message;
      button.disabled = false;
    }
  });
  showForProvider();
  refreshInstallation();
  setInterval(refreshInstallation, 2000);
})();
