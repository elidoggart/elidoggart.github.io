/* SPDX-License-Identifier: GPL-3.0-or-later
 * Independently drawn displays. Layout references: R246 bendlfo.svg,
 * cranklfo.svg, adsr.svg. Palette values measured from colors.svg.
 * Static firmware SVGs contain alternate layers; no firmware artwork is loaded.
 */
import {wave} from './modules.js';
export const screenPalette={black:'#010000',blue:'#698EFF',green:'#00ED95',white:'#FFFFFF',orange:'#FF423F',red:'#FF3A5D',grey:'#7C7990',purple:'#AEB1DC',dark:'#00475B',knobs:['#698EFF','#00ED95','#FFFFFF','#FF423F']};
const P=screenPalette;
function circle(g,x,y,r,color,width=3){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();}
function line(g,points,color,width=3){g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
function text(g,value,x,y,color=P.white,size=18){g.fillStyle=color;g.font=size+'px monospace';g.textAlign='center';g.fillText(value,x,y);}
function route(g,x,y,field,parameter){
 const colors=P.knobs;for(let i=0;i<4;i++){const a=i*Math.PI/2-Math.PI/2;circle(g,x+Math.cos(a)*49,y+Math.sin(a)*49,5,colors[i],i===parameter?5:2);}
 text(g,['SYN','ENV','FX'][field]||'SYN',x,y+7,P.blue,20);
}
export function drawLFO(g,cfg,state){
 const p=cfg.lfo,type=cfg.lfoType,enabled=cfg.lfoOn,value=state.modulation||0;
 g.save();g.globalAlpha=enabled?1:.4;g.lineCap='round';
 if(type==='bend'){
  route(g,178,160,Math.round(p[0]*2),Math.round(p[1]*3));
  const bend=(p[3]*2-1)*(cfg.bendReverse?-1:1),angle=bend*.72;
  circle(g,404,160,39,P.purple,4);circle(g,348,144,7,P.purple,3);circle(g,348,176,7,P.purple,3);
  g.save();g.translate(404,160);g.rotate(angle);line(g,[[-72,0],[72,0]],P.red,10);circle(g,0,0,25,P.red,4);circle(g,98,0,39,P.red,4);line(g,[[-8,8],[8,-8]],P.red,5);g.restore();
  text(g,Math.round(p[2]*100)+'%',582,38,P.white,24);text(g,'BEND',405,282,P.grey,16);
 }else if(type==='crank'){
  const angle=(cfg.crankPhase||0)*Math.PI*2;
  // Belt and two pulleys retain the reference screen's silhouette.
  g.strokeStyle=P.red;g.lineWidth=4;g.beginPath();g.moveTo(150,116);g.lineTo(344,69);g.bezierCurveTo(478,26,515,270,371,254);g.lineTo(150,194);g.bezierCurveTo(104,184,104,128,150,116);g.stroke();
  circle(g,370,160,83,P.purple,4);circle(g,160,160,40,P.purple,4);
  g.save();g.translate(160,160);g.rotate(angle);line(g,[[0,0],[0,-46]],P.purple,13);circle(g,0,-46,19,P.blue,4);circle(g,0,-46,10,P.blue,4);g.restore();
  for(const a of [angle,angle+Math.PI])line(g,[[370+Math.cos(a)*58,160+Math.sin(a)*58],[370+Math.cos(a)*75,160+Math.sin(a)*75]],P.purple,4);
  route(g,370,160,Math.round(p[2]*2),Math.round(p[3]*3));text(g,Math.round(p[1]*100),544,174,P.green,36);text(g,'CRANK',160,282,P.grey,16);
 }else{
  text(g,type.toUpperCase(),90,38,P.blue,20);
  const field=Math.round(p[2]*2),param=Math.round(p[3]*3);
  if(type!=='tremolo')route(g,520,150,field,type==='random'?-1:param);
  const right=type==='tremolo'?590:410;
  line(g,[[42,160],[right,160]],P.dark,2);g.beginPath();g.strokeStyle=P.green;g.lineWidth=3;
  for(let i=0;i<=right-42;i++){const x=42+i,y=160-65*wave(i/190,cfg.lfoShape);i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
  circle(g,65,270,20,P.blue);const phase=(state.lfoPhase||0)*Math.PI*2;line(g,[[65,270],[65+Math.sin(phase)*15,270-Math.cos(phase)*15]],P.blue,3);
  circle(g,320+value*180,270,8,P.orange,5);
  if(type==='tremolo'){text(g,'PITCH '+Math.round(p[1]*100)+'%',200,40,P.green,16);text(g,'VOL '+Math.round(p[2]*100)+'%',460,40,P.white,16);}
 }
 g.restore();
}
export function drawEnvelope(g,adsr){
 const [attack,decay,sustain,release]=adsr,total=attack+decay+release+1,scale=530/total,x0=54,x1=x0+attack*scale,x2=x1+decay*scale,x3=x2+scale,y=272-sustain*220;
 g.save();g.strokeStyle=P.blue;g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(x0,272);g.quadraticCurveTo(x0+(x1-x0)*.3,52,x1,52);g.quadraticCurveTo(x1+(x2-x1)*.3,y,x2,y);g.lineTo(x3,y);g.quadraticCurveTo(x3+(584-x3)*.3,272,584,272);g.stroke();
 [x1,x2,x3,584].forEach((x,i)=>{circle(g,x,[52,y,y,272][i],5,P.knobs[i],3);});g.restore();
}
