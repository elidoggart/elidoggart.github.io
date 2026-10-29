/* SPDX-License-Identifier: GPL-3.0-or-later */
import {clamp} from './dsp.js';
// Six-minute tape, allocated in one-second pages only where audio is recorded.
export class Tape {
 constructor(rate,seconds=360){this.rate=rate;this.length=Math.round(rate*seconds);this.tracks=Array.from({length:4},()=>new Map());this.takes=[[],[],[],[]];this.clipboard=null;this.undo=null;}
 read(track,position){if(position<0||position>=this.length)return 0;const p=Math.floor(position),f=position-p,a=this.at(track,p),b=this.at(track,p+1);return a+(b-a)*f;}
 at(track,p){if(p<0||p>=this.length)return 0;return this.tracks[track].get(Math.floor(p/this.rate))?.[p%this.rate]||0;}
 write(track,p,value){p=Math.floor(p);if(p<0||p>=this.length)return;const page=Math.floor(p/this.rate);let data=this.tracks[track].get(page);if(!data){data=new Float32Array(this.rate);this.tracks[track].set(page,data);}data[p%this.rate]=clamp(value,-1,1);}
 add(track,p,value){this.write(track,p,this.at(track,Math.floor(p))+value);}
 take(track,start,end){start=clamp(Math.floor(start),0,this.length);end=clamp(Math.ceil(end),0,this.length);if(end<=start)return;let current={start,end};const result=[];for(const t of this.takes[track]){if(t.end>current.start&&t.start<current.end){current={start:Math.min(t.start,current.start),end:Math.max(t.end,current.end)};}else result.push(t);}result.push(current);this.takes[track]=result.sort((a,b)=>a.start-b.start);}
 selected(track,pos){return this.takes[track].find(t=>pos>=t.start&&pos<t.end)||this.takes[track].find(t=>Math.abs(pos-t.end)<2);}
 snapshot(){this.undo={tracks:this.tracks.map(map=>new Map([...map].map(([k,v])=>[k,v.slice()]))),takes:this.takes.map(takes=>takes.map(t=>({...t})))};}
 swapUndo(){if(!this.undo)return;const old={tracks:this.tracks,takes:this.takes};this.tracks=this.undo.tracks;this.takes=this.undo.takes;this.undo=old;}
 clear(track,start=0,end=this.length){start=Math.floor(start);end=Math.ceil(end);for(const [key,data] of this.tracks[track]){const a=Math.max(0,start-key*this.rate),b=Math.min(this.rate,end-key*this.rate);if(a>=b)continue;if(a===0&&b===this.rate)this.tracks[track].delete(key);else data.fill(0,a,b);}this.takes[track]=this.takes[track].flatMap(t=>{if(t.end<=start||t.start>=end)return [t];return [...(t.start<start?[{start:t.start,end:start}]:[]),...(t.end>end?[{start:end,end:t.end}]:[])];});}
 slice(track,start,end){return Float32Array.from({length:Math.max(0,Math.floor(end-start))},(_,i)=>this.at(track,Math.floor(start)+i));}
 split(track,pos){pos=Math.floor(pos);const take=this.selected(track,pos);if(!take||pos<=take.start||pos>=take.end)return false;this.snapshot();this.takes[track]=this.takes[track].flatMap(t=>t===take?[{start:t.start,end:pos},{start:pos,end:t.end}]:[t]);return true;}
 join(track,pos){const ts=this.takes[track],take=this.selected(track,pos);if(!take||ts.length<2)return false;const i=ts.indexOf(take),other=ts[i+1]||ts[i-1];this.snapshot();this.takes[track]=ts.filter(t=>t!==take&&t!==other);this.takes[track].push({start:Math.min(take.start,other.start),end:Math.max(take.end,other.end)});this.takes[track].sort((a,b)=>a.start-b.start);return true;}
 lift(track,pos,all=false,region=null){const take=region||this.selected(track,pos);if(!take)return null;this.snapshot();const indices=all?[0,1,2,3]:[track];this.clipboard={length:take.end-take.start,all,audio:indices.map(t=>this.slice(t,take.start,take.end))};for(const t of indices)this.clear(t,take.start,take.end);return take.start;}
 drop(track,pos){if(!this.clipboard)return pos;this.snapshot();const start=Math.floor(pos),end=Math.min(this.length,start+this.clipboard.length);this.clipboard.audio.forEach((audio,i)=>{const t=this.clipboard.all?i:track;for(let n=0;n<end-start;n++)this.add(t,start+n,audio[n]);this.take(t,start,end);});return end;}
 get end(){return Math.max(0,...this.takes.flat().map(t=>t.end));}
}
