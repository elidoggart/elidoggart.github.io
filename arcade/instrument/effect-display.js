/* SPDX-License-Identifier: GPL-3.0-or-later. Original canvas artwork. */
import {cwoFrequency} from './modules.js';
const colors=['#72bce5','#6dc98c','#f0f0e6','#e78045'];
export function drawEffect(g,type,p,peak,time,enabled=true){
 g.save();g.globalAlpha=enabled?1:.35;
 const t=enabled?time:0,energy=enabled?Math.min(1,peak*8):0;
 g.lineWidth=4;g.lineCap='round';g.lineJoin='round';
 const text=(value,x,y,color=colors[2],size=19)=>{g.fillStyle=color;g.font=size+'px monospace';g.fillText(String(value),x,y);};
 const meter=(x,y,v,color)=>{for(let i=0;i<12;i++){g.fillStyle=i/12<v?color:'#39413c';g.fillRect(x,y-i*8,18,3);}};
 const dial=(x,y,v,color)=>{for(let i=0;i<9;i++){const a=Math.PI*(1.1+i*.1);g.strokeStyle='#60716c';g.beginPath();g.moveTo(x+Math.cos(a)*24,y+Math.sin(a)*24);g.lineTo(x+Math.cos(a)*31,y+Math.sin(a)*31);g.stroke();}const a=Math.PI*(1.1+v*.8);g.strokeStyle=color;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*26,y+Math.sin(a)*26);g.stroke();};
 const number=(label,v,x,y,color)=>{text(label,x,y,color,18);text(Math.round(v*99),x,y+38,color,35);};
 const line=(points,color=colors[2])=>{g.strokeStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const ellipse=(x,y,rx,ry,color,fill=false)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.strokeStyle=color;g.fillStyle=color;fill?g.fill():g.stroke();};
 if(type==='cwo'){
  // Draw on a six-pixel grid so the silhouette remains clear on the small screen.
  // Motion is deliberately limited to a pixel or two; parameter changes keep its anatomy intact.
  const ink='#d8e4df',coat='#7d9699',shade='#52676c',unit=6;
  const bob=0;
  g.save();g.translate(570,25);g.scale(-5.2,5.2);g.globalAlpha=enabled?1:.4;
  const block=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  const shape=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle='#252d2c';g.fill();g.strokeStyle=color;g.lineWidth=.65;g.stroke();};
  // Far legs, tail and udder sit behind the broad body.
  block(33,30,5,10,shade);block(61,29,5,11,shade);
  block(33,39,6,3,ink);block(61,39,6,3,ink);
  const swish=0;
  shape([[23,17],[19,17],[19,23],[17+swish,23],[17+swish,29],[15+swish,29],[15+swish,21],[17,21],[17,15],[23,15]],coat);
  block(14+swish,28,5,6,ink);
  shape([[46,30],[58,30],[58,35],[55,35],[55,37],[53,37],[53,35],[49,35],[49,37],[47,37],[47,34],[46,34]],'#c99780');
  // Solid, stepped outline and rounded rump, chest and belly.
  shape([[25,12],[60,12],[65,15],[68,21],[66,29],[62,33],[29,33],[24,30],[22,26],[22,18]],coat);
  // Near legs and square black hooves, shorter and heavier than the old wire drawing.
  shape([[27,29],[33,30],[33,39],[35,39],[35,42],[26,42],[26,39],[27,39]],coat);
  shape([[59,29],[65,28],[65,39],[67,39],[67,42],[58,42],[58,39],[59,39]],coat);
  block(26,39,9,3,ink);block(58,39,9,3,ink);
  // Neck, ears and two small horns frame the recognizable cow head.
  shape([[60,15],[62,8],[67,6],[77,7],[80,12],[79,25],[74,29],[64,26]],coat);
  shape([[63,10],[57,8],[54,9],[57,13],[63,14]],coat);
  shape([[77,10],[82,8],[85,9],[82,13],[78,14]],coat);
  block(58,10,4,2,shade);block(80,10,3,2,shade);
  shape([[65,7],[63,4],[63,1],[65,1],[66,5],[68,7]],colors[0]);
  shape([[74,7],[76,4],[76,1],[78,1],[78,5],[77,8]],colors[0]);
  shape([[68,6],[74,6],[74,12],[71,14],[68,12]],ink);
  const blink=false;
  block(65,15,3,blink?1:3,ink);block(75,15,3,blink?1:3,ink);
  if(!blink){block(65,15,1,1,coat);block(75,15,1,1,coat);}
  // Broad warm muzzle with dark nostrils and a small mouth.
  shape([[65,21],[78,21],[80,23],[80,27],[78,29],[65,29],[63,27],[63,23]],colors[3]);
  block(66,23,3,2,ink);block(75,23,3,2,ink);block(69,27,5,1,ink);
  // Familiar CWO anatomy: throat, rotor, large stomach, intestine and outlet.
  const wire=(points,color,width=.55)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
  const ring=(x,y,r,color)=>{g.strokeStyle=color;g.lineWidth=.65;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();};
  wire([[64,23],[60,20],[58,16],[54,15]],colors[0]);wire([[64,24],[59,22],[56,18],[53,18]],'#657c92');
  ring(55,19,3.6,colors[0]);const angle=t*(p[0]*2-1)*8;
  wire([[55-2.5*Math.cos(angle),19-2.5*Math.sin(angle)],[55+2.5*Math.cos(angle),19+2.5*Math.sin(angle)]],colors[0]);
  ring(55,27,3.3,colors[1]);wire([[55,22.6],[55,23.7]],colors[1]);
  const delay=.001+p[1]*.75,travel=t/(.3+delay*6);
  for(let i=0;i<4;i++){const a=travel*Math.PI*2+i*Math.PI/2;block(55+Math.cos(a)*2-.45,27+Math.sin(a)*2-.45,.9,.9,colors[i]);}
  const stomach=7+p[1]*2;
  ring(43,23,stomach,'#9e9dbd');wire([[51.7,27],[49,27]],colors[1]);
  g.save();g.beginPath();g.arc(43,23,stomach-.8,0,Math.PI*2);g.clip();
  for(let i=0;i<6;i++){const x=36+i*2.6,phase=(travel+i*.17)%1,height=2+p[2]*11;g.globalAlpha=(enabled?1:.4)*(.3+.7*p[2]);for(let j=0;j<4;j++)block(x,14+phase*5+j*5, .65,height/5,colors[(i+j)%4]);}g.restore();
  // The orange intestine and outlet show the sideband balance; feedback feeds the stomach.
  const intestine=[];for(let i=0;i<=50;i++)intestine.push([35-i*.19,19+Math.sin(i*.5)*(1+p[3]*1.7)]);wire(intestine,colors[3]);
  wire([[25.5,19],[24,19],[24,25],[28,25]],colors[3]);ring(31,27,3.5,colors[3]);
  for(let i=0;i<5;i++){g.globalAlpha=(enabled?1:.4)*(.2+.8*(i<2?1-p[3]:p[3]));wire([[28.5,25+i],[33.5,25+i]],colors[3],.4);}g.globalAlpha=enabled?1:.4;
  g.restore();
  text('FREQ',20,39,colors[0]);dial(63,88,p[0],colors[0]);text(cwoFrequency(p[0]).toFixed(0),20,130,colors[0],28);
  text('DELAY',20,166,colors[1]);text(Math.round((.001+p[1]*.75)*1000),20,205,colors[1],35);text('ms',83,205,colors[1],16);
  number('FDBACK',p[2],20,245,colors[2]);text('SIDEBAND',510,42,colors[3],16);meter(550,178,p[3],colors[3]);text(Math.round(p[3]*100)+'%',518,218,colors[3],26);
 }else{
  // Shared X-ray shells and signal traces; all geometry reads the live DSP parameters.
  const shell=(points)=>{g.fillStyle='#252d2c';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.strokeStyle='#7d9699';g.lineWidth=3;g.stroke();};
  const trace=(points,color)=>{g.lineWidth=3;line(points,color);};
  const dot=(x,y,color,r=5)=>ellipse(x,y,r,r,color,true);
  const pulse=(points,phase,color)=>{const n=points.length-1,u=((phase%1)+1)%1*n,i=Math.floor(u),f=u-i;dot(points[i][0]*(1-f)+points[i+1][0]*f,points[i][1]*(1-f)+points[i+1][1]*f,color,4+energy*3);};
  const output=(x,y,amount)=>{trace([[x-20,y],[x+20,y]],colors[3]);ellipse(x+32,y,9,9,colors[3]);g.globalAlpha=(enabled?1:.35)*(.2+.8*amount);dot(x+32,y,colors[3],5+energy*3);g.globalAlpha=enabled?1:.35;};
  if(type==='grid'){
   // The original's X/Y floor and floating Z-feedback cube.
   const project=(x,y,z=0)=>[300+(x-y)*24,190+(x+y)*10-z];
   for(let i=-5;i<=5;i++){trace([project(i,-5),project(i,5)],'#55516d');trace([project(-5,i),project(5,i)],'#55516d');}
   const x=1+p[0]*3,y=1+p[1]*3,h=28+p[2]*55;
   const base=[project(-x,-y),project(x,-y),project(x,y),project(-x,y)],top=[project(-x,-y,h),project(x,-y,h),project(x,y,h),project(-x,y,h)];
   trace([...base,base[0]],colors[0]);trace([...top,top[0]],colors[1]);for(let i=0;i<4;i++)trace([base[i],top[i]],colors[i%2]);
   pulse([...top,top[0]],t*(.2+p[2]),colors[2]);text('X',72,160,colors[0],25);text('Y',260,48,colors[1],25);number('Z FDB',p[2],475,70,colors[2]);text('MIX',553,62,colors[3]);meter(569,246,p[3],colors[3]);
  }else if(type==='phone'){
   // Exploded landline: floating handset, keypad board, circuitry and lower shell.
   const spread=10+p[1]*18;
   const layer=(cy,color)=>{const pts=[[193,cy],[335,cy-53],[445,cy-10],[300,cy+47],[193,cy]];trace(pts,color);};
   layer(220,'#7d9699');layer(200-spread*.4,colors[2]);layer(158-spread, '#9e9dbd');
   for(let i=0;i<12;i++){const x=268+(i%3)*24+Math.floor(i/3)*9,y=164-spread*.4+Math.floor(i/3)*10-(i%3)*8;g.strokeStyle=colors[2];g.strokeRect(x,y,13,7);}
   // Oversized stepped handset is the cartoon counterpart of the floating receiver.
   shell([[207,130-spread],[219,103-spread],[248,91-spread],[269,103-spread],[263,116-spread],[337,89-spread],[338,73-spread],[369,59-spread],[398,72-spread],[399,96-spread],[370,110-spread],[348,103-spread],[271,134-spread],[244,148-spread]]);
   for(let i=0;i<4;i++)trace([[348+i*7,79-spread],[370+i*6,71-spread]],'#9e9dbd');
   const signal=[];for(let i=0;i<36;i++)signal.push([211+i*2,203+Math.sin(i*.5-t*(.5+p[2]*8))*p[0]*8]);trace(signal,colors[0]);
   ellipse(235,210,14,7,colors[1]);ellipse(394,151,14,7,colors[3]);pulse([[250,210],[300,230],[394,190],[394,151]],t*(.4+p[3]*2),colors[3]);
   number('TONE',p[0],20,45,colors[0]);number('PHONIC',p[1],20,220,colors[1]);number('BAUD',p[2],510,45,colors[2]);number('TELEM',p[3],510,220,colors[3]);
  }else if(type==='nitro'){
   // Cockpit / road view, matching the recognizable Nitro dashboard metaphor.
   trace([[60,48],[188,62],[453,62],[580,48]],'#8e8bad');
   const horizon=105;for(let i=0;i<11;i++){const progress=((i/11+t*(.12+p[1]*.22))%1),y=horizon+progress*progress*125,w=40+progress*220;trace([[320-w,y],[320+w,y]],i%2?colors[0]:colors[1]);}
   for(let i=0;i<45;i++){const x=224+i*4.3,shape=Math.exp(-(((i-22)/11)**2)),h=shape*(15+p[2]*48)*(1+.25*Math.sin(i*2+t*4));trace([[x,horizon],[x,horizon-h]],colors[2]);}
   shell([[40,244],[231,244],[272,270],[368,270],[409,244],[600,244],[600,286],[40,286]]);
   shell([[287,278],[294,260],[300,232],[295,214],[300,196],[321,190],[339,197],[343,212],[335,232],[341,262],[351,278]]);
   text('R',309,216,colors[2],22);trace([[300,228],[335,228]],colors[2]);
   text('FREQ',50,100,colors[0]);dial(92,150,p[0],colors[0]);text('FREQ',510,100,colors[3]);dial(550,150,p[3],colors[3]);
   text('FF '+Math.round(p[1]*99),62,276,colors[1],23);text('RES '+Math.round(p[2]*99),441,276,colors[2],23);
  }else if(type==='punch'){
   // Cartoon boxer: compact body, expressive face and large moving gloves.
   const punch=enabled?Math.max(0,Math.sin(t*(1+p[2]*4)))*(.15+energy)*p[3]*36:0;
   shell([[276,116],[247,140],[231,192],[251,220],[264,248],[245,284],[285,284],[315,251],[345,284],[385,284],[363,239],[374,200],[354,145],[330,118]]);
   g.strokeStyle=colors[1];g.lineWidth=4;g.beginPath();g.ellipse(307,88,32,40,0,0,Math.PI*2);g.stroke();
   trace([[280,68],[292,55],[319,55],[333,70]],colors[1]);trace([[287,88],[297,92],[303,88]],colors[1]);trace([[313,88],[323,92],[329,87]],colors[1]);trace([[301,110],[315,110]],colors[1]);
   trace([[270,151],[248,177],[279,196]],colors[1]);trace([[342,150],[366,166],[386+punch,150]],colors[1]);
   ellipse(296,205,34+p[1]*5,27,colors[0]);ellipse(404+punch,147,29,35,colors[3]);trace([[384+punch,173],[418+punch,174]],colors[3]);
   trace([[276,241],[310,232],[347,242]],'#9e9dbd');
   text('FREQ',20,44,colors[0]);dial(63,95,p[0],colors[0]);number('PUNCH',p[1],20,210,colors[1]);number('ROUNDS',p[2],500,48,colors[2]);number('POWER',p[3],500,220,colors[3]);
  }else if(type==='spring'){
   // A single long helical spring, rather than a tank of three unrelated coils.
   text('TURNS '+Math.round(4+p[1]*16),235,62,colors[1],23);
   const turns=4+p[1]*16,coil=[];trace([[100,180],[142,180]],colors[0]);
   for(let i=0;i<=600;i++){const u=i/600,phase=u*Math.PI*2*turns,decay=1-p[2]*.7,vibration=Math.sin(t*(2+p[0]*8)-u*12)*energy*decay*9;coil.push([150+u*320+Math.cos(phase)*13,180+Math.sin(phase)*(32+decay*10)+vibration]);}trace(coil,colors[2]);trace([[483,180],[515,180],[525,163]],colors[2]);
   text('T',53,190,colors[0],35);text(Math.round(p[0]*99),35,229,colors[0],24);text('DAMP '+Math.round(p[2]*99),230,269,colors[2],23);meter(568,235,p[3],colors[3]);
  }else{
   // Concentric delay-time circles and rotating input vector, as in the OP-1 display.
   g.strokeStyle='#5b526c';g.strokeRect(147,42,275,244);
   const center=[326,193],radius=35+p[0]*57;
   for(let i=0;i<5;i++){const r=radius*(1-i*.17);ellipse(center[0]-radius+r,center[1]-radius+r,r,r,colors[0]);}
   const a=t*(.5+p[1]*1.5);trace([[147,193],[326,193]],colors[3]);ellipse(326,193,9,9,colors[3]);trace([[326,193],[326+Math.cos(a)*48,193+Math.sin(a)*48]],colors[1]);
   text('INPUT',36,198,colors[3],19);text('R '+Math.round(p[0]*99),161,65,colors[0]);number('FDB',p[2],465,65,colors[2]);number('SPEED',p[1],465,174,colors[1]);text('MIX',556,45,colors[3],16);meter(570,275,p[3],colors[3]);
  }
 }
 for(let i=0;i<4;i++){g.fillStyle=colors[i];g.fillRect(40+i*150,298,Math.max(4,p[i]*110),4);}
 g.restore();
}
