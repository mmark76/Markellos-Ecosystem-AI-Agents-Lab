'use strict';
(() => {
  const layout=document.getElementById('panel-layout');
  if (!layout) return;
  const left=document.getElementById('left-panel'), right=document.getElementById('right-panel');
  const leftToggle=document.getElementById('toggle-left'), rightToggle=document.getElementById('toggle-right');
  const desktop=window.matchMedia('(min-width:901px)');
  const stored=(key,fallback)=>{try{return Number(localStorage.getItem(key))||fallback;}catch{return fallback;}};
  const setWidth=(name,value)=>layout.style.setProperty(name,`${Math.round(value)}px`);
  setWidth('--left-panel',stored('agents-lab-left-panel',272));
  setWidth('--right-panel',stored('agents-lab-right-panel',352));
  const saveWidth=(key,value)=>{try{localStorage.setItem(key,String(Math.round(value)));}catch{}};
  const setExpanded=(side,expanded)=>{
    const collapsed=`${side}-collapsed`, open=`${side}-open`, toggle=side==='left'?leftToggle:rightToggle;
    const toggleLabel=toggle.querySelector('.panel-toggle-label'), toggleIcon=toggle.querySelector('[aria-hidden="true"]');
    if (desktop.matches) layout.classList.toggle(collapsed,!expanded);
    else { layout.classList.toggle(open,expanded); if (expanded) layout.classList.remove(side==='left'?'right-open':'left-open'); }
    toggle.setAttribute('aria-expanded',String(expanded));
    const panelName=side==='left'?'workspace':'tools';
    toggle.title=`${expanded?'Hide':'Show'} ${panelName} panel`;
    if (toggleLabel) toggleLabel.textContent=expanded?'Hide':'Show';
    if (toggleIcon) toggleIcon.textContent=side==='left'?(expanded?'◀':'▶'):(expanded?'▶':'◀');
  };
  leftToggle.addEventListener('click',event=>{event.preventDefault();setExpanded('left',desktop.matches?layout.classList.contains('left-collapsed'):!layout.classList.contains('left-open'));});
  rightToggle.addEventListener('click',event=>{event.preventDefault();setExpanded('right',desktop.matches?layout.classList.contains('right-collapsed'):!layout.classList.contains('right-open'));});
  const closeOnBackdrop=event=>{if (!desktop.matches && event.target===layout) { setExpanded('left',false); setExpanded('right',false); }};
  layout.addEventListener('click',closeOnBackdrop);
  let activeResize=null;
  const finishResize=()=>{if(!activeResize)return;activeResize=null;layout.classList.remove('is-resizing');document.body.classList.remove('is-resizing-panels');};
  window.addEventListener('pointermove',event=>{if(activeResize)activeResize.resize(event);});
  window.addEventListener('pointerup',finishResize);
  window.addEventListener('pointercancel',finishResize);
  const setupResizer=(id,side)=>{
    const handle=document.getElementById(id); if (!handle) return;
    const key=side==='left'?'agents-lab-left-panel':'agents-lab-right-panel';
    const resize=event=>{
      if (!desktop.matches) return;
      const value=side==='left'?event.clientX:window.innerWidth-event.clientX;
      const clamped=Math.max(220,Math.min(460,value));
      setWidth(side==='left'?'--left-panel':'--right-panel',clamped); saveWidth(key,clamped);
    };
    handle.addEventListener('pointerdown',event=>{if(!desktop.matches)return;event.preventDefault();activeResize={resize};layout.classList.add('is-resizing');document.body.classList.add('is-resizing-panels');resize(event);});
    handle.addEventListener('keydown',event=>{if(!desktop.matches)return;const amount=event.shiftKey?32:12;if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const property=side==='left'?'--left-panel':'--right-panel';const current=Number.parseFloat(getComputedStyle(layout).getPropertyValue(property));const direction=(event.key==='ArrowRight'?1:-1)*(side==='left'?1:-1);const value=Math.max(220,Math.min(460,current+direction*amount));setWidth(property,value);saveWidth(key,value);});
  };
  setupResizer('resize-left','left'); setupResizer('resize-right','right');
  desktop.addEventListener('change',()=>{layout.classList.remove('left-open','right-open');leftToggle.setAttribute('aria-expanded',String(!layout.classList.contains('left-collapsed')));rightToggle.setAttribute('aria-expanded',String(!layout.classList.contains('right-collapsed')));});
})();
