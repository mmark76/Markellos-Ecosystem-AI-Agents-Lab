'use strict';

const chatgptConnect = document.getElementById('openai-chatgpt-connect');
const chatgptSetup = document.getElementById('openai-chatgpt-setup');
const chatgptRemove = document.getElementById('openai-chatgpt-remove');
const chatgptStatus = document.getElementById('openai-chatgpt-status');

function chatgptMessage(message, error = false) {
  chatgptStatus.textContent = message;
  chatgptStatus.dataset.state = error ? 'error' : 'success';
}

async function chatgptRequest(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json();
  if (!response.ok) {
    const error = Error(payload.error || 'The ChatGPT connection could not be completed.');
    error.setupRequired = payload.setupRequired === true;
    throw error;
  }
  return payload;
}

async function refreshChatgptStatus() {
  try {
    const status = await chatgptRequest('/api/openai/connection');
    chatgptRemove.hidden = !status.connected;
    chatgptConnect.hidden = status.connected;
    chatgptSetup.hidden = true;
    chatgptMessage(status.connected
      ? 'ChatGPT is connected locally for this Windows user. No prompt or AI request has been made by connecting.'
      : 'No ChatGPT connection is stored for this Windows user.');
  } catch (error) {
    chatgptMessage(error.message, true);
  }
}

chatgptConnect.addEventListener('click', async () => {
  chatgptConnect.disabled = true;
  chatgptSetup.hidden = true;
  chatgptMessage('Opening your browser for ChatGPT approval…');
  try {
    await chatgptRequest('/api/openai/connection', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({confirmConnection: true}),
    });
    chatgptMessage('Finish the approval in your browser. Then return here; the local status will refresh when you reload the page.');
  } catch (error) {
    chatgptSetup.hidden = !error.setupRequired;
    chatgptMessage(error.message, true);
  } finally {
    chatgptConnect.disabled = false;
  }
});

chatgptSetup.addEventListener('click', async () => {
  chatgptSetup.disabled = true;
  try {
    await chatgptRequest('/api/openai/connection/setup', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({confirmSetup: true}),
    });
    chatgptMessage('The optional setup window is open. Review and approve its installation prompt, then restart the Local Lab.');
  } catch (error) {
    chatgptMessage(error.message, true);
  } finally {
    chatgptSetup.disabled = false;
  }
});

chatgptRemove.addEventListener('click', async () => {
  if (!confirm('Remove the locally stored ChatGPT connection for this Windows user? This cannot be undone.')) return;
  chatgptRemove.disabled = true;
  try {
    await chatgptRequest('/api/openai/connection', {
      method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({confirmRemoval: true}),
    });
    await refreshChatgptStatus();
  } catch (error) {
    chatgptMessage(error.message, true);
  } finally {
    chatgptRemove.disabled = false;
  }
});

refreshChatgptStatus();
