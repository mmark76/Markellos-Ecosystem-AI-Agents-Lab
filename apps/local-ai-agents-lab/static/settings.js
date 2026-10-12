'use strict';
(() => {
  const themeKey = 'agents-lab-theme';
  const accentKey = 'agents-lab-accent';
  const accentNames = ['mint', 'blue', 'purple', 'orange', 'rose', 'white'];
  const storageRead = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const storageWrite = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Browser storage unavailable. */ }
  };
  let mode = storageRead(themeKey) === 'light' ? 'light' : 'dark';
  let accent = accentNames.includes(storageRead(accentKey)) ? storageRead(accentKey) : 'mint';
  const $ = id => document.getElementById(id);
  const ui = {settings:'Settings', heading:'Appearance Settings', appearance:'Appearance', dark:'Dark', light:'Light', accent:'Accent Color', reset:'Reset to Defaults', close:'Close settings',
    colors:{mint:'Mint',blue:'Blue',purple:'Purple',orange:'Orange',rose:'Rose',white:'White'}};
  function apply() {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.accent = accent;
    document.querySelectorAll('input[name="appearance"]').forEach(el => {el.checked = el.value === mode;});
    document.querySelectorAll('[data-accent]').forEach(el => {el.setAttribute('aria-pressed', String(el.dataset.accent === accent));});
    const label = ui;
    $('settings-label').textContent = label.settings;
    $('settings-heading').textContent = label.heading;
    $('settings-mode-label').textContent = label.appearance;
    $('theme-dark-label').textContent = label.dark;
    $('theme-light-label').textContent = label.light;
    $('settings-accent-label').textContent = label.accent;
    $('settings-reset').textContent = label.reset;
    $('settings-close').setAttribute('aria-label',label.close);
    $('accent-options').setAttribute('aria-label',label.accent);
    $('settings-toggle').setAttribute('aria-label',label.settings);
    document.querySelectorAll('[data-accent]').forEach(el => { el.setAttribute('aria-label',label.colors[el.dataset.accent]); el.setAttribute('title',label.colors[el.dataset.accent]); });
  }
  function setOpen(open) {
    $('settings-panel').hidden = !open;
    $('settings-toggle').setAttribute('aria-expanded',String(open));
    if(open) $('settings-close').focus();
    else $('settings-toggle').focus();
  }
  $('settings-toggle').addEventListener('click', () => setOpen($('settings-panel').hidden));
  $('settings-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', ev => {if(ev.key === 'Escape' && !$('settings-panel').hidden)setOpen(false);});
  document.querySelectorAll('input[name="appearance"]').forEach(el => el.addEventListener('change', () => {
    if(!el.checked) return;
    mode = el.value;
    storageWrite(themeKey, mode);
    apply();
  }));
  document.querySelectorAll('[data-accent]').forEach(el => el.addEventListener('click', () => {
    accent = el.dataset.accent;
    storageWrite(accentKey, accent);
    apply();
  }));
  $('settings-reset').addEventListener('click', () => {
    mode = 'dark';
    accent = 'mint';
    storageWrite(themeKey, mode);
    storageWrite(accentKey, accent);
    apply();
  });
  apply();
})();
