import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

test('original Doom boots, renders wireframe frames, and responds to movement',async()=>{
 const runtime=fileURLToPath(new URL('../doom-runtime.js',import.meta.url));
 const dir=path.dirname(runtime);let timer,frames=0,before,after;
 const timers=new Set();
 const schedule=(fn,ms)=>{const t=setTimeout(()=>{timers.delete(t);fn()},ms);timers.add(t);return t};
 await new Promise((resolve,reject)=>{
  timer=setTimeout(()=>reject(Error('Doom did not produce playable frames')),10000);
  const Module={wasmBinary:readFileSync(path.join(dir,'doom-runtime.wasm')),print(){},printErr(){},
   onAbort:reject,playSound(){},soundPlaying(){return false},registerMusic(){},startMusic(){},stopMusic(){},persistSaves(){},updateHUD(){},
   renderFrame(ptr){try{frames++;const data=Module.HEAPU8.slice(ptr,ptr+320*168*4);if(frames===20){before=data;Module._doom_key(173,1)}if(frames===55){Module._doom_key(173,0);after=data;assert.notDeepEqual(before,after,'W must move the player through the original level');const colors=new Set();for(let i=0;i<data.length;i+=4)colors.add(data.slice(i,i+4).join(','));assert(colors.has('255,255,255,255'));assert(colors.has('35,36,33,255'));assert(colors.has('199,49,54,255'));assert(colors.size<=3);resolve()}}catch(e){reject(e)}},
   onRuntimeInitialized(){try{Module.FS.writeFile('/doom1.wad',readFileSync(path.join(dir,'doom1.wad')));Module.FS.mkdir('/saves');Module.FS.writeFile('/default.cfg','screenblocks 10\ndetaillevel 0\n');Module.callMain(['-iwad','/doom1.wad','-config','/default.cfg','-warp','1','1'])}catch(e){reject(e)}}};
  const context={Module,require:createRequire(runtime),__dirname:dir,module:{exports:{}},console,process,performance,WebAssembly,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,setTimeout:schedule,clearTimeout,setInterval,clearInterval};
  try{vm.runInNewContext(readFileSync(runtime,'utf8'),context,{filename:runtime})}catch(e){reject(e)}
 }).finally(()=>{clearTimeout(timer);for(const t of timers)clearTimeout(t)});
});
