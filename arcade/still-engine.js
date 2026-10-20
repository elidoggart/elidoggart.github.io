// Original time-driven arcade combat. Simulation is independent of rendering/audio.
export const MODES=Object.freeze({
 easy:{label:'Easy',multiplier:1,speed:4.5,interval:3.2,move:.7,windup:1.05,ready:2.4,armor:0,description:'Fewer guards · longer warnings'},
 medium:{label:'Medium',multiplier:1.5,speed:7.2,interval:1.85,move:1.1,windup:.65,ready:1.5,armor:0,description:'Full patrols · reinforcements'},
 hard:{label:'Hard',multiplier:2.5,speed:9.2,interval:1.4,move:1.3,windup:.4,ready:1.1,armor:1,description:'Armored guards · faster attacks'}
});
// Authored encounters: no free firearms. Each opening asks for a disarm or a throw.
const room=(name,size,start,cover,enemies,items=[],waves=[],theme='office')=>({name,size,start,theme,
 cover:cover.map(([x,z,w,d,h=3.4])=>({x,z,w,d,h,kind:h>2?(w<2.5&&d<2.5?'column':'partition'):theme==='mall'?'cafe':'desk'})),
 enemies:enemies.map(([x,z,type='gun'])=>({x,z,type})),
 items:items.map(([x,z,kind='bottle',y=.08])=>({x,z,kind,y})),
 waves:waves.map(group=>group.map(([x,z,type='gun'])=>({x,z,type}))) });
export const WEAPONS=Object.freeze({
 gun:{name:'PISTOL',capacity:3,ammo:2,reserve:0,cool:.32,reload:1.15,speed:24,spread:0,pellets:1},
 shotgun:{name:'SHOTGUN',capacity:2,ammo:2,reserve:0,cool:.85,reload:1.6,speed:22,spread:.075,pellets:5},
 smg:{name:'SMG',capacity:9,ammo:6,reserve:0,cool:.12,reload:1.35,speed:26,spread:.025,pellets:1},
 rifle:{name:'RIFLE',capacity:3,ammo:2,reserve:0,cool:.75,reload:1.8,speed:42,spread:0,pellets:1,pierce:1}
});
export const MELEE=Object.freeze({knife:{name:'KNIFE',reach:1.65,cool:.24,arc:.8,targets:1},baton:{name:'BATON',reach:2.2,cool:.45,arc:.6,targets:1},axe:{name:'AXE',reach:1.9,cool:.75,arc:.4,targets:2}});
export const isMelee=kind=>Object.hasOwn(MELEE,kind);
export const isFirearm=kind=>Object.hasOwn(WEAPONS,kind);
export const ITEM_NAMES={gun:'PISTOL',shotgun:'SHOTGUN',smg:'SMG',rifle:'RIFLE',knife:'KNIFE',baton:'BATON',axe:'AXE',bottle:'BOTTLE',mug:'MUG',stapler:'STAPLER'};
export const roomTimeScore=(world,real)=>Math.floor(10000/(1+(world+real*.15)/10));
export const ROOMS=[
 room('Cubicle area',18,[0,-6.5,0],[[-4,0,2,3],[4,0,2,3],[-4,4,3,1.4,1],[4,4,3,1.4,1]],[[2.1,-2.7],[-5.8,3],[3.3,6]],[[-1.3,-4.8,'bottle']],[[[6,6],[-6,6,'rush']]],'cubicles'),
 room('Break room',16,[0,-5,0],[[-1,-3.5,1.4,.8,.85],[3,0,2,3],[-4,3,3,1.5,1]],[[0,0]],[[-1,-3.5,'mug',.88]],[[[-4,5],[4,5]]],'break'),
 room('Reception',20,[0,-7,0],[[-4,-1,3,2,1],[4,2,3,2,1],[-6,5,2,2]],[[2,-3.5],[-6,7],[5.8,5.5]],[[1,-5.5,'stapler']],[[[-7,-6],[7,-6,'rush']]],'reception'),
 room('Roof',22,[0,-8,0],[[-4,-2,3,3,1.3],[4,3,3,3,1.3]],[[1,-4.5],[-6.3,4.5],[6.3,6.5]],[[1,-6.5,'bottle']],[[[-8,-7],[8,-7,'rush']]],'roof'),
 room('Helicopter',20,[-2.3,-2,Math.PI/2],[[-2.65,2,1,3,.65],[2.65,-4,1,3,.65],[-1,7.7,.8,1.1,1.15],[1,7.7,.8,1.1,1.15]],[[1,-.3],[-1.2,3.5],[1.4,5,'rush']],[[-.5,-2,'baton']],[],'helicopter')
];
const CHAPTERS=[['STAFF KITCHEN','door'],['RECEPTION','door'],['ROOF ACCESS','elevator'],['EXTRACTION','boarding'],['COCKPIT','cockpit']];
export const roomBounds=r=>({x:r.halfWidth||r.size/2,z:r.size/2});
export const sideYaw=side=>({north:0,east:Math.PI/2,south:Math.PI,west:-Math.PI/2}[side]||0);
export function transformPoint(p,t,inverse=false){
 const c=Math.cos(t.yaw),s=Math.sin(t.yaw),x=p.x-(inverse?t.x:0),z=p.z-(inverse?t.z:0);
 return inverse?{x:x*c-z*s,z:x*s+z*c}:{x:x*c+z*s+t.x,z:-x*s+z*c+t.z};
}
export function stageConnection(level){
 const from=ROOMS[level],to=ROOMS[level+1];if(!to)return null;
 const exit=from.exit,entry=to.entrance,yaw=sideYaw(exit.side)-sideYaw(entry.side)+Math.PI;
 const rotated=transformPoint(entry,{x:0,z:0,yaw});
 return {yaw,x:exit.x+Math.sin(sideYaw(exit.side))*exit.travel-rotated.x,z:exit.z+Math.cos(sideYaw(exit.side))*exit.travel-rotated.z};
}
export function enemyRoster(r,mode){return r.enemies.filter((e,i)=>mode!=='easy'||i<2).filter(e=>!e.hardOnly||mode==='hard').map(e=>({...e,weapon:mode==='easy'&&e.type==='gun'?'gun':e.weapon}));}
ROOMS.forEach((r,level)=>{
 r.exit={side:'north',offset:0,x:0,z:r.size/2,label:CHAPTERS[level][0],kind:CHAPTERS[level][1],travel:level===3?1.2:2.6};
 r.entrance={side:'south',offset:0,x:0,z:-r.size/2};
 if(r.theme==='helicopter'){r.halfWidth=3.2;r.entrance={side:'west',offset:-2,x:-3.2,z:-2};r.exit.z=6;r.exit.travel=.7;r.cover.slice(-2).forEach(b=>b.kind='seat');}
 if(r.theme==='cubicles')r.cover.push({x:0,z:-4.7,w:1.65,d:1,h:.8,kind:'terminal'});
 const extra=[[-6,-2],[5,2],[6,-3],[-7,1],[1.6,2.5]][level];r.enemies.push({x:extra[0],z:extra[1],type:'gun',hardOnly:true,role:'flank'});
 r.enemies.forEach((e,i)=>{e.role||=(i===0?'entry-watch':i===1?'cover-watch':'exit-watch');});
 if(r.theme==='cubicles')r.cover.filter(b=>b.h>2).forEach(b=>{b.kind='cubicle';b.h=1.65;});
 if(r.theme==='break')r.cover.filter(b=>b.h<2).forEach(b=>b.kind='cafe');
 if(r.theme==='roof')r.cover.forEach(b=>b.kind='vent');
 if(r.theme==='helicopter')r.cover.filter(b=>b.h<1).forEach(b=>b.kind='bench');
 let melee=0;for(const e of [...r.enemies,...r.waves.flat()])if(e.type==='rush')e.weapon=['baton','knife','axe'][(melee+++level)%3];
 if(level===0)r.items.push({x:1.3,z:-3.8,kind:'baton',y:.08});
 let armed=0;for(const e of [...r.enemies,...r.waves.flat()])if(e.type==='gun')e.weapon=['gun','shotgun','smg','rifle'][(armed+++level)%4];
 // Entry points sit in real perimeter openings. Pick a clear approach to each authored wave.
 const n=r.size/2,half=roomBounds(r),candidates=[];
 for(const side of ['north','south','east','west'])for(let offset=-(side==='north'||side==='south'?half.x:half.z)+2;offset<=(side==='north'||side==='south'?half.x:half.z)-2;offset+=2){
  const horizontal=side==='north'||side==='south',sign=side==='north'||side==='east'?1:-1;
  const edge=horizontal?half.z:half.x,x=horizontal?offset:sign*(edge-.65),z=horizontal?sign*(edge-.65):offset;
  if(!(side==='north'&&Math.abs(offset)<2)&&!(side===r.entrance.side&&Math.abs(offset-r.entrance.offset)<2)&&!r.cover.some(b=>Math.abs(x-b.x)<b.w/2+.5&&Math.abs(z-b.z)<b.d/2+.5))candidates.push({side,offset,x,z,ox:horizontal?x:sign*(edge+2),oz:horizontal?sign*(edge+2):z});
 }
 r.doors=[];
 if(r.theme==='roof'){candidates.splice(0,candidates.length,{side:'south',offset:0,x:0,z:-n+.65,ox:0,oz:-n-2});}
 for(const e of r.waves.flat()){
  const clear=candidates.filter(d=>!r.cover.some(b=>segmentBox({x:d.x,y:1.2,z:d.z},{x:e.x,y:1.2,z:e.z},b,.25)!==null));
  const door=(clear.length?clear:candidates).slice().sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
  if(!r.doors.some(d=>d.side===door.side&&d.offset===door.offset))r.doors.push(door);
  e.door=door;
 }

 // Additional objects reward moving through the room; all firearms must be earned.
 r.cover.filter(b=>b.h<2&&!['cubicle','seat','terminal'].includes(b.kind)).forEach((b,j)=>r.items.push({x:b.x-b.w*.25,z:b.z-b.d*.2,y:b.h+.03,kind:['knife','baton','axe'][(level+j)%3]}));
 r.solids=r.cover.flatMap(b=>{if(b.kind==='cubicle')return [{x:b.x,z:b.z+b.d/2,w:b.w,d:.07,h:b.h},...[-1,1].map(side=>({x:b.x+side*b.w/2,z:b.z,w:.07,d:b.d,h:b.h})),{x:b.x,z:b.z+.4,w:b.w,y:.8,h:.09,d:1}];if(!['desk','cafe','terminal'].includes(b.kind))return [b];const parts=[{...b,y:b.h-.09,h:.09}];for(const sx of [-1,1])for(const sz of [-1,1])parts.push({x:b.x+sx*(b.w/2-.09),z:b.z+sz*(b.d/2-.09),w:.055,d:.055,h:b.h-.09});if(b.kind==='terminal')parts.push({x:b.x,z:b.z+.23,y:b.h+.22,w:1.38,d:.08,h:.61});if(b.kind==='desk')parts.push({x:b.x+b.w*.2,z:b.z+b.d*.28,y:b.h+.2,w:.7,d:.055,h:.44});return parts;});
});
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function segmentBox(a,b,box,pad=0){let lo=0,hi=1;for(const [k,min,max] of [['x',box.x-box.w/2-pad,box.x+box.w/2+pad],['z',box.z-box.d/2-pad,box.z+box.d/2+pad],['y',(box.y||0)-pad,(box.y||0)+box.h+pad]]){const delta=b[k]-a[k];if(Math.abs(delta)<1e-9){if(a[k]<min||a[k]>max)return null;}else{let p=(min-a[k])/delta,q=(max-a[k])/delta;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return null;}}return lo;}
export function segmentSphere(a,b,c,r){const x=a.x-c.x,y=a.y-c.y,z=a.z-c.z,dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,A=dx*dx+dy*dy+dz*dz;if(!A)return x*x+y*y+z*z<=r*r?0:null;const B=2*(x*dx+y*dy+z*dz),C=x*x+y*y+z*z-r*r,D=B*B-4*A*C;if(C<=0)return 0;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;}
export class StillGame{
 constructor(mode='medium'){this.mode=Object.hasOwn(MODES,mode)?mode:'medium';this.events=[];this.newRun(false);}
 get settings(){return MODES[this.mode]}get room(){return ROOMS[this.level]}get score(){return Math.round(this.points*this.settings.multiplier)}
 get roomValue(){return roomTimeScore(this.roomTime,this.roomRealTime)}
 newRun(play=true){this.previousRoom=null;this.level=0;this.splits=[];this.points=0;this.lives=3;this.kills=0;this.totalShots=0;this.totalHits=0;this.totalTime=0;this.totalRealTime=0;this.state=play?'playing':'ready';this.loadRoom();}
 loadRoom(){this.death=null;this.exitUnlocked=false;this.clearBonus=0;const r=this.room;this.player={x:r.start[0],z:r.start[1],y:1.5,yaw:r.start[2],pitch:0,held:null,ammo:0,reserve:0,cool:0,reload:0,kick:0};this.checkpoint={points:this.points,kills:this.kills,shots:this.totalShots,hits:this.totalHits,time:this.totalTime};this.enemies=enemyRoster(r,this.mode).map((e,i)=>({...e,id:i,alive:true,armor:e.type==='gun'?this.settings.armor:0,y:0,angle:Math.atan2(r.start[0]-e.x,r.start[1]-e.z),phase:i,gait:0,recoil:0,fire:this.settings.ready+i*.35,windup:0,target:null,route:i%2?1:-1}));this.wave=0;this.pendingWaves=(this.mode==='easy'?[]:r.waves).map(w=>w.map(e=>({...e})));this.items=r.items.map((item,i)=>({...item,id:'room-'+i}));this.roomTime=0;this.roomRealTime=0;this.bullets=[];this.shards=[];this.events=[];this.simTime=this.totalTime;this.timeScale=.025;this.actionTime=0;this.chain=0;this.lastKill=-10;this.levelShots=0;this.levelHits=0;this.dodges=0;this.nextId=1;this.banner='';this.bannerTime=0;}
 start(mode=this.mode){this.mode=Object.hasOwn(MODES,mode)?mode:'medium';this.newRun();}
 retry(){if(this.state!=='dead')return;if(!this.lives){this.newRun();return;}const world=this.roomTime,real=this.roomRealTime;Object.assign(this,{points:this.checkpoint.points,kills:this.checkpoint.kills,totalShots:this.checkpoint.shots,totalHits:this.checkpoint.hits});this.loadRoom();this.roomTime=world;this.roomRealTime=real;this.state='playing';}
 next(){
  const p=this.player,exit=this.room.exit,travel=exit?.travel??2.6;
  if(this.state!=='playing'||!this.exitUnlocked||!exit||Math.abs(p.x-exit.x)>.65||p.z<exit.z+travel+.04)return false;
  this.clearBonus=this.roomValue;this.addScore(this.clearBonus);this.splits.push({name:this.room.name,world:this.roomTime,real:this.roomRealTime});this.emit('clear');
  if(this.level===ROOMS.length-1){this.state='won';return true;}
  const link=stageConnection(this.level),position=transformPoint(p,link,true),held={held:p.held,ammo:p.ammo,reserve:p.reserve,cool:p.cool,reload:p.reload,kick:p.kick},old={room:this.room,items:this.items,level:this.level,link};
  this.level++;this.loadRoom();this.previousRoom=old;Object.assign(this.player,position,held,{yaw:p.yaw-link.yaw,pitch:p.pitch});this.state='playing';return true;
 }

 emit(kind,data={}){this.events.push({kind,...data});}drainEvents(){return this.events.splice(0)}
 pause(){if(['playing','clearing'].includes(this.state)){this.pauseFrom=this.state;this.state='paused';return true}return false}resume(){if(this.state==='paused')this.state=this.pauseFrom||'playing'}
 addScore(points){this.points+=points}note(text){this.banner=text;this.bannerTime=1.7}
 blocked(x,z,r=.3,allowExit=true){
  const bounds=roomBounds(this.room),exit=this.room.exit,entry=this.room.entrance;
  const passage=allowExit&&this.exitUnlocked&&exit&&Math.abs(x-exit.x)<.8-r&&z>exit.z-1&&z<exit.z+(exit.travel??2.6)+.5;
  const atEntry=entry&&Math.abs((entry.side==='west'?z:x)-entry.offset)<.8-r&&(entry.side==='west'?x>-bounds.x-.4&&x<-bounds.x+1:z>-bounds.z-.4&&z<-bounds.z+1);
  return (!this.exitUnlocked&&exit&&Math.abs(x-exit.x)<.95&&z>exit.z-r)||(!passage&&!atEntry&&(Math.abs(x)>bounds.x-r||Math.abs(z)>bounds.z-r))||this.room.cover.some(b=>x>b.x-b.w/2-r&&x<b.x+b.w/2+r&&z>b.z-b.d/2-r&&z<b.z+b.d/2+r);
 }
 move(actor,dx,dz,r=.3){if(!this.blocked(actor.x+dx,actor.z,r,actor===this.player))actor.x+=dx;if(!this.blocked(actor.x,actor.z+dz,r,actor===this.player))actor.z+=dz;}

 wallHit(a,b){let t=null;for(const box of this.room.solids){const hit=segmentBox(a,b,box);if(hit!==null&&(t===null||hit<t))t=hit;}const edges=roomBounds(this.room);for(const key of ['x','z'])if(Math.abs(b[key])>=edges[key]){const hit=((b[key]>0?edges[key]:-edges[key])-a[key])/(b[key]-a[key]);if(hit>=0&&hit<=1&&(t===null||hit<t))t=hit;}return t}
 visible(a,b){return this.wallHit(a,b)===null}
 nearbyItem(){const p=this.player;let chosen=null,best=2.3;for(const item of this.items){const dx=item.x-p.x,dz=item.z-p.z,d=Math.hypot(dx,dz);if(d<best&&(d<.5||(dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw))/d>.45)&&this.visible(p,{x:item.x,y:item.y+.12,z:item.z})){chosen=item;best=d}}return chosen;}
 drop(){const p=this.player;if(!p.held)return;this.items.push({id:'drop-'+this.nextId++,kind:p.held,x:p.x,z:p.z,y:.06,ammo:p.ammo,reserve:p.reserve});p.held=null;p.ammo=p.reserve=0;p.reload=0;}
 interact(){if(this.state!=='playing'||this.player.cool>0)return;const item=this.nearbyItem();if(!item){this.melee();return;}const p=this.player;this.drop();this.items=this.items.filter(i=>i!==item);p.held=item.kind;p.ammo=item.ammo||0;p.reserve=item.reserve||0;p.cool=.08;this.actionTime=.12;this.emit('loaded');}
 reload(){const p=this.player,w=WEAPONS[p.held];if(this.state!=='playing'||p.reload||!w||p.ammo===w.capacity)return;if(!p.reserve){this.note('EMPTY');return;}p.reload=w.reload;this.emit('reload');}
 fire(throwing=false){
  const p=this.player,w=WEAPONS[p.held];if(this.state!=='playing'||p.cool>0||p.reload>0)return false;
  if(!p.held){this.melee();return false;}if(isMelee(p.held)&&!throwing){this.melee();return true;}throwing=throwing||!w;
  if(!throwing&&p.ammo<=0){this.reload();return false;}
  const item=p.held,ammo=p.ammo,reserve=p.reserve;
  if(throwing){p.held=null;p.ammo=p.reserve=0;}else p.ammo--;
  p.cool=throwing?.25:w.cool;p.kick=1;this.actionTime=throwing?.34:Math.max(.18,w.cool+.02);this.levelShots++;this.totalShots++;
  const count=throwing?1:w.pellets,speed=throwing?14:w.speed;
  for(let j=0;j<count;j++){
   const spread=throwing?0:count>1?(j-(count-1)/2)*w.spread:Math.sin(this.totalShots*2.4)*w.spread;
   const yaw=p.yaw+spread,cp=Math.cos(p.pitch);
   this.bullets.push({id:this.nextId++,x:p.x,y:p.y-.08,z:p.z,vx:Math.sin(yaw)*cp*speed,vy:Math.sin(p.pitch)*speed,vz:Math.cos(yaw)*cp*speed,owner:'player',type:throwing?'throw':'shot',item,ammo,reserve,pierce:throwing?0:w.pierce||0,age:0,path:[]});
  }
  this.emit(throwing?'throw':'shot',{weapon:item});return true;
 }
 melee(){if(this.state!=='playing'||this.player.cool>0||this.player.reload>0)return;const p=this.player,w=MELEE[p.held]||{reach:1.25,cool:.2,arc:.55,targets:1};this.actionTime=w.cool+.02;p.cool=w.cool;p.kick=1;
  const targets=this.enemies.filter(e=>{const dx=e.x-p.x,dz=e.z-p.z,dist=Math.hypot(dx,dz),facing=(Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz)/Math.max(.001,dist);return e.alive&&dist<w.reach&&facing>w.arc&&this.visible(p,{x:e.x,y:1.1,z:e.z});}).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).slice(0,w.targets);
  for(const e of targets)this.kill(e,'melee');if(!targets.length)this.emit('miss');
 }
 hitEnemy(e,kind='shot',head=false,weapon=null){if(e.armor>0&&!head&&kind!=='melee'&&weapon!=='rifle'){e.armor--;e.recoil=1;this.emit('impact');this.note('ARMOR BROKEN');return false;}this.kill(e,kind,head);return true;}
 kill(e,kind='shot',head=false){if(!e.alive)return;e.alive=false;this.kills++;if(kind!=='melee'){this.totalHits++;this.levelHits++;}if(e.type==='gun'||isMelee(e.weapon)){const kind=e.weapon||'gun',w=WEAPONS[kind]||{ammo:0,reserve:0};const dx=this.player.x-e.x,dz=this.player.z-e.z,d=Math.hypot(dx,dz),travel=Math.min(2.2,Math.max(0,d-.85)*.3),duration=1.6;this.items.push({id:'enemy-'+e.id,kind,x:e.x,z:e.z,y:1.12,ammo:w.ammo,reserve:w.reserve,flight:true,vx:d?dx/d*travel/duration:0,vz:d?dz/d*travel/duration:0,vy:(.06-1.12+1.5*duration*duration)/duration,angle:e.angle||0,spin:(e.id%2?1:-1)*3});}this.emit('shatter',{x:e.x,z:e.z});for(let i=0;i<10;i++){const a=i*2.399+e.id;this.shards.push({x:e.x+Math.cos(a)*.25,y:.25+(i%6)*.27,z:e.z+Math.sin(a)*.25,vx:Math.cos(a)*(1+(i%4)*.4),vy:1.2+(i%5)*.3,vz:Math.sin(a)*(1+(i%4)*.4),size:.035+(i%3)*.018,age:0,angle:a});}}
 die(attack=null){if(this.state!=='playing')return;const p=this.player;this.death={age:0,kind:attack?.kind||'shot',origin:{...(attack?.origin||p)},impact:{...(attack?.impact||p)},camera:{...p},attacker:attack?.attacker};this.lives--;this.state='dead';this.emit('death');this.note('A FRACTION TOO LATE');}
 step(dt,input={}){if(this.state==='dead'){if(this.death)this.death.age+=clamp(dt,0,.05);return;}if(this.state!=='playing')return;const realDelta=Math.max(0,dt);dt=clamp(dt,0,.05);const p=this.player;p.yaw+=(input.turn||0)*dt*1.7+(input.lookX||0);p.pitch=clamp(p.pitch+(input.lookY||0),-.48,.48);const mx=clamp(input.x||0,-1,1),mz=clamp(input.z||0,-1,1),moving=Math.hypot(mx,mz),aim=Math.abs(input.lookX||0)+Math.abs(input.lookY||0)+Math.abs(input.turn||0)*dt;
 if(input.reload)this.reload();if(input.melee)this.interact();if(input.throw)this.fire(true);if(input.fire)this.fire();
 this.timeScale=moving>.03?Math.min(1,moving):this.actionTime>0?1:p.reload>0?.65:aim>.0001?clamp(aim/dt* .16,.08,.5):.025;const delta=dt*this.timeScale;this.actionTime=Math.max(0,this.actionTime-dt);this.simTime+=delta;this.totalTime+=delta;this.roomTime+=delta;this.totalRealTime+=realDelta;this.roomRealTime+=realDelta;this.bannerTime=Math.max(0,this.bannerTime-dt);p.cool=Math.max(0,p.cool-delta);p.kick=Math.max(0,p.kick-dt*5);if(p.reload>0){p.reload=Math.max(0,p.reload-delta);if(!p.reload){const rounds=Math.min(WEAPONS[p.held].capacity-p.ammo,p.reserve);p.ammo+=rounds;p.reserve-=rounds;this.emit('loaded')}}
 if(moving){const n=Math.max(1,moving),speed=3.7*delta;this.move(p,(Math.sin(p.yaw)*mz+Math.cos(p.yaw)*mx)/n*speed,(Math.cos(p.yaw)*mz-Math.sin(p.yaw)*mx)/n*speed);}
 if(this.next())return;
 for(const e of this.enemies){if(!e.alive)continue;e.recoil=Math.max(0,(e.recoil||0)-delta*5);const oldX=e.x,oldZ=e.z;if(e.entryDelay>0){e.entryDelay=Math.max(0,e.entryDelay-delta);continue;}if(e.enter>0){e.enter=Math.max(0,e.enter-delta);const t=1-e.enter/1.1;e.x=e.door.ox+(e.door.x-e.door.ox)*t;e.z=e.door.oz+(e.door.z-e.door.oz)*t;e.angle=Math.atan2(e.door.x-e.door.ox,e.door.z-e.door.oz);e.gait=1;e.phase+=Math.hypot(e.x-oldX,e.z-oldZ)*5;continue;}const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz);e.angle=Math.atan2(dx,dz);const los=this.visible({x:e.x,y:1.25,z:e.z},p);const desired=e.type==='rush'?1:6.5;if(dist>desired||!los){let vx=dx/Math.max(.01,dist),vz=dz/Math.max(.01,dist),speed=(e.type==='rush'?1.75:1.05)*this.settings.move*delta;if(this.blocked(e.x+vx*.6,e.z+vz*.6,.32)){const angle=e.angle+e.route*1.2;vx=Math.sin(angle);vz=Math.cos(angle);if(this.blocked(e.x+vx*.6,e.z+vz*.6,.32))e.route*=-1;}this.move(e,vx*speed,vz*speed,.32)}const travel=Math.hypot(e.x-oldX,e.z-oldZ);e.gait+=(Math.min(1,travel/Math.max(.001,delta))-(e.gait||0))*Math.min(1,delta*12);e.phase+=travel*5;
 if(e.type==='rush'){if(dist<.85&&los){this.die({kind:'fist',origin:{x:e.x,y:1.25,z:e.z},impact:{x:p.x,y:1.3,z:p.z},attacker:e.id});break;}continue;}if(e.windup>0){e.windup-=delta;if(e.windup<=0){const a={x:e.x,y:1.25,z:e.z},target=e.target,w=WEAPONS[e.weapon||'gun'],yaw=Math.atan2(target.x-a.x,target.z-a.z),pitch=Math.atan2(target.y-a.y,Math.hypot(target.x-a.x,target.z-a.z)),speed=this.settings.speed*(e.weapon==='rifle'?1.3:1);
 const count=e.weapon==='shotgun'?3:1;for(let j=0;j<count;j++){const angle=yaw+(j-(count-1)/2)*.085;this.bullets.push({id:this.nextId++,...a,origin:{...a},attacker:e.id,vx:Math.sin(angle)*Math.cos(pitch)*speed,vy:Math.sin(pitch)*speed,vz:Math.cos(angle)*Math.cos(pitch)*speed,owner:'enemy',type:'shot',age:0,path:[],near:false,closest:99});}
 e.recoil=1;e.fire=this.settings.interval*(e.weapon==='smg'?.55:e.weapon==='shotgun'?1.3:e.weapon==='rifle'?1.2:1)+(e.id%3)*.15;this.emit('enemyShot',{weapon:e.weapon});}}else{e.fire-=delta;if(e.fire<=0&&los){e.windup=this.settings.windup;e.target={x:p.x,y:1.28,z:p.z};}}}
 if(this.state==='dead')return;
 for(const b of this.bullets){if(b.dead)continue;const old={x:b.x,y:b.y,z:b.z},next={x:b.x+b.vx*delta,y:b.y+b.vy*delta,z:b.z+b.vz*delta};b.age+=delta;b.path.push(old);if(b.path.length>12)b.path.shift();let hit=this.wallHit(old,next),victim=null,head=false;
 if(b.owner==='player'){const hits=[];for(const e of this.enemies){if(!e.alive)continue;const h=segmentSphere(old,next,{x:e.x,y:1.64,z:e.z},b.type==='throw'?.42:.27),body=segmentBox(old,next,{x:e.x,z:e.z,w:.65,d:.5,h:1.43},b.type==='throw'?.15:0);const t=h===null?body:body===null?h:Math.min(h,body);if(t!==null&&(hit===null||t<hit))hits.push({e,t,head:h!==null&&(body===null||h<body)});}
 for(const candidate of hits.sort((a,b)=>a.t-b.t)){if(b.pierce>0){this.hitEnemy(candidate.e,b.type,candidate.head,b.item);b.pierce--;}else{hit=candidate.t;victim=candidate.e;head=candidate.head;break;}}
 }else{const t=segmentBox(old,next,{x:p.x,z:p.z,y:p.y-1.5,w:.42,d:.42,h:1.8});if(t!==null&&(hit===null||t<hit)){hit=t;victim=p;}const d=Math.hypot(next.x-p.x,next.z-p.z);b.closest=Math.min(d,b.closest);if(victim!==p&&hit===null&&!b.near&&b.closest<.85&&d>b.closest+.15){b.near=true;this.dodges++;this.emit('dodge');}}
 Object.assign(b,next);if(hit!==null){b.dead=true;if(victim===p){const impact={x:old.x+(next.x-old.x)*hit,y:old.y+(next.y-old.y)*hit,z:old.z+(next.z-old.z)*hit};this.die({kind:'shot',origin:b.origin||b.path[0]||old,impact,attacker:b.attacker});return;}else if(victim)this.hitEnemy(victim,b.type,head,b.item);else this.emit('impact');}if(b.age>9||b.y<0||b.y>4.5)b.dead=true;if(b.dead&&b.type==='throw'&&(isFirearm(b.item)||isMelee(b.item))){this.items.push({id:'thrown-'+b.id,kind:b.item,x:old.x,z:old.z,y:.06,ammo:b.ammo,reserve:b.reserve});}}
 this.bullets=this.bullets.filter(b=>!b.dead);this.animateShards(delta);this.animateItems(delta);
 if(this.state==='playing'&&this.enemies.every(e=>!e.alive)&&this.pendingWaves.length){this.reinforce();}
 else if(this.state==='playing'&&!this.exitUnlocked&&this.enemies.every(e=>!e.alive)){this.exitUnlocked=true;this.bullets=[];this.emit('clear');this.note('AREA CLEAR · '+(this.room.exit?.label||'EXIT'));}
 }
 reinforce(){const group=this.pendingWaves.shift(),used=new Map();this.wave++;
  for(const entry of group){
   let door=entry.door||this.room.doors[0];
   if(Math.hypot(door.x-this.player.x,door.z-this.player.z)<3)door=this.room.doors.slice().sort((a,b)=>Math.hypot(b.x-this.player.x,b.z-this.player.z)-Math.hypot(a.x-this.player.x,a.z-this.player.z))[0];
   const entryDelay=(used.get(door)||0)*.45;used.set(door,(used.get(door)||0)+1);const id=this.enemies.length;this.enemies.push({...entry,door,entryDelay,x:door.ox,z:door.oz,id,alive:true,armor:entry.type==='gun'?this.settings.armor:0,y:0,angle:Math.atan2(door.x-door.ox,door.z-door.oz),phase:id,gait:0,recoil:0,fire:1.2,windup:0,target:null,route:id%2?1:-1,enter:1.1});
  }
  this.emit('arrival');
 }
 animateItems(delta){for(const item of this.items){if(!item.flight)continue;
  const old={x:item.x,y:item.y,z:item.z},next={x:item.x+item.vx*delta,y:item.y+item.vy*delta-1.5*delta*delta,z:item.z+item.vz*delta};
  let hit=null,box=null;for(const solid of this.room.solids){const t=segmentBox(old,next,solid,.09);if(t!==null&&(hit===null||t<hit)){hit=t;box=solid;}}
  const edge=this.wallHit(old,next);if(edge!==null&&(hit===null||edge<hit)){hit=edge;box=null;}
  item.vy-=3*delta;item.angle+=item.spin*delta;
  if(hit!==null){const t=Math.max(0,hit-.002);item.x=old.x+(next.x-old.x)*t;item.z=old.z+(next.z-old.z)*t;item.y=old.y+(next.y-old.y)*t;item.vx=item.vz=0;
   if(box&&item.vy<0&&Math.abs((old.y+(next.y-old.y)*hit)-((box.y||0)+box.h+.09))<.025){item.y=(box.y||0)+box.h+.09;item.flight=false;}
  }else Object.assign(item,next);
  if(item.y<=.06){item.y=.06;item.flight=false;}
  if(!item.flight){item.vx=item.vy=item.vz=0;item.spin=0;}
 }}
 animateShards(delta){for(const s of this.shards){s.age+=delta;s.x+=s.vx*delta;s.z+=s.vz*delta;s.y+=s.vy*delta;s.vy-=5*delta;s.angle+=delta*2;if(s.y<.06){s.y=.06;s.vy=0;s.vx*=.9;s.vz*=.9}}this.shards=this.shards.filter(s=>s.age<4);}

}
