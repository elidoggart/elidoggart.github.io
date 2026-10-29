/* SPDX-License-Identifier: GPL-3.0-or-later */
// Clock and editor behavior follow the original OP-1. Trigger-mask bank is an
// independent approximation; see docs/instrument-control-conformance.md.
export const triggerPatterns=[[1],[1,0],[1,1,0],[1,0,0],[1,0,1,0,1,0,0,0],[1,1,0,1,0,0],[1,0,0,1,0,0,1,0],[1,1,1,0]];
export function sequenceDefaults(type='endless'){return {type,enabled:false,steps:type==='pattern'?Array.from({length:16},()=>({notes:[],tie:false})):[],length:16,division:16,swing:.5,hold:false,direction:'forward',gate:.75,offset:0,rotation:0,triggerPattern:0,triggerRotation:0,crank:false,crankPosition:.5,arpMode:'none',arpType:0,arpSkip:false,noteLength:8};}
export function arpeggioNotes(notes,mode='none',type=0){if(!notes.length)return [];const additions=[[12],[12,-12],[7,9,-5],[2,4,5,7,9]][type]||[12],sorted=[...notes].sort((a,b)=>a-b);if(mode==='once')return [...sorted,...additions.map(n=>notes.at(-1)+n)];if(mode==='each')return sorted.flatMap(n=>[n,...additions.map(a=>n+a)]);if(mode==='all')return [0,...additions].flatMap(a=>sorted.map(n=>n+a));if(mode==='trig')return [notes[0],...sorted.filter(n=>n!==notes[0])];return sorted;}
export class Sequencer {
 constructor(rate){this.rate=rate;this.reset();}
 reset(){this.index=-1;this.until=0;this.playing=false;this.transpose=0;this.cycleDirection=1;this.pulse=0;}
 trigger(note){if(!this.playing){this.index=-1;this.until=0;this.pulse=0;}this.playing=true;this.transpose=note-60;}
 tick(config,bpm,held,manual=false){
  if(!config.enabled||(!held&&!config.hold)){this.playing=false;return null;}
  if(!this.playing){if(!config.hold&&!manual)return null;this.trigger(60);}
  if(config.crank&&!manual)return null;
  if(this.until>1e-9&&!manual){this.until--;return null;}
  const length=config.type==='arp'?Math.max(1,held):Math.max(1,Math.min(config.type==='pattern'?config.length:128,config.steps.length));
  const pattern=triggerPatterns[config.triggerPattern||0],pulse=this.pulse++,hit=pattern[(pulse+(config.triggerRotation||0))%pattern.length];
  // Pause consumes time but retains the next note; skip advances the note too.
  const advance=config.type!=='arp'||hit||config.arpSkip;
  if(advance){if(config.direction==='random')this.index=Math.floor(Math.random()*length);
   else if(config.direction==='reverse')this.index=this.index<0?length-1:(this.index-1+length)%length;
   else if(config.direction==='cycle'){this.index+=this.cycleDirection;if(this.index>=length){this.index=Math.max(0,length-2);this.cycleDirection=-1;}if(this.index<0){this.index=Math.min(1,length-1);this.cycleDirection=1;}}
   else this.index=(this.index+1)%length;}
  const base=this.rate*60/bpm*4/config.division,frames=base*(pulse%2===0?config.swing*2:(1-config.swing)*2);this.until=manual?0:this.until+frames-1;
  const offset=config.type==='pattern'?(config.offset||0):0,memoryIndex=(this.index+offset)%16,step=config.steps[config.type==='pattern'?memoryIndex:this.index]||{notes:[],tie:false},muted=config.type!=='pattern'&&!hit;
  return {memoryIndex,notes:muted?[]:step.notes.map(n=>n+this.transpose),tie:!muted&&step.tie,sustain:!muted&&config.direction==='forward'&&Boolean(config.steps[((this.index+1)%length)+offset]?.tie),frames,gate:config.type==='arp'?(config.noteLength||8)/24*config.division/4:config.gate,index:this.index,muted};
 }
}
// The device and companion display the same active section of the same memory.
export function sequenceWindow(seq,cursor=0){const total=seq.type==='pattern'?seq.length:Math.max(1,seq.steps.length),offset=seq.type==='pattern'?(seq.offset||0):0,start=offset+Math.floor(Math.min(Math.max(0,cursor-offset),total-1)/32)*32;return {start,count:Math.min(32,total-(start-offset)),total:total+offset};}
