'use strict';

const providerPlan = document.getElementById('personal-provider-plan');
const providerPlanStatus = document.getElementById('personal-provider-status');
const providerPlanOutput = document.getElementById('personal-provider-output');
const credentialForm = document.getElementById('personal-provider-credentials');
const credentialStatus = document.getElementById('personal-credential-status');
const credentialToken = document.getElementById('personal-api-key');
const credentialSave = document.getElementById('personal-credential-save');
const credentialRemove = document.getElementById('personal-credential-remove');
const credentialStorage = document.getElementById('personal-credential-storage');
const ownAccount = document.getElementById('personal-own-account');
const providerConnection = document.getElementById('personal-provider-connection');
const providerConnect = document.getElementById('personal-provider-connect');
const providerConnectionStatus = document.getElementById('personal-provider-connection-status');
const providerConnectionOutput = document.getElementById('personal-provider-connection-output');

function providerPlanMessage(message, error = false) {
  providerPlanStatus.textContent = message;
  providerPlanStatus.dataset.state = error ? 'error' : 'success';
}

async function providerPlanFetch(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json();
  if (!response.ok) throw Error(payload.error || 'Could not review the personal provider plan.');
  return payload;
}

function credentialMessage(message, error = false) {
  credentialStatus.textContent = message;
  credentialStatus.dataset.state = error ? 'error' : 'success';
}

function providerConnectionMessage(message, error = false) {
  providerConnectionStatus.textContent = message;
  providerConnectionStatus.dataset.state = error ? 'error' : 'success';
}

async function refreshCredentialStatus() {
  try {
    const status = await providerPlanFetch('/api/training/provider-credential-status');
    credentialRemove.hidden = !status.stored;
    providerConnection.hidden = !status.stored;
    credentialMessage(status.stored
      ? 'A RunPod token is stored encrypted for this Windows user. You can now check your own provider connection.'
      : 'No RunPod token is stored for this Windows user.');
  } catch (error) {
    credentialRemove.hidden = true;
    providerConnection.hidden = true;
    credentialMessage(error.message, true);
  }
}

providerPlan.addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(providerPlan);
  const payload = {
    provider: form.get('provider'),
    region: form.get('region'),
    maxBudgetUsd: Number(form.get('maxBudgetUsd')),
    maxRuntimeMinutes: Number(form.get('maxRuntimeMinutes')),
    confirmOwnAccount: form.get('confirmOwnAccount') === 'on',
    confirmDataTransfer: form.get('confirmDataTransfer') === 'on',
  };
  try {
    const plan = await providerPlanFetch('/api/training/provider-plan', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload),
    });
    providerPlanOutput.textContent = `${plan.provider.label} · ${plan.limits.maxRuntimeMinutes} minutes · up to $${plan.limits.maxBudgetUsd}\n${plan.billing}\n${plan.credentials}\n${plan.execution}\n${plan.nextStep}`;
    providerPlanOutput.hidden = false;
    providerPlanMessage('Personal provider plan reviewed. You may now connect your own RunPod account; no charge was created.');
  } catch (error) {
    providerPlanOutput.hidden = true;
    providerPlanMessage(error.message, true);
  }
});

credentialForm.addEventListener('submit', async event => {
  event.preventDefault();
  credentialSave.disabled = true;
  try {
    const result = await providerPlanFetch('/api/training/provider-credentials', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        provider: document.getElementById('personal-provider').value,
        apiKey: credentialToken.value,
        confirmOwnAccount: ownAccount.checked,
        confirmCredentialStorage: credentialStorage.checked,
      }),
    });
    credentialToken.value = '';
    credentialStorage.checked = false;
    credentialMessage(`Token stored for this Windows user. ${result.execution}`);
    await refreshCredentialStatus();
  } catch (error) {
    credentialMessage(error.message, true);
  } finally {
    credentialSave.disabled = false;
  }
});

credentialRemove.addEventListener('click', async () => {
  if (!confirm('Remove the locally stored RunPod token for this Windows user? This cannot be undone.')) return;
  credentialRemove.disabled = true;
  try {
    await providerPlanFetch('/api/training/provider-credentials', {
      method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        provider: document.getElementById('personal-provider').value, confirmCredentialRemoval: true,
      }),
    });
    credentialMessage('The locally stored RunPod token was removed. No provider action can use it.');
    providerConnectionOutput.hidden = true;
    await refreshCredentialStatus();
  } catch (error) {
    credentialMessage(error.message, true);
  } finally {
    credentialRemove.disabled = false;
  }
});

providerConnect.addEventListener('click', async () => {
  providerConnect.disabled = true;
  providerConnectionOutput.hidden = true;
  providerConnectionMessage('Checking RunPod with a read-only request…');
  try {
    const result = await providerPlanFetch('/api/training/provider-connection', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        provider: document.getElementById('personal-provider').value, confirmReadOnlyConnection: true,
      }),
    });
    const listed = result.gpus.slice(0, 12).map(gpu => {
      const price = gpu.hourlyPriceUsd === null ? 'price unavailable' : `$${gpu.hourlyPriceUsd}/hour`;
      return `${gpu.name} · ${gpu.memoryGb} GB · ${gpu.availability || 'availability unavailable'} · ${price}`;
    });
    providerConnectionOutput.textContent = `${result.provider} account confirmed.\n${listed.length ? listed.join('\n') : 'No GPU catalog entries were returned.'}\n${result.execution}`;
    providerConnectionOutput.hidden = false;
    providerConnectionMessage('RunPod connection verified. This was read-only; no paid Pod or training job was started.');
  } catch (error) {
    providerConnectionMessage(error.message, true);
  } finally {
    providerConnect.disabled = false;
  }
});

refreshCredentialStatus();
