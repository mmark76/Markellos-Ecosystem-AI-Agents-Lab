'use strict';
(() => {
  const advanced = document.getElementById('advanced-tools');
  const advancedContent = advanced?.querySelector('.advanced-tools-content');
  const chatgpt = document.getElementById('openai-chatgpt-connection');
  const chatgptDialogContent = document.getElementById('chatgpt-connection-dialog-content');
  const providerDialogContent = document.getElementById('personal-provider-dialog-content');
  const providerSection = advancedContent?.querySelector('.personal-provider-workspace');
  const guide = advancedContent?.querySelector('a[href="/fine-tuning-guide"]')?.parentElement;
  const openAiPlatformLink = document.getElementById('open-openai-platform')?.parentElement;
  const openAiBoundary = openAiPlatformLink?.previousElementSibling;
  if (advancedContent && chatgpt && chatgptDialogContent && providerDialogContent && providerSection) {
    chatgptDialogContent.append(chatgpt);
    if (openAiBoundary?.classList.contains('personal-provider-console-boundary')) chatgptDialogContent.append(openAiBoundary);
    if (openAiPlatformLink) chatgptDialogContent.append(openAiPlatformLink);
    if (guide) providerSection.querySelector('h3')?.after(guide);
    providerDialogContent.append(providerSection, ...[...advancedContent.children]);
    advanced.remove();
  }
  const connectionsHub = document.getElementById('connections-hub-dialog');
  const primaryTrigger = document.getElementById('open-connections-hub');
  const bindings = [
    ['open-connections-hub', 'connections-hub-dialog', primaryTrigger],
    ['open-chatgpt-connection', 'chatgpt-connection-dialog', primaryTrigger],
    ['open-personal-provider', 'personal-provider-dialog', primaryTrigger],
  ];
  for (const [triggerId, dialogId, returnTarget] of bindings) {
    const trigger = document.getElementById(triggerId);
    const dialog = document.getElementById(dialogId);
    if (!trigger || !dialog) continue;
    trigger.addEventListener('click', () => {
      if (dialog !== connectionsHub && connectionsHub?.open) connectionsHub.close();
      dialog.showModal();
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => returnTarget?.focus());
  }
  document.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
})();
