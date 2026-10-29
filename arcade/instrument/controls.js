/* SPDX-License-Identifier: GPL-3.0-or-later */
// Original OP-1 control behavior; references and tutorial timestamps are in
// docs/instrument-control-conformance.md. Sound models remain independent.
export const rates=[4,6,8,12,16,24,32,48];
export const rateLabel=n=>'1/'+({6:4,12:8,24:16,48:32}[n]||n)+([6,12,24,48].includes(n)?'T':'');
export const playModes=['poly','mono','legato','unison'];
export const clockModes=['free','beat match','sync'];
export const arpModes=['none','once','each','all','trig'];
export const clone=x=>structuredClone(x);
const memoFields=['levels','pans','eq','masterfx','masterfxType','masterfxOn','master','speed','recordLevel','loopMarkers','tapePosition'];
export class MemoKeys {
 constructor(){this.slots=[{},{}];this.active=null;}
 capture(c){return Object.fromEntries(memoFields.map(k=>[k,clone(c[k])]));}
 press(index,c){if(this.active)return;this.active={index,before:this.capture(c),changed:new Set()};for(const [key,value] of Object.entries(this.slots[index])){const [field,i]=key.split('.');if(i===undefined)c[field]=clone(value);else c[field][i]=value;}}
 change(before,c){if(!this.active)return;for(const field of memoFields){if(Array.isArray(c[field]))c[field].forEach((value,i)=>{if(value!==before[field][i])this.active.changed.add(field+'.'+i);});else if(c[field]!==before[field])this.active.changed.add(field);}}
 release(c){if(!this.active)return;const {index,before,changed}=this.active,slot=this.slots[index];for(const key of changed){const [field,i]=key.split('.');slot[key]=clone(i===undefined?c[field]:c[field][i]);}for(const key of new Set([...Object.keys(slot),...changed])){const [field,i]=key.split('.');if(i===undefined)c[field]=clone(before[field]);else c[field][i]=before[field][i];}this.active=null;}
}
export function rotateSteps(steps,delta){if(!steps.length)return steps;const n=((Math.round(delta)%steps.length)+steps.length)%steps.length;return [...steps.slice(-n||steps.length),...steps.slice(0,-n||steps.length)];}
