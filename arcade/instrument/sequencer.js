/* SPDX-License-Identifier: GPL-3.0-or-later */
export function sequenceDefaults(type='endless'){return {type,enabled:false,steps:type==='pattern'?Array.from({length:16},()=>({notes:[],tie:false})):[],length:16,division:16,swing:.5,hold:false,direction:'forward',gate:.75};}
export class Sequencer {
 constructor(rate){this.rate=rate;this.reset();}
 reset(){this.index=-1;this.until=0;this.playing=false;this.transpose=0;this.cycleDirection=1;}
 trigger(note){if(!this.playing){this.index=-1;this.until=0;}this.playing=true;this.transpose=note-60;}
 tick(config,bpm,held){if(!config.enabled||(!held&&!config.hold)){this.playing=false;return null;}if(!this.playing){if(!config.hold)return null;this.trigger(60);}if(this.until>1e-9){this.until--;return null;}
  const length=config.type==='arp'?Math.max(1,held):Math.max(1,Math.min(config.type==='pattern'?config.length:128,config.steps.length));
  if(config.direction==='random')this.index=Math.floor(Math.random()*length);
  else if(config.direction==='reverse')this.index=this.index<0?length-1:(this.index-1+length)%length;
  else if(config.direction==='cycle'){this.index+=this.cycleDirection;if(this.index>=length){this.index=Math.max(0,length-2);this.cycleDirection=-1;}if(this.index<0){this.index=Math.min(1,length-1);this.cycleDirection=1;}}
  else this.index=(this.index+1)%length;
  const base=this.rate*60/bpm*4/config.division,frames=base*(this.index%2===0?config.swing*2:(1-config.swing)*2);this.until+=frames-1;
  const step=config.steps[this.index]||{notes:[],tie:false};
  return {notes:step.notes.map(n=>n+this.transpose),tie:step.tie,sustain:config.direction==='forward'&&Boolean(config.steps[(this.index+1)%length]?.tie),frames,gate:config.gate,index:this.index};
 }
}
