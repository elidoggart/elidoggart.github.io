import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

test('preview streams full files, HEAD and Safari media ranges without escaping its root',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-preview-test-'));
 await fs.mkdir(path.join(directory,'dist'));
 await fs.writeFile(path.join(directory,'dist','sample.mp4'),'0123456789');
 await fs.writeFile(path.join(directory,'outside.txt'),'not served');
 await fs.symlink('../outside.txt',path.join(directory,'dist','outside.txt'));
 const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/serve.mjs',import.meta.url))],{cwd:directory,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 try{
  const url=await new Promise((resolve,reject)=>{
   let output='',errors='';const timer=setTimeout(()=>reject(Error('Preview failed to start: '+errors)),5000);
   child.stderr.on('data',chunk=>errors+=chunk);
   child.on('exit',code=>{clearTimeout(timer);reject(Error('Preview exited '+code+': '+errors));});
   child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
  });
  const full=await fetch(url+'/sample.mp4');assert.equal(full.status,200);assert.equal(full.headers.get('content-length'),'10');assert.equal(await full.text(),'0123456789');
  const head=await fetch(url+'/sample.mp4',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'10');assert.equal(await head.text(),'');
  const conditional=await fetch(url+'/sample.mp4',{headers:{Range:'bytes=0-1','If-Range':'"old-version"'}});assert.equal(conditional.status,200);assert.equal(await conditional.text(),'0123456789');
  for(const [range,body,contentRange] of [['bytes=0-1','01','bytes 0-1/10'],['bytes=7-','789','bytes 7-9/10'],['bytes=-3','789','bytes 7-9/10']]){
   const response=await fetch(url+'/sample.mp4',{headers:{Range:range}});assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),contentRange);assert.equal(await response.text(),body);
  }
  for(const range of ['bytes=10-','bytes=5-2','bytes=-0']){const response=await fetch(url+'/sample.mp4',{headers:{Range:range}});assert.equal(response.status,416);assert.equal(response.headers.get('content-range'),'bytes */10');}
  assert.equal((await fetch(url+'/outside.txt')).status,404);
  assert.equal((await fetch(url+'/sample.mp4',{method:'POST'})).status,405);
 }finally{if(child.exitCode===null){const stopped=once(child,'exit');child.kill();await stopped;}await fs.rm(directory,{recursive:true,force:true});}
});
