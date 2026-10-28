'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const dialog = byId('api-logs-dialog');
  const output = byId('api-logs-content');
  const refresh = byId('api-logs-refresh');
  let loading = false;

  async function loadLogs() {
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    output.textContent = 'Loading local API logs…';
    try {
      const response = await fetch('/api/system/logs', {cache:'no-store'});
      if (!response.ok) throw new Error('Log request failed');
      const result = await response.json();
      if (typeof result.logs !== 'string') throw new Error('Invalid log response');
      output.textContent = result.logs.trim() || 'No API requests have been logged yet.';
    } catch {
      output.textContent = 'Local API logs are unavailable. Please try again.';
    } finally {
      loading = false;
      refresh.disabled = false;
    }
  }

  byId('view-api-logs').addEventListener('click', () => {
    const info = byId('lab-info');
    if (info.open) info.close();
    dialog.showModal();
    loadLogs();
  });
  refresh.addEventListener('click', loadLogs);
  byId('api-logs-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => byId('info-toggle').focus());
})();
