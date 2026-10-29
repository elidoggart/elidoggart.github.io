/* SPDX-License-Identifier: GPL-3.0-or-later */
import {Voice,clamp} from './dsp.js';
class Instrument extends AudioWorkletProcessor {
 constructor(){super();this.voices=new Map();this.held=new Map();this.cfg={engine:'fm',knobs:[.18,.4,.2,.1],adsr:[.006,.3,.65,.25],effect:[.45,.2,.15,.5],levels:[.8,.8,.8,.8],mute:[false,false,false,false],volume:.65,track:0,bpm:100,bars:2,speed:1,arp:false,metro:false};this.tracks=Array.from({length:4},()=>new Float32Array(sampleRate*60));this.pos=0;this.running=false;this.recording=false;this.frames=0;this.step=0;this.untilStep=0;this.undo=null;this.delay=new Float32Array(sampleRate*2);this.delayPos=0;this.filter=0;this.peak=0;this.sample=null;this.port.onmessage=e=>this.message(e.data);}
 get length(){return Math.min(this.tracks[0].length,Math.round(this.cfg.bars*4*60/this.cfg.bpm*sampleRate));}
 snapshot(){this.undo={track:this.cfg.track,data:this.tracks[this.cfg.track].slice()};}
 message(m){
  if(m.type==='config'){const oldArp=this.cfg.arp;Object.assign(this.cfg,m.value);if(oldArp!==this.cfg.arp)this.panic();this.pos%=this.length;}
  if(m.type==='on'){this.held.set(m.id,m.note);if(!this.cfg.arp)this.add(m.id,m.note);}
  if(m.type==='off'){this.held.delete(m.id);this.voices.get(m.id)?.release();if(this.cfg.arp&&!this.held.size)for(const v of this.voices.values())v.release();}
  if(m.type==='panic')this.panic();
  if(m.type==='play'){if(!this.running&&this.pos===0){this.step=0;this.untilStep=0;}this.running=!this.running;if(!this.running){this.recording=false;this.panic();}}
  if(m.type==='record'){if(!this.running&&this.pos===0){this.step=0;this.untilStep=0;}if(!this.recording)this.snapshot();this.recording=!this.recording;if(this.recording)this.running=true;}
  if(m.type==='stop'){this.running=false;this.recording=false;this.pos=0;this.untilStep=0;this.step=0;this.panic();}
  if(m.type==='clear'){this.recording=false;this.snapshot();this.tracks[this.cfg.track].fill(0);}
  if(m.type==='undo'&&this.undo){this.recording=false;const t=this.undo.track,previous=this.tracks[t];this.tracks[t]=this.undo.data;this.undo={track:t,data:previous};}
  if(m.type==='sample')this.sample=m.samples;
  if(m.type==='export'){this.port.postMessage({type:'export',rate:sampleRate,tracks:this.tracks.map(t=>t.slice(0,this.length)),levels:this.cfg.levels.map((v,i)=>this.cfg.mute[i]?0:v)});}
 }
 add(id,note){if(this.voices.has(id))this.voices.get(id).release();if(this.voices.size>=6)this.voices.delete(this.voices.keys().next().value);this.voices.set(id,new Voice(id,note,this.cfg.engine,sampleRate));}
 panic(){this.held.clear();for(const v of this.voices.values())v.release();}
 process(inputs,outputs){const out=outputs[0][0];if(!out)return true;const c=this.cfg,len=this.length,trackPeaks=[0,0,0,0];
  for(let i=0;i<out.length;i++){
   const beat=60/c.bpm*sampleRate;
   if(--this.untilStep<=0){this.untilStep+=beat/4;this.step++;
    if(c.arp&&this.held.size){for(const v of this.voices.values())v.release();const notes=[...this.held.values()].sort((a,b)=>a-b);this.add('arp-'+this.step,notes[(this.step-1)%notes.length]);}
    if(c.metro&&this.running&&this.step%4===1)this.click=sampleRate*.025;
   }
   let live=0;for(const [id,v] of this.voices){live+=v.tick(c.knobs,c.adsr,this.sample);if(v.done)this.voices.delete(id);}
   const cutoff=180*2**(c.effect[3]*6),alpha=1-Math.exp(-2*Math.PI*cutoff/sampleRate);this.filter+=(live-this.filter)*alpha;live=this.filter;
   const delayFrames=Math.floor((.08+c.effect[0]*.55)*sampleRate),tap=this.delay[(this.delayPos-delayFrames+this.delay.length)%this.delay.length];this.delay[this.delayPos]=clamp(live+tap*c.effect[1]*.8,-2,2);this.delayPos=(this.delayPos+1)%this.delay.length;live=live*(1-c.effect[2]*.5)+tap*c.effect[2];
   let mix=live*.65;
   if(this.running){const p=Math.floor(this.pos);if(this.recording)this.tracks[c.track][p]=clamp(this.tracks[c.track][p]+live*.65,-1,1);
    for(let t=0;t<4;t++){const v=this.tracks[t][p]*(c.mute[t]?0:c.levels[t]);trackPeaks[t]=Math.max(trackPeaks[t],Math.abs(v));if(!(this.recording&&t===c.track))mix+=v;else mix+=v-live*.65;}
    this.pos=(this.pos+c.speed+len)%len;
   }
   if(this.click>0){mix+=Math.sin(this.click*.18)*.06*(this.click/(sampleRate*.025));this.click--;}
   out[i]=Math.tanh(mix*c.volume);this.peak=Math.max(this.peak,Math.abs(out[i]));
  }
  if((this.frames+=out.length)>=sampleRate/20){this.frames=0;this.port.postMessage({type:'state',position:this.pos/len,running:this.running,recording:this.recording,voices:this.voices.size,peak:this.peak,trackPeaks,undo:!!this.undo});this.peak=0;}
  return true;
 }
}
registerProcessor('arcade-instrument',Instrument);
