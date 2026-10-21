'use strict';
const KEY = 'markellos.ai-lab.appearance.v1';
const ANALYTICS_SCRIPT_ID = 'ai-lab-cookieless-analytics';
const ANALYTICS_SCRIPT_URL = 'https://analytics.markellosecosystem.com/v1/script.js';
const PRODUCTION_HOSTNAME = 'ai-lab.markellosecosystem.com';
const ANALYTICS_NOTICE_KEY = 'markellos.ai-lab.analyticsNoticeDismissed.v1';
const DEFAULT = Object.freeze({colorMode:'dark',accent:'#f2c230',font:'system',textSize:'100',spacing:'comfortable'});
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
function initializeAnalytics() {
  if (window.location.protocol !== 'https:' || window.location.hostname.toLowerCase() !== PRODUCTION_HOSTNAME || document.getElementById(ANALYTICS_SCRIPT_ID)) return false;
  const script=document.createElement('script');
  script.id=ANALYTICS_SCRIPT_ID;
  script.async=true;
  script.src=ANALYTICS_SCRIPT_URL;
  document.head.append(script);
  return true;
}
function isAnalyticsNoticeDismissed() { try { return storage()?.getItem(ANALYTICS_NOTICE_KEY) === 'true'; } catch { return false; } }
function dismissAnalyticsNotice() { try { storage()?.setItem(ANALYTICS_NOTICE_KEY, 'true'); } catch {} }
function initializeAnalyticsNotice() {
  const dialog = document.getElementById('analytics-notice-dialog');
  const reopen = document.getElementById('analytics-notice-button');
  const close = document.getElementById('analytics-notice-close');
  const acknowledge = document.getElementById('analytics-notice-acknowledge');
  const info = document.getElementById('info-dialog');
  if (!dialog || !reopen || !close || !acknowledge) return false;

  const open = () => { if (!dialog.open) dialog.showModal(); };
  const dismiss = () => { dismissAnalyticsNotice(); dialog.close(); };
  reopen.addEventListener('click', () => { info?.close(); open(); });
  close.addEventListener('click', dismiss);
  acknowledge.addEventListener('click', dismiss);
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dismiss(); });
  if (!isAnalyticsNoticeDismissed()) window.requestAnimationFrame(open);
  return true;
}
document.addEventListener('DOMContentLoaded',()=>{
  initializeAnalytics();
  initializeAnalyticsNotice();
  let prefs=applyAppearance(loadAppearance());
  const status=document.getElementById('appearance-status');
  const update=patch=>{ prefs=applyAppearance({...prefs,...patch}); const saved=saveAppearance(prefs); if(status) status.textContent=saved?'Appearance preferences saved on this device.':'Appearance applied for this session only.'; };
  document.getElementById('theme-toggle')?.addEventListener('click',()=>update({colorMode:prefs.colorMode==='dark'?'light':'dark'}));
  [['accent-color','accent'],['font-choice','font'],['text-size','textSize'],['spacing-choice','spacing']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('input',event=>update({[key]:event.currentTarget.value})));
  document.getElementById('reset-appearance')?.addEventListener('click',()=>{try{storage()?.removeItem(KEY);}catch{} prefs=applyAppearance(DEFAULT); if(status)status.textContent='Appearance preferences reset.';});
  [['settings-button','settings-dialog'],['info-button','info-dialog']].forEach(([button,dialog])=>document.getElementById(button)?.addEventListener('click',()=>document.getElementById(dialog)?.showModal()));
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
});
if (typeof module !== 'undefined') module.exports={DEFAULT,normalizeAppearance,syncThemeToggle,initializeAnalytics,initializeAnalyticsNotice,isAnalyticsNoticeDismissed,dismissAnalyticsNotice,ANALYTICS_NOTICE_KEY};
