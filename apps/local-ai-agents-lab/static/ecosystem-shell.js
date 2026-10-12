'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const info = $('lab-info');
  const strings = {
    back: 'Back to markellosecosystem', mode: 'Light / Dark', modeTitle: 'Toggle light and dark mode',
    info: 'Info', title: 'Important Info',
    body: 'This laboratory runs locally with Ollama. Conversation history stays in local SQLite storage.',
    privacy: 'No analytics or external AI service is integrated into this app.',
    close: 'Close'
  };
  function translate() {
    $('ecosystem-link').textContent = strings.back;
    $('quick-mode').textContent = strings.mode;
    $('quick-mode').setAttribute('aria-label',strings.modeTitle);
    $('info-toggle').textContent = strings.info;
    $('lab-info-title').textContent = strings.title;
    $('lab-info-body').textContent = strings.body;
    $('lab-info-privacy').textContent = strings.privacy;
    $('info-close').textContent = strings.close;
    document.querySelectorAll('.copyright-year').forEach(el => {el.textContent = String(new Date().getFullYear());});
  }
  $('quick-mode').addEventListener('click',() => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    const control = document.querySelector('input[name="appearance"][value="' + next + '"]');
    if (control) {control.checked = true;control.dispatchEvent(new Event('change',{bubbles:true}));}
  });
  $('info-toggle').addEventListener('click',() => {if(!info.open)info.showModal();});
  $('info-close').addEventListener('click',()=>info.close());
  translate();
})();
