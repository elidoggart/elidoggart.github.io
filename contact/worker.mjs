const MAX_FILE=50*1024*1024;
class Invalid extends Error{constructor(message,status=400){super(message);this.status=status;}}
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=text=>Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function key(env){return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.UPLOAD_SESSION_KEY)),'AES-GCM',false,['encrypt','decrypt']);}
async function seal(value,env){const iv=crypto.getRandomValues(new Uint8Array(12));return encode(iv)+'.'+encode(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(env),new TextEncoder().encode(JSON.stringify(value)))));}
async function unseal(value,env){const [iv,data,...extra]=value.split('.');if(extra.length)throw Error();return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv)},await key(env),decode(data))));}
async function jsonBody(request){
 const reader=request.body?.getReader();if(!reader)throw new Invalid('Invalid submission.');const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw new Invalid('Message is too long.',413);}chunks.push(value);}}
 finally{reader.releaseLock();}
 try{return JSON.parse(await new Blob(chunks).text());}catch{throw new Invalid('Invalid submission.');}
}
async function accessToken(env,fetcher){
 const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'})});
 if(!response.ok)throw Error('authorization');const token=await response.json();if(!token.access_token)throw Error('authorization');return token.access_token;
}
const clean=value=>value.replace(/[\u0000-\u001f\u007f/\\]/g,'_').trim().slice(0,200);
export async function handle(request,env,{fetcher=fetch,now=()=>Date.now()}={}){
 const origin=request.headers.get('Origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Origin'};
 const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers});
 if(!env.SITE_ORIGIN||origin!==env.SITE_ORIGIN)return reply(403,{error:'Please upload from the portfolio contact page.'});
 headers['Access-Control-Allow-Origin']=origin;
 if(new URL(request.url).pathname!=='/upload')return reply(404,{error:'Not found.'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, PUT','Access-Control-Allow-Headers':'Content-Type, X-Upload-Session'}});
 if(!['POST','PUT'].includes(request.method))return reply(405,{error:'Method not allowed.'});
 if(!['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','DRIVE_FOLDER_ID'].every(k=>env[k])||!env.UPLOAD_LIMITER||env.UPLOAD_SESSION_KEY?.length<32||!env.UPLOAD_SESSION_KEY)return reply(503,{error:'Uploads are not available yet. Please email me instead.'});
 try{
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)throw new Invalid('Upload unavailable.',503);
  if(request.method==='PUT'){
   let session;try{const value=request.headers.get('X-Upload-Session')||'';if(value.length>8192)throw Error();session=await unseal(value,env);}catch{throw new Invalid('The upload session is invalid. Please start again.',403);}
   if(session.ip!==ip||session.expires<now()||session.expires>now()+3600000||!Number.isInteger(session.size)||session.size<0||session.size>MAX_FILE)throw new Invalid('The upload session expired. Please start again.',403);
   const url=new URL(session.url);if(url.origin!=='https://www.googleapis.com'||url.pathname!=='/upload/drive/v3/files')throw new Invalid('Invalid upload session.',403);
   const declared=request.headers.get('Content-Length');if(declared!==null&&Number(declared)!==session.size)throw new Invalid('File size changed. Please start again.',413);
   if(!request.body&&session.size!==0)throw new Invalid('Choose a file.');
   let received=0;
   // Forward the file as a stream, keeping 50 MB uploads out of Worker memory.
   const limited=new TransformStream({transform(chunk,controller){received+=chunk.byteLength;if(received>session.size)throw new Invalid('File exceeds its expected size.',413);controller.enqueue(chunk);},flush(){if(received!==session.size)throw new Invalid('The upload was incomplete.');}});
   const body=request.body?request.body.pipeThrough(limited):new Uint8Array();
   const token=await accessToken(env,fetcher);
   const response=await fetcher(url.href,{method:'PUT',redirect:'error',signal:AbortSignal.timeout(300000),headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream','Content-Length':String(session.size)},body,duplex:'half'});
   if(!response.ok||!(await response.json()).id)throw Error('upload');
   return reply(200,{ok:true});
  }
  if(!(await env.UPLOAD_LIMITER.limit({key:ip})).success)throw new Invalid('Too many submissions. Please try again later.',429);
  const data=await jsonBody(request);
  if(!data||Array.isArray(data)||typeof data!=='object'||Object.keys(data).some(k=>!['name','email','message','website','file'].includes(k)))throw new Invalid('Invalid submission.');
  const field=(key,max)=>{const value=data[key]??'';if(typeof value!=='string'||value.length>max)throw new Invalid('Please shorten your name, email, or message.');return value.trim();};
  if(field('website',1000))throw new Invalid('Submission rejected.');
  const name=field('name',100),email=field('email',254),message=field('message',2000),file=data.file;
  if(file!==undefined&&file!==null&&(typeof file!=='object'||Array.isArray(file)||typeof file.name!=='string'||!file.name||file.name.length>255||!Number.isInteger(file.size)||file.size<0||file.size>MAX_FILE))throw new Invalid('Choose a file up to 50 MB.');
  const token=await accessToken(env,fetcher),authorization={Authorization:'Bearer '+token};
  const timestamp=new Date(now()).toISOString(),folderName=timestamp.replace(/[:.]/g,'-')+' - '+(clean(name)||'Submission')+' - '+crypto.randomUUID().slice(0,8);
  const folderResponse=await fetcher('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{...authorization,'Content-Type':'application/json'},body:JSON.stringify({name:folderName,mimeType:'application/vnd.google-apps.folder',parents:[env.DRIVE_FOLDER_ID]})});
  if(!folderResponse.ok)throw Error('folder');const folder=await folderResponse.json();if(!folder.id)throw Error('folder');
  const details=`Submitted: ${timestamp}\nName: ${name}\nEmail: ${email}\nFile: ${file?.name||''}\n\nMessage:\n${message}\n`;
  const boundary='portfolio_'+crypto.randomUUID();
  const detailBody=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:'submission.txt',mimeType:'text/plain',parents:[folder.id]})}\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${details}\r\n--${boundary}--\r\n`]);
  const detailResponse=await fetcher('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{...authorization,'Content-Type':`multipart/related; boundary=${boundary}`},body:detailBody});
  if(!detailResponse.ok||!(await detailResponse.json()).id)throw Error('details');
  if(!file)return reply(200,{ok:true});
  const response=await fetcher('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{...authorization,'Content-Type':'application/json','X-Upload-Content-Type':'application/octet-stream','X-Upload-Content-Length':String(file.size)},body:JSON.stringify({name:clean(file.name)||'attachment',parents:[folder.id],mimeType:'application/octet-stream'})});
  const uploadURL=response.headers.get('Location');if(!response.ok||!uploadURL)throw Error('session');
  return reply(200,{session:await seal({url:uploadURL,size:file.size,ip,expires:now()+3600000},env)});
 }catch(error){return reply(error instanceof Invalid?error.status:502,{error:error instanceof Invalid?error.message:'The submission could not be confirmed. Please email me before sending it again.'});}
}
export default {fetch:handle};
