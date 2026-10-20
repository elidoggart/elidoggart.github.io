// Original generative score: a quiet pulse at rest, bass/percussion/arpeggios in motion.
export class StillMusic{
 constructor(){this.volume=.28;this.enabled=false;this.context=null;this.voices=new Set();this.active=false;this.motion=0;this.blend=0;this.step=0;this.next=0;}
 setVolume(v){this.volume=v;if(this.context)this.master.gain.setTargetAtTime(v,this.context.currentTime,.03)}
 async enable(){if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');const c=this.context=new Audio();this.master=c.createGain();this.master.gain.value=this.volume;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=10000;this.master.connect(filter).connect(c.destination);this.noise=c.createBuffer(1,c.sampleRate*.2,c.sampleRate);const a=this.noise.getChannelData(0);let seed=73;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/2147483648-1}}
 await this.context.resume();this.enabled=true;this.next=this.context.currentTime+.03;if(!this.timer)this.timer=setInterval(()=>this.schedule(),40);}
 mute(){this.enabled=false;this.stopVoices()}stopVoices(){for(const n of this.voices){try{n.stop()}catch{}}this.voices.clear()}
 stop(){this.active=false;this.stopVoices();clearInterval(this.timer);this.timer=null;}
 update(game,blocked){const active=game.state==='playing'&&!blocked;if(!active&&this.active)this.stopVoices();if(active&&!this.active&&this.context)this.next=this.context.currentTime+.03;this.active=active;this.motion=game.timeScale;this.room=game.level;this.danger=game.bullets.filter(b=>b.owner==='enemy').length;}
 tone(freq,t,dur,gain,type='triangle',end=null){const c=this.context,n=type==='noise'?c.createBufferSource():c.createOscillator(),g=c.createGain();if(type==='noise')n.buffer=this.noise;else{n.type=type;n.frequency.setValueAtTime(freq,t);if(end)n.frequency.exponentialRampToValueAtTime(end,t+dur)}g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);n.connect(g).connect(this.master);n.start(t);n.stop(t+dur+.01);this.voices.add(n);n.onended=()=>{this.voices.delete(n);n.disconnect();g.disconnect()};}
 // Both instrument pairs share one musical clock, so the phrase survives speed changes.
 strings(freq,t,fast){
  const slow=1-fast;
  for(const [ratio,level] of [[1,1],[2,.32],[3,.16],[4,.07]]){
   if(slow>.001)this.tone(freq/2*ratio,t,1.25,.028*slow*level,'triangle');
   if(fast>.001)this.tone(freq*ratio,t,.48,.021*fast*level,'triangle');
  }
 }
 percussion(t,fast){
  if(fast<.999)this.tone(150,t,.23,.055*(1-fast),'sine',48);
  if(fast>.001)this.hat(t,.03+.04*(1-fast),.035*fast);
 }
 hat(t,dur,gain){
  const c=this.context,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  n.buffer=this.noise;f.type='highpass';f.frequency.value=6500;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  n.connect(f).connect(g).connect(this.master);n.start(t);n.stop(t+dur+.01);this.voices.add(n);
  n.onended=()=>{this.voices.delete(n);n.disconnect();f.disconnect();g.disconnect()};
 }
 schedule(){
  if(!this.enabled||!this.active||this.context.state!=='running')return;
  const c=this.context;this.next=Math.max(this.next,c.currentTime);let limit=0;
  while(this.next<c.currentTime+.12&&limit++<8){
   const target=Math.max(0,Math.min(1,(this.motion-.025)/.975));
   this.blend+=(target-this.blend)*.38;
   const fast=this.blend,t=this.next,i=this.step++,root=[55,65.406,49,58.27][Math.floor(i/32)%4],notes=[0,7,12,15,12,7,3,10];
   if(i%8===0)this.tone(root*4,t,1.8,.09,'sine');
   if(i%4===0){this.tone(root,t,.4,.12+.1*fast,'triangle');this.strings(root*4*2**(notes[i%8]/12),t,fast);}
   if(i%2===0)this.percussion(t,fast);
   if(i%2===1&&fast>.05)this.hat(t,.035,.016*fast);
   if(fast>.03)this.tone(root*4*2**(notes[i%8]/12),t,.18,.085*fast,'sine');
   if(this.danger>2&&i%8===6)this.tone(root*8,t,.25,.035,'triangle');
   this.next+=60/(72+36*fast)/4;
  }
 }
}
