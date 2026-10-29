/* SPDX-License-Identifier: GPL-3.0-or-later. Original canvas artwork. */
const colors=['#72bce5','#6dc98c','#f0f0e6','#e78045'];
export function drawEffect(g,type,p,peak,time){
 g.lineWidth=4;g.lineCap='round';g.lineJoin='round';
 const line=(points,color=colors[2])=>{g.strokeStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const ellipse=(x,y,rx,ry,color,fill=false)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.strokeStyle=color;g.fillStyle=color;fill?g.fill():g.stroke();};
 if(type==='cwo'){
  const bob=Math.sin(time*(2+p[0]*8))*Math.min(8,peak*40),width=150+p[1]*100,headY=90+bob,front=220+width;
  // Cow silhouette: stretching body, ears/horns, muzzle, four legs and swishing tail.
  line([[220,130+bob],[front,130+bob],[front+15,headY],[front+65,headY-8],[front+85,headY+30],[front+75,headY+65],[front+25,headY+64],[front,178+bob],[220,188+bob],[205,160+bob],[220,130+bob]]);
  line([[front+20,headY],[front+10,headY-26],[front+35,headY-12]],colors[0]);line([[front+55,headY-6],[front+60,headY-30],[front+73,headY-12]],colors[0]);
  ellipse(front+62,headY+43,27,18,colors[3]);ellipse(front+55,headY+39,3,4,colors[3],true);ellipse(front+71,headY+39,3,4,colors[3],true);
  ellipse(front+49,headY+14,4+p[3]*4,5,colors[0],true);
  const stride=Math.sin(time*4)*Math.min(10,peak*60),leg=40+p[2]*35;
  for(const [x,s] of [[230,1],[255,-1],[front-35,-1],[front-10,1]])line([[x,181+bob],[x+s*stride,181+leg],[x+14+s*stride,181+leg]],colors[2]);
  ellipse(265,150+bob,18,12,colors[1],true);ellipse(front-40,158+bob,23,16,colors[1],true);
  line([[213,140+bob],[180,118],[166+Math.sin(time*3)*8,146],[158,158]],colors[3]);
  // Repeating delay traces behind the animal respond to the green knob.
  for(let i=0;i<1+Math.round(p[1]*4);i++){g.globalAlpha=.18+i*.12;line([[80+i*24,145],[80+i*24,205]],colors[1]);}g.globalAlpha=1;
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
