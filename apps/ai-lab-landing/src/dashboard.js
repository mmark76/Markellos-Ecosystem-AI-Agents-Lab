'use strict';
const KEY = 'markellos.ai-lab.appearance.v1';
const ANALYTICS_CONSENT_KEY = 'markellos.ai-lab.analytics-consent.v1';
const GA_MEASUREMENT_ID = 'G-ZEPZK1T1YQ';
const DEFAULT = Object.freeze({colorMode:'dark',accent:'#f2c230',font:'system',textSize:'100',spacing:'comfortable'});
const CONSENT_DENIED = Object.freeze({analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
const CONSENT_GRANTED = Object.freeze({...CONSENT_DENIED,analytics_storage:'granted'});
let analyticsInitialized = false;
let lastTrackedLocation = null;
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
function analyticsConsent() { try { const value=storage()?.getItem(ANALYTICS_CONSENT_KEY); return value === 'granted' || value === 'denied' ? value : null; } catch { return null; } }
function saveAnalyticsConsent(value) { try { storage()?.setItem(ANALYTICS_CONSENT_KEY,value); } catch {} }
function gtag() { window.dataLayer=window.dataLayer||[]; window.gtag=window.gtag||function(){window.dataLayer.push(arguments);}; return window.gtag; }
function analyticsDisabled() {
  window[`ga-disable-${GA_MEASUREMENT_ID}`]=true;
  analyticsInitialized=false;
  lastTrackedLocation=null;
  if (typeof window.gtag === 'function') window.gtag('consent','update',CONSENT_DENIED);
  document.querySelector(`script[data-ga4-measurement-id="${GA_MEASUREMENT_ID}"]`)?.remove();
}
function trackPageView() {
  if (!analyticsInitialized || window[`ga-disable-${GA_MEASUREMENT_ID}`]) return;
  const location=window.location.href;
  if (location === lastTrackedLocation) return;
  lastTrackedLocation=location;
  window.gtag('event','page_view',{page_location:location,page_title:document.title});
}
function trackZipDownload(event) {
  if (!analyticsInitialized || window[`ga-disable-${GA_MEASUREMENT_ID}`]) return;
  const link=event?.currentTarget;
  window.gtag('event','zip_download',{release_version:link?.dataset.zipVersion || 'unknown',delivery_source:link?.dataset.downloadSource || 'unknown'});
}
function configureAnalytics() {
  if (analyticsInitialized || window[`ga-disable-${GA_MEASUREMENT_ID}`]) return;
  analyticsInitialized=true;
  window.gtag('config',GA_MEASUREMENT_ID);
}
function enableAnalytics() {
  if (analyticsInitialized) { trackPageView(); return Promise.resolve(); }
  window[`ga-disable-${GA_MEASUREMENT_ID}`]=false;
  const send=gtag();
  send('consent','default',CONSENT_DENIED);
  send('consent','update',CONSENT_GRANTED);
  send('js',new Date());
  const existing=document.querySelector(`script[data-ga4-measurement-id="${GA_MEASUREMENT_ID}"]`);
  if (existing?.dataset.ga4Ready === 'true') { configureAnalytics(); return Promise.resolve(); }
  if (existing) return new Promise((resolve,reject)=>{
    existing.addEventListener('load',()=>{existing.dataset.ga4Ready='true';configureAnalytics();resolve();},{once:true});
    existing.addEventListener('error',()=>reject(new Error('Google Analytics could not be loaded.')),{once:true});
  });
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.dataset.ga4MeasurementId=GA_MEASUREMENT_ID;
    script.addEventListener('load',()=>{script.dataset.ga4Ready='true';configureAnalytics();resolve();},{once:true});
    script.addEventListener('error',()=>reject(new Error('Google Analytics could not be loaded.')),{once:true});
    document.head.append(script);
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  let prefs=applyAppearance(loadAppearance());
  const status=document.getElementById('appearance-status');
  const update=patch=>{ prefs=applyAppearance({...prefs,...patch}); const saved=saveAppearance(prefs); if(status) status.textContent=saved?'Appearance preferences saved on this device.':'Appearance applied for this session only.'; };
  document.getElementById('theme-toggle')?.addEventListener('click',()=>update({colorMode:prefs.colorMode==='dark'?'light':'dark'}));
  [['accent-color','accent'],['font-choice','font'],['text-size','textSize'],['spacing-choice','spacing']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('input',event=>update({[key]:event.currentTarget.value})));
  document.getElementById('reset-appearance')?.addEventListener('click',()=>{try{storage()?.removeItem(KEY);}catch{} prefs=applyAppearance(DEFAULT); if(status)status.textContent='Appearance preferences reset.';});
  [['settings-button','settings-dialog'],['info-button','info-dialog']].forEach(([button,dialog])=>document.getElementById(button)?.addEventListener('click',()=>document.getElementById(dialog)?.showModal()));
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
  const banner=document.getElementById('analytics-consent-banner');
  const analyticsDialog=document.getElementById('analytics-dialog');
  const consentStatus=document.getElementById('analytics-consent-status');
  const setConsentStatus=consent=>{ if(consentStatus) consentStatus.textContent=consent === 'granted' ? 'Analytics is enabled. You can withdraw consent at any time.' : consent === 'denied' ? 'Analytics is disabled.' : 'Analytics is off until you choose otherwise.'; };
  const applyAnalyticsConsent=consent=>{
    saveAnalyticsConsent(consent);
    banner.hidden=true;
    analyticsDialog?.close();
    setConsentStatus(consent);
    if(consent === 'granted') enableAnalytics().catch(()=>{ if(consentStatus)consentStatus.textContent='Analytics could not be loaded. Your choice is saved and no analytics event was sent.'; });
    else analyticsDisabled();
  };
  const savedConsent=analyticsConsent();
  setConsentStatus(savedConsent);
  if(savedConsent === 'granted') enableAnalytics().catch(()=>{ if(consentStatus)consentStatus.textContent='Analytics could not be loaded. Your choice is saved and no analytics event was sent.'; });
  else if(savedConsent === 'denied') analyticsDisabled();
  else banner.hidden=false;
  document.getElementById('accept-analytics')?.addEventListener('click',()=>applyAnalyticsConsent('granted'));
  document.getElementById('reject-analytics')?.addEventListener('click',()=>applyAnalyticsConsent('denied'));
  document.getElementById('accept-analytics-dialog')?.addEventListener('click',()=>applyAnalyticsConsent('granted'));
  document.getElementById('reject-analytics-dialog')?.addEventListener('click',()=>applyAnalyticsConsent('denied'));
  ['manage-analytics','privacy-analytics-choices'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>analyticsDialog?.showModal()));
  document.querySelectorAll('.release-download').forEach(link=>link.addEventListener('click',trackZipDownload));
  window.addEventListener('hashchange',trackPageView);
});
if (typeof module !== 'undefined') module.exports={DEFAULT,normalizeAppearance,syncThemeToggle,analyticsConsent};
