// Static, engine-derived card artwork. No game engines run on the arcade menu.
// Run: node scripts/generate-arcade-art.mjs
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {Mission,predictTrajectory,orbitPosition,SUN} from '../arcade/physics.js';
import {traceShot} from '../arcade/tanks-physics.js';
import {StillRenderer} from '../arcade/still-render.js';
import {draw as drawEquation} from '../arcade/equation-plot.js';
const ink='#232421',red='#c73136',muted='#d9d9d2';
const n=v=>Number(v.toFixed(3)),escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const path=(points,color=ink,width=1,extra='')=>`<path d="${points.map((p,i)=>`${i?'L':'M'}${p.map(n).join(' ')}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const circle=(x,y,r,color=ink,fill='white',width=1)=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" stroke="${color}" stroke-width="${width}"/>`;
const rect=(x,y,w,h,color=muted,fill='none',width=1)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" stroke="${color}" stroke-width="${width}"/>`;
function svg(title,content){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 330" width="700" height="330" fill="none"><title>${title}</title><defs><clipPath id="frame"><rect x="20" y="14" width="660" height="302"/></clipPath></defs><g clip-path="url(#frame)" stroke-linejoin="round" stroke-linecap="round">${content}</g></svg>\n`;}

// A small Canvas-to-SVG recorder for the game's own tank and graph drawing code.
class SvgContext{
 constructor(prefix='c'){this.parts=[];this.defs=[];this.prefix=prefix;this.stack=[];this.state={transform:'',clip:null,strokeStyle:ink,fillStyle:'white',lineWidth:1,lineCap:'butt',lineJoin:'miter',globalAlpha:1,font:'10px Arial',dash:[]};}
 save(){this.stack.push(structuredClone(this.state));}
 restore(){this.state=this.stack.pop();}
 translate(x,y){this.state.transform+=` translate(${n(x)} ${n(y)})`;}
 rotate(a){this.state.transform+=` rotate(${n(a*180/Math.PI)})`;}
 scale(x,y){this.state.transform+=` scale(${x} ${y})`;}
 setLineDash(dash){this.state.dash=dash;}
 beginPath(){this.d='';}
 moveTo(x,y){this.d+=`M${n(x)} ${n(y)} `;}
 lineTo(x,y){this.d+=`L${n(x)} ${n(y)} `;}
 closePath(){this.d+='Z ';}
 rect(x,y,w,h){this.d+=`M${x} ${y}h${w}v${h}h${-w}Z `;}
 roundRect(x,y,w,h,r){r=Math.min(r,w/2,h/2);this.d+=`M${x+r} ${y}h${w-2*r}q${r} 0 ${r} ${r}v${h-2*r}q0 ${r} ${-r} ${r}h${-w+2*r}q${-r} 0 ${-r} ${-r}v${-h+2*r}q0 ${-r} ${r} ${-r}Z `;}
 arc(x,y,r,start,end){const steps=Math.ceil(Math.abs(end-start)*12);for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps;(i?this.lineTo:this.moveTo).call(this,x+Math.cos(a)*r,y+Math.sin(a)*r);}}
 wrap(element){const s=this.state;return `${s.clip?`<g clip-path="url(#${s.clip})">`:''}<g transform="${s.transform}" opacity="${s.globalAlpha}">${element}</g>${s.clip?'</g>':''}`;}
 emit(element){this.lastFill=null;this.parts.push(this.wrap(element));}
 stroke(){const s=this.state;this.emit(`<path d="${this.d}" fill="none" stroke="${s.strokeStyle}" stroke-width="${s.lineWidth}" stroke-linecap="${s.lineCap}" stroke-linejoin="${s.lineJoin}" stroke-dasharray="${s.dash.join(' ')}"/>`);}
 fill(){const key=JSON.stringify([this.state.transform,this.state.clip,this.globalAlpha,this.fillStyle]),last=this.lastFill;
  if(last?.key===key){last.d+=this.d;this.parts[last.index]=this.wrap(`<path d="${last.d}" fill="${this.fillStyle}" stroke="none"/>`);}
  else{this.emit(`<path d="${this.d}" fill="${this.fillStyle}" stroke="none"/>`);this.lastFill={key,d:this.d,index:this.parts.length-1};}
 }
 clip(){const id=this.prefix+this.defs.length;this.defs.push(`<clipPath id="${id}"><path d="${this.d}" transform="${this.state.transform}"/></clipPath>`);this.state.clip=id;}
 clearRect(){}
 fillText(text,x,y){this.emit(`<text x="${n(x)}" y="${n(y)}" style="font:${this.font}" fill="${this.fillStyle}" stroke="none">${escape(text)}</text>`);}
 measureText(text){return {width:String(text).length*parseFloat(this.font)*.55};}
 output(){return `<defs>${this.defs.join('')}</defs>${this.parts.join('')}`;}
}
for(const key of ['strokeStyle','fillStyle','lineWidth','lineCap','lineJoin','globalAlpha','font'])Object.defineProperty(SvgContext.prototype,key,{get(){return this.state[key]},set(value){this.state[key]=value}});

function space(){
 const mission=new Mission(42),origin={x:375,y:175},scale=.13;
 Object.assign(mission.ship,{x:-2000,y:900,vx:90,vy:-160,docked:null,engine:false});
 const past=predictTrajectory(mission,2);
 Object.assign(mission.ship,past.end);mission.time=past.time;
 for(const planet of mission.planets)Object.assign(planet,orbitPosition(planet,mission.time));
 const future=predictTrajectory(mission,16);
 assert.equal(future.impact,null);
 const P=p=>[origin.x+p.x*scale,origin.y+p.y*scale];
 let art='';
 for(const p of mission.planets)art+=circle(origin.x,origin.y,p.orbit*scale,'#e3e3dc','none',.85);
 for(const [x,y]of [[74,63],[178,168],[277,32],[590,286],[637,143],[453,299]])art+=circle(x,y,.8,'#c7c8bf','#c7c8bf',.5);
 art+=path(past.points.map(P),'#bdbeb5',1.3);
 art+=path(future.points.map(P),red,1.6,'stroke-dasharray="4 6"');
 const sr=SUN.r*scale;
 art+=circle(origin.x,origin.y,sr,ink,'white',1.4)+circle(origin.x,origin.y,sr*.82,ink,'none',.6);
 for(let i=0;i<32;i++){const a=i*Math.PI/16;art+=path([[origin.x+Math.cos(a)*(sr+4),origin.y+Math.sin(a)*(sr+4)],[origin.x+Math.cos(a+.025)*(sr+8+i%3*4),origin.y+Math.sin(a+.025)*(sr+8+i%3*4)]],i%4===0?red:ink,.8);}
 for(const p of mission.planets){
  const [x,y]=P(p),r=p.r*scale;
  art+=circle(x,y,r,ink,'white',1.2);
  art+=`<defs><clipPath id="planet-${p.id}"><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/></clipPath></defs><g clip-path="url(#planet-${p.id})" stroke="#b6b7af" stroke-width=".65">`;
  for(const f of [-.55,0,.55])art+=`<ellipse cx="${n(x)}" cy="${n(y+f*r)}" rx="${n(r*Math.sqrt(1-f*f))}" ry="${n(r*.19)}"/>`;
  art+=`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r*.4)}" ry="${n(r)}"/></g>`;
  if(p.id==='home')art+=circle(x,y,r+4,red,'none',1);
  if(p.flag==='available')art+=path([[x,y-r+3],[x,y-r-17],[x+16,y-r-13],[x,y-r-8]],red,1.2);
 }
 // Identical ship silhouette to drawShip; orientation follows its velocity.
 const [x,y]=P(mission.ship),a=Math.atan2(mission.ship.vy,mission.ship.vx)*180/Math.PI;
 art+=`<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(1.8)"><path d="M15 0L-11-9-6 0-11 9Z" fill="white" stroke="${ink}" stroke-width="1.1"/></g>`;
 return svg('Space flight: a coasting ship and its gravity-predicted path',art);
}

async function tanks(){
 const ctx=new SvgContext('tank'),source=await readFile(new URL('../arcade/tanks.js',import.meta.url),'utf8');
 // Reuse the pure drawing functions, including the actual red player tracks.
 const drawing=source.slice(source.indexOf('function line(x1'),source.indexOf('function draw(){'));
 const sandbox={ctx,game:{state:'playing'},ink,red};vm.createContext(sandbox);vm.runInContext(drawing,sandbox);
 const player={x:150,y:200,angle:0,type:'player'},target={x:530,y:180,angle:2.85,type:'patrol',aim:2.85};
 const walls=[{x:210,y:88,w:250,h:20}],surface=112;
 player.aim=Math.atan2(2*surface-target.y-player.y,target.x-player.x);
 const muzzle={x:player.x+37*Math.cos(player.aim),y:player.y+37*Math.sin(player.aim)};
 const length=Math.hypot(target.x-player.x,2*surface-target.y-player.y)-37;
 const segments=traceShot(muzzle.x,muzzle.y,player.aim,walls,1,length);
 assert.equal(segments.length,2);
 assert(Math.hypot(segments.at(-1).ex-target.x,segments.at(-1).ey-target.y)<.01);
 assert(Math.abs(segments[0].ey-surface)<1e-6);
 const transform='translate(-102 -42) scale(1.35)';
 let scene='';
 for(let x=100;x<580;x+=40)for(let y=60;y<265;y+=40)scene+=circle(x,y,.65,muted,muted,.5);
 scene+=rect(102,54,475,205,muted,'none',.8);
 for(const w of walls){scene+=rect(w.x,w.y,w.w,w.h,ink,'white',1.3);for(let x=w.x+50;x<w.x+w.w;x+=50)scene+=path([[x,w.y],[x,w.y+w.h]],'#aaa99f',.7);}
 for(let x=105;x<145;x+=10)for(const y of [186,214])scene+=path([[x-3,y],[x+3,y]],'#d1d2ca',2);
 scene+=path([[muzzle.x,muzzle.y],...[...segments].map(s=>[s.ex,s.ey])],'#bd7778',1.2,'stroke-dasharray="3 5"');
 const bounce=segments[0];scene+=circle(bounce.ex,bounce.ey,6,red,'none',1);
 const last=segments[1],a=Math.atan2(last.ey-last.y,last.ex-last.x),shell={x:target.x-45*Math.cos(a),y:target.y-45*Math.sin(a)};
 scene+=path([[shell.x-8*Math.cos(a),shell.y-8*Math.sin(a)],[shell.x,shell.y]],ink,8,'stroke-linecap="round"');
 ctx.save();ctx.translate(-102,-42);ctx.scale(1.35,1.35);sandbox.drawTank(player);sandbox.drawTank(target);ctx.restore();
 return svg('Tanks: the red-tracked player banks a shell off a wall toward an enemy',`<g transform="${transform}">${scene}</g>${ctx.output()}`);
}

function still(){
 const v=Object.create(StillRenderer.prototype);
 Object.assign(v,{faces:[],w:700,h:330,f:500,game:{player:{x:0,y:1.35,z:-5.8,yaw:0,pitch:-.04},simTime:.4,state:'playing'}});
 for(let x=-7;x<=7;x+=2)v.line([x,0,-3],[x,0,9],'#deded7',.8);
 for(let z=-3;z<=9;z+=2)v.line([-7,0,z],[7,0,z],'#deded7',.8);
 v.box(0,0,9,8,3.4,.12,'#d0d1c8');
 for(const x of [-4,4]){v.line([x,0,-3],[x,0,9],'#d0d1c8');v.line([x,3.4,-3],[x,3.4,9],'#d0d1c8');v.line([x,0,9],[x,3.4,9],'#d0d1c8');}
 for(const x of [-2.8,2.8])v.furniture({x,z:3.5,w:2,d:2.4,h:1.65,kind:'cubicle'});
 for(const z of [2.5,6])v.box(0,3.3,z,1.5,.045,.45,'#deded7');
 v.enemy({id:1,x:1.65,z:2.1,angle:-2.45,phase:.2,gait:.2,type:'gun',weapon:'rifle',alive:true});
 // The foreground player uses the same faceted anatomy, in the player's ink.
 const face=v.face;v.face=function(points,color,fill,width){face.call(this,points,color===red?ink:color,fill,width?width*1.25:width);};
 v.enemy({id:0,x:-1.1,z:-1,angle:Math.atan2(2.75,3.1),phase:1.1,gait:.7,type:'gun',weapon:'gun',alive:true});
 v.face=face;
 const art=v.faces.sort((a,b)=>b.depth-a.depth).map(f=>{
  if(f.points.length===2)return path(f.points,f.color,f.width);
  return `<path d="${f.points.map((p,i)=>`${i?'L':'M'}${p.map(n).join(' ')}`).join(' ')}Z" fill="${f.fill||'none'}" stroke="${f.color}" stroke-width="${f.width}"/>`;
 }).join('');
 return svg('Still: a faceted player moves through cubicles while aiming at a red guard',art);
}

function equation(){
 globalThis.devicePixelRatio=1;
 const round={dim:2,domain:[-3,3],range:[-5,5],fn:x=>.32*x**3-.8*x};
 round.points=Array.from({length:121},(_,i)=>{const x=-3+i/20;return {x,z:round.fn(x)};});
 const guess=x=>.23*x**3-.4*x+.5;
 function plot(x,y,size,options,id){
  const ctx=new SvgContext(id),canvas={getBoundingClientRect:()=>({width:size,height:size}),getContext:()=>ctx};
  drawEquation(canvas,round,{guess,...options});
  return `<g transform="translate(${x} ${y})">${ctx.output()}</g>`;
 }
 let art=plot(42,6,290,{},'main');
 art+=path([[379,26],[379,304]],'#deded8',1);
 art+=`<text x="407" y="52" font-family="Georgia,serif" font-size="23" fill="${ink}">y = 0.23x³ − 0.4x + 0.5</text>`;
 art+=path([[407,65],[659,65]],ink,1);
 art+=`<text x="407" y="96" font-family="Arial,sans-serif" font-size="11" fill="#777873">Your guess</text><text x="551" y="96" font-family="Arial,sans-serif" font-size="11" fill="${red}">Δ guess − target</text>`;
 art+=plot(398,112,130,{},'compare')+plot(540,112,130,{difference:true},'difference');
 art+=path([[75,307],[92,307]],ink,1.8)+`<text x="99" y="311" font-family="Arial,sans-serif" font-size="10" fill="#777873">Target</text>`;
 art+=path([[151,307],[168,307]],ink,1.8,'stroke-dasharray="1 5"')+`<text x="175" y="311" font-family="Arial,sans-serif" font-size="10" fill="#777873">Guess</text>`;
 return svg('Equation: cubic target, dotted guess, red error shading and paired comparison plots',art);
}
const out=new URL('../arcade/art/',import.meta.url);await mkdir(out,{recursive:true});
for(const [name,content]of [['space',space()],['tanks',await tanks()],['still',still()],['equation',equation()]])await writeFile(new URL(`${name}.svg`,out),content);
console.log('Generated four static arcade illustrations from game geometry, physics, and plotting code.');
