'use strict';
(() => {
  const $=id=>document.getElementById(id),data=window.ModelGuidanceData;
  const dialog=$('model-guidance-dialog'),tabs=$('model-guidance-tabs');let trigger=null;
  function render(role){const guidance=data.roles[role];if(!guidance)return;$('model-guidance-role').textContent=role;$('model-guidance-size').textContent=guidance.size;$('model-guidance-capabilities').replaceChildren(...guidance.capabilities.map(capability=>{const item=document.createElement('span');item.textContent=capability;return item;}));$('model-guidance-explanation').textContent=guidance.explanation;$('model-guidance-hardware').textContent=data.hardware;[...tabs.children].forEach(tab=>{const selected=tab.dataset.role===role;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});}
  for(const role of Object.keys(data.roles)){const tab=document.createElement('button');tab.type='button';tab.role='tab';tab.dataset.role=role;tab.textContent=role;tab.addEventListener('click',()=>render(role));tabs.append(tab);}
  const profiles=$('model-guidance-profiles');for(const profile of data.profiles){const card=document.createElement('article'),title=document.createElement('h4'),body=document.createElement('p');title.textContent=profile.name;body.textContent=profile.description;card.append(title,body);profiles.append(card);}
  document.querySelectorAll('.model-guidance-trigger').forEach(button=>button.addEventListener('click',()=>{trigger=button;render(button.dataset.guidanceRole);dialog.showModal();}));
  $('model-guidance-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{if(trigger)trigger.focus();trigger=null;});
  render('Trainer');
})();
