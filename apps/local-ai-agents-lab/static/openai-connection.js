'use strict';

const chatgptConnect = document.getElementById('openai-chatgpt-connect');
const chatgptSetup = document.getElementById('openai-chatgpt-setup');
const chatgptRemove = document.getElementById('openai-chatgpt-remove');
const chatgptStatus = document.getElementById('openai-chatgpt-status');
const externalReview = document.getElementById('openai-external-review');
const reviewMode = document.getElementById('openai-review-mode');
const reviewQuestion = document.getElementById('openai-review-question');
const reviewContent = document.getElementById('openai-review-content');
const reviewRoom = document.getElementById('openai-review-room');
const reviewModel = document.getElementById('openai-review-model');
const reviewModels = document.getElementById('openai-review-models');
const reviewSubmit = document.getElementById('openai-review-submit');
const reviewStatus = document.getElementById('openai-review-status');
const reviewOutput = document.getElementById('openai-review-output');

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
    externalReview.hidden = !status.connected || !status.planUsageAuthorized;
    chatgptSetup.hidden = true;
    chatgptMessage(status.connected
      ? 'ChatGPT is connected for this Windows user. The Lab is not exclusively local while this connection is active, although no prompt or AI request has been made by connecting. External review is available only when you explicitly choose material to share; disconnect to return to local-only operation.'
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

reviewSubmit.addEventListener('click', async () => {
  if (!reviewQuestion.value.trim()) {
    reviewStatus.textContent = 'Enter a question for the external agent.';
    return;
  }
  if (!reviewModel.value) {
    reviewStatus.textContent = 'Load and select a model from your ChatGPT account first.';
    return;
  }
  const mode = reviewMode.value;
  if ((mode === 'pasted' || mode === 'notes') && !reviewContent.value.trim()) {
    reviewStatus.textContent = 'Provide the discussion or notes you chose to share.';
    return;
  }
  const labels = {question: 'your question only', room: 'the selected room discussion', pasted: 'the pasted discussion', notes: 'the notes you wrote'};
  if (!confirm(`Send ${labels[mode]} to OpenAI for this external review? Local agents remain local.`)) return;
  reviewSubmit.disabled = true;
  reviewOutput.hidden = true;
  reviewStatus.textContent = 'Sending only the approved review packet to ChatGPT…';
  try {
    const result = await chatgptRequest('/api/openai/review', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({confirmExternalReview: true, mode, room: reviewRoom.value,
        question: reviewQuestion.value, pastedText: mode === 'pasted' ? reviewContent.value : '',
        notes: mode === 'notes' ? reviewContent.value : '', model: reviewModel.value}),
    });
    reviewOutput.textContent = result.review || 'The external agent returned no text.';
    reviewOutput.hidden = false;
    reviewStatus.textContent = `External review completed with ${result.model}. It was not added to local room history.`;
  } catch (error) {
    reviewStatus.textContent = error.message;
  } finally {
    reviewSubmit.disabled = false;
  }
});

reviewModels.addEventListener('click', async () => {
  reviewModels.disabled = true;
  reviewStatus.textContent = 'Loading models available to your signed-in ChatGPT account…';
  try {
    const result = await chatgptRequest('/api/openai/models');
    reviewModel.replaceChildren();
    for (const model of result.models) {
      const option = document.createElement('option');
      option.value = model.slug;
      option.textContent = model.displayName;
      reviewModel.append(option);
    }
    reviewModel.disabled = result.models.length === 0;
    reviewStatus.textContent = result.models.length
      ? 'Choose a model, then decide exactly what to share.'
      : 'No displayable models were returned for this ChatGPT account.';
  } catch (error) {
    reviewStatus.textContent = error.message;
  } finally {
    reviewModels.disabled = false;
  }
});

refreshChatgptStatus();
