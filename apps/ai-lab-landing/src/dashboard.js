'use strict';
const KEY = 'markellos.ai-lab.appearance.v1';
const DEFAULT = Object.freeze({colorMode:'light',accent:'#f2c230',background:'#f8fafc',font:'system',textSize:'100',spacing:'comfortable'});
const validHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
function normalizeAppearance(value={}) {
  return {colorMode:value.colorMode === 'dark' ? 'dark' : 'light',accent:validHex(value.accent) || DEFAULT.accent,background:validHex(value.background) || DEFAULT.background,font:['system','serif'].includes(value.font) ? value.font : DEFAULT.font,textSize:['100','112.5','125'].includes(String(value.textSize)) ? String(value.textSize) : DEFAULT.textSize,spacing:['compact','comfortable','spacious'].includes(value.spacing) ? value.spacing : DEFAULT.spacing};
}
function storage() { try { return window.localStorage; } catch { return null; } }
function loadAppearance() { try { return normalizeAppearance(JSON.parse(storage()?.getItem(KEY) || '{}')); } catch { return {...DEFAULT}; } }
function applyAppearance(value) {
  const p=normalizeAppearance(value), root=document.documentElement;
  root.dataset.colorMode=p.colorMode; root.dataset.font=p.font; root.dataset.spacing=p.spacing;
  root.style.setProperty('--user-accent',p.accent); root.style.setProperty('--user-background',p.background); root.style.setProperty('--user-text-size',p.textSize+'%');
  for(const [id,key] of [['accent-color','accent'],['background-color','background'],['font-choice','font'],['text-size','textSize'],['spacing-choice','spacing']]) { const input=document.getElementById(id); if(input) input.value=p[key]; }
  document.getElementById('theme-toggle')?.setAttribute('aria-pressed',String(p.colorMode==='dark'));
  return p;
}
function saveAppearance(p) { try { storage()?.setItem(KEY,JSON.stringify(normalizeAppearance(p))); return true; } catch { return false; } }
document.addEventListener('DOMContentLoaded',()=>{
  let prefs=applyAppearance(loadAppearance());
  const status=document.getElementById('appearance-status');
  const update=patch=>{ prefs=applyAppearance({...prefs,...patch}); const saved=saveAppearance(prefs); if(status) status.textContent=saved?'Appearance preferences saved on this device.':'Appearance applied for this session only.'; };
  document.getElementById('theme-toggle')?.addEventListener('click',event=>{update({colorMode:prefs.colorMode==='dark'?'light':'dark'}); event.currentTarget.querySelector('span').textContent=prefs.colorMode==='dark'?'Light':'Dark';});
  [['accent-color','accent'],['background-color','background'],['font-choice','font'],['text-size','textSize'],['spacing-choice','spacing']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('input',event=>update({[key]:event.currentTarget.value})));
  document.getElementById('reset-appearance')?.addEventListener('click',()=>{try{storage()?.removeItem(KEY);}catch{} prefs=applyAppearance(DEFAULT); if(status)status.textContent='Appearance preferences reset.';});
  [['settings-button','settings-dialog'],['info-button','info-dialog']].forEach(([button,dialog])=>document.getElementById(button)?.addEventListener('click',()=>document.getElementById(dialog)?.showModal()));
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
});
module.exports={DEFAULT,normalizeAppearance};
