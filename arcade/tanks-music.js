// The Road to Boston: traditional public-domain melody, new adaptive arrangement.
// Requested reference: https://www.youtube.com/watch?v=6qfBJwDjbUA
// Score: https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/march/Road_to_Boston_D/0000
// Keep the legacy piccolo bus name; its voice is a synthesized fife.
export const TANK_PARTS={
 sentry:['snare','bassDrum'],
 patrol:['metronome','harmony'],
 rocket:['timpaniA','horns'],
 hunter:['counterFife','cymbals'],
 miner:['bells','triangle'],
 warrior:['timpaniB','horns','rolls'],
 sniper:['clarinet','harmony'],
 stealth:['synth','counterFife','triangle'],
 elite:['horns','clarinet','bells','cymbals','rolls','harmony']
};
export const PARTS=['piccolo','snare','bassDrum','tuba','metronome','timpaniA','timpaniB','cymbals','bells','synth','harmony','counterFife','horns','clarinet','rolls','triangle'];
export function musicLayers(tanks){
 const enemies=tanks.filter(t=>t.id!==0&&t.alive&&TANK_PARTS[t.type]);
 if(!enemies.length)return [];
 const parts=new Set(['piccolo','snare','bassDrum','tuba']);
 for(const tank of enemies)for(const part of TANK_PARTS[tank.type])parts.add(part);
 for(const [count,part] of [[2,'harmony'],[3,'rolls'],[4,'cymbals'],[6,'horns'],[8,'bells']])if(enemies.length>=count)parts.add(part);
 // The bus order is stable, independent of tank order. Surviving types retain
 // their instruments when another type dies; all parts share one music clock.
 return PARTS.filter(part=>parts.has(part));
}
export const TEMPO=112;
// Cut-time score: eight subdivisions per two-beat marching bar.
export const STEP_SECONDS=60/TEMPO/4;
const EIGHTH=STEP_SECONDS;
const A=[
 [[78,4],[78,2],[76,1],[78,1]],
 [[79,2],[78,2],[76,2],[74,2]],
 [[73,2],[74,2],[76,2],[78,2]],
 [[74,2],[69,2],[66,2],[69,2]],
 [[78,4],[78,2],[76,1],[78,1]],
 [[79,2],[78,2],[76,2],[74,2]],
 [[73,2],[74,2],[76,2],[73,2]],
 [[74,6],[74,1],[76,1]]
];
const B=[
 [[81,4],[81,2],[80,1],[81,1]],
 [[83,2],[81,2],[79,2],[78,2]],
 [[79,4],[79,2],[78,1],[79,1]],
 [[81,2],[79,2],[78,2],[76,2]],
 [[78,4],[78,2],[76,1],[78,1]],
 [[79,2],[78,2],[76,2],[74,2]],
 [[73,2],[74,2],[76,2],[73,2]],
 [[74,6],[78,1],[79,1]]
];
// AABB form; pickups point into the next strain instead of adding a count-in.
const BARS=[...A,...A.slice(0,7),[[74,6],[78,1],[79,1]],...B,...B.slice(0,7),[[74,6],[74,1],[76,1]]];
export const MELODY=BARS.flatMap(bar=>bar.flatMap(([pitch,length])=>[[pitch,length],...Array.from({length:length-1},()=>null)]));
const A_ROOTS=[50,55,57,50,50,55,57,50],B_ROOTS=[50,55,52,57,50,55,57,50];
const ROOTS=[...A_ROOTS,...A_ROOTS,...B_ROOTS,...B_ROOTS];
const SCALE=[50,52,54,55,57,59,61];
function thirdBelow(pitch){let note=pitch-3;while(!SCALE.some(p=>(p%12)===(note%12)))note--;return note;}
export class TankMusic{
 constructor(){this.volume=.65;this.enabled=false;this.context=null;this.active=false;this.step=0;this.next=0;this.state='';this.level=-1;this.count=0;this.lives=0;this.voices=new Set();this.cache=new Map();this.layers=[];}
 setVolume(value){this.volume=value;if(this.context)this.master.gain.setTargetAtTime(value,this.context.currentTime,.03);}
 async enable(){
  if(!this.context||this.context.state==='closed'){
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!Audio)throw new Error('Audio unavailable');
   this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=this.volume;
   this.master.connect(this.context.destination);this.buses={};
   for(const name of [...PARTS,'cue']){const gain=this.context.createGain();gain.gain.value=name==='cue'?1:0;gain.connect(this.master);this.buses[name]=gain;}
  }
  await this.context.resume();this.enabled=true;this.applyLayers();
  if(this.state==='ready')this.cue('announce');
 }
 mute(){this.enabled=false;this.stop();}
 stop(){this.active=false;clearInterval(this.timer);this.timer=null;for(const v of this.voices){try{v.stop();}catch{}}this.voices.clear();}
 applyLayers(){if(!this.context)return;for(const name of PARTS){const p=this.buses[name].gain;p.cancelScheduledValues(this.context.currentTime);p.setTargetAtTime(this.layers.includes(name)?1:0,this.context.currentTime,.012);}}
 update(game,hidden=false){
  const results=(game.state==='dead'&&!game.lives)||game.state==='won';
  const nextLayers=results?['piccolo','tuba','snare','metronome']:musicLayers(game.tanks),count=game.tanks.filter(t=>t.id&&t.alive).length;
  const state=game.state,changed=state!==this.state||game.level!==this.level;
  const previous=this.state,oldCount=this.count,oldLives=this.lives;
  this.state=state;this.level=game.level;this.count=count;this.lives=game.lives;
  if(nextLayers.join()!==this.layers.join()){this.layers=nextLayers;this.applyLayers();}
  if(!this.enabled||!this.context)return;
  if(hidden||state==='paused'){if(this.active||this.voices.size)this.stop();return;}
  if(changed){
   if(state!=='playing')this.stop();
   if(previous==='playing'&&count<oldCount)this.cue('kill');
   if(state==='ready')this.cue('announce');
   else if(state==='dead')this.cue('lost');
   else if(state==='clear'||state==='won')this.cue(game.level===19||game.level===99?'finale':'clear');
   if(game.lives>oldLives&&previous==='clear')this.cue('life');
  }
  if(state==='playing'||results){
   if(!this.active){
    this.active=true;
    if(previous!=='paused')this.step=0;
    this.next=this.context.currentTime+(results?1.2:.04);
    this.timer=setInterval(()=>this.schedule(),25);this.schedule();
   }
   if(state==='playing'&&!changed&&count<oldCount)this.cue('kill');
  }
 }
 schedule(){
  if(!this.enabled||!this.active||this.context.state!=='running')return;
  const now=this.context.currentTime;
  if(this.next<now-.15)this.next=now+.03; // Never replay a burst after background throttling.
  while(this.next<now+.12){this.beat(this.step++,this.next);this.next+=EIGHTH;}
 }
 buffer(voice,note,duration){
  const key=`${voice}:${note}:${duration}`;if(this.cache.has(key))return this.cache.get(key);
  const sr=this.context.sampleRate,buffer=this.context.createBuffer(1,Math.ceil(sr*duration),sr),out=buffer.getChannelData(0);
  const f=440*2**((note-69)/12),tau=Math.PI*2;
  let seed=12345,previous=0;
  for(let i=0;i<out.length;i++){
   const t=i/sr,phase=tau*f*t,attack=Math.min(1,t/.012),release=Math.min(1,(duration-t)/.045);
   seed=(seed*1664525+1013904223)>>>0;const noise=seed/2147483648-1;
   let v=0,env=attack*release;
   if(voice==='snare'){v=(noise*.7+Math.sin(tau*185*t)*.3)*Math.exp(-t*28);env=Math.min(1,t/.001);}
   else if(voice==='cymbals'){v=(noise-previous)*.35*Math.exp(-t*12);env=Math.min(1,t/.002);}
   else if(voice==='metronome'){v=Math.sin(tau*1900*t)*Math.exp(-t*110);env=1;}
   else if(voice==='bassDrum'){v=Math.sin(tau*(52*t+1.5*(1-Math.exp(-t*35))))*Math.exp(-t*13);env=Math.min(1,t/.003);}
   else if(voice==='timpani'){v=(Math.sin(phase)+.3*Math.sin(phase*1.48)+.16*Math.sin(phase*2.1))*Math.exp(-t*7);env=attack;}
   else if(voice==='bells'){v=(Math.sin(phase)*Math.exp(-t*3)+.35*Math.sin(phase*2.76)*Math.exp(-t*7)+.15*Math.sin(phase*5.4)*Math.exp(-t*14));}
   else if(voice==='fife'){
    // Breath, a quick tongued attack and upper harmonics make the flute audible
    // without the old octave-doubled sine-wave whistle.
    const flutter=.018*Math.sin(tau*5.6*t)*Math.min(1,t/.12);
    const p=phase+flutter;
    v=(Math.sin(p)+.30*Math.sin(2*p)+.13*Math.sin(3*p)+.045*Math.sin(4*p))*.65+noise*.025;
    env=Math.min(1,t/.006)*Math.min(1,(duration-t)/.025)*(.88+.12*Math.exp(-t*32));
   }
   else if(voice==='clarinet'){v=(Math.sin(phase)+.38*Math.sin(phase*3)+.16*Math.sin(phase*5))*.6;}
   else if(voice==='horn'){v=(Math.sin(phase)+.22*Math.sin(phase*2)+.09*Math.sin(phase*3))*.7;env*=Math.min(1,t/.025);}
   else if(voice==='triangle'){v=(Math.sin(phase)+.35*Math.sin(phase*2.71)+.15*Math.sin(phase*4.13))*Math.exp(-t*9);}
   else if(voice==='tuba'){v=(Math.sin(phase)+.32*Math.sin(phase*2)+.14*Math.sin(phase*3))*.7;}
   else if(voice==='trumpet'){v=(Math.sin(phase)+.55*Math.sin(phase*2)+.3*Math.sin(phase*3)+.12*Math.sin(phase*4))*.5;env*=.8+.2*Math.exp(-t*12);}
   else if(voice==='synth'){v=(Math.sin(phase)+.3*Math.sin(phase*2+.5*Math.sin(tau*4*t)))*.7;}
   else {v=(Math.sin(phase+.012*Math.sin(tau*5*t))+.12*Math.sin(phase*2))*.8;}
   out[i]=v*env;previous=noise;
  }
  this.cache.set(key,buffer);return buffer;
 }
 note(part,voice,note,time,duration=.2,volume=.12){
  const source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=this.buffer(voice,note,duration);gain.gain.value=volume;
  source.connect(gain);gain.connect(this.buses[part]);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};source.start(time);
 }
 beat(step,time){
  const i=step%MELODY.length,beat=i%8,root=ROOTS[Math.floor(i/8)],melody=MELODY[i];
  // All parts share a clock, even while muted, so changes never restart the melody.
  if(melody){
   const [pitch,length]=melody,duration=length*EIGHTH*.88;
   this.note('piccolo','fife',pitch,time,duration,beat===0?.18:.155);
   this.note('harmony','fife',thirdBelow(pitch),time,duration,.055);
   this.note('clarinet','clarinet',pitch-12,time,duration,.055);
  }
  if(beat===2||beat===6)this.note('snare','snare',0,time,.12,.17);
  if(beat===3||beat===7){
   this.note('snare','snare',0,time,.08,.065);
   if(beat===7)this.note('snare','snare',0,time+EIGHTH/2,.07,.085);
  }
  if(beat%2===0)this.note('metronome','metronome',0,time,.04,.055);
  if(beat===0||beat===4)this.note('cymbals','cymbals',0,time,.24,.05);
  if(beat===0||beat===4)this.note('bassDrum','bassDrum',0,time,.3,.16);
  if(beat===0||beat===3){this.note('timpaniA','timpani',root,time,.3,.075);this.note('timpaniB','timpani',root,time,.3,.075);}
  if(beat===5||beat===6||beat===7)this.note('timpaniB','timpani',root+(beat===6?7:0),time,.22,.055);
  if(beat%2===0)this.note('tuba','tuba',root+(beat===4?7:0)-12,time,.18,.095);
  if(beat===0||beat===4)this.note('bells','bells',root+24+(beat===4?7:0),time,.45,.045);
  if(beat===0||beat===4){
   this.note('horns','horn',root+12,time,EIGHTH*2.8,.055);
   this.note('horns','horn',root+19,time,EIGHTH*2.8,.035);
  }
  if(beat===1||beat===3||beat===5||beat===7)this.note('counterFife','fife',root+24+(beat===3?7:beat===7?12:0),time,EIGHTH*.75,.045);
  if(beat===3||beat===7)for(let n=0;n<3;n++)this.note('rolls','snare',0,time+n*EIGHTH/3,.055,.035+n*.009);
  if(beat===2||beat===6)this.note('triangle','triangle',98,time,.18,.035);
  if(beat===1||beat===5){this.note('synth','synth',root+12,time,.22,.055);this.note('synth','synth',root+19,time,.22,.035);}
 }
 cue(kind){
  if(!this.enabled||!this.context||this.context.state!=='running')return;
  const at=this.context.currentTime+.015;
  const play=(voice,note,offset=0,duration=.18,volume=.13)=>this.note('cue',voice,note?note-5:0,at+offset,duration,volume);
  if(kind==='announce'){[72,76,79].forEach((n,i)=>{play('trumpet',n,i*.15,.23);play('trumpet',n-7,i*.15,.23,.07);});return;}
  if(kind==='kill'||kind==='life'){(kind==='kill'?[79,84]:[72,76,79,84]).forEach((n,i)=>play('trumpet',n,i*.09,.13,.10));return;}
  const notes=kind==='lost'?[79,75,72]:[76,79,84];
  notes.forEach((n,i)=>{play('fife',n,i*.2,.28,.1);play('fife',n-12,i*.2,.28,.06);});
  if(kind==='lost')play('bells',48,.4,.9,.15);
  if(kind==='finale'){play('tuba',36,0,.7,.15);play('cymbals',0,.4,.5,.13);play('bassDrum',0,.4,.4,.2);play('snare',0,.2,.16,.14);}
 }
 dispose(){this.mute();this.context?.close();}
}
