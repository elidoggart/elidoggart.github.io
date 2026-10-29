/* SPDX-License-Identifier: GPL-3.0-or-later
 * Independent DSP approximations; no manufacturer firmware code. */
import {clamp} from './dsp.js';
export const effects={delay:['Size','Speed','Feedback','Mix'],punch:['Frequency','Punch','Rounds','Power'],spring:['Tone','Turns','Damping','Send']};
export const effectDefaults={delay:[.4,.5,.25,.2],punch:[.65,.4,.25,.8],spring:[.6,.5,.5,.3]};
export const lfos={tremolo:['Speed','Pitch','Volume','Envelope'],value:['Speed','Amount','Destination','Parameter'],random:['Amount','Speed','Destination','Envelope']};
export const shapes=['sine','saw','exp','square','blip'];
export function wave(phase,shape='sine'){const p=phase-Math.floor(phase);return shape==='saw'?2*p-1:shape==='exp'?2*p*p-1:shape==='square'?(p<.5?1:-1):shape==='blip'?(p<.08?1:-1):Math.sin(p*Math.PI*2);}
export class Modulator{
 constructor(rate){this.rate=rate;this.phase=0;this.age=0;this.values=[0,0,0,0];this.output={knobs:[],adsr:[],effect:[],pitch:0,gain:1,value:0};}
 trigger(free){if(!free){this.phase=0;this.age=0;}}
 tick(c){const out=this.output;for(const field of ['knobs','adsr','effect'])for(let i=0;i<4;i++)out[field][i]=c[field][i];out.pitch=0;out.gain=1;out.value=0;if(!c.lfoOn)return out;
 const p=c.lfo,type=c.lfoType||'tremolo',speed=type==='random'?p[1]:p[0],hz=c.lfoSync?(c.bpm/60)/[16,8,4,2,1,.5,.25,.125][Math.round(speed*7)]:.05*2**(speed*9),previous=this.phase;this.phase=(this.phase+hz/this.rate)%1;this.age++;
 if(this.phase<previous||this.age===1)for(let i=0;i<4;i++)this.values[i]=Math.random()*2-1;
 const curve=type==='value'?1:(p[3]<.5?Math.exp(-this.age/this.rate/Math.max(.03,p[3]*8)):p[3]>.5?Math.min(1,this.age/this.rate/Math.max(.03,(p[3]-.5)*8)):1),w=wave(this.phase,c.lfoShape)*curve;out.value=w;
 if(type==='tremolo'){out.pitch=w*p[1]*12;out.gain=clamp(1-Math.abs(p[2])*.5+w*p[2]*.5,0,1);}
 else{const field=['knobs','adsr','effect'][Math.round(p[2]*2)],indexes=type==='random'?[0,1,2,3]:[Math.round(p[3]*3)];for(const i of indexes){const scale=field==='adsr'?[2,2,1,3][i]:1,amount=type==='random'?this.values[i]*p[0]*curve:w*p[1];out[field][i]=clamp(out[field][i]+amount*scale,field==='adsr'&&i!==2?.003:0,scale);}}
 return out;
 }
}
export class Effect{
 constructor(rate){this.rate=rate;this.buffer=new Float32Array(Math.ceil(rate*2));this.pos=0;this.low=0;this.band=0;this.damped=[0,0,0,0];this.combs=[.0297,.0371,.0411,.0437].map(t=>({data:new Float32Array(Math.ceil(rate*t*2)),pos:0}));}
 tick(x,type,p,on=true){if(!on)return x;let wet=0;
 if(type==='punch'){const f=2*Math.sin(Math.PI*(40*2**(p[0]*8))/this.rate),q=1.9-p[1]*1.7;for(let i=0;i<2;i++){this.low+=f*this.band*.5;const high=Math.tanh(x*(1+p[2]*8))-this.low-q*this.band;this.band+=f*high*.5;}return Math.tanh(this.low)*(p[3]*1.5);}
 if(type==='spring'){for(let i=0;i<4;i++){const comb=this.combs[i],length=Math.max(2,Math.floor(comb.data.length*(.4+p[1]*.6))),at=comb.pos%length,v=comb.data[at];this.damped[i]+=(v-this.damped[i])*(.04+(1-p[2])*.7);comb.data[at]=Math.tanh(x*.35+this.damped[i]*(.5+p[1]*.43));comb.pos=(at+1)%length;wet+=v*.25;}this.low+=(wet-this.low)*(.03+p[0]*.9);return x*(1-p[3]*.4)+this.low*p[3];}
 const delay=Math.max(1,Math.floor(this.rate*(.03+p[0]*.9)/(.5+p[1]*1.5))),read=(this.pos-delay+this.buffer.length)%this.buffer.length;wet=this.buffer[read];this.buffer[this.pos]=Math.tanh(x+wet*p[2]*.94);this.pos=(this.pos+1)%this.buffer.length;return x*(1-p[3])+wet*p[3];
 }
}
