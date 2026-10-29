/* SPDX-License-Identifier: GPL-3.0-or-later */
import {Voice,clamp} from './dsp.js';
import {Album} from './album.js';
import {Tape} from './tape.js';
import {Sequencer,sequenceDefaults,arpeggioNotes} from './sequencer.js';
import {Mixer} from './mixer.js';
import {Effect,Modulator} from './modules.js';
class Instrument extends AudioWorkletProcessor {
 constructor(){super();this.voices=new Map();this.held=new Map();this.cfg={engine:'fm',knobs:[.18,.4,.2,.1],adsr:[.006,.3,.65,.25],effect:[.45,.2,.15,.5],effectOn:true,lfo:[.2,0,0,0],lfoOn:false,levels:[.8,.8,.8,.8],pans:[0,0,0,0],mute:[false,false,false,false],volume:.65,recordLevel:.65,track:0,playMode:'poly',portamento:0,pitchBend:0,bpm:100,bars:2,speed:1,metro:false,seq:sequenceDefaults(),eq:[.5,.5,.5,0],masterfx:[.3,.2,0,.5],masterfxOn:false,master:[1,1,0,.3]};this.fx=new Effect(sampleRate);this.mod=new Modulator(sampleRate);this.tape=new Tape(sampleRate);this.album=new Album(sampleRate);this.inputSampling=false;this.inputSample=null;this.inputSamplePosition=0;this.inputTriggered=false;this.lastOutput=[0,0];this.seq=new Sequencer(sampleRate);this.mixer=new Mixer(sampleRate);this.pos=0;this.loopIn=0;this.loopOut=sampleRate*4.8;this.loop=true;this.running=false;this.recording=false;this.armed=false;this.frames=0;this.clock=0;this.seqSerial=0;this.delay=new Float32Array(sampleRate*2);this.delayPos=0;this.filter=0;this.peak=0;this.sample=null;this.segment=null;this.brake=false;this.chop=false;this.reverseHeld=false;this.wind=0;this.recordHeld=false;this.recordLatched=false;this.manualRecord=false;this.scrubRemaining=0;this.scrubSpeed=0;this.arpSequence=[];this.port.onmessage=e=>this.message(e.data);}
 get length(){return this.loopOut-this.loopIn;}
 finishTake(){if(this.segment){this.tape.take(this.segment.track,this.segment.start,this.segment.end);this.segment=null;}}
 beginRecording(){if(!this.recording){this.tape.snapshot();this.recording=true;}this.armed=false;}
 stop(){this.finishTake();this.running=false;this.recording=false;this.armed=false;this.recordHeld=false;this.recordLatched=false;this.manualRecord=false;this.scrubRemaining=0;this.wind=0;this.brake=false;this.chop=false;this.reverseHeld=false;this.panic();}
 seek(position){this.finishTake();this.pos=clamp(Math.round(position),0,this.tape.length-1);this.seq.reset();this.clock=0;}
 message(m){const c=this.cfg;
  if(m.type==='album'){if(m.action==='record')this.album.record();if(m.action==='play'){this.stop();this.album.play();}if(m.action==='stop')this.album.stop();if(m.action==='flip')this.album.flip();if(['stop','flip'].includes(m.action))this.port.postMessage({type:'album-backup',value:this.album.snapshot()});if(m.action==='restore')this.album.restore(m.value);if(m.action==='export'){this.album.stop();const a=this.album;this.port.postMessage({type:'album-export',channels:[a.audio.slice(a.side*2,0,a.lengths[a.side]),a.audio.slice(a.side*2+1,0,a.lengths[a.side])],rate:sampleRate,side:a.side});}}
  if(m.type==='sample-start'){this.inputSampling=true;this.inputSample=new Float32Array(sampleRate*6);this.inputSamplePosition=0;this.inputTriggered=false;}
  if(m.type==='sample-stop')this.finishSample();
  if(m.type==='config'){const oldSeq=c.seq.enabled,oldEngine=c.engine;Object.assign(c,m.value);if(oldSeq!==c.seq.enabled||oldEngine!==c.engine)this.panic();this.updateArp();}
  if(m.type==='wind')this.wind=m.delta||0;
  if(m.type==='loop-bars'){this.loopOut=Math.min(this.tape.length,this.loopIn+Math.round(c.bars*4*60/c.bpm*sampleRate));this.loop=true;}
  if(m.type==='on'||m.type==='audition'){
   if(this.armed&&!this.running){this.running=true;this.beginRecording();this.recordLatched=true;this.clock=0;this.seq.reset();}
   this.held.set(m.id,m.note);this.updateArp();if(c.seq.enabled&&m.type!=='audition'){this.seq.trigger(m.transpose===false?60:m.note);}else this.add(m.id,m.note);
  }
  if(m.type==='off'){const wasCurrent=[...this.voices.values()].some(v=>v.keyId===m.id&&!v.released);this.held.delete(m.id);this.updateArp();for(const v of this.voices.values())if((v.keyId===m.id||v.id===m.id)&&!(c.playMode==='legato'&&this.held.size))v.release();if(wasCurrent&&['mono','legato','unison'].includes(c.playMode)&&this.held.size){const [id,note]=[...this.held].at(-1);this.add(id,note);}if(c.seq.enabled&&!this.held.size&&!c.seq.hold){this.seq.reset();this.releaseSequence();}}
  if(m.type==='panic')this.panic();
  if(m.type==='play'){c.speed=(m.reverse?-1:1)*Math.abs(c.speed);this.manualRecord=false;this.running=true;if(this.armed||this.recordHeld){this.beginRecording();this.recordLatched=true;}}
  if(m.type==='record-down'){this.recordHeld=true;if(m.manual){this.manualRecord=true;this.running=true;this.beginRecording();this.recordLatched=true;}else if(this.running){this.beginRecording();this.recordLatched=false;}else this.armed=true;}
  if(m.type==='record-up'){this.recordHeld=false;this.armed=false;if(this.recording&&!this.recordLatched){this.finishTake();this.recording=false;}}
  if(m.type==='record'){if(this.running){if(this.recording){this.finishTake();this.recording=false;}else this.beginRecording();}else this.armed=!this.armed;}
  if(m.type==='stop')this.stop();
  if(m.type==='seek'){if(this.manualRecord){this.scrubRemaining=Math.round(sampleRate*.08);this.scrubSpeed=clamp((m.position*sampleRate-this.pos)/this.scrubRemaining,-8,8);}else this.seek(m.position*sampleRate);}
  if(m.type==='rewind')this.seek(m.end?this.tape.end:0);
  if(m.type==='move'){const bar=4*60/c.bpm*sampleRate,amount=m.bars?bar:sampleRate*.5;if(this.running&&m.bars&&this.loop){const delta=clamp(this.loopIn+m.delta*this.length,0,this.tape.length-this.length)-this.loopIn;this.loopIn+=delta;this.loopOut+=delta;this.pos+=delta;}else this.seek(this.pos+m.delta*amount);}
  if(m.type==='loop-in'){const length=this.length;this.loopIn=Math.round(this.pos);if(this.loopIn>=this.loopOut)this.loopOut=Math.min(this.tape.length,this.loopIn+length);}
  if(m.type==='loop-marker'){if(m.marker==='in')this.loopIn=clamp(Math.round(m.seconds*sampleRate),0,this.loopOut-1);else this.loopOut=clamp(Math.round(m.seconds*sampleRate),this.loopIn+1,this.tape.length);}
  if(m.type==='loop-out'){this.loopOut=Math.max(this.loopIn+1,Math.round(this.pos));}
  if(m.type==='loop-toggle'){this.loop=!this.loop;}
  if(m.type==='loop-take'){const take=this.tape.selected(c.track,this.pos);if(take){this.loopIn=take.start;this.loopOut=take.end;this.loop=true;}}
  if(m.type==='clear'){this.stop();this.tape.snapshot();if(m.all)for(let t=0;t<4;t++)this.tape.clear(t);else this.tape.clear(c.track);}
  if(m.type==='lift'){this.stop();const start=this.tape.lift(c.track,this.pos,m.all,m.region?{start:this.loopIn,end:this.loopOut}:null);if(start!==null)this.seek(start);}
  if(m.type==='drop'){this.stop();this.seek(this.tape.drop(c.track,this.pos));}
  if(m.type==='split'){this.finishTake();if(m.join)this.tape.join(c.track,this.pos);else this.tape.split(c.track,this.pos);}
  if(m.type==='undo'){this.stop();this.tape.swapUndo();}
  if(m.type==='slide'){this.stop();this.seek(this.tape.slide(c.track,this.pos,m.seconds*sampleRate));}
  if(m.type==='load-tape'){try{this.stop();this.tape.load(m.tracks,m.takes);this.loopIn=clamp(Math.round((m.loopIn||0)*sampleRate),0,this.tape.length-1);this.loopOut=clamp(Math.round(m.loopOut*sampleRate),this.loopIn+1,this.tape.length);this.loop=m.loop!==false;this.seek(this.loopIn);this.port.postMessage({type:'tape-loaded'});}catch(error){this.port.postMessage({type:'project-error',message:error.message});}}
  if(m.type==='save-tape'){this.finishTake();this.port.postMessage({type:'tape-backup',rate:sampleRate,tracks:this.tape.tracks.map((_,i)=>this.tape.slice(i,0,this.tape.end)),takes:this.tape.takes,loopIn:this.loopIn/sampleRate,loopOut:this.loopOut/sampleRate,loop:this.loop});}
  if(m.type==='sample')this.sample=m.samples;
  if(m.type==='resample'&&this.tape.clipboard){const clip=this.tape.clipboard,limit=Math.min(clip.length,sampleRate*6);this.sample=new Float32Array(limit);for(const a of clip.audio)for(let i=0;i<limit;i++)this.sample[i]+=a[i]/clip.audio.length;this.port.postMessage({type:'sample-ready',seconds:limit/sampleRate,samples:this.sample});}
  if(m.type==='trick'){if(m.name==='reverse')this.reverseHeld=m.active;if(m.name==='brake')this.brake=m.active;if(m.name==='chop'){if(m.active&&!this.chop){const cell=60/c.bpm*sampleRate/4;this.chopStart=Math.floor(this.pos/cell)*cell;}this.chop=m.active;}}
  if(m.type==='crank'){const event=this.seq.tick({...c.seq,direction:m.delta<0?'reverse':'forward'},c.bpm,Math.max(1,this.held.size),true);if(event)this.sequenceEvent(event);}
  if(m.type==='export'){this.finishTake();const start=this.loop?this.loopIn:0,end=this.loop?this.loopOut:Math.max(1,this.tape.end);this.port.postMessage({type:'export',rate:sampleRate,tracks:this.tape.tracks.map((_,i)=>this.tape.slice(i,start,end)),levels:c.levels.map((v,i)=>c.mute[i]?0:v),pans:c.pans,config:{eq:c.eq,masterfx:c.masterfx,masterfxOn:c.masterfxOn,masterfxType:c.masterfxType,master:c.master},takes:this.tape.takes});}
 }
 updateArp(){if(this.held.size)this.arpHeld=[...this.held.values()];else if(!this.cfg.seq.hold)this.arpHeld=[];this.arpSequence=arpeggioNotes(this.arpHeld||[],this.cfg.seq.arpMode,this.cfg.seq.arpType);}
 finishSample(){if(!this.inputSampling)return;this.inputSampling=false;if(this.inputSamplePosition){this.sample=this.inputSample.slice(0,this.inputSamplePosition);this.port.postMessage({type:'sample-ready',seconds:this.sample.length/sampleRate,samples:this.sample});}this.inputSample=null;}
 add(id,note,gateFrames=Infinity){
  const c=this.cfg,mode=c.playMode||'poly',last=[...this.voices.values()].find(v=>!v.released),legato=mode==='legato'&&last;
  if(legato){last.keyId=id;last.targetNote=note;last.gateFrames=gateFrames;return;}
  if(mode!=='poly'){for(const v of this.voices.values())v.release();this.voices.clear();}
  const count=mode==='unison'?6:1;
  for(let i=0;i<count;i++){if(this.voices.size>=6)this.voices.delete(this.voices.keys().next().value);const key=count===1?id:id+'-unison-'+i,detune=count===1?0:(i-2.5)*.035,voice=new Voice(key,note+detune,c.engine,sampleRate,count===1?1:1/3);voice.keyId=id;voice.targetNote=note+detune;if(c.portamento>0&&last)voice.note=last.note;voice.gateFrames=gateFrames;this.voices.set(key,voice);}this.mod.trigger(c.lfoFree);
 }
 sequenceEvent(event){const c=this.cfg;if(!event.tie)this.releaseSequence();let notes=event.notes;if(c.seq.type==='arp'){const noteset=this.arpSequence||[];notes=!event.muted&&noteset.length?[noteset[event.index%noteset.length]]:[];}const gate=event.sustain?Infinity:event.frames*event.gate;if(event.tie){for(const [id,v] of this.voices)if(id.startsWith('seq-'))v.gateFrames=gate;}else for(const note of notes)this.add('seq-'+this.seqSerial++,note,gate);}
 releaseSequence(){for(const [id,v] of this.voices)if(id.startsWith('seq-'))v.release();}
 panic(){this.held.clear();this.arpHeld=[];this.arpSequence=[];this.seq.reset();for(const v of this.voices.values())v.release();}
 process(inputs,outputs){const left=outputs[0][0],right=outputs[0][1];if(!left)return true;const c=this.cfg,trackPeaks=[0,0,0,0];
  for(let i=0;i<left.length;i++){
   const beat=60/c.bpm*sampleRate;
   const count=c.seq.type==='arp'?this.arpSequence.length:this.held.size;
   const event=this.seq.tick(c.seq,c.bpm,count);
   if(event)this.sequenceEvent(event);
   if(c.metro&&this.running&&this.clock%Math.round(beat)===0)this.click=sampleRate*.025;
   const mod=this.mod.tick(c);let live=0;
   for(const [id,v] of this.voices){if(--v.gateFrames<=0)v.release();if(v.targetNote!==undefined)v.note+=(v.targetNote-v.note)*(c.portamento>0?1-Math.exp(-1/(sampleRate*c.portamento*1.5)):1);v.pitchOffset=mod.pitch+(c.pitchBend||0);live+=v.tick(mod.knobs,mod.adsr,this.sample,c.sampleOptions);if(v.done)this.voices.delete(id);}
   const input=c.inputSource==='resample'?(this.lastOutput[0]+this.lastOutput[1])/2:((inputs[0]?.[0]?.[i]||0)+(inputs[0]?.[1]?.[i]??inputs[0]?.[0]?.[i]??0))/2;const incoming=input*(c.inputGain??1);
   if(this.inputSampling){if(Math.abs(incoming)>=(c.inputThreshold||0))this.inputTriggered=true;if(this.inputTriggered){this.inputSample[this.inputSamplePosition++]=incoming;if(this.inputSamplePosition>=this.inputSample.length)this.finishSample();}}
   live=this.fx.tick(live*mod.gain,c.effectType||'delay',mod.effect,c.effectOn);
   const recordSignal=(live+(c.inputEnabled?incoming:0))*c.recordLevel,monitor=(live+(c.inputEnabled&&c.inputSource!=='resample'?incoming:0))*c.recordLevel,stereo=[monitor*.7071,monitor*.7071];
   if(this.wind){this.pos=clamp(this.pos+this.wind*8,0,this.tape.length-1);}
   if(this.running&&!this.wind){const speed=this.manualRecord?(this.scrubRemaining-->0?this.scrubSpeed:0):c.speed*(this.reverseHeld?-1:1);let readPos=this.pos;if(this.chop){const cell=beat/4;readPos=this.chopStart+((this.pos-this.chopStart)%cell+cell)%cell;}
    for(let t=0;t<4;t++){const v=this.brake?0:this.tape.read(t,readPos)*(c.mute[t]?0:c.levels[t]);trackPeaks[t]=Math.max(trackPeaks[t],Math.abs(v));stereo[0]+=v*Math.cos((c.pans[t]+1)*Math.PI/4);stereo[1]+=v*Math.sin((c.pans[t]+1)*Math.PI/4);}
    if(this.recording&&!this.brake&&speed!==0){const amount=Math.abs(speed);for(let n=0;n<Math.max(1,Math.ceil(amount));n++){const p=Math.floor(this.pos+Math.sign(speed)*n);this.tape.add(c.track,p,recordSignal*Math.min(1,amount));}const a=Math.floor(this.pos),b=Math.ceil(this.pos+Math.max(1,amount));if(!this.segment)this.segment={track:c.track,start:a,end:b};else{this.segment.start=Math.min(this.segment.start,a);this.segment.end=Math.max(this.segment.end,b);}}
    const next=this.pos+(this.brake&&!this.loop?0:speed);
    if(this.loop&&(next>=this.loopOut||next<this.loopIn)){this.finishTake();this.pos=this.loopIn+((next-this.loopIn)%this.length+this.length)%this.length;}
    else if(next<0||next>=this.tape.length){this.stop();this.pos=clamp(next,0,this.tape.length-1);}else this.pos=next;
   }
   if(this.click>0){const click=Math.sin(this.click*(.04+(c.metroPitch||.5)*.35))*.06*(this.click/(sampleRate*.025));stereo[0]+=click;stereo[1]+=click;this.click--;}
   const master=this.mixer.tick(stereo,c);this.lastOutput=master;const recordingAlbum=this.album.recording,output=this.album.tick(master);if(recordingAlbum&&!this.album.recording)this.port.postMessage({type:'album-backup',value:this.album.snapshot()});left[i]=output[0]*c.volume;if(right)right[i]=output[1]*c.volume;this.peak=Math.max(this.peak,Math.abs(left[i]),Math.abs(right?.[i]||0));this.clock++;
  }
  if((this.frames+=left.length)>=sampleRate/20){this.frames=0;this.port.postMessage({type:'state',position:this.pos/this.tape.length,seconds:this.pos/sampleRate,loopIn:this.loopIn/sampleRate,loopOut:this.loopOut/sampleRate,loop:this.loop,running:this.running,recording:this.recording,armed:this.armed,voices:this.voices.size,modulation:this.mod.output.value,modulated:{knobs:this.mod.output.knobs,adsr:this.mod.output.adsr,effect:this.mod.output.effect},peak:this.peak,trackPeaks,undo:!!this.tape.undo,takes:this.tape.takes.map((takes,t)=>[...takes,...(this.segment?.track===t?[this.segment]:[])].map(t=>({start:t.start/sampleRate,end:t.end/sampleRate}))),album:{side:this.album.side,position:this.album.position/sampleRate,lengths:this.album.lengths.map(n=>n/sampleRate),recording:this.album.recording,playing:this.album.playing},manualRecord:this.manualRecord,seqStep:c.seq.type==='pattern'?(this.seq.index+(c.seq.offset||0))%16:this.seq.index,seqPlaying:this.seq.playing});this.peak=0;}
  return true;
 }
}
registerProcessor('arcade-instrument',Instrument);
