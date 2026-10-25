import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../contact/worker.mjs';
import {contactUpload} from '../lib/contact-upload.mjs';
import {escape} from '../lib/render.mjs';
const env={SITE_ORIGIN:'https://www.elidoggart.com',GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',GOOGLE_REFRESH_TOKEN:'refresh',DRIVE_FOLDER_ID:'destination',UPLOAD_SESSION_KEY:'a'.repeat(64),UPLOAD_LIMITER:{limit:async()=>({success:true})}};
function request(data={},origin=env.SITE_ORIGIN){return new Request('https://contact.example/upload',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json'},body:JSON.stringify(data)});}
function google(calls=[]){return async(url,options)=>{
 calls.push({url,options});
 if(url.includes('oauth2'))return Response.json({access_token:'access'});
 if(url.includes('uploadType=resumable'))return new Response(null,{headers:{Location:'https://www.googleapis.com/upload/drive/v3/files?upload_id=test'}});
 if(options.method==='PUT')await new Response(options.body).arrayBuffer();
 return Response.json({id:options.body?.includes?.('application/vnd.google-apps.folder')?'submission-folder':'private-file'});
};}
test('saves optional fields in a text file inside a new private submission folder',async()=>{
 const calls=[],response=await handle(request({name:'Example',email:'example@example.com',message:'Hello'}),env,{fetcher:google(calls)});
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(calls.length,3);
 const metadata=JSON.parse(calls[1].options.body);assert.deepEqual(metadata.parents,['destination']);assert.equal(metadata.mimeType,'application/vnd.google-apps.folder');
 const details=await calls[2].options.body.text();assert.match(details,/"parents":\["submission-folder"\]/);assert.match(details,/"name":"submission.txt"/);assert.match(details,/Email: example@example.com/);assert.match(details,/Message:\nHello/);assert.doesNotMatch(details,/anyone|permissions/);
});
test('accepts all blank fields and no attachment',async()=>{
 const response=await handle(request({}),env,{fetcher:google()});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
});
test('accepts arbitrary file types and streams the upload to the same submission folder',async()=>{
 const calls=[],fetcher=google(calls);
 const start=await handle(request({file:{name:'design.step',size:3}}),env,{fetcher});const {session}=await start.json();assert.ok(session);assert.doesNotMatch(session,/googleapis|access/);
 assert.deepEqual(JSON.parse(calls[3].options.body).parents,['submission-folder']);assert.equal(JSON.parse(calls[3].options.body).name,'design.step');
 const response=await handle(new Request('https://contact.example/upload',{method:'PUT',headers:{Origin:env.SITE_ORIGIN,'CF-Connecting-IP':'192.0.2.1','X-Upload-Session':session},body:'abc'}),env,{fetcher});
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(calls.at(-1).options.body instanceof ReadableStream,true);
});
test('allows 50 MB and rejects larger files before calling Google',async()=>{
 const response=await handle(request({file:{name:'archive.zip',size:50*1024*1024}}),env,{fetcher:google()});assert.equal(response.status,200);assert.ok((await response.json()).session);
 const denied=await handle(request({file:{name:'archive.zip',size:50*1024*1024+1}}),env,{fetcher:()=>assert.fail('Google must not be called')});assert.equal(denied.status,400);
});
test('rejects forged, wrong-IP, expired, and oversized streaming sessions',async()=>{
 const fetcher=google(),start=await handle(request({file:{name:'anything',size:3}}),env,{fetcher,now:()=>10000});const {session}=await start.json();
 for(const [value,ip,body,time] of [[session+'x','192.0.2.1','abc',10000],[session,'192.0.2.2','abc',10000],[session,'192.0.2.1','abc',4000000],[session,'192.0.2.1','abcd',10000]]){
  const response=await handle(new Request('https://contact.example/upload',{method:'PUT',headers:{Origin:env.SITE_ORIGIN,'CF-Connecting-IP':ip,'X-Upload-Session':value},body}),env,{fetcher,now:()=>time});assert.ok(response.status>=400);
 }
});
test('rejects abuse and unavailable setup without contacting Google',async()=>{
 const fetcher=()=>assert.fail('Google must not be called');
 for(const req of [request({},'https://evil.example'),request({website:'bot'}),request({folder:'other'}),request({message:'x'.repeat(20000)})])assert.ok((await handle(req,env,{fetcher})).status>=400);
 assert.equal((await handle(request(),{...env,GOOGLE_REFRESH_TOKEN:''},{fetcher})).status,503);
 assert.equal((await handle(request(),{...env,UPLOAD_LIMITER:{limit:async()=>({success:false})}},{fetcher})).status,429);
});
test('provider failure does not report success or expose credentials',async()=>{
 const response=await handle(request(),env,{fetcher:async()=>new Response('secret provider error',{status:401})});assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/secret|refresh/);
});
test('form is optional, unrestricted, and uses a secure endpoint',()=>{
 assert.equal(contactUpload('',escape),'');assert.throws(()=>contactUpload('http://example.com',escape));const html=contactUpload('https://example.com/upload',escape);
 assert.match(html,/50 MB/);assert.doesNotMatch(html,/required|accept=|Share your résumé/);
});
