'use strict';
const KEY = 'markellos.ai-lab.appearance.v1';
const DEFAULT = Object.freeze({colorMode:'dark',accent:'#f2c230',font:'system',textSize:'100',spacing:'comfortable'});
const LATEST_ZIP_URL = 'https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/latest/download/AI-Agents-Lab-Windows.zip';
const validHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
function normalizeAppearance(value={}) {
  return {colorMode:value.colorMode === 'dark' ? 'dark' : 'light',accent:validHex(value.accent) || DEFAULT.accent,font:['system','serif'].includes(value.font) ? value.font : DEFAULT.font,textSize:['100','112.5','125'].includes(String(value.textSize)) ? String(value.textSize) : DEFAULT.textSize,spacing:['compact','comfortable','spacious'].includes(value.spacing) ? value.spacing : DEFAULT.spacing};
}
function storage() { try { return window.localStorage; } catch { return null; } }
function loadAppearance() { try { return normalizeAppearance(JSON.parse(storage()?.getItem(KEY) || '{}')); } catch { return {...DEFAULT}; } }
function syncThemeToggle(colorMode) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', String(colorMode === 'dark'));
  const label = toggle.querySelector('span');
  if (label) label.textContent = colorMode === 'dark' ? 'Light' : 'Dark';
}
function applyAppearance(value) {
  const p=normalizeAppearance(value), root=document.documentElement;
  root.dataset.colorMode=p.colorMode; root.dataset.font=p.font; root.dataset.spacing=p.spacing;
  root.style.setProperty('--user-accent',p.accent); root.style.setProperty('--user-text-size',p.textSize+'%');
  for(const [id,key] of [['accent-color','accent'],['font-choice','font'],['text-size','textSize'],['spacing-choice','spacing']]) { const input=document.getElementById(id); if(input) input.value=p[key]; }
  syncThemeToggle(p.colorMode);
  return p;
}
function saveAppearance(p) { try { storage()?.setItem(KEY,JSON.stringify(normalizeAppearance(p))); return true; } catch { return false; } }
function releaseVersion(build) {
  const match = /^v(\d+)\.(\d+)\.(\d+)_/.exec(build || '');
  return match ? match.slice(1).map(Number) : null;
}
function isNewerRelease(available, current) {
  for (let index = 0; index < available.length; index += 1) {
    if (available[index] !== current[index]) return available[index] > current[index];
  }
  return false;
}
async function checkForZipUpdate(button) {
  const currentBuild = document.querySelector('.build-id')?.textContent?.trim();
  const currentVersion = releaseVersion(currentBuild);
  if (!currentVersion || typeof window.fetch !== 'function' || typeof DOMParser !== 'function') return;
  try {
    const response = await window.fetch(window.location.href, {cache:'no-store'});
    if (!response.ok) return;
    const availableBuild = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('.build-id')?.textContent?.trim();
    const availableVersion = releaseVersion(availableBuild);
    if (availableVersion && isNewerRelease(availableVersion, currentVersion)) {
      button.hidden = false;
      button.textContent = `New version available: v${availableVersion.join('.')} — Download ZIP ↓`;
    }
  } catch {}
}
function scheduleZipUpdateChecks(button) {
  const check = () => void checkForZipUpdate(button);
  check();
  window.setInterval(check, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  let prefs=applyAppearance(loadAppearance());
  const status=document.getElementById('appearance-status');
  const update=patch=>{ prefs=applyAppearance({...prefs,...patch}); const saved=saveAppearance(prefs); if(status) status.textContent=saved?'Appearance preferences saved on this device.':'Appearance applied for this session only.'; };
  document.getElementById('theme-toggle')?.addEventListener('click',()=>update({colorMode:prefs.colorMode==='dark'?'light':'dark'}));
  [['accent-color','accent'],['font-choice','font'],['text-size','textSize'],['spacing-choice','spacing']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('input',event=>update({[key]:event.currentTarget.value})));
  document.getElementById('reset-appearance')?.addEventListener('click',()=>{try{storage()?.removeItem(KEY);}catch{} prefs=applyAppearance(DEFAULT); if(status)status.textContent='Appearance preferences reset.';});
  const zipUpdate=document.getElementById('zip-update');
  if (zipUpdate) {
    zipUpdate.addEventListener('click',()=>window.location.assign(LATEST_ZIP_URL));
    scheduleZipUpdateChecks(zipUpdate);
  }
  [['settings-button','settings-dialog'],['info-button','info-dialog']].forEach(([button,dialog])=>document.getElementById(button)?.addEventListener('click',()=>document.getElementById(dialog)?.showModal()));
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
});
module.exports={DEFAULT,normalizeAppearance,syncThemeToggle,releaseVersion,isNewerRelease,checkForZipUpdate,scheduleZipUpdateChecks};
