/* SPDX-License-Identifier: GPL-3.0-or-later. Original canvas artwork. */
const colors=['#72bce5','#6dc98c','#f0f0e6','#e78045'];
export function drawEffect(g,type,p,peak,time,enabled=true){
 g.save();g.globalAlpha=enabled?1:.35;
 const t=enabled?time:0,energy=enabled?Math.min(1,peak*8):0;
 g.lineWidth=4;g.lineCap='round';g.lineJoin='round';
 const line=(points,color=colors[2])=>{g.strokeStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const ellipse=(x,y,rx,ry,color,fill=false)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.strokeStyle=color;g.fillStyle=color;fill?g.fill():g.stroke();};
 if(type==='cwo'){
  // Draw on a six-pixel grid so the silhouette remains clear on the small screen.
  // Motion is deliberately limited to a pixel or two; parameter changes keep its anatomy intact.
  const ink='#d8e4df',coat='#7d9699',shade='#52676c',unit=6;
  const bob=0;
  g.save();g.translate(32,16+bob*unit);g.scale(unit,unit);g.globalAlpha=enabled?1:.4;
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
  // X-ray signal path: input → frequency shifter → delay → sideband output.
  const wire=(points,color,width=.55)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
  const ring=(x,y,r,color)=>{g.strokeStyle=color;g.lineWidth=.65;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();};
  wire([[64,23],[59,19],[54,19]],colors[0]);
  ring(49,20,5,colors[0]);
  const frequency=(p[0]*2-1),angle=enabled?time*frequency*8:0;
  wire([[49-3*Math.cos(angle),20-3*Math.sin(angle)],[49+3*Math.cos(angle),20+3*Math.sin(angle)]],colors[0],.8);
  wire([[44,20],[40,20]],colors[1]);
  ring(34,23,6,colors[1]);
  const delay=.001+p[1]*.75,travel=enabled?(time/(delay*6+.3))%1:0;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;block(34+Math.cos(a)*4.2-.5,23+Math.sin(a)*4.2-.5,1,1,'#435852');}
  const a=travel*Math.PI*2;block(34+Math.cos(a)*4.2-.7,23+Math.sin(a)*4.2-.7,1.4,1.4,colors[1]);
  // Feedback wraps back to the input; each repeat has the actual feedback decay.
  wire([[29,19],[29,15],[53,15],[53,17]],'#67736d');
  for(let i=0;i<5;i++){g.globalAlpha=(enabled?1:.4)*Math.pow(p[2]*.92,i+1);block(31+i*4,14.3,2,1.4,colors[2]);}g.globalAlpha=enabled?1:.4;
  wire([[40,25],[44,28],[49,28]],colors[3]);ring(54,27,4,colors[3]);
  for(let i=0;i<5;i++){const balance=(i-2)/2,alpha=.2+.8*(balance<0?1-p[3]:balance>0?p[3]:.5);g.globalAlpha=(enabled?1:.4)*alpha;wire([[51,25+i],[57,25+i]],colors[3],.5);}g.globalAlpha=enabled?1:.4;
  wire([[58,27],[61,27],[63,24]],colors[3]);
  g.restore();
 }else{
  // Shared X-ray shells and signal traces; all geometry reads the live DSP parameters.
  const shell=(points)=>{g.fillStyle='#252d2c';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.strokeStyle='#7d9699';g.lineWidth=3;g.stroke();};
  const trace=(points,color)=>{g.lineWidth=3;line(points,color);};
  const dot=(x,y,color,r=5)=>ellipse(x,y,r,r,color,true);
  const pulse=(points,phase,color)=>{const n=points.length-1,u=((phase%1)+1)%1*n,i=Math.floor(u),f=u-i;dot(points[i][0]*(1-f)+points[i+1][0]*f,points[i][1]*(1-f)+points[i+1][1]*f,color,4+energy*3);};
  const output=(x,y,amount)=>{trace([[x-20,y],[x+20,y]],colors[3]);ellipse(x+32,y,9,9,colors[3]);g.globalAlpha=(enabled?1:.35)*(.2+.8*amount);dot(x+32,y,colors[3],5+energy*3);g.globalAlpha=enabled?1:.35;};
  if(type==='grid'){
   const w=190+p[0]*120,h=90+p[1]*80,d=48,x=310-w/2,y=150-h/2;
   shell([[x,y],[x+d,y-d],[x+w+d,y-d],[x+w+d,y+h-d],[x+w,y+h],[x,y+h]]);
   for(let i=0;i<=4;i++){const n=i/4;trace([[x+n*w,y],[x+n*w+d,y-d]],colors[0]);trace([[x,y+n*h],[x+w,y+n*h],[x+w+d,y+n*h-d]],'#52676c');}
   trace([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],colors[1]);
   const route=[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
   for(let i=0;i<4;i++){g.globalAlpha=(enabled?1:.35)*Math.pow(.1+p[2]*.87,i);pulse(route,t/(1+p[0]+p[1])-i*.14,colors[2]);}g.globalAlpha=enabled?1:.35;output(x+w+45,y+h/2,p[3]);
  }else if(type==='phone'){
   shell([[200,38],[415,38],[435,58],[435,258],[200,258]]);
   shell([[170,58],[185,58],[185,100],[170,110],[170,191],[185,201],[185,240],[160,240],[143,215],[143,85]]);
   trace([[185,220],[190,220],[190,270],[228,270],[228,258]],'#7d9699');
   g.strokeStyle='#52676c';g.strokeRect(223,62,189,76);
   const wave=[];for(let i=0;i<48;i++){const x=i/47,steps=3+Math.round((1-p[1])*9),v=Math.round(Math.sin(x*(8+p[0]*20)-t*(1+p[2]*8))*steps)/steps;wave.push([230+x*174,100+v*24]);}trace(wave,colors[0]);
   for(let i=0;i<12;i++){const x=238+i%3*66,y=161+Math.floor(i/3)*23;g.strokeStyle='#52676c';g.strokeRect(x,y,32,15);}
   const active=Math.floor(t*(1+p[2]*15))%12;dot(254+active%3*66,168+Math.floor(active/3)*23,colors[1],4);
   trace([[435,157],[470,157]],colors[2]);const carrier=[];for(let i=0;i<48;i++)carrier.push([470+i*1.7,157+Math.sin(i*.2*(1+p[3]*5)-t*5)*p[3]*23]);trace(carrier,colors[3]);
  }else if(type==='nitro'){
   for(let j=0;j<2;j++){
    const x=168+j*210,f=j?(p[3]*(1-p[1])+p[0]*p[1]):p[0];
    shell([[x+28,38],[x+72,38],[x+72,65],[x+100,86],[x+100,252],[x,252],[x,86],[x+28,65]]);
    trace([[x+35,29],[x+65,29]],colors[j?3:0]);
    const height=35+f*125;g.fillStyle=j?'#40332a':'#253944';g.fillRect(x+9,242-height,82,height);trace([[x+9,242-height],[x+91,242-height]],colors[j?3:0]);
    for(let i=0;i<4;i++){const phase=(t*(.25+p[2]*2)+i/4)%1;ellipse(x+25+(i%2)*45,237-phase*height,3+p[2]*7,3+p[2]*7,colors[2]);}
   }
   const link=[[268,116],[320,116],[320,196],[378,196]];trace(link,colors[1]);pulse(link,t*(.2+p[1]*1.8),colors[1]);
  }else if(type==='punch'){
   // A compact piston compressor: cutoff position, resonance, drive stages, output power.
   shell([[145,74],[175,48],[415,48],[445,74],[445,248],[145,248]]);
   shell([[185,72],[405,72],[405,205],[185,205]]);
   const piston=95+p[0]*80;trace([[295,75],[295,piston]],colors[0]);
   g.fillStyle='#364951';g.fillRect(205,piston,180,19);trace([[205,piston],[385,piston]],colors[0]);
   for(let i=0;i<4;i++){const y=piston+29+i*10;trace([[220,y],[370,y]],i<=Math.round(p[2]*3)?colors[2]:'#40504a');}
   ellipse(295,225,12+p[1]*14,12+p[1]*14,colors[1]);
   const angle=t*(1+p[1]*5);dot(295+Math.cos(angle)*(12+p[1]*14),225+Math.sin(angle)*(12+p[1]*14),colors[1],3+energy*3);output(485,160,p[3]);
  }else if(type==='spring'){
   shell([[95,75],[119,52],[517,52],[541,75],[541,247],[95,247]]);
   for(const x of [113,523])for(const y of [70,230])ellipse(x,y,4,4,'#7d9699');
   for(let row=0;row<3;row++){const y=105+row*48,pts=[];trace([[115,y],[150,y]],colors[0]);
    for(let i=0;i<=240;i++){const x=i/240,vibration=(enabled?Math.sin(t*(4+p[0]*12)-x*10)*energy:0)*(1-p[2])*7;pts.push([150+x*330,y+Math.sin(x*Math.PI*(12+p[1]*24))*(11+(1-p[2])*7)+vibration]);}
    g.globalAlpha=(enabled?1:.35)*(.45+p[0]*.55);trace(pts,colors[row%3]);g.globalAlpha=enabled?1:.35;trace([[480,y],[520,y]],colors[2]);}
   output(565,153,p[3]);
  }else{
   shell([[90,64],[115,42],[500,42],[525,64],[525,245],[90,245]]);
   const radius=30+p[0]*20,speed=.5+p[1]*1.5;
   for(const x of [190,420]){ellipse(x,135,radius,radius,'#7d9699');ellipse(x,135,9,9,colors[0]);for(let i=0;i<3;i++){const a=t*speed*2+i*Math.PI*2/3;trace([[x+Math.cos(a)*15,135+Math.sin(a)*15],[x+Math.cos(a)*(radius-8),135+Math.sin(a)*(radius-8)]],colors[1]);}}
   const tape=[[190,135+radius],[190,206],[420,206],[420,135+radius]];trace(tape,'#7d9699');
   const delay=(.03+p[0]*.9)/speed;for(let i=0;i<5;i++){g.globalAlpha=(enabled?1:.35)*Math.pow(.1+p[2]*.84,i);pulse(tape,t/(.4+delay*3)-i*.15,colors[2]);}g.globalAlpha=enabled?1:.35;
   output(555,135,p[3]);
  }
 }
 for(let i=0;i<4;i++){g.fillStyle=colors[i];g.fillRect(40+i*150,298,Math.max(4,p[i]*110),4);}
 g.restore();
}
