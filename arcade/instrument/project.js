/* SPDX-License-Identifier: GPL-3.0-or-later */
import {Voice,clamp} from './dsp.js';
import {Effect,Modulator,effectDefaults,lfos,shapes} from './modules.js';
const finite=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
export function encodePCM(audio){const bytes=new Uint8Array(audio.length*2),view=new DataView(bytes.buffer);for(let i=0;i<audio.length;i++)view.setInt16(i*2,Math.round(clamp(audio[i],-1,1)*32767),true);let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
export function decodePCM(text,maxFrames=44100*360){if(typeof text!=='string'||text.length>maxFrames*8/3+4)throw Error('Audio exceeds the tape limit');const bytes=atob(text);if(bytes.length%2)throw Error('Invalid PCM audio');const a=new Float32Array(bytes.length/2);for(let i=0;i<a.length;i++){let n=bytes.charCodeAt(i*2)|bytes.charCodeAt(i*2+1)<<8;if(n>=32768)n-=65536;a[i]=n/32767;}return a;}
export function resample(audio,from,to){if(from===to)return audio;const out=new Float32Array(Math.round(audio.length*to/from));for(let i=0;i<out.length;i++){const p=i*from/to,n=Math.floor(p);out[i]=(audio[n]||0)+((audio[n+1]??audio[n]??0)-(audio[n]||0))*(p-n);}return out;}
function four(a,min,max){return Array.isArray(a)&&a.length===4&&a.every(v=>finite(v,min,max));}
export function performancePatch(p){return {sampleOptions:{reverse:false,gain:1,root:60,...p.sampleOptions},engine:p.engine,knobs:[...p.knobs],adsr:[...p.adsr],effectType:p.effectType||'delay',effect:[...(p.effect||effectDefaults.delay)],effectOn:p.effectOn===true,lfoType:p.lfoType||'tremolo',lfo:[...(p.lfo||[.4,0,0,.5])],lfoShape:p.lfoShape||'sine',lfoOn:p.lfoOn===true,lfoSync:p.lfoSync===true,lfoFree:p.lfoFree===true,playMode:'poly',portamento:0,recordLevel:p.recordLevel??.65};}
export function validatePerformance(p){
 if(p?.format!=='arcade-performance-1'||!finite(p.bpm,40,220)||!Number.isInteger(p.bars)||p.bars<1||p.bars*240/p.bpm>360||!Array.isArray(p.tracks)||p.tracks.length!==4)throw Error('Choose a valid four-track performance project');
 if(!p.patches||Object.keys(p.patches).length>16)throw Error('Invalid sound patches');
 for(const patch of Object.values(p.patches)){if(!['fm','saw','tone','drum','sample'].includes(patch.engine)||!four(patch.knobs,0,1)||!four(patch.adsr,0,3)||patch.adsr[2]>1||patch.effectType&&!effectDefaults[patch.effectType]||patch.effect&&!four(patch.effect,0,1)||patch.recordLevel!==undefined&&!finite(patch.recordLevel,0,1))throw Error('Invalid patch parameters');if(patch.lfo&&!four(patch.lfo,0,1)||patch.lfoType&&!lfos[patch.lfoType]||patch.lfoShape&&!shapes.includes(patch.lfoShape))throw Error('Invalid modulation parameters');if(patch.engine==='sample'&&!p.samples?.[patch.sampleId])throw Error('Missing sampler audio');if(patch.sampleOptions&&(patch.sampleOptions.root!==undefined&&!finite(patch.sampleOptions.root,0,127)||patch.sampleOptions.gain!==undefined&&!finite(patch.sampleOptions.gain,0,2)))throw Error('Invalid sampler parameters');}
 for(const s of Object.values(p.samples||{}))if(!finite(s.rate,8000,96000)||typeof s.pcm16!=='string'||s.pcm16.length>s.rate*6*8/3+4)throw Error('Sampler audio must be at most six seconds');
 for(const t of p.tracks){if(t.level!==undefined&&!finite(t.level,0,1)||t.pan!==undefined&&!finite(t.pan,-1,1))throw Error('Invalid track mix');if(!Array.isArray(t.events)||t.events.length>20000)throw Error('Too many note events');for(const e of t.events)if(!Object.hasOwn(p.patches,e.patch)||!finite(e.beat,0,p.bars*4)||!finite(e.beats,.001,p.bars*4)||!finite(e.note,0,127)||!finite(e.velocity??1,0,1))throw Error('Invalid note event');}
 if(p.sections&&(!Array.isArray(p.sections)||p.sections.length>256||p.sections.some(s=>!finite(s.bar,0,p.bars-1)||!finite(s.bars,1,p.bars))))throw Error('Invalid song sections');
 return p;
}
// Prints the same Voice + Effect signal chain used by the live instrument onto
// four independent mono tracks. No recording of the reference mix is used.
export async function renderPerformance(project,rate=44100,progress=()=>{}){
 const p=validatePerformance(project),samples={};for(const [id,s] of Object.entries(p.samples||{}))samples[id]=resample(decodePCM(s.pcm16,s.rate*6),s.rate,rate);
 const frames=Math.round(p.bars*240/p.bpm*rate),beat=60/p.bpm*rate,tracks=[];
 for(let t=0;t<4;t++){
  const audio=new Float32Array(frames),groups=new Map();for(const event of p.tracks[t].events){if(!groups.has(event.patch))groups.set(event.patch,[]);groups.get(event.patch).push(event);}
  for(const [id,events] of groups){const patch={...performancePatch(p.patches[id]),sampleId:p.patches[id].sampleId,bpm:p.bpm},fx=new Effect(rate);events.sort((a,b)=>a.beat-b.beat);let ei=0,serial=0,voices=[],seed=(p.seed||42)+t;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const modulator=new Modulator(rate,random);
   const start=Math.floor(events[0].beat*beat),end=Math.min(frames,Math.ceil(Math.max(...events.map(e=>(e.beat+e.beats)*beat))+rate*Math.max(3,patch.adsr[3]*10)));
   for(let n=start;n<end;n++){
    while(ei<events.length&&Math.round(events[ei].beat*beat)<=n){const e=events[ei++],v=new Voice(String(serial++),e.note,patch.engine,rate,e.velocity??1);v.random=random;v.end=Math.round((e.beat+e.beats)*beat);if(voices.length>=6)voices.shift();voices.push(v);modulator.trigger(patch.lfoFree);}
    const mod=modulator.tick(patch);let x=0;for(const v of voices){if(n>=v.end)v.release();v.pitchOffset=mod.pitch;x+=v.tick(mod.knobs,mod.adsr,samples[patch.sampleId],patch.sampleOptions);}voices=voices.filter(v=>!v.done);
    audio[n]+=fx.tick(x*mod.gain,patch.effectType,mod.effect,patch.effectOn)*(patch.recordLevel??.65);
    if(n%65536===0){progress(t,n/frames);await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};channel.port2.postMessage(0);});}
   }
  }
  for(let i=0;i<frames;i++)audio[i]=clamp(audio[i],-1,1);tracks.push(audio);progress(t,1);
 }
 return {tracks,samples,takes:p.tracks.map(t=>{const bars=new Set(t.events.map(e=>Math.floor(e.beat/4)));return [...bars].sort((a,b)=>a-b).map(bar=>({start:Math.round(bar*4*beat),end:Math.min(frames,Math.round((bar+1)*4*beat))}));}),loopIn:0,loopOut:frames/rate,loop:true};
}
