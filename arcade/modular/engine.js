import {modules,ports} from './model.js';
export class RackEngine {
 constructor(ctx){this.ctx=ctx;this.nodes={};this.voices=[];this.lfos=[];this.links=[];this.grains=new Set();this.meters={};this.values={};this.nextRandom=0;this.nextGrain=0;this.slice=0;this.grainsOn=true;for(const m of modules)for(const k of m.knobs)this.values[`${m.id}.${k.id}`]=k.value;this.build();}
 gain(value=1){const n=this.ctx.createGain();n.gain.value=value;return n;}
 constant(value=0){const n=this.ctx.createConstantSource();n.offset.value=value;n.start();return n;}
 meter(id){const n=this.ctx.createAnalyser();n.fftSize=32;this.meters[id]={node:n,data:new Float32Array(32),high:false};this.nodes[id]=n;return n;}
 read(id){const m=this.meters[id];m.node.getFloatTimeDomainData(m.data);return m.data[0]||0;}
 edge(id){const m=this.meters[id];const value=this.read(id)>.5,rise=value&&!m.high;m.high=value;return rise;}
 patched(id){return this.links.some(e=>e.b===id);}
 pulse(source,t=this.ctx.currentTime,length=.06){source.offset.cancelScheduledValues(t);source.offset.setValueAtTime(1,t);source.offset.setValueAtTime(0,t+length);}
 build(){const c=this.ctx,n=this.nodes;n['op1.out']=this.gain();this.op1Input=this.gain();this.op1Direct=this.gain(1);this.op1Rack=this.gain(0);this.op1Input.connect(this.op1Direct);this.op1Input.connect(this.op1Rack);this.op1Rack.connect(n['op1.out']);
 this.master=this.gain(.35);this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-9;this.limiter.ratio.value=16;this.master.connect(this.limiter);this.analyser=c.createAnalyser();this.analyser.fftSize=256;this.op1Direct.connect(this.limiter);this.limiter.connect(this.analyser);this.analyser.connect(c.destination);
 this.hDry=this.gain(.5);this.hWet=this.gain(.5);this.hInput=this.gain(1);this.hMix=this.gain();this.hInput.connect(this.hWet);this.hWet.connect(this.hMix);this.hDry.connect(this.hMix);this.hMix.connect(this.master);n['hendrik.in']=this.hDry;n['hendrik.instrument']=this.hInput;n['hendrik.send']=this.hDry;n['hendrik.out']=this.hMix;n['hendrik.headphones']=this.master;
 this.pitch=this.constant();n['touch.pitch']=this.pitch;this.gate=this.constant();n['touch.gate']=this.gate;this.pressure=this.constant(.6);n['touch.pressure']=this.pressure;
 this.env=this.constant();n['contour.env']=this.env;this.eon=this.constant();this.eoc=this.constant();n['contour.eon']=this.eon;n['contour.eoc']=this.eoc;const inv=this.gain(-1);this.env.connect(inv);n['contour.inverted']=inv;
 this.random=this.constant();n['woggle.random']=this.random;this.smooth=this.constant();n['woggle.smooth']=this.smooth;this.woggle=this.constant();n['woggle.woggle']=this.woggle;this.pulseOut=this.constant();n['woggle.pulse']=this.pulseOut;this.burst=this.constant();n['woggle.burst']=this.burst;
 this.randomOscs=['sawtooth','square'].map(type=>{const o=c.createOscillator();o.type=type;o.frequency.value=140;o.start();return o;});const r1=this.gain(.2),r2=this.gain(.2);this.randomOscs[0].connect(r1);this.randomOscs[1].connect(r2);n['woggle.smoothAudio']=r1;n['woggle.woggleAudio']=r2;const ring=this.gain(0),ringScale=this.gain(.2);this.randomOscs[0].connect(ring);this.randomOscs[1].connect(ring.gain);ring.connect(ringScale);n['woggle.ring']=ringScale;
 for(let i=0;i<8;i++){const o=c.createOscillator();o.frequency.value=.3/(1+i*.73);o.start();const g=this.gain(.5);o.connect(g);n[`ochd.lfo${i+1}`]=g;this.lfos.push(o);}
 this.clutches={};for(const suffix of ['','B','C','D']){const g=this.gain(.4);this.clutches[suffix]=g;n[`clutch.in${suffix}`]=n[`clutch.out${suffix}`]=g;}this.clutchSource=this.constant();this.clutchSource.connect(this.clutches['']);
 for(const [i,low,high]of [[1,1500,7000],[2,1100,3500],[3,220,410]]){const suffix=i===1?'':i,input=this.gain(),lp=c.createBiquadFilter(),hp=c.createBiquadFilter();lp.frequency.value=low;hp.type='highpass';hp.frequency.value=high;input.connect(lp);input.connect(hp);n[`propust.in${suffix}`]=input;n[`propust.out${suffix}`]=lp;n[`propust.high${suffix}`]=hp;}
 this.pitchCV=this.gain(1200);this.fmCV=this.gain(300);n['friends.pitch']=this.pitchCV;n['friends.fm']=this.fmCV;this.mix=this.gain(.13);n['friends.mix']=this.mix;this.voiceGains=[];
 for(let i=0;i<6;i++){const o=c.createOscillator();o.type='triangle';this.pitchCV.connect(o.detune);this.fmCV.connect(o.detune);const g=this.gain(.3);o.connect(g);g.connect(this.mix);n[`friends.voice${i+1}`]=g;o.start();this.voices.push(o);this.voiceGains.push(g);}
 this.opto=[];this.optoMix=this.gain();n['optomix.mix']=n['optomix.aux']=this.optoMix;
 for(let i=1;i<=2;i++){const f=c.createBiquadFilter(),g=this.gain(.6),cv=this.gain(.6),strike=this.constant(),filterCV=this.gain(6500);cv.connect(g.gain);strike.connect(cv);cv.connect(filterCV);filterCV.connect(f.frequency);f.frequency.value=2200;f.connect(g);g.connect(this.optoMix);n[`optomix.in${i}`]=f;n[`optomix.out${i}`]=g;n[`optomix.cv${i}`]=cv;this.opto.push({f,g,cv,strike});}
 this.morphIn=this.gain();this.morphOut=this.gain(.7);this.delay=c.createDelay(2);this.delay.delayTime.value=.16;this.wet=this.gain(.5);this.dry=this.gain(.7);this.morphIn.connect(this.dry);this.dry.connect(this.morphOut);this.morphIn.connect(this.delay);this.delay.connect(this.wet);this.wet.connect(this.morphOut);n['morph.in']=n['morph.inR']=this.morphIn;n['morph.out']=n['morph.outR']=this.morphOut;this.grainCV=this.constant();this.grainEnd=this.constant();n['morph.cv']=this.grainCV;n['morph.eos']=this.grainEnd;
 // Remaining physical inputs are control voltages read by the control-rate loop.
 for(const [id,p]of Object.entries(ports))if(!n[id]){if(p.direction==='in')this.meter(id);else throw Error(`Missing output ${id}`);}
 for(const [k,v]of Object.entries(this.values))this.set(k,v);this.timer=setInterval(()=>this.tick(),12);
 }
 set(key,value){this.values[key]=value;const v=this.values,t=this.ctx.currentTime,s=(p,x)=>p.setTargetAtTime(x,t,.015);
 if(key.startsWith('friends.')){this.updateVoices();s(this.fmCV.gain,v['friends.fmDepth']*1200);}
 if(key==='ochd.rate')this.lfos.forEach((o,i)=>s(o.frequency,value/(1+i*.73)));
 if(key.startsWith('clutch.gain'))s(this.clutches[key.slice(11)].gain,value);
 if(key.startsWith('optomix.'))this.updateGates();
 if(key==='morph.size')s(this.delay.delayTime,value);if(key==='morph.morph')s(this.wet.gain,value*.7);if(key==='morph.mix')s(this.dry.gain,1-value*.8);
 if(key==='hendrik.volume')s(this.master.gain,value);if(key==='hendrik.mix'){s(this.hDry.gain,1-value);s(this.hWet.gain,value);}if(key==='hendrik.gain')s(this.hInput.gain,.1+value*3);
 }
 updateVoices(){const v=this.values,t=this.ctx.currentTime,spread=Math.max(0,v['friends.spread']+(this.meters['friends.intone']?this.read('friends.intone')*.2:0));this.voices.forEach((o,i)=>{o.frequency.setTargetAtTime(440*2**((v['friends.pitch']-69+i*spread*7)/12),t,.015);o.type=this.waveOverride||(v['friends.shape']<.33?'sine':v['friends.shape']<.66?'triangle':'sawtooth');});}
 updateGates(){this.opto.forEach(({f,g,cv},i)=>{cv.gain.setTargetAtTime(this.values[`optomix.level${i+1}`],this.ctx.currentTime,.01);const patched=this.patched(`optomix.cv${i+1}`)||this.patched(`optomix.strike${i+1}`);g.gain.setTargetAtTime(patched?0:this.values[`optomix.level${i+1}`],this.ctx.currentTime,.01);f.frequency.setTargetAtTime(120+(1-this.values[i?'optomix.damp2':'optomix.damp'])*(patched?1800:9000),this.ctx.currentTime,.015);});}
 patch(cables){for(const e of this.links){try{e.source.disconnect(e.target);}catch{}}this.links=[];for(const [a,b] of cables){const source=this.nodes[a],target=this.nodes[b];source.connect(target);this.links.push({a,b,source,target});}this.updateGates();this.updateVoices();this.mix.gain.setTargetAtTime(.13,this.ctx.currentTime,.01);this.set('ochd.rate',this.values['ochd.rate']);this.set('hendrik.mix',this.values['hendrik.mix']);this.set('morph.mix',this.values['morph.mix']);this.voiceGains.forEach((g,i)=>g.gain.setTargetAtTime(this.transientMode||this.patched(`friends.trig${i+1}`)?0:.3,this.ctx.currentTime,.01));}
 note(semitones){const t=this.ctx.currentTime;this.pitch.offset.setValueAtTime(semitones/12,t);this.pulse(this.gate,t,.08);this.pressure.offset.setTargetAtTime(.6,t,.01);}
 envelope(){const t=this.ctx.currentTime,v=this.values,p=this.env.offset,decay=v['contour.decay']*(1+(this.meters['contour.decay']?Math.max(-.8,this.read('contour.decay')):0));p.cancelScheduledValues(t);p.setValueAtTime(0,t);p.linearRampToValueAtTime(1,t+v['contour.attack']);p.linearRampToValueAtTime(v['contour.sustain'],t+v['contour.attack']+decay*(.2+v['contour.curve']*.6));p.linearRampToValueAtTime(0,t+v['contour.attack']+decay);this.pulse(this.eon,t+v['contour.attack']);this.pulse(this.eoc,t+v['contour.attack']+decay);}
 disturb(){this.nextRandom=0;}
 splice(){this.slice=(this.slice+1)%8;this.nextGrain=0;}
 randomize(t){const v=this.values,external=this.read('woggle.ego'),value=(Math.random()*2-1)*v['woggle.depth']+external*(1-v['woggle.depth']);this.random.offset.setValueAtTime(value,t);this.smooth.offset.setTargetAtTime(value,t,.04+1/Math.max(.1,v['woggle.rate']));this.woggle.offset.setTargetAtTime(value+Math.sin(t*9)*.15,t,.02+v['woggle.wobble']*.5);this.randomOscs.forEach((o,i)=>o.frequency.setTargetAtTime(80+Math.abs(value+this.read('woggle.influence'))*(i?950:640),t,.02));this.pulse(this.pulseOut,t);if(Math.random()>.35)this.pulse(this.burst,t,.03);}
 tick(){if(this.ctx.state!=='running')return;const t=this.ctx.currentTime,v=this.values;
 const gate=this.edge('contour.gate'),retrigger=this.edge('contour.retrigger');if(gate||retrigger)this.envelope();
 if(this.edge('touch.clock'))this.onClock?.();if(this.edge('touch.reset'))this.onReset?.();
 if(t>=this.nextRandom){this.nextRandom=t+1/Math.max(.1,v['woggle.rate']+this.read('woggle.speed')*v['woggle.speedAmount']*6);if(!this.patched('woggle.clock'))this.randomize(t);}if(this.edge('woggle.clock'))this.randomize(t);
 if(this.patched('ochd.cv'))this.lfos.forEach((o,i)=>o.frequency.setTargetAtTime(Math.max(.01,v['ochd.rate']*(1+this.read('ochd.cv')*v['ochd.amount']*3))/(1+i*.73),t,.02));
 if(this.patched('friends.intone'))this.updateVoices();if(this.patched('friends.ramp')){const shape=Math.max(0,Math.min(1,v['friends.shape']+this.read('friends.ramp')*.5));this.voices.forEach(o=>o.type=shape<.33?'sine':shape<.66?'triangle':'sawtooth');}if(this.patched('friends.curve'))this.mix.gain.setTargetAtTime(.13*(1+Math.max(-.8,this.read('friends.curve'))*v['friends.curve']),t,.02);
 const run=this.edge('friends.run');this.voiceGains.forEach((g,i)=>{const trig=this.edge(`friends.trig${i+1}`);if(trig||run){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.1+v['friends.curve']);}});
 this.opto.forEach(({f,strike},i)=>{if(this.edge(`optomix.strike${i+1}`)){strike.offset.cancelScheduledValues(t);strike.offset.setValueAtTime(1,t);strike.offset.exponentialRampToValueAtTime(.001,t+.1+(1-this.values[i?'optomix.damp2':'optomix.damp'])*.9);}if(this.patched(`optomix.damp${i+1}`))f.frequency.setTargetAtTime(Math.max(50,120+(v[i?'optomix.damp2':'optomix.damp']+this.read(`optomix.damp${i+1}`)) * 7000),t,.02);});
 if(this.patched('hendrik.cv'))this.hDry.gain.setTargetAtTime(Math.max(0,Math.min(1,1-v['hendrik.mix']+this.read('hendrik.cv'))),t,.02);
 if(this.edge('morph.shift')||this.edge('morph.splice'))this.splice();if(this.edge('morph.play'))this.grainsOn=!this.grainsOn;if(this.edge('morph.record'))this.onRecord?.();
 if(this.patched('morph.sos'))this.dry.gain.setTargetAtTime(Math.max(0,1-v['morph.mix']*.8+this.read('morph.sos')*.3),t,.02);
 const clock=this.edge('morph.clock');if(clock)this.nextGrain=0;
 if(this.buffer&&this.grainsOn&&t>=this.nextGrain&&(!this.patched('morph.clock')||clock)){
 const size=Math.max(.015,Math.min(.8,v['morph.size']+this.read('morph.size')*v['morph.sizeAmount']*.25)),morph=Math.max(0,Math.min(1,v['morph.morph']+this.read('morph.morph')*.4));this.nextGrain=t+size*(1-morph*.75);
 const slide=v['morph.slide']+this.read('morph.slide')*v['morph.slideAmount']*.4+(Math.floor((v['morph.organize']+this.read('morph.organize')*.5)*7)+this.slice)/8;
 const offset=Math.max(0,Math.min(1,((slide%1)+1)%1))*Math.max(0,this.buffer.duration-size*2),source=this.ctx.createBufferSource(),g=this.gain(0);source.buffer=this.buffer;source.playbackRate.value=Math.max(.1,v['morph.speed']+this.read('morph.speed')*v['morph.speedAmount']);source.connect(g);g.connect(this.morphOut);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+size*.3);g.gain.linearRampToValueAtTime(0,t+size);source.start(t,offset);source.stop(t+size);this.grains.add(source);source.onended=()=>{source.disconnect();g.disconnect();this.grains.delete(source);};this.pulse(this.grainEnd,t+size);this.grainCV.offset.setTargetAtTime(offset/this.buffer.duration,t,.01);
 }
 }
 route(mode){const t=this.ctx.currentTime;this.op1Direct.gain.setTargetAtTime(mode==='direct'?1:0,t,.01);this.op1Rack.gain.setTargetAtTime(mode==='rack'?1:0,t,.01);}
 switches(state){this.waveOverride=state['friends-wave']?'square':null;this.transientMode=state['friends-mode'];this.clutchSource.offset.setValueAtTime(state['clutch-source']?1:0,this.ctx.currentTime);this.updateVoices();this.voiceGains.forEach((g,i)=>g.gain.setTargetAtTime(this.transientMode||this.patched(`friends.trig${i+1}`)?0:.3,this.ctx.currentTime,.01));this.hInput.gain.setTargetAtTime((.1+this.values['hendrik.gain']*3)*(state['input-mode']?2:1),this.ctx.currentTime,.01);}
 clearSample(){for(const source of this.grains){try{source.stop();}catch{}}this.buffer=null;this.slice=0;this.grainsOn=true;}
 async loadSample(bytes){this.buffer=await this.ctx.decodeAudioData(bytes);this.nextGrain=0;this.slice=0;this.grainsOn=true;}
 async close(){clearInterval(this.timer);await this.ctx.close();}
}
