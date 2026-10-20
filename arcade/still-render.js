import {WEAPONS,isFirearm} from './still-engine.js?v=arsenal-replay-1';
const INK='#232421',RED='#c73136',LINE='#e5e5de';
export class StillRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.faces=[];this.lines=[];}
 camera(v){const p=this.view||this.game.player,dx=v[0]-p.x,dz=v[2]-p.z,dy=v[1]-p.y,s=Math.sin(p.yaw),c=Math.cos(p.yaw),f=dx*s+dz*c,cp=Math.cos(p.pitch),sp=Math.sin(p.pitch);return [dx*c-dz*s,dy*cp-f*sp,f*cp+dy*sp];}
 project(v){return [this.w/2+v[0]/v[2]*this.f,this.h*.47-v[1]/v[2]*this.f]}
 clip(points){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],inside=a[2]>.08,next=b[2]>.08;if(inside)out.push(a);if(inside!==next){const t=(.08-a[2])/(b[2]-a[2]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;}
 face(points,color=INK,fill='white',width=1.1){const camera=points.map(v=>this.camera(v)),clipped=this.clip(camera);if(clipped.length<3)return;this.faces.push({points:clipped.map(v=>this.project(v)),depth:camera.reduce((a,b)=>a+b[2],0)/camera.length,color,fill,width});}
 line(a,b,color=LINE,width=1,dashed=false){let x=this.camera(a),y=this.camera(b);if(x[2]<.08&&y[2]<.08)return;if(x[2]<.08||y[2]<.08){const t=(.08-x[2])/(y[2]-x[2]),m=x.map((v,k)=>v+(y[k]-v)*t);if(x[2]<.08)x=m;else y=m;}this.faces.push({points:[this.project(x),this.project(y)],depth:(x[2]+y[2])/2,color,width,dashed});}
 box(x,y,z,w,h,d,color=INK,angle=0,faceted=false,fill='white'){const c=Math.cos(angle),s=Math.sin(angle),v=[];for(const [a,b,k] of [[-1,0,-1],[1,0,-1],[1,1,-1],[-1,1,-1],[-1,0,1],[1,0,1],[1,1,1],[-1,1,1]])v.push([x+a*w/2*c+k*d/2*s,y+b*h,z-a*w/2*s+k*d/2*c]);for(const f of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]]){if(faceted){this.face([v[f[0]],v[f[1]],v[f[2]]],color,fill,1.15);this.face([v[f[0]],v[f[2]],v[f[3]]],color,fill,1.15)}else this.face(f.map(i=>v[i]),color,fill,1.1)}}
 // Rings create tapered, faceted anatomy rather than rectangular body parts.
 mesh(rings,color=RED,angle=0){const c=Math.cos(angle),s=Math.sin(angle),vertices=rings.map(([x,y,z,rx,rz])=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,u=Math.cos(a)*rx,v=Math.sin(a)*rz;return [x+u*c+v*s,y,z-u*s+v*c]}));for(let j=0;j<vertices.length-1;j++)for(let i=0;i<8;i++)this.face([vertices[j][i],vertices[j][(i+1)%8],vertices[j+1][(i+1)%8],vertices[j+1][i]],color,'white',.85);this.face(vertices[0],color);this.face(vertices.at(-1),color);}
 limb(a,b,size,end=size*.7,color=RED){const d=b.map((v,i)=>v-a[i]),n=Math.hypot(...d),v=d.map(x=>x/n),reference=Math.abs(v[1])>.9?[1,0,0]:[0,1,0],cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],u=cross(v,reference),un=Math.hypot(...u),axis=u.map(x=>x/un),other=cross(v,axis),ring=(p,r)=>Array.from({length:6},(_,i)=>p.map((x,j)=>x+r*(axis[j]*Math.cos(i*Math.PI/3)+other[j]*Math.sin(i*Math.PI/3)))),A=ring(a,size),B=ring(b,end);for(let i=0;i<6;i++)this.face([A[i],A[(i+1)%6],B[(i+1)%6],B[i]],color,'white',.85);this.face(B,color);}
 enemy(e){if(e.entryDelay>0)return;const p=this.game.player,dist=Math.hypot(e.x-p.x,e.z-p.z),stride=dist>(e.type==='rush'?1:6.5)?Math.sin(e.phase)*.23:0,angle=e.angle,s=Math.sin(angle),c=Math.cos(angle),point=(x,y,z)=>[e.x+x*c+z*s,y,e.z-x*s+z*c],ring=(x,y,z,rx,rz)=>[...point(x,y,z),rx,rz];
 this.mesh([ring(0,.75,0,.2,.13),ring(0,.94,0,.15,.11),ring(0,1.16,0,.25,.15),ring(0,1.35,.02,.28,.14),ring(0,1.43,.02,.12,.09)],RED,angle);

 this.mesh([ring(0,1.48,.04,.085,.08),ring(0,1.57,.05,.13,.12),ring(0,1.73,.02,.145,.135),ring(0,1.83,.0,.10,.1),ring(0,1.86,0,.025,.03)],RED,angle);
 for(const side of [-1,1]){const hip=point(side*.13,.8,0),knee=point(side*.16,.44,stride*side),ankle=point(side*.17,.10,-stride*side);this.limb(hip,knee,.135,.09);this.limb(knee,ankle,.085,.05);this.mesh([ring(side*.17,.035,-stride*side+.06,.075,.15),ring(side*.17,.11,-stride*side,.065,.09)],RED,angle);}
 for(const side of [-1,1]){const shoulder=point(side*.29,1.33,.02),elbow=point(side*(e.type==='rush'?.34:.27),1.08,e.type==='rush'?stride*side:.25),hand=point(e.type==='rush'?side*.26:.14+side*.045,1.22,e.type==='rush'?.27:.59);this.limb(shoulder,elbow,.095,.065);this.limb(elbow,hand,.075,.045);this.limb(hand,hand.map((v,i)=>v+(i===1?.08:0)),.06,.055);}
 if(e.type==='gun'){const gun=point(.2,1.23,.68);this.firearm(e.weapon||'gun',...gun,INK,angle);if(e.windup>0&&e.target)this.line(gun,[e.target.x,1.28,e.target.z],'#df9696',.7,true);}}
 firearm(kind,x,y,z,color=INK,angle=0){
  const long=kind==='shotgun'||kind==='rifle',d=long?.78:kind==='smg'?.44:.33;
  this.box(x,y,z,.115,.12,d,color,angle);this.box(x-Math.sin(angle)*.12,y-.13,z-Math.cos(angle)*.12,.09,.16,.1,color,angle);
  if(kind==='shotgun')this.box(x,y-.07,z,.14,.07,.46,color,angle);
  if(kind==='smg')this.box(x+Math.sin(angle)*.08,y-.2,z+Math.cos(angle)*.08,.08,.22,.1,color,angle);
  if(kind==='rifle'){this.box(x,y+.13,z,.08,.07,.24,color,angle);this.box(x-Math.sin(angle)*.4,y-.05,z-Math.cos(angle)*.4,.14,.15,.24,color,angle);}
 }

 item(item,highlight=false){const {x,y,z,kind}=item,color=highlight?RED:INK;if(isFirearm(kind)){this.firearm(kind,x,y+.22,z,color);}else if(kind==='bottle'){this.mesh([[x,y,z,.09,.09],[x,y+.24,z,.09,.09],[x,y+.31,z,.035,.035],[x,y+.4,z,.035,.035]],color);}else if(kind==='mug'){this.mesh([[x,y,z,.09,.09],[x,y+.18,z,.11,.11]],color);this.line([x+.1,y+.16,z],[x+.18,y+.14,z],color);this.line([x+.18,y+.14,z],[x+.18,y+.04,z],color);this.line([x+.18,y+.04,z],[x+.1,y+.03,z],color);}else{this.box(x,y,z,.12,.06,.3,color);this.box(x,y+.07,z,.11,.04,.32,color,.1);}
 if(highlight){const h=y+.54;this.line([x-.12,h+.1,z],[x,h,z],RED,1.5);this.line([x,h,z],[x+.12,h+.1,z],RED,1.5);}}
 furniture(b){const {x,z,w,d,h,kind}=b;if(['desk','cart','cafe'].includes(kind)){this.box(x,h-.09,z,w,.09,d);for(const sx of [-1,1])for(const sz of [-1,1])this.box(x+sx*(w/2-.09),0,z+sz*(d/2-.09),.055,h-.09,.055);if(kind==='desk'){this.box(x+w*.2,h,z+d*.22,.65,.04,.32);this.box(x+w*.2,h+.02,z+d*.28,.045,.19,.05);this.box(x+w*.2,h+.2,z+d*.28,.7,.44,.055);this.box(x+w*.2,h+.015,z-.15,.6,.025,.23);this.box(x,0,z+d*.47,w,.65,.04,LINE);this.chair(x,z+d*.5+.45);}if(kind==='cafe'){this.chair(x-w*.3,z+d/2+.45);this.chair(x+w*.3,z+d/2+.45);this.box(x,h,z,.16,.23,.12,LINE);}}
 else if(kind==='partition'){this.box(x,0,z,w,h,d,LINE);for(const side of [-1,1]){this.box(x+side*(w/2-.035),0,z,.07,h,d,INK);this.box(x,1.15,z+side*d/2,w,.045,.035,INK);}this.box(x,h-.07,z,w,.07,d);}
 else if(kind==='bench'){this.box(x,.32,z,w,.2,d);this.box(x+w*.35,.5,z,.2,.65,d);for(const side of [-1,1])this.box(x,.05,z+side*(d/2-.2),w*.7,.27,.08);}
 else if(kind==='column'){this.box(x,0,z,w,h,d);this.box(x,0,z,w+.15,.12,d+.15);}
 else {this.box(x,0,z,w,h,d);this.box(x,h,z,w+.1,.06,d+.1);for(let a=-d/2+.45;a<d/2;a+=.65){this.line([x-w/2-.005,.1,z+a],[x-w/2-.005,h-.08,z+a],LINE);this.box(x-w/2-.025,h*.65,z+a-.2,.04,.03,.16);}}
 }
 chair(x,z){this.box(x,.45,z,.52,.075,.5);this.box(x,.5,z+.23,.52,.52,.06);this.box(x,.08,z,.06,.38,.06);this.line([x-.32,.08,z],[x+.32,.08,z],INK);this.line([x,.08,z-.3],[x,.08,z+.3],INK);}
 label(text,x,y,z,height=.18,color=INK){const a=this.camera([x,y,z]);if(a[2]<.1)return;const q=this.project(a),up=this.project(this.camera([x,y+height,z]));this.faces.push({text,points:[q],depth:a[2]-.005,color,font:Math.abs(up[1]-q[1])});}
 architecture(r){const n=r.size/2;

 // Doors, glazing, shopfronts and ceiling fixtures give each arena a real interior.
 for(let x=-n+2;x<n;x+=4){if((r.doors||[]).some(d=>d.side==='north'&&Math.abs(d.offset-x)<2.1))continue;this.box(x,1.0,n-.13,2.5,1.7,.035,LINE);for(const dx of [-1.25,0,1.25])this.line([x+dx,1,n-.16],[x+dx,2.7,n-.16],INK,.8);this.line([x-1.25,1.85,n-.16],[x+1.25,1.85,n-.16],LINE);}
 for(let z=-n+3;z<n;z+=5)for(const x of [-n*.45,n*.45])this.box(x,3.3,z,1.5,.045,.45,LINE);
 // Closed leaf volumes avoid the old crossed, paper-thin triangles.
 for(const x of [-n+.8,n-.8]){const z=n-1;this.mesh([[x,0,z,.19,.19],[x,.4,z,.26,.26],[x,.44,z,.26,.26]],INK);
  for(let i=0;i<5;i++){const a=i*2.4,X=x+Math.sin(a)*.22,Z=z+Math.cos(a)*.22,h=.85+(i%3)*.16;
   this.limb([x,.4,z],[X,h-.12,Z],.012,.009,INK);
   this.mesh([[X,h-.3,Z,.015,.015],[X,h-.12,Z,.14,.065],[X+Math.sin(a)*.07,h+.13,Z+Math.cos(a)*.07,.012,.008]],INK,a);
  }
 }
 if(r.theme==='mall'){for(const x of [-n+3,n-3]){if((r.doors||[]).some(d=>d.side==='north'&&Math.abs(d.offset-x)<2.6))continue;this.box(x,0,n-.5,3.5,2.8,.12);this.box(x,2.8,n-.58,3.7,.35,.13,RED);this.box(x,1,n-.7,2.6,.05,.5);this.box(x,1.7,n-.7,2.6,.05,.5);for(const dx of [-.8,0,.8]){this.box(x+dx,1.05,n-.7,.3,.4,.25,LINE);this.box(x+dx,1.75,n-.7,.25,.3,.2,LINE);}}}
 }
 boundary(r){const n=r.size/2,cutaway=this.game.state==='dead';
  for(const side of ['north','south','east','west']){
   const horizontal=side==='north'||side==='south',sign=side==='north'||side==='east'?1:-1;
   const box=(offset,along,y,h,depth=.2,dist=n+.1)=>horizontal?this.box(offset,y,sign*dist,along,h,depth):this.box(sign*dist,y,offset,depth,h,along);
   let start=-n;const doors=(r.doors||[]).filter(d=>d.side===side).sort((a,b)=>a.offset-b.offset);
   for(const d of doors){const left=d.offset-.8,right=d.offset+.8;if(left>start)box((start+left)/2,left-start,0,cutaway?.35:3.4);box(d.offset,1.6,2.55,.85);start=right;
    // Jambs and a lintel frame an open, roofless passage extending outside the room.
    for(const edge of [left,right])box(edge,.08,0,cutaway?.35:2.55,2.6,n+1.3);
    box(d.offset,1.6,0,.03,2.6,n+1.3);box(d.offset,1.6,0,cutaway?.35:2.55,.12,n+2.6);
   }
   if(start<n)box((start+n)/2,n-start,0,cutaway?.35:3.4);
  }
 }
 deathView(game){if(game.state!=='dead'||!game.death)return null;const d=game.death,t=Math.min(1,d.age/1.35),e=t*t*(3-2*t),p=d.camera,span=Math.hypot(d.origin.x-p.x,d.origin.z-p.z),height=Math.max(10,span*this.w/this.h*.8+8);
  return {...p,x:p.x+(d.origin.x-p.x)*.5*e,z:p.z+(d.origin.z-p.z)*.5*e,y:p.y+(height-p.y)*e,pitch:p.pitch+(-Math.PI/2-p.pitch)*e};
 }
 deathTrace(){const d=this.game.death;if(!d||d.age<.25)return;const ctx=this.ctx,origin=d.origin,impact=d.impact,point=t=>{const bend=d.kind==='fist'?Math.sin(t*Math.PI)*.35:0;return [origin.x+(impact.x-origin.x)*t+bend,origin.y+(impact.y-origin.y)*t+.04,origin.z+(impact.z-origin.z)*t];};
  const points=Array.from({length:25},(_,i)=>this.camera(point(i/24)));if(points.some(p=>p[2]<.08))return;const q=points.map(p=>this.project(p));ctx.save();ctx.globalAlpha=Math.min(1,d.age/.7);ctx.lineCap='round';
  for(const [color,width] of [['white',6],[RED,2.5]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
  const progress=Math.max(0,Math.min(1,((d.age-.8)%2.5)/1.5)),dot=this.project(this.camera(point(progress)));ctx.fillStyle=RED;ctx.strokeStyle='white';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...dot,d.kind==='fist'?7:4,0,Math.PI*2);ctx.fill();ctx.stroke();
  const end=q.at(-1);ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.beginPath();ctx.arc(...end,11,0,Math.PI*2);ctx.stroke();
  // The black head marker locates the player beneath the rising camera.
  const head=this.project(this.camera([d.camera.x,1.6,d.camera.z]));ctx.fillStyle=INK;ctx.beginPath();ctx.arc(...head,4,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 draw(game){this.game=game;const ctx=this.ctx,rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.w=Math.max(1,rect.width);this.h=Math.max(1,rect.height);this.view=this.deathView(game);const pw=Math.round(this.w*dpr),ph=Math.round(this.h*dpr);if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,this.w,this.h);ctx.fillStyle='white';ctx.fillRect(0,0,this.w,this.h);this.f=this.w*.75;this.faces=[];
 const r=game.room,N=r.size/2;for(let x=-N;x<=N;x+=4)this.line([x,0,-N],[x,0,N],LINE,.65);for(let z=-N;z<=N;z+=4)this.line([-N,0,z],[N,0,z],LINE,.65);
 this.boundary(r);
 this.architecture(r);for(const b of r.cover)this.furniture(b);const nearby=game.nearbyItem();for(const item of game.items)this.item(item,item===nearby);
 for(const e of game.enemies)if(e.alive)this.enemy(e);
 for(const s of game.shards){const size=s.size,a=s.angle,c=Math.cos(a)*size,n=Math.sin(a)*size;this.face([[s.x-c,s.y,s.z-n],[s.x+c,s.y,s.z+n],[s.x,s.y+size*1.8,s.z-size]],RED,s.age<.7?'#f9e8e8':'white',1);}
 for(const b of game.bullets){const v=Math.hypot(b.vx,b.vy,b.vz),tail=.9,color=b.owner==='enemy'?RED:INK;if(b.type==='throw')this.item({x:b.x,y:b.y-.08,z:b.z,kind:b.item});else{this.line([b.x-b.vx/v*tail,b.y-b.vy/v*tail,b.z-b.vz/v*tail],[b.x,b.y,b.z],color,b.owner==='enemy'?2.3:1.5);this.box(b.x,b.y-.025,b.z,.055,.055,.055,color,0,false,color)}}
 this.faces.sort((a,b)=>b.depth-a.depth);ctx.lineJoin='round';ctx.lineCap='round';for(const face of this.faces){const q=face.points;if(face.text){ctx.font=`${face.font}px ui-monospace,monospace`;ctx.textAlign='center';ctx.fillStyle=face.color;ctx.fillText(face.text,...q[0]);continue;}if(q.every(p=>p[0]<0)||q.every(p=>p[0]>this.w)||q.every(p=>p[1]<0)||q.every(p=>p[1]>this.h))continue;ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(face.fill){ctx.closePath();ctx.fillStyle=face.fill;ctx.fill()}ctx.strokeStyle=face.color;ctx.lineWidth=face.width;ctx.setLineDash(face.dashed?[4,7]:[]);ctx.stroke();}ctx.setLineDash([]);
 if(game.state==='dead')this.deathTrace();
 if(['playing','clearing','paused','ready'].includes(game.state))this.weapon();
 if(game.state==='playing'){const x=this.w/2,y=this.h*.47;ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x-3,y);ctx.moveTo(x+3,y);ctx.lineTo(x+8,y);ctx.moveTo(x,y-8);ctx.lineTo(x,y-3);ctx.moveTo(x,y+3);ctx.lineTo(x,y+8);ctx.stroke();ctx.fillStyle=RED;ctx.fillRect(x-.8,y-.8,1.6,1.6);this.threats();}
 }
 weapon(){const ctx=this.ctx,p=this.game.player,w=this.w,h=this.h,scale=Math.min(w/900,h/520),kick=p.kick*11,reload=p.reload>0?Math.sin(Math.min(1,p.reload/1.4)*Math.PI)*70:0;ctx.save();ctx.translate(w*.62,h+reload+kick);ctx.scale(scale,scale);ctx.lineWidth=1.3;ctx.strokeStyle=INK;ctx.fillStyle='white';const poly=points=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fill();ctx.stroke()};poly([[-8,10],[-40,-48],[-16,-89],[17,-94],[51,-60],[76,10]]);if(!isFirearm(p.held)){if(p.held==='bottle'){poly([[-18,-73],[-22,-143],[-9,-162],[-9,-191],[8,-191],[8,-162],[22,-143],[20,-73]]);}else if(p.held==='mug'){poly([[-34,-70],[-39,-130],[29,-130],[25,-70]]);poly([[29,-119],[51,-119],[51,-82],[27,-82]]);}else if(p.held==='stapler'){poly([[-34,-96],[-41,-123],[42,-139],[49,-111]]);}else{poly([[-24,-65],[-34,-96],[-25,-112],[4,-116],[29,-100],[34,-72]]);}ctx.restore();return;}if(p.held==='shotgun'||p.held==='rifle'){
  poly([[-15,-58],[-35,-143],[-20,-211],[3,-215],[34,-144],[55,-53],[24,-30]]);
  poly([[-35,-143],[-32,-218],[-21,-244],[-8,-239],[3,-163]]);
  poly([[-20,-211],[-13,-238],[0,-242],[15,-220],[34,-144],[3,-163]]);
  poly([[-30,-128],[-32,-167],[-2,-176],[18,-134]]);
  if(p.held==='rifle'){poly([[-27,-184],[-28,-211],[-10,-219],[7,-192],[-1,-178]]);poly([[-32,-218],[-29,-263],[-19,-267],[-8,-239]]);}
  else{ctx.strokeStyle=INK;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-29,-139-i*7);ctx.lineTo(7,-147-i*7);ctx.stroke();}}
  if(p.kick>.65){ctx.strokeStyle=RED;ctx.beginPath();ctx.moveTo(-20,-252);ctx.lineTo(-24,-282);ctx.moveTo(-32,-249);ctx.lineTo(-48,-269);ctx.stroke();}ctx.restore();return;
 }
 if(p.held==='smg'){
  poly([[-21,-45],[-30,-115],[7,-124],[32,-63],[12,-39]]);
  poly([[-40,-117],[-46,-174],[19,-187],[54,-129],[45,-98],[-4,-91]]);
  poly([[-46,-174],[-24,-194],[35,-201],[60,-148],[54,-129],[19,-187]]);
  poly([[21,-110],[43,-115],[55,-48],[31,-40]]);
  poly([[-30,-184],[-34,-213],[-15,-220],[-8,-191]]);
  ctx.strokeStyle=RED;ctx.beginPath();ctx.moveTo(-26,-118);ctx.lineTo(32,-130);ctx.stroke();ctx.restore();return;
 }
 poly([[-19,-67],[-24,-107],[23,-118],[38,-82],[22,-35],[3,-33]]);poly([[-28,-103],[-37,-153],[17,-162],[42,-121],[38,-88],[0,-83]]);poly([[-37,-153],[-7,-172],[35,-166],[55,-126],[42,-121],[17,-162]]);poly([[-7,-172],[-7,-156],[17,-150],[17,-162]]);ctx.strokeStyle=RED;ctx.beginPath();ctx.moveTo(-24,-102);ctx.lineTo(30,-112);ctx.stroke();if(p.kick>.65){ctx.strokeStyle=RED;ctx.beginPath();ctx.moveTo(-28,-176);ctx.lineTo(-44,-202);ctx.moveTo(-6,-182);ctx.lineTo(-8,-217);ctx.moveTo(13,-179);ctx.lineTo(28,-202);ctx.stroke()}ctx.restore();}
 threats(){const ctx=this.ctx,p=this.game.player;for(const e of this.game.enemies){if(!e.alive)continue;const v=this.camera([e.x,1.25,e.z]),q=v[2]>.08?this.project(v):null;if(q&&q[0]>15&&q[0]<this.w-15)continue;const angle=Math.atan2(e.x-p.x,e.z-p.z)-p.yaw,side=Math.sin(angle)>=0?1:-1,x=side>0?this.w-16:16,y=this.h*.5;ctx.strokeStyle=RED;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-side*7,y-7);ctx.lineTo(x,y);ctx.lineTo(x-side*7,y+7);ctx.stroke();}}
}
