/* SPDX-License-Identifier: GPL-3.0-or-later */
import {sequenceWindow} from './sequencer.js';
// The roll edits the hardware-style step memory directly, including chords/rests.
export function createPianoRoll({getSequence,onChange,onCursor,getCursor}){
 const canvas=document.querySelector('#piano-roll'),g=canvas.getContext('2d'),octave=document.querySelector('#roll-octave'),add=document.querySelector('#roll-add');
 const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'],row=18,left=48,top=26;
 let cell=32;
 let pitch=60,painting=null;
 const low=()=>12*(Number(octave.value)+1),view=()=>sequenceWindow(getSequence(),getCursor()),count=()=>view().count;
 function render(){
  const seq=getSequence(),arp=seq.type==='arp';canvas.parentElement.hidden=arp;octave.closest('.roll-tools').hidden=arp;document.querySelector('#roll-help').hidden=arp;add.hidden=seq.type!=='endless';document.querySelector('.roll-heading').hidden=arp;if(arp)return;
  const {start,total}=view();canvas.dataset.columns=count();document.querySelector('#roll-range').textContent=`Steps ${start+1}–${start+count()} / ${total}`;document.querySelector('#roll-prev').disabled=start===0;document.querySelector('#roll-next').disabled=start+count()>=total;document.querySelector('#roll-pages').hidden=total<=32;add.disabled=seq.steps.length>=128;const width=Math.max(left+count()*32,Math.floor(canvas.parentElement.clientWidth));cell=(width-left)/count();if(canvas.width!==width)canvas.width=width;g.clearRect(0,0,width,canvas.height);g.font='10px '+getComputedStyle(document.body).getPropertyValue('--arcade-mono');g.textBaseline='middle';
  for(let r=0;r<24;r++){const n=low()+23-r,y=top+r*row;g.fillStyle=[1,3,6,8,10].includes(n%12)?'#f5f5f2':'#ffffff';g.fillRect(0,y,width,row);g.fillStyle='#777873';g.fillText(names[n%12]+(Math.floor(n/12)-1),5,y+row/2);g.strokeStyle='#e7e7e1';g.beginPath();g.moveTo(left,y);g.lineTo(width,y);g.stroke();}
  for(let i=0;i<count();i++){const x=left+i*cell;g.fillStyle='#777873';g.fillText(start+i+1,x+8,12);g.strokeStyle=i%4===0?'#c5c5bd':'#e7e7e1';g.beginPath();g.moveTo(x,top);g.lineTo(x,canvas.height);g.stroke();const step=seq.steps[start+i];if(step?.tie){g.fillStyle='#e7804540';g.fillRect(x,top,cell,24*row);}for(const n of step?.notes||[]){if(n<low()||n>low()+23)continue;g.fillStyle='#c73136';g.fillRect(x+2,top+(low()+23-n)*row+2,cell-4,row-4);}if(seq.type==='pattern'&&i>=seq.length){g.fillStyle='#ffffffaa';g.fillRect(x,top,cell,24*row);}}
  g.strokeStyle='#232421';g.lineWidth=2;g.strokeRect(left+Math.min(count()-1,getCursor()-start)*cell+1,top+(low()+23-pitch)*row+1,cell-2,row-2);g.lineWidth=1;
  canvas.setAttribute('aria-label',`Piano roll editor: step ${getCursor()+1}, ${names[pitch%12]}${Math.floor(pitch/12)-1}`);
 }
 function edit(step,n,erase){const seq=getSequence();while(seq.steps.length<=step)seq.steps.push({notes:[],tie:false});const entry=seq.steps[step];entry.tie=false;entry.notes=entry.notes.filter(v=>v!==n);if(!erase)entry.notes.push(n);onCursor(step);pitch=n;onChange();}
 function at(e){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height,step=Math.floor((x-left)/cell),n=low()+23-Math.floor((y-top)/row);return step>=0&&step<count()&&n>=low()&&n<low()+24?{step:step+view().start,n}:null;}
 canvas.onpointerdown=e=>{if(e.button!==0)return;const pos=at(e);if(!pos)return;e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);painting={erase:getSequence().steps[pos.step]?.notes.includes(pos.n)||false,last:pos.step+':'+pos.n};edit(pos.step,pos.n,painting.erase);};
 canvas.onpointermove=e=>{if(!painting)return;const pos=at(e);if(!pos||painting.last===pos.step+':'+pos.n)return;painting.last=pos.step+':'+pos.n;edit(pos.step,pos.n,painting.erase);};
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>painting=null;
 canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Delete','Backspace'].includes(e.code))return;e.preventDefault();e.stopPropagation();let step=getCursor();if(e.code==='ArrowLeft')step=Math.max(0,step-1);if(e.code==='ArrowRight')step=Math.min(view().total-1,step+1);if(e.code==='ArrowUp')pitch=Math.min(low()+23,pitch+1);if(e.code==='ArrowDown')pitch=Math.max(low(),pitch-1);onCursor(step);if(['Space','Delete','Backspace'].includes(e.code))edit(step,pitch,e.code!=='Space'||getSequence().steps[step]?.notes.includes(pitch));else render();};
 octave.onchange=()=>{octave.value=Math.max(0,Math.min(7,Number(octave.value)||0));pitch=Math.max(low(),Math.min(low()+23,pitch));render();};
 add.onclick=()=>{const seq=getSequence();if(seq.steps.length>=128)return;seq.steps.push({notes:[],tie:false});onCursor(seq.steps.length-1);onChange();};
 document.querySelector('#roll-prev').onclick=()=>{onCursor(Math.max(0,view().start-32));onChange();};document.querySelector('#roll-next').onclick=()=>{onCursor(Math.min(view().total-1,view().start+32));onChange();};
 new ResizeObserver(()=>render()).observe(canvas.parentElement);
 return {render};
}
