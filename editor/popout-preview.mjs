import {render} from '../lib/render.mjs';

// The editor owns the draft. This same-origin window only displays it and selects fields.
export function createPopoutPreview({getData,getURLs,select,status}){
 let popup,frame,note,ready=false,loading=false,view={section:'work',open:[],scroll:0},generation=0;
 const isOpen=()=>!!popup&&!popup.closed;
 function open(){
  if(isOpen()&&frame?.isConnected){popup.focus();return;}
  popup=window.open('about:blank','', 'popup,width=1100,height=850');
  if(!popup){status('Allow pop-ups for this site, then click Pop-out preview again.',true);return;}
  const doc=popup.document;doc.title='Live portfolio preview';
  const style=doc.createElement('style');style.textContent='html,body{margin:0;height:100%;font:14px system-ui}body{display:flex;flex-direction:column}header{padding:12px 16px;background:#f5f2ee;display:flex;gap:16px;align-items:center;flex-wrap:wrap}p{margin:0;flex:1}iframe{border:0;flex:1;width:100%;background:white;margin:auto}button,select{font:inherit;padding:6px}';doc.head.append(style);
  const header=doc.createElement('header');note=doc.createElement('p');note.setAttribute('role','status');note.textContent='Click content to find it in the editor. Changes appear automatically.';
  const label=doc.createElement('label');label.textContent='View ';const size=doc.createElement('select');size.setAttribute('aria-label','Preview width');for(const [value,text] of [['100%','Desktop'],['390px','Phone']]){const option=doc.createElement('option');option.value=value;option.textContent=text;size.append(option);}label.append(size);
  const back=doc.createElement('button');back.textContent='Focus editor';back.onclick=()=>window.focus();header.append(note,label,back);
  frame=doc.createElement('iframe');frame.title='Live portfolio draft';frame.setAttribute('sandbox','allow-scripts allow-same-origin');doc.body.replaceChildren(header,frame);size.onchange=()=>frame.style.width=size.value;
  loading=false;view={section:'work',open:[],scroll:0};
 }
 function pending(){generation++;ready=false;if(isOpen())note.textContent='Updating preview…';}
 function invalid(){generation++;ready=false;if(isOpen())note.textContent='Showing the last valid preview. Fix the marked fields in the editor to resume updates.';}
 function update(){
  if(!isOpen()||!frame?.isConnected)return;
  const data=structuredClone(getData()),ticket=++generation;ready=false;
  if(!loading)try{const doc=frame.contentDocument;view={section:doc.querySelector('.view:not([hidden])')?.dataset.view||view.section,open:[...doc.querySelectorAll('[data-expand][aria-expanded=true]')].map(n=>n.dataset.expand),scroll:frame.contentWindow.scrollY};}catch{}
  loading=true;
  frame.onload=()=>{
   if(ticket!==generation||!isOpen())return;
   const doc=frame.contentDocument,win=frame.contentWindow;
   doc.querySelector('nav [data-section="'+view.section+'"]')?.click();
   for(const id of view.open)doc.querySelector('[data-expand="'+id+'"]')?.click();
   const mark=(node,path)=>{if(node)node.dataset.previewPath=path;};
   for(const [selector,path] of [['.name','site.name'],['.profession','site.profession'],['.introduction','site.introduction'],['footer p','site.footer'],['.contact-content','site'],['.resume-actions','site.resume'],['.education','education']])mark(doc.querySelector(selector),'portfolio.'+path);
   data.sections.forEach((section,si)=>{
    const sp='portfolio.sections['+si+']';mark(doc.querySelector('#view-'+section.id+' > .section-heading'),sp+'.subtitle');
    section.entries.forEach((entry,ei)=>{
     const ep=sp+'.entries['+ei+']',node=doc.getElementById('entry-'+entry.id);if(!node)return;mark(node,ep+'.title');
     for(const [selector,key] of [['.company-line h3','title'],['.entry-intro','intro'],['.entry-summary .date','date'],['.entry-summary .role','role'],['.entry-photo','image']])mark(node.querySelector(selector),ep+'.'+key);
     if(entry.divider)mark(node.previousElementSibling,ep+'.divider');
     entry.roles.forEach((role,ri)=>{const rp=ep+'.roles['+ri+']',control=doc.querySelector('[data-expand="'+role.id+'"]')?.parentElement;mark(doc.getElementById('details-'+role.id),rp);for(const [selector,key] of [['.role-meta h4','label'],['.role-meta .role','role'],['.role-meta .date','date']])mark(control?.querySelector(selector),rp+'.'+key);});
    });
   });
   const css=doc.createElement('style');css.textContent='[data-preview-path]:hover{outline:2px solid #ac2b37;outline-offset:3px;cursor:pointer}';doc.head.append(css);
   doc.addEventListener('click',event=>{
    if(event.target.closest('nav,.compact-nav,[data-expand],[data-collapse],.skip'))return;
    const node=event.target.closest('[data-preview-path]');
    if(node){event.preventDefault();event.stopImmediatePropagation();if(ready)select(node.dataset.previewPath);}
    else if(event.target.closest('a'))event.preventDefault();
   },true);
   win.requestAnimationFrame(()=>win.scrollTo(0,view.scroll));loading=false;ready=true;note.textContent='Click content to find it in the editor. Changes appear automatically.';
  };
  try{frame.srcdoc=render(data,{base:new URL('../',location.href).href,mediaURL:src=>getURLs().get(src)||src,editPaths:true});}catch{loading=false;invalid();}
 }
 window.addEventListener('pagehide',()=>{if(isOpen()){ready=false;note.textContent='Editor closed or reloaded. Reopen the preview from the editor to reconnect.';}});
 return {open,update,pending,invalid,isOpen};
}
