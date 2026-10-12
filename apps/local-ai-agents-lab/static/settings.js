'use strict';
(() => {
  const themeKey = 'agents-lab-theme';
  const accentKey = 'agents-lab-accent';
  const backgroundKey = 'agents-lab-background';
  const fontKey = 'agents-lab-font';
  const accentNames = ['mint', 'blue', 'purple', 'orange', 'rose', 'white'];
  const backgroundNames = ['default', 'midnight', 'navy', 'forest', 'plum'];
  const fontNames = ['system', 'modern', 'serif', 'mono'];
  const storageRead = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const storageWrite = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Browser storage unavailable. */ }
  };
  let mode = storageRead(themeKey) === 'light' ? 'light' : 'dark';
  let accent = accentNames.includes(storageRead(accentKey)) ? storageRead(accentKey) : 'white';
  let background = backgroundNames.includes(storageRead(backgroundKey)) ? storageRead(backgroundKey) : 'default';
  let font = fontNames.includes(storageRead(fontKey)) ? storageRead(fontKey) : 'system';
  const $ = id => document.getElementById(id);
  const ui = {settings:'Settings', heading:'Appearance Settings', appearance:'Appearance', dark:'Dark', light:'Light', accent:'Accent Color', background:'Background Color', font:'Text Font', reset:'Reset to Defaults', close:'Close settings',
    colors:{mint:'Mint',blue:'Blue',purple:'Purple',orange:'Orange',rose:'Rose',white:'White'}, backgrounds:{default:'Default',midnight:'Midnight',navy:'Navy',forest:'Forest',plum:'Plum'}, fonts:{system:'System',modern:'Modern',serif:'Serif',mono:'Monospace'}};
  function apply() {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.accent = accent;
    root.dataset.background = background;
    root.dataset.font = font;
    document.querySelectorAll('input[name="appearance"]').forEach(el => {el.checked = el.value === mode;});
    document.querySelectorAll('[data-accent]').forEach(el => {el.setAttribute('aria-pressed', String(el.dataset.accent === accent));});
    document.querySelectorAll('[data-background]').forEach(el => {el.setAttribute('aria-pressed', String(el.dataset.background === background));});
    document.querySelectorAll('[data-font]').forEach(el => {el.setAttribute('aria-pressed', String(el.dataset.font === font));});
    const label = ui;
    $('settings-label').textContent = label.settings;
    $('settings-heading').textContent = label.heading;
    $('settings-mode-label').textContent = label.appearance;
    $('theme-dark-label').textContent = label.dark;
    $('theme-light-label').textContent = label.light;
    $('settings-accent-label').textContent = label.accent;
    $('settings-background-label').textContent = label.background;
    $('settings-font-label').textContent = label.font;
    $('settings-reset').textContent = label.reset;
    $('settings-close').setAttribute('aria-label',label.close);
    $('accent-options').setAttribute('aria-label',label.accent);
    $('background-options').setAttribute('aria-label',label.background);
    $('font-options').setAttribute('aria-label',label.font);
    $('settings-toggle').setAttribute('aria-label',label.settings);
    document.querySelectorAll('[data-accent]').forEach(el => { el.setAttribute('aria-label',label.colors[el.dataset.accent]); el.setAttribute('title',label.colors[el.dataset.accent]); });
    document.querySelectorAll('[data-background]').forEach(el => { el.setAttribute('aria-label',label.backgrounds[el.dataset.background]); el.setAttribute('title',label.backgrounds[el.dataset.background]); });
    document.querySelectorAll('[data-font]').forEach(el => { el.setAttribute('aria-label',label.fonts[el.dataset.font]); el.setAttribute('title',label.fonts[el.dataset.font]); });
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
  document.querySelectorAll('[data-background]').forEach(el => el.addEventListener('click', () => {
    background = el.dataset.background;
    storageWrite(backgroundKey, background);
    apply();
  }));
  document.querySelectorAll('[data-font]').forEach(el => el.addEventListener('click', () => {
    font = el.dataset.font;
    storageWrite(fontKey, font);
    apply();
  }));
  $('settings-reset').addEventListener('click', () => {
    mode = 'dark';
    accent = 'white';
    background = 'default';
    font = 'system';
    storageWrite(themeKey, mode);
    storageWrite(accentKey, accent);
    storageWrite(backgroundKey, background);
    storageWrite(fontKey, font);
    apply();
  });
  apply();
})();
