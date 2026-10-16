'use strict';

const providerPlan = document.getElementById('personal-provider-plan');
const providerPlanStatus = document.getElementById('personal-provider-status');
const providerPlanOutput = document.getElementById('personal-provider-output');

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
    providerPlanMessage('Personal provider plan reviewed. No connection or charge was created.');
  } catch (error) {
    providerPlanOutput.hidden = true;
    providerPlanMessage(error.message, true);
  }
});
