/* SPDX-License-Identifier: GPL-3.0-or-later
 * Independent DSP approximations; no manufacturer firmware code. */
import {clamp} from './dsp.js';
export const effects={delay:['Size','Speed','Feedback','Mix'],punch:['Frequency','Punch','Rounds','Power'],spring:['Tone','Turns','Damping','Send'],cwo:['Frequency','Delay','Feedback','Sideband'],grid:['X size','Y size','Z feedback','Mix'],nitro:['Frequency I','Follow','Resonance','Frequency II'],phone:['Tone','Phonic','Baud','Telematic']};
export const effectDefaults={delay:[.4,.5,.25,.2],punch:[.65,.4,.25,.8],spring:[.6,.5,.5,.3],cwo:[.56,.22,.35,1],grid:[.35,.55,.55,.35],nitro:[.75,.5,.25,.1],phone:[.55,.35,.6,.3]};
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
// Windowed Hilbert FIR supplies quadrature for genuine single-sideband frequency shifting.
export const cwoFrequency=value=>{const x=value*2-1;return Math.sign(x)*1000*x*x;};
export class FrequencyShifter{
 constructor(rate){this.rate=rate;this.phase=0;this.pos=0;this.history=new Float32Array(127);this.taps=[];for(let n=0;n<127;n++){const k=n-63;if(k%2)this.taps.push([n,2/(Math.PI*k)*(.54-.46*Math.cos(2*Math.PI*n/126))]);}}
 tick(x,hz,sideband){this.history[this.pos]=x;let quadrature=0;for(const [n,k] of this.taps)quadrature+=k*this.history[(this.pos-n+127)%127];const direct=this.history[(this.pos-63+127)%127];this.phase=(this.phase+2*Math.PI*hz/this.rate)%(2*Math.PI);this.pos=(this.pos+1)%127;return direct*Math.cos(this.phase)-quadrature*Math.sin(this.phase)*(sideband*2-1);}
}
class ResonantFilter{
 constructor(){this.a=0;this.b=0;}
 tick(x,hz,resonance,rate,high=false){const g=Math.tan(Math.PI*clamp(hz,20,rate*.42)/rate),k=2-1.92*resonance,a1=1/(1+g*(g+k)),v1=a1*(this.a+g*(x-this.b)),v2=this.b+g*v1;this.a=2*v1-this.a;this.b=2*v2-this.b;return high?x-k*v1-v2:v2;}
}
export class Effect{
 constructor(rate){this.rate=rate;this.shifter=new FrequencyShifter(rate);this.filters=[new ResonantFilter(),new ResonantFilter()];this.held=0;this.holdClock=0;this.carrier=0;this.gridLines=[.071,.089,.113,.137].map(t=>({data:new Float32Array(Math.ceil(rate*t*4)),pos:0}));this.gridRead=new Float64Array(4);this.buffer=new Float32Array(Math.ceil(rate*2));this.pos=0;this.low=0;this.band=0;this.damped=[0,0,0,0];this.combs=[.0297,.0371,.0411,.0437].map(t=>({data:new Float32Array(Math.ceil(rate*t*2)),pos:0}));}
 tick(x,type,p,on=true){if(!on)return x;let wet=0;
 if(type==='cwo'){const frames=Math.max(1,Math.floor(this.rate*(.001+p[1]*.75))),tap=this.buffer[(this.pos-frames+this.buffer.length)%this.buffer.length],shifted=this.shifter.tick(x+tap*p[2]*.92,cwoFrequency(p[0]),p[3]);this.buffer[this.pos]=Math.tanh(shifted);this.pos=(this.pos+1)%this.buffer.length;return x*.35+shifted*.65;}
 if(type==='grid'){const v=this.gridRead;for(let i=0;i<4;i++){const line=this.gridLines[i],scale=.1+(i%2?p[1]:p[0])*.9,length=Math.max(2,Math.floor(line.data.length*scale));line.pos%=length;v[i]=line.data[line.pos];}const sum=v[0]+v[1]+v[2]+v[3];for(let i=0;i<4;i++){const line=this.gridLines[i],length=Math.max(2,Math.floor(line.data.length*(.1+(i%2?p[1]:p[0])*.9)));line.data[line.pos]=Math.tanh(x*.4+(sum*.5-v[i])*p[2]*.97);line.pos=(line.pos+1)%length;}return x*(1-p[3])+sum*.5*p[3];}
 if(type==='nitro'){const f1=30*2**(p[0]*9),f2=30*2**((p[3]*(1-p[1])+p[0]*p[1])*9),low=this.filters[0].tick(x,f1,p[2],this.rate);return Math.tanh(this.filters[1].tick(low,f2,p[2],this.rate,true));}
 if(type==='phone'){const low=this.filters[0].tick(x,800+p[0]*5000,0,this.rate),band=this.filters[1].tick(low,180+p[0]*700,0,this.rate,true);this.holdClock--;if(this.holdClock<=0){this.holdClock=Math.max(1,Math.round(this.rate/(800+p[2]*15200)));const levels=2**(3+Math.round((1-p[1])*9));this.held=Math.round(band*levels)/levels;}this.carrier=(this.carrier+2*Math.PI*(40+p[3]*1800)/this.rate)%(2*Math.PI);return Math.tanh(this.held*(1+p[1]*5))*((1-p[3])+p[3]*Math.cos(this.carrier));}
 if(type==='punch'){const f=2*Math.sin(Math.PI*(40*2**(p[0]*8))/this.rate),q=1.9-p[1]*1.7;for(let i=0;i<2;i++){this.low+=f*this.band*.5;const high=Math.tanh(x*(1+p[2]*8))-this.low-q*this.band;this.band+=f*high*.5;}return Math.tanh(this.low)*(p[3]*1.5);}
 if(type==='spring'){for(let i=0;i<4;i++){const comb=this.combs[i],length=Math.max(2,Math.floor(comb.data.length*(.4+p[1]*.6))),at=comb.pos%length,v=comb.data[at];this.damped[i]+=(v-this.damped[i])*(.04+(1-p[2])*.7);comb.data[at]=Math.tanh(x*.35+this.damped[i]*(.5+p[1]*.43));comb.pos=(at+1)%length;wet+=v*.25;}this.low+=(wet-this.low)*(.03+p[0]*.9);return x*(1-p[3]*.4)+this.low*p[3];}
 const delay=Math.max(1,Math.floor(this.rate*(.03+p[0]*.9)/(.5+p[1]*1.5))),read=(this.pos-delay+this.buffer.length)%this.buffer.length;wet=this.buffer[read];this.buffer[this.pos]=Math.tanh(x+wet*p[2]*.94);this.pos=(this.pos+1)%this.buffer.length;return x*(1-p[3])+wet*p[3];
 }
}
