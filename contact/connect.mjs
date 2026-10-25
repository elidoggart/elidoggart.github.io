// One-time owner setup. Run locally; never deploy this helper or its output.
import http from 'node:http';
import fs from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
const credentials=JSON.parse(await fs.readFile(process.argv[2],'utf8')).web;
const folder=process.argv[3];
if(!credentials?.client_id||!credentials.client_secret||!folder)throw Error('Usage: node contact/connect.mjs CLIENT_JSON FOLDER_ID');
const origin='http://localhost:4188',scope='https://www.googleapis.com/auth/drive.file';
const session=randomBytes(32).toString('hex'),state=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url');
let token,apiKey='',consumed=false;
const js=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const page=body=>`<!doctype html><meta charset="utf-8"><meta name="referrer" content="same-origin"><title>Connect portfolio uploads</title><style>body{font:18px system-ui;max-width:640px;margin:60px auto;padding:24px;line-height:1.6}input,button{font:inherit;padding:10px;max-width:100%}label{display:block}button{cursor:pointer}code{overflow-wrap:anywhere}</style><h1>Connect portfolio uploads</h1>${body}`;
async function readForm(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>4096)throw Error('Request too large');}return new URLSearchParams(text);}
const server=http.createServer(async(req,res)=>{
 const send=(code,body,headers={})=>{res.writeHead(code,{'Cache-Control':'no-store','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Type':'text/html; charset=utf-8',...headers});res.end(body);};
 try{
  if(req.headers.host!=='localhost:4188')return send(403,'Invalid host');
  const url=new URL(req.url,origin);
  const sameSession=(req.headers.cookie||'').split(';').some(c=>c.trim()==='portfolio_setup='+session);
  if(req.method==='POST'&&(req.headers.origin!==origin||!sameSession))return send(403,'Invalid session');
  if(req.method==='GET'&&url.pathname==='/'){
   if(req.headers['sec-fetch-site']==='cross-site')return send(403,'Open localhost directly.');
   return send(200,page(`<p>This connects your private upload folder using Google's selected-file permission.</p><form method="post" action="/authorize"><label>Google Picker API key <input type="password" name="key" required autocomplete="off"></label><p><button>Authorize Google Drive</button></p></form>`),{'Set-Cookie':`portfolio_setup=${session}; HttpOnly; SameSite=Lax; Path=/`});
  }
  if(req.method==='POST'&&url.pathname==='/authorize'){
   apiKey=(await readForm(req)).get('key')||'';if(!/^AIza[\w-]{20,}$/.test(apiKey))return send(400,'Enter the Google Picker API key.');
   const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');auth.search=new URLSearchParams({client_id:credentials.client_id,redirect_uri:origin+'/callback',response_type:'code',scope,access_type:'offline',prompt:'consent',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
   return send(302,'',{Location:auth.href});
  }
  if(req.method==='GET'&&url.pathname==='/callback'){
   if(!sameSession||consumed||url.searchParams.get('state')!==state||!url.searchParams.get('code'))return send(400,'Authorization was not completed. Restart the helper to try again.');
   consumed=true;
   const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),body:new URLSearchParams({client_id:credentials.client_id,client_secret:credentials.client_secret,code:url.searchParams.get('code'),code_verifier:verifier,redirect_uri:origin+'/callback',grant_type:'authorization_code'})});
   if(!response.ok)throw Error('Google authorization failed');token=await response.json();
   if(!token.refresh_token||!token.access_token||!token.scope?.split(' ').includes(scope))throw Error('Google did not return the requested offline authorization');
   return send(302,'',{Location:'/choose'});
  }
  if(req.method==='GET'&&url.pathname==='/choose'&&sameSession&&token){
   return send(200,page(`<p>Select <strong>Portfolio uploads</strong>. Only that folder and files created by this app will be used.</p><button id="choose" disabled>Choose upload folder</button><p id="status"></p><script>
   function loaded(){gapi.load('picker',()=>{document.getElementById('choose').disabled=false;});}
   document.getElementById('choose').onclick=()=>{
    const view=new google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder').setMode(google.picker.DocsViewMode.LIST);
    const picker=new google.picker.PickerBuilder().addView(view).setOAuthToken(${js(token.access_token)}).setDeveloperKey(${js(apiKey)}).setAppId(${js(credentials.client_id.split('-')[0])}).setOrigin(location.origin).setCallback(async result=>{
     if(result.action!=='picked')return;
     if(result.docs[0].id!==${js(folder)}){document.getElementById('status').textContent='Please select the Portfolio uploads folder from your link.';return;}
     const response=await fetch('/finish',{method:'POST',body:new URLSearchParams({folder:result.docs[0].id})});
     document.getElementById('status').textContent=await response.text();
    }).build();picker.setVisible(true);
   };
   </script><script src="https://apis.google.com/js/api.js" onload="loaded()"></script>`));
  }
  if(req.method==='POST'&&url.pathname==='/finish'&&token){
   if((await readForm(req)).get('folder')!==folder)return send(400,'Wrong folder.');
   const response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(folder)+'?fields=id,name,mimeType,capabilities(canAddChildren)',{headers:{Authorization:'Bearer '+token.access_token},redirect:'error',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('The selected folder is not yet accessible');const info=await response.json();
   if(info.mimeType!=='application/vnd.google-apps.folder'||!info.capabilities?.canAddChildren)throw Error('The folder does not allow uploads');
   await fs.mkdir('.local/contact-secrets',{recursive:true,mode:0o700});
   await fs.writeFile('.local/contact-secrets/worker-secrets.json',JSON.stringify({GOOGLE_CLIENT_ID:credentials.client_id,GOOGLE_CLIENT_SECRET:credentials.client_secret,GOOGLE_REFRESH_TOKEN:token.refresh_token,DRIVE_FOLDER_ID:folder,UPLOAD_SESSION_KEY:randomBytes(32).toString('base64url')}),{mode:0o600});
   return send(200,'Connected. The private authorization is saved locally for deployment. You can close this tab.');
  }
  send(404,'Not found');
 }catch{send(502,'The connection could not be completed. Check the Google APIs and client configuration, then restart this helper.');}
});
server.listen(4188,'127.0.0.1',()=>console.log('Owner setup: http://localhost:4188'));
