/* SPDX-License-Identifier: GPL-3.0-or-later. Original canvas artwork. */
const colors=['#72bce5','#6dc98c','#f0f0e6','#e78045'];
export function drawEffect(g,type,p,peak,time,enabled=true){
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
 }else if(type==='grid'){
  const w=130+p[0]*120,h=50+p[1]*85,d=30+p[2]*55,x=300-w/2,y=160-h/2;for(let i=0;i<=5;i++){const n=i/5;line([[x+n*w,y],[x+n*w+d,y-d],[x+n*w+d,y+h-d],[x+n*w,y+h],[x+n*w,y]],colors[i%4]);line([[x,y+n*h],[x+w,y+n*h],[x+w+d,y+n*h-d]],colors[1]);}
 }else if(type==='phone'){
  g.strokeStyle=colors[2];g.strokeRect(210,45,220,225);g.strokeStyle=colors[0];g.strokeRect(235,65,170,45);for(let i=0;i<12;i++)ellipse(255+(i%3)*65,140+Math.floor(i/3)*30,9,8,colors[(i+Math.floor(time*p[2]*6))%4]);line([[185,80],[160,90],[150,135],[160,180],[185,190]],colors[3]);
 }else if(type==='nitro'||type==='punch'){
  for(let j=0;j<(type==='nitro'?2:1);j++){const cutoff=p[j?3:0],pts=[];for(let i=0;i<120;i++){const x=i/119,y=240-160/(1+Math.exp((x-cutoff)*25));pts.push([40+x*560,j?290-y:y]);}line(pts,colors[j?3:0]);ellipse(40+cutoff*560,150,10+p[2]*12,10+p[2]*12,colors[1]);}
 }else if(type==='spring'){
  const pts=[];for(let i=0;i<400;i++){const x=i/399,amplitude=55*(1-x*p[2]);pts.push([55+x*530,155+Math.sin(x*Math.PI*(12+p[1]*24))*amplitude]);}line(pts,colors[1]);
 }else{
  for(let i=0;i<8;i++){const x=55+i*75,h=140*Math.pow(.25+p[2]*.7,i);g.globalAlpha=1-i*.1;line([[x,230],[x,230-h],[x+25,230-h],[x+25,230]],colors[i%4]);}g.globalAlpha=1;
 }
 for(let i=0;i<4;i++){g.fillStyle=colors[i];g.fillRect(40+i*150,298,Math.max(4,p[i]*110),4);}
}
