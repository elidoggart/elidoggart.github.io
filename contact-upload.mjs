for(const form of document.querySelectorAll('[data-contact-upload]')){
 const status=form.querySelector('[data-upload-status]'),button=form.querySelector('button[type="submit"]');
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(button.disabled)return;
  const data=new FormData(form),file=form.querySelector('input[type="file"]').files[0];
  if(file&&file.size>50*1024*1024){status.textContent='Choose a file up to 50 MB.';return;}
  button.disabled=true;button.textContent='Sending…';status.textContent=file?'Uploading your file…':'Sending…';
  try{
   const payload=Object.fromEntries(['name','email','message','website'].map(k=>[k,data.get(k)||'']));
   if(file)payload.file={name:file.name,size:file.size};
   const options={credentials:'omit',redirect:'error'};
   let response=await fetch(form.dataset.endpoint,{...options,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(60000)});
   let result=await response.json();
   if(!response.ok)throw Error(result.error||'Your submission could not be completed.');
   if(file){
    if(!result.session)throw Error('The upload could not be started.');
    response=await fetch(form.dataset.endpoint,{...options,method:'PUT',headers:{'Content-Type':'application/octet-stream','X-Upload-Session':result.session},body:file,signal:AbortSignal.timeout(300000)});
    result=await response.json();
   }
   if(!response.ok||result.ok!==true)throw Error(result.error||'Your submission could not be completed.');
   form.reset();status.textContent='Thank you—your submission has been sent.';
  }catch(error){status.textContent=error.name==='TimeoutError'||error instanceof TypeError?'The connection was interrupted. Your submission may have arrived; please email me before sending it again.':error.message;}
  finally{button.disabled=false;button.textContent='Send';}
 });
}
