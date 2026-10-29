import test from 'node:test';
import assert from 'node:assert/strict';
import {Voice,frequency,wavBytes} from '../instrument/dsp.js';
const rate=44100;
test('pitch is A440 and octave spacing is exact',()=>{assert.equal(frequency(69),440);assert.equal(frequency(81),880);});
for(const engine of ['fm','saw','tone','drum','sample'])test(`${engine}: audible finite output and note-off settles`,()=>{
 const v=new Voice('test',60,engine,rate),sample=Float32Array.from({length:rate},(_,i)=>Math.sin(i*.04)),k=[.3,.4,.2,.1],adsr=[.005,.1,.8,.02];let power=0;
 for(let i=0;i<rate/4;i++){const s=v.tick(k,adsr,sample);assert.ok(Number.isFinite(s));assert.ok(Math.abs(s)<2);power+=s*s;}
 assert.ok(power>1);v.release();for(let i=0;i<rate;i++)v.tick(k,adsr,sample);assert.ok(v.done);
});
test('WAV mix honors levels, clipping and header',()=>{const b=wavBytes([new Float32Array([1,-1,.5]),new Float32Array([1,-1,.5])],[1,1],rate),v=new DataView(b);assert.equal(v.getUint32(24,true),rate);assert.equal(v.getUint32(40,true),6);assert.equal(v.getInt16(44,true),32767);assert.equal(v.getInt16(46,true),-32767);assert.equal(new DataView(wavBytes([new Float32Array([1])],[0],rate)).getInt16(44,true),0);});
let Processor;
globalThis.sampleRate=rate;globalThis.AudioWorkletProcessor=class{constructor(){this.messages=[];this.port={postMessage:m=>this.messages.push(m)};}};globalThis.registerProcessor=(name,ctor)=>Processor=ctor;
await import('../instrument/processor.js');
function render(p,blocks=10){let energy=0;for(let b=0;b<blocks;b++){const a=new Float32Array(128);p.process([],[[a]]);for(const s of a){assert.ok(Number.isFinite(s));energy+=s*s;}}return energy;}
test('tape records audio, plays independently, exports muted mix, and undoes erase',()=>{const p=new Processor();p.message({type:'record'});p.message({type:'on',id:'a',note:60});assert.ok(render(p,100)>0);p.message({type:'off',id:'a'});p.message({type:'stop'});assert.ok(p.tracks[0].some(x=>x!==0));p.voices.clear();p.delay.fill(0);p.filter=0;p.message({type:'play'});assert.ok(render(p,100)>0);p.message({type:'stop'});p.message({type:'clear'});assert.ok(p.tracks[0].every(x=>x===0));p.message({type:'undo'});assert.ok(p.tracks[0].some(x=>x!==0));p.message({type:'export'});const m=p.messages.at(-1);assert.equal(m.type,'export');assert.equal(m.tracks[0].length,p.length);p.message({type:'config',value:{mute:[true,true,true,true]}});p.message({type:'export'});assert.deepEqual(p.messages.at(-1).levels,[0,0,0,0]);});
test('changing arpeggiator clears held voices and six-voice cap holds',()=>{const p=new Processor();for(let i=0;i<10;i++)p.message({type:'on',id:String(i),note:60+i});assert.equal(p.voices.size,6);p.message({type:'config',value:{arp:true}});assert.equal(p.held.size,0);assert.ok([...p.voices.values()].every(v=>v.released));});
test('reverse tape wraps within bounds',()=>{const p=new Processor();p.message({type:'config',value:{speed:-1}});p.message({type:'play'});render(p,1);assert.equal(p.pos,p.length-128);});
test('arpeggiator releases its generated voice when the final key is lifted',()=>{const p=new Processor();p.message({type:'config',value:{arp:true}});p.message({type:'on',id:'key',note:60});render(p,2);assert.ok(p.voices.size>0);p.message({type:'off',id:'key'});assert.ok([...p.voices.values()].every(v=>v.released));});
test('finished sample voices decay and leave the pool even when held',()=>{const v=new Voice('sample',60,'sample',rate);for(let i=0;i<rate;i++)v.tick([1/3,0,0,0],[.003,.1,1,.01],new Float32Array([.5,.4,.2]));assert.ok(v.done);});
test('lift and drop move actual audio between tracks and retain undo',()=>{const p=new Processor();p.tracks[0][100]=.4;p.message({type:'lift'});assert.equal(p.tracks[0][100],0);p.message({type:'config',value:{track:1}});p.message({type:'drop'});assert.ok(Math.abs(p.tracks[1][100]-.4)<.0001);p.message({type:'undo'});assert.equal(p.tracks[1][100],0);});
