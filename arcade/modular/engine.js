import {modules} from './model.js';
export class RackEngine {
 constructor(ctx){this.ctx=ctx;this.nodes={};this.voices=[];this.lfos=[];this.links=[];this.grains=new Set();this.values={};for(const m of modules)for(const k of m.knobs)this.values[`${m.id}.${k.id}`]=k.value;this.build();}
 gain(value=1){const n=this.ctx.createGain();n.gain.value=value;return n;}
 constant(value=0){const n=this.ctx.createConstantSource();n.offset.value=value;n.start();return n;}
 build(){const c=this.ctx,n=this.nodes;
 this.master=this.gain(.35);this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-9;this.limiter.ratio.value=16;this.master.connect(this.limiter);this.analyser=c.createAnalyser();this.analyser.fftSize=256;this.limiter.connect(this.analyser);this.analyser.connect(c.destination);n['hendrik.in']=this.master;
 this.pitch=this.constant();n['touch.pitch']=this.pitch;this.gate=this.constant();n['touch.gate']=this.gate;this.env=this.constant();n['contour.env']=this.env;
 this.gateMeter=c.createAnalyser();this.gateMeter.fftSize=32;n['contour.gate']=this.gateMeter;this.gateData=new Float32Array(32);
 this.random=this.constant();n['woggle.random']=this.random;this.pulse=this.constant();n['woggle.pulse']=this.pulse;
 for(let i=0;i<8;i++){const o=c.createOscillator();o.frequency.value=.3/(1+i*.73);o.start();const g=this.gain(.5);o.connect(g);n[`ochd.lfo${i+1}`]=g;this.lfos.push(o);}
 this.clutch=this.gain(.4);n['clutch.in']=n['clutch.out']=this.clutch;
 this.propust=c.createBiquadFilter();this.propust.frequency.value=3500;n['propust.in']=n['propust.out']=this.propust;
 this.pitchCV=this.gain(1200);this.fmCV=this.gain(300);n['friends.pitch']=this.pitchCV;n['friends.fm']=this.fmCV;this.mix=this.gain(.13);n['friends.mix']=this.mix;
 for(let i=0;i<6;i++){const o=c.createOscillator();o.type='triangle';this.pitchCV.connect(o.detune);this.fmCV.connect(o.detune);const g=this.gain(.3);o.connect(g);g.connect(this.mix);n[`friends.voice${i+1}`]=g;o.start();this.voices.push(o);}
 this.opto=[];this.optoMix=this.gain();n['optomix.mix']=this.optoMix;
 for(let i=1;i<=2;i++){const f=c.createBiquadFilter(),g=this.gain(.6),cv=this.gain(.6);cv.connect(g.gain);f.frequency.value=2200;f.connect(g);g.connect(this.optoMix);n[`optomix.in${i}`]=f;n[`optomix.out${i}`]=g;n[`optomix.cv${i}`]=cv;this.opto.push({f,g,cv});}
 this.morphIn=this.gain();this.morphOut=this.gain(.7);this.delay=c.createDelay(2);this.delay.delayTime.value=.16;this.wet=this.gain(.5);this.morphIn.connect(this.morphOut);this.morphIn.connect(this.delay);this.delay.connect(this.wet);this.wet.connect(this.morphOut);n['morph.in']=this.morphIn;n['morph.out']=this.morphOut;
 this.slideCV=c.createAnalyser();this.slideCV.fftSize=32;this.slideData=new Float32Array(32);n['morph.slide']=this.slideCV;
 for(const [k,v] of Object.entries(this.values))this.set(k,v);this.timer=setInterval(()=>this.tick(),20);this.nextRandom=0;this.nextGrain=0;this.lastGate=false;
 }
 set(key,value){this.values[key]=value;const v=this.values,t=this.ctx.currentTime,s=(p,x)=>p.setTargetAtTime(x,t,.015);
 if(key.startsWith('friends.'))this.voices.forEach((o,i)=>{s(o.frequency,440*2**((v['friends.pitch']-69+i*v['friends.spread']*7)/12));o.type=v['friends.shape']<.33?'sine':v['friends.shape']<.66?'triangle':'sawtooth';});
 if(key==='ochd.rate')this.lfos.forEach((o,i)=>s(o.frequency,value/(1+i*.73)));
 if(key==='clutch.gain')s(this.clutch.gain,value);if(key==='propust.cutoff')s(this.propust.frequency,value);
 if(key.startsWith('optomix.'))this.updateGates();
 if(key==='morph.size')s(this.delay.delayTime,value);if(key==='morph.morph')s(this.wet.gain,value*.7);if(key==='hendrik.volume')s(this.master.gain,value);
 }
 updateGates(){this.opto.forEach(({f,g,cv},i)=>{cv.gain.setTargetAtTime(this.values[`optomix.level${i+1}`],this.ctx.currentTime,.01);const patched=this.links.some(e=>e.b===`optomix.cv${i+1}`);g.gain.setTargetAtTime(patched?0:this.values[`optomix.level${i+1}`],this.ctx.currentTime,.01);f.frequency.setTargetAtTime(120+this.values['optomix.damp']*9000,this.ctx.currentTime,.015);});}
 patch(cables){for(const e of this.links){try{e.source.disconnect(e.target);}catch{}}this.links=[];for(const [a,b] of cables){const source=this.nodes[a],target=this.nodes[b];source.connect(target);this.links.push({a,b,source,target});}this.updateGates();}
 note(semitones){const t=this.ctx.currentTime;this.pitch.offset.setValueAtTime(semitones/12,t);this.gate.offset.cancelScheduledValues(t);this.gate.offset.setValueAtTime(1,t);this.gate.offset.setValueAtTime(0,t+.08);}
 envelope(){const t=this.ctx.currentTime,v=this.values,p=this.env.offset;p.cancelScheduledValues(t);p.setValueAtTime(0,t);p.linearRampToValueAtTime(1,t+v['contour.attack']);p.linearRampToValueAtTime(v['contour.sustain'],t+v['contour.attack']+v['contour.decay']*.65);p.linearRampToValueAtTime(0,t+v['contour.attack']+v['contour.decay']);}
 tick(){if(this.ctx.state!=='running')return;const t=this.ctx.currentTime,v=this.values;this.gateMeter.getFloatTimeDomainData(this.gateData);const high=this.gateData.some(x=>x>.5);if(high&&!this.lastGate)this.envelope();this.lastGate=high;
 if(t>=this.nextRandom){this.nextRandom=t+1/v['woggle.rate'];this.random.offset.setTargetAtTime((Math.random()*2-1)*v['woggle.depth'],t,.02);this.pulse.offset.setValueAtTime(1,t);this.pulse.offset.setValueAtTime(0,t+.07);}
 if(this.buffer&&t>=this.nextGrain){const size=v['morph.size'];this.nextGrain=t+size*(1-v['morph.morph']*.75);this.slideCV.getFloatTimeDomainData(this.slideData);const offset=Math.max(0,Math.min(1,v['morph.slide']+this.slideData[0]*.2))*Math.max(0,this.buffer.duration-size*2);const source=this.ctx.createBufferSource(),g=this.gain(0);source.buffer=this.buffer;source.playbackRate.value=v['morph.speed'];source.connect(g);g.connect(this.morphOut);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+size*.3);g.gain.linearRampToValueAtTime(0,t+size);source.start(t,offset);source.stop(t+size);this.grains.add(source);source.onended=()=>{source.disconnect();g.disconnect();this.grains.delete(source);};}
 }
 async loadSample(bytes){this.buffer=await this.ctx.decodeAudioData(bytes);this.nextGrain=0;}
 async close(){clearInterval(this.timer);await this.ctx.close();}
}
