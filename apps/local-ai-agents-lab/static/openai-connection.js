'use strict';

const chatgptConnect = document.getElementById('openai-chatgpt-connect');
const chatgptSetup = document.getElementById('openai-chatgpt-setup');
const chatgptRemove = document.getElementById('openai-chatgpt-remove');
const chatgptStatus = document.getElementById('openai-chatgpt-status');
const chatgptIntro = document.getElementById('openai-chatgpt-intro');
const advisor = document.getElementById('openai-external-review');
const question = document.getElementById('openai-review-question');
const ask = document.getElementById('openai-review-submit');
const answer = document.getElementById('openai-review-answer');
const answerOutput = document.getElementById('openai-review-output');
const copyAnswer = document.getElementById('openai-review-copy');
const advisorStatus = document.getElementById('openai-review-status');

function chatgptMessage(message, error = false) {
  chatgptStatus.textContent = message;
  chatgptStatus.dataset.state = error ? 'error' : 'success';
}

async function chatgptRequest(path, options) {
  const response = await fetch(path, {...options, cache: 'no-store'});
  const payload = await response.json();
  if (!response.ok) {
    const error = Error(payload.error || 'The ChatGPT connection could not be completed.');
    error.setupRequired = payload.setupRequired === true;
    throw error;
  }
  return payload;
}

function showDisconnected(status) {
  const unreadable = status.connectionState === 'unreadable';
  chatgptConnect.hidden = false;
  chatgptConnect.textContent = unreadable ? 'Reconnect with ChatGPT' : 'Connect with ChatGPT';
  chatgptRemove.hidden = !unreadable;
  advisor.hidden = true;
  chatgptIntro.hidden = false;
  chatgptIntro.textContent = 'Connect your ChatGPT account to ask a question. Connecting does not send a prompt or invoke a model.';
  chatgptMessage(status.message || 'No ChatGPT connection is stored for this Windows user.', unreadable);
}

function showConnected(status) {
  chatgptConnect.hidden = true;
  chatgptRemove.hidden = false;
  chatgptIntro.hidden = true;
  chatgptSetup.hidden = true;
  advisor.hidden = !status.planUsageAuthorized;
  if (status.planUsageAuthorized) {
    chatgptMessage('ChatGPT is connected for this Windows user.');
    return;
  }
  chatgptMessage('ChatGPT is connected, but plan usage was not approved. Disconnect and reconnect to approve it.', true);
}

async function refreshChatgptStatus() {
  try {
    const status = await chatgptRequest('/api/openai/connection');
    if (status.connected) showConnected(status);
    else showDisconnected(status);
  } catch (error) {
    advisor.hidden = true;
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
    chatgptMessage('Finish approval in your browser, then return to this tab. Its connection status updates automatically.');
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
    chatgptMessage('The optional setup window is open. Review and approve it, then restart the Local Lab.');
  } catch (error) {
    chatgptMessage(error.message, true);
  } finally {
    chatgptSetup.disabled = false;
  }
});

chatgptRemove.addEventListener('click', async () => {
  if (!confirm('Disconnect ChatGPT for this Windows user? This removes the local connection record.')) return;
  chatgptRemove.disabled = true;
  try {
    await chatgptRequest('/api/openai/connection', {
      method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({confirmRemoval: true}),
    });
    answer.hidden = true;
    answerOutput.replaceChildren();
    advisorStatus.textContent = '';
    await refreshChatgptStatus();
  } catch (error) {
    chatgptMessage(error.message, true);
  } finally {
    chatgptRemove.disabled = false;
  }
});

function appendInlineMarkdown(target, value) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      target.append(strong);
    } else if (part.startsWith('`') && part.endsWith('`')) {
      const code = document.createElement('code');
      code.textContent = part.slice(1, -1);
      target.append(code);
    } else {
      target.append(document.createTextNode(part));
    }
  }
}

function renderAnswer(text) {
  answerOutput.replaceChildren();
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let list;
  for (const line of lines) {
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      if (!list) {
        list = document.createElement('ul');
        answerOutput.append(list);
      }
      const listItem = document.createElement('li');
      appendInlineMarkdown(listItem, item[1]);
      list.append(listItem);
      continue;
    }
    list = null;
    if (!line.trim()) continue;
    const paragraph = document.createElement('p');
    appendInlineMarkdown(paragraph, line);
    answerOutput.append(paragraph);
  }
}

ask.addEventListener('click', async () => {
  const value = question.value.trim();
  if (!value) {
    advisorStatus.textContent = 'Enter a question for ChatGPT.';
    question.focus();
    return;
  }
  ask.disabled = true;
  answer.hidden = true;
  advisorStatus.textContent = 'ChatGPT is responding…';
  try {
    const result = await chatgptRequest('/api/openai/review', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({confirmExternalReview: true, question: value}),
    });
    renderAnswer(result.answer || '');
    answer.hidden = false;
    advisorStatus.textContent = 'Answer ready.';
  } catch (error) {
    advisorStatus.textContent = error.message;
  } finally {
    ask.disabled = false;
  }
});

copyAnswer.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(answerOutput.innerText);
    advisorStatus.textContent = 'Answer copied.';
  } catch (_error) {
    advisorStatus.textContent = 'Select the answer text and copy it manually.';
  }
});

// OAuth completes in a separate tab. Focus/visibility refreshes are one-shot
// lifecycle events, not background polling, and all responses are no-store.
window.addEventListener('focus', refreshChatgptStatus);
window.addEventListener('pageshow', refreshChatgptStatus);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshChatgptStatus();
});
refreshChatgptStatus();
