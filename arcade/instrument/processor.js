/* SPDX-License-Identifier: GPL-3.0-or-later */
import {Voice,clamp} from './dsp.js';
import {Tape} from './tape.js';
import {Sequencer,sequenceDefaults} from './sequencer.js';
import {Mixer} from './mixer.js';
class Instrument extends AudioWorkletProcessor {
 constructor(){super();this.voices=new Map();this.held=new Map();this.cfg={engine:'fm',knobs:[.18,.4,.2,.1],adsr:[.006,.3,.65,.25],effect:[.45,.2,.15,.5],effectOn:true,lfo:[.2,0,0,0],lfoOn:false,levels:[.8,.8,.8,.8],pans:[0,0,0,0],mute:[false,false,false,false],volume:.65,recordLevel:.65,track:0,bpm:100,bars:2,speed:1,metro:false,seq:sequenceDefaults(),eq:[.5,.5,.5,0],masterfx:[.3,.2,0,.5],masterfxOn:false,master:[1,1,0,.3]};this.tape=new Tape(sampleRate);this.seq=new Sequencer(sampleRate);this.mixer=new Mixer(sampleRate);this.pos=0;this.loopIn=0;this.loopOut=sampleRate*4.8;this.loop=true;this.running=false;this.recording=false;this.armed=false;this.frames=0;this.clock=0;this.seqSerial=0;this.delay=new Float32Array(sampleRate*2);this.delayPos=0;this.filter=0;this.peak=0;this.sample=null;this.segment=null;this.brake=false;this.chop=false;this.port.onmessage=e=>this.message(e.data);}
 get length(){return this.loopOut-this.loopIn;}
 finishTake(){if(this.segment){this.tape.take(this.segment.track,this.segment.start,this.segment.end);this.segment=null;}}
 beginRecording(){if(!this.recording){this.tape.snapshot();this.recording=true;}this.armed=false;}
 stop(){this.finishTake();this.running=false;this.recording=false;this.armed=false;this.panic();}
 seek(position){this.finishTake();this.pos=clamp(Math.round(position),0,this.tape.length-1);this.seq.reset();this.clock=0;}
 message(m){const c=this.cfg;
  if(m.type==='config'){const oldSeq=c.seq.enabled,oldEngine=c.engine;Object.assign(c,m.value);if(oldSeq!==c.seq.enabled||oldEngine!==c.engine)this.panic();}
  if(m.type==='loop-bars'){this.loopOut=Math.min(this.tape.length,this.loopIn+Math.round(c.bars*4*60/c.bpm*sampleRate));this.loop=true;}
  if(m.type==='on'||m.type==='audition'){
   if(this.armed&&!this.running){this.running=true;this.beginRecording();this.clock=0;this.seq.reset();}
   this.held.set(m.id,m.note);if(c.seq.enabled&&m.type!=='audition'){this.seq.trigger(m.note);}else this.add(m.id,m.note);
  }
  if(m.type==='off'){this.held.delete(m.id);this.voices.get(m.id)?.release();if(c.seq.enabled&&!this.held.size&&!c.seq.hold){this.seq.reset();this.releaseSequence();}}
  if(m.type==='panic')this.panic();
  if(m.type==='play'){if(this.running){this.finishTake();this.running=false;this.recording=false;}else{this.running=true;this.clock=0;if(this.armed)this.beginRecording();}}
  if(m.type==='record'){if(this.running){if(this.recording){this.finishTake();this.recording=false;}else this.beginRecording();}else this.armed=!this.armed;}
  if(m.type==='stop')this.stop();
  if(m.type==='seek')this.seek(m.position*sampleRate);
  if(m.type==='rewind')this.seek(m.end?this.tape.end:0);
  if(m.type==='move'){const bar=4*60/c.bpm*sampleRate,amount=m.bars?bar:sampleRate*.5;if(this.running&&m.bars&&this.loop){const delta=clamp(this.loopIn+m.delta*amount,0,this.tape.length-this.length)-this.loopIn;this.loopIn+=delta;this.loopOut+=delta;this.pos+=delta;}else this.seek(this.pos+m.delta*amount);}
  if(m.type==='loop-in'){this.loopIn=Math.min(Math.round(this.pos),this.loopOut-1);}
  if(m.type==='loop-out'){this.loopOut=Math.max(this.loopIn+1,Math.round(this.pos));}
  if(m.type==='loop-toggle'){this.loop=!this.loop;}
  if(m.type==='loop-take'){const take=this.tape.selected(c.track,this.pos);if(take){this.loopIn=take.start;this.loopOut=take.end;this.loop=true;}}
  if(m.type==='clear'){this.stop();this.tape.snapshot();if(m.all)for(let t=0;t<4;t++)this.tape.clear(t);else this.tape.clear(c.track);}
  if(m.type==='lift'){this.stop();const start=this.tape.lift(c.track,this.pos,m.all,m.region?{start:this.loopIn,end:this.loopOut}:null);if(start!==null)this.seek(start);}
  if(m.type==='drop'){this.stop();this.seek(this.tape.drop(c.track,this.pos));}
  if(m.type==='split'){this.finishTake();if(m.join)this.tape.join(c.track,this.pos);else this.tape.split(c.track,this.pos);}
  if(m.type==='undo'){this.stop();this.tape.swapUndo();}
  if(m.type==='sample')this.sample=m.samples;
  if(m.type==='resample'&&this.tape.clipboard){const clip=this.tape.clipboard,limit=Math.min(clip.length,sampleRate*6);this.sample=new Float32Array(limit);for(const a of clip.audio)for(let i=0;i<limit;i++)this.sample[i]+=a[i]/clip.audio.length;this.port.postMessage({type:'sample-ready',seconds:limit/sampleRate});}
  if(m.type==='trick'){if(m.name==='reverse')c.speed=-c.speed;if(m.name==='brake')this.brake=m.active;if(m.name==='chop')this.chop=m.active;}
  if(m.type==='export'){this.finishTake();const start=this.loop?this.loopIn:0,end=this.loop?this.loopOut:Math.max(1,this.tape.end);this.port.postMessage({type:'export',rate:sampleRate,tracks:this.tape.tracks.map((_,i)=>this.tape.slice(i,start,end)),levels:c.levels.map((v,i)=>c.mute[i]?0:v),pans:c.pans,config:{eq:c.eq,masterfx:c.masterfx,masterfxOn:c.masterfxOn,master:c.master},takes:this.tape.takes});}
 }
 add(id,note,gateFrames=Infinity){if(this.voices.size>=6)this.voices.delete(this.voices.keys().next().value);const voice=new Voice(id,note,this.cfg.engine,sampleRate);voice.gateFrames=gateFrames;this.voices.set(id,voice);}
 releaseSequence(){for(const [id,v] of this.voices)if(id.startsWith('seq-'))v.release();}
 panic(){this.held.clear();this.seq.reset();for(const v of this.voices.values())v.release();}
 process(inputs,outputs){const left=outputs[0][0],right=outputs[0][1];if(!left)return true;const c=this.cfg,trackPeaks=[0,0,0,0];
  for(let i=0;i<left.length;i++){
   const beat=60/c.bpm*sampleRate;
   const event=this.seq.tick(c.seq,c.bpm,this.held.size);
   if(event){if(!event.tie)this.releaseSequence();let notes=event.notes;if(c.seq.type==='arp'){const sorted=[...this.held.values()].sort((a,b)=>a-b);notes=sorted.length?[sorted[event.index%sorted.length]]:[];}const gate=event.sustain?Infinity:event.frames*event.gate;if(event.tie){for(const [id,v] of this.voices)if(id.startsWith('seq-'))v.gateFrames=gate;}else for(const note of notes)this.add('seq-'+this.seqSerial++,note,gate);}
   if(c.metro&&this.running&&this.clock%Math.round(beat)===0)this.click=sampleRate*.025;
   const lfo=Math.sin(this.clock/sampleRate*2*Math.PI*(.1+c.lfo[0]*15));let live=0;
   for(const [id,v] of this.voices){if(--v.gateFrames<=0)v.release();v.pitchOffset=c.lfoOn?lfo*c.lfo[1]*2:0;live+=v.tick(c.knobs,c.adsr,this.sample);if(v.done)this.voices.delete(id);}
   if(c.lfoOn)live*=1-c.lfo[2]*(lfo+1)/2;
   const cutoff=180*2**(c.effect[3]*6),alpha=1-Math.exp(-2*Math.PI*cutoff/sampleRate);this.filter+=(live-this.filter)*alpha;
   const tap=this.delay[(this.delayPos-Math.floor((.08+c.effect[0]*.55)*sampleRate)+this.delay.length)%this.delay.length];this.delay[this.delayPos]=clamp(this.filter+tap*c.effect[1]*.8,-2,2);this.delayPos=(this.delayPos+1)%this.delay.length;if(c.effectOn)live=this.filter*(1-c.effect[2]*.5)+tap*c.effect[2];
   const monitor=live*c.recordLevel,stereo=[monitor*.7071,monitor*.7071];
   if(this.running){let readPos=this.pos;if(this.chop){const cell=beat/4;readPos=this.loopIn+((this.pos-this.loopIn)%cell+cell)%cell;}
    for(let t=0;t<4;t++){const v=this.brake?0:this.tape.read(t,readPos)*(c.mute[t]?0:c.levels[t]);trackPeaks[t]=Math.max(trackPeaks[t],Math.abs(v));stereo[0]+=v*Math.cos((c.pans[t]+1)*Math.PI/4);stereo[1]+=v*Math.sin((c.pans[t]+1)*Math.PI/4);}
    if(this.recording&&!this.brake){const speed=c.speed,amount=Math.abs(speed);for(let n=0;n<Math.max(1,Math.ceil(amount));n++){const p=Math.floor(this.pos+Math.sign(speed)*n);this.tape.add(c.track,p,monitor*Math.min(1,amount));}const a=Math.floor(this.pos),b=Math.ceil(this.pos+Math.max(1,amount));if(!this.segment)this.segment={track:c.track,start:a,end:b};else{this.segment.start=Math.min(this.segment.start,a);this.segment.end=Math.max(this.segment.end,b);}}
    const next=this.pos+c.speed;
    if(this.loop&&(next>=this.loopOut||next<this.loopIn)){this.finishTake();this.pos=this.loopIn+((next-this.loopIn)%this.length+this.length)%this.length;}
    else if(next<0||next>=this.tape.length){this.stop();this.pos=clamp(next,0,this.tape.length-1);}else this.pos=next;
   }
   if(this.click>0){const click=Math.sin(this.click*.18)*.06*(this.click/(sampleRate*.025));stereo[0]+=click;stereo[1]+=click;this.click--;}
   const output=this.mixer.tick(stereo,c);left[i]=output[0]*c.volume;if(right)right[i]=output[1]*c.volume;this.peak=Math.max(this.peak,Math.abs(left[i]),Math.abs(right?.[i]||0));this.clock++;
  }
  if((this.frames+=left.length)>=sampleRate/20){this.frames=0;this.port.postMessage({type:'state',position:this.pos/this.tape.length,seconds:this.pos/sampleRate,loopIn:this.loopIn/sampleRate,loopOut:this.loopOut/sampleRate,loop:this.loop,running:this.running,recording:this.recording,armed:this.armed,voices:this.voices.size,peak:this.peak,trackPeaks,undo:!!this.tape.undo,takes:this.tape.takes.map((takes,t)=>[...takes,...(this.segment?.track===t?[this.segment]:[])].map(t=>({start:t.start/sampleRate,end:t.end/sampleRate}))),seqStep:this.seq.index,seqPlaying:this.seq.playing});this.peak=0;}
  return true;
 }
}
registerProcessor('arcade-instrument',Instrument);
