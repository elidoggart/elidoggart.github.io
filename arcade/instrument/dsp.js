/* SPDX-License-Identifier: GPL-3.0-or-later
 * FM and supersaw DSP adapted from op1r, Copyright (C) 2026 pcppcp.
 * See credits.html and upstream/ for the original sources and notices.
 * Browser envelopes, drums, sampling and tape are new implementations.
 */
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const frequency=n=>440*2**((n-69)/12);
const sine=new Int16Array(8192);
for(let i=0;i<8192;i++)sine[i]=Math.round(32767*Math.sin(i*Math.PI*2/8192));
const sin32=p=>sine[((p|0)>>19)+4096];
export class Voice {
 constructor(id,note,engine,rate,velocity=1){Object.assign(this,{id,note,engine,rate,velocity,age:0,env:0,released:false,pc:0,pm:0,ps:0,p2:0x40000000,fb:0,modEnv:32767,lp:0,noise:0,samplePos:0});}
 release(){this.released=true;}
 tick(knobs,adsr,sample){
  if(this.k0!==knobs[0]||this.k1!==knobs[1]||this.k2!==knobs[2]||this.k3!==knobs[3]){this.k0=knobs[0];this.k1=knobs[1];this.k2=knobs[2];this.k3=knobs[3];this.k=knobs.map(v=>Math.round(v*32767));}
  const k=this.k,inc=Math.round(frequency(this.note+(this.pitchOffset||0))*4294967296/this.rate)>>>0;
  let x=0;
  if(this.engine==='fm'){
   // Original integer phases, ratio quantisation, feedback and index envelope.
   this.pm=(this.pm+(inc>>>1)*(1+(k[0]>>11)))>>>0;
   const m=sin32((this.pm+this.fb*(k[3]>>4)*32)>>>0);this.fb=m;
   this.pc=(this.pc+inc)>>>0;
   const idx=( (k[1]>>3)*this.modEnv)>>15;
   x=sin32((this.pc+m*idx*16)>>>0)/65536;
   // OP1_BLOCK is 128 samples at 44.1 kHz; rescale decay for other rates.
   if(this.age%Math.max(1,Math.round(128*this.rate/44100))===0)this.modEnv-=this.modEnv*(1+(k[2]>>9))/4096;
  }else if(this.engine==='saw'){
   const d=(inc>>>14)*(k[0]>>7);
   this.pc=(this.pc+inc+d)>>>0;this.p2=(this.p2+inc-d)>>>0;this.ps=(this.ps+(inc>>>1))>>>0;
   const s1=(this.pc|0)>>16,s2=(this.p2|0)>>16;
   x=(s1+s2-((2*s2*k[1])>>15))/2;
   x+=((sin32(this.ps)*k[2])>>15)/2;
   x=clamp(x*(1+4*knobs[3])/32768,-1,1);x-=x*x*x/3;
   this.lp+=(x-this.lp)*.5;x=this.lp*.75;
  }else if(this.engine==='sample'){
   if(!sample?.length){this.released=true;x=0;}else{
   const pos=this.samplePos,lo=Math.floor(pos);
   if(lo>=sample.length-1){this.released=true;x=0;}else{
   x=sample[lo]+(sample[lo+1]-sample[lo])*(pos-lo);
   this.samplePos+=2**((this.note-60)/12)*(0.5+knobs[0]*1.5);}}
  }else if(this.engine==='drum'){
   const t=this.age/this.rate,type=[0,0,1,1,6,2,3,7,7,4,5,7,0,0,1,1,6,2,3,7,7,4,5,7][((this.note-53)%24+24)%24];
   const decay=.08+knobs[1]*.8,pitch=0.5+knobs[0]*1.5;
   const noise=Math.random()*2-1;this.noise+=.25*(noise-this.noise);
   const f=type===0?48+140*Math.exp(-t*40):type===1?175:type===4?110:type===5?230:600;
   this.pc+=2*Math.PI*f*pitch/this.rate;
   if(type===0||type===4||type===5)x=Math.sin(this.pc)*Math.exp(-t/(type===0?decay:decay*.5));
   else if(type===1)x=(noise*.65+Math.sin(this.pc)*.35)*Math.exp(-t/(decay*.35));
   else if(type===2||type===3)x=(noise-this.noise)*Math.exp(-t/(type===2?.025+knobs[1]*.08:decay*.6));
   else if(type===6)x=noise*Math.exp(-t/decay*.5)*(Math.sin(t*1000)>0?1:.3);
   else x=(Math.sin(this.pc)+Math.sin(this.pc*1.49))*.3*Math.exp(-t/(decay*.4));
   x*=.6;if(t>decay*8)this.released=true;
  }else{
   this.pc=(this.pc+inc)>>>0;const p=this.pc/4294967296;
   const a=Math.sin(p*2*Math.PI),b=2/Math.PI*Math.asin(a);
   x=a*(1-knobs[0])+b*knobs[0];x*=.45;
  }
  const [attack,decay,sustain,release]=adsr;
  if(this.released)this.env*=Math.exp(-1/(this.rate*Math.max(.008,release)));
  else if(this.age/this.rate<attack)this.env=Math.min(1,this.env+1/(this.rate*Math.max(.002,attack)));
  else this.env+=(sustain-this.env)*(1-Math.exp(-1/(this.rate*Math.max(.008,decay))));
  this.age++;return x*this.env*this.velocity;
 }
 get done(){return this.released&&this.env<.0001;}
}
export function wavBytes(tracks,levels,rate){
 const count=tracks[0].length,b=new ArrayBuffer(44+count*2),d=new DataView(b);
 const text=(at,s)=>[...s].forEach((c,i)=>d.setUint8(at+i,c.charCodeAt(0)));
 text(0,'RIFF');d.setUint32(4,36+count*2,true);text(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);text(36,'data');d.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){let s=0;for(let j=0;j<tracks.length;j++)s+=tracks[j][i]*levels[j];d.setInt16(44+i*2,Math.round(clamp(s,-1,1)*32767),true);}return b;
}
