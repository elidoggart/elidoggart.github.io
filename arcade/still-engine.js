// Original time-driven arcade combat. Simulation is independent of rendering/audio.
export const MODES=Object.freeze({easy:{label:'Easy',multiplier:1,speed:5.2,interval:2.8,move:.85},medium:{label:'Medium',multiplier:1.5,speed:7.2,interval:1.85,move:1.1},hard:{label:'Hard',multiplier:2.5,speed:9.2,interval:1.4,move:1.3}});
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
 // One close guard, then a second sightline. Your first gun belongs to someone else.
 room('The doorstep',14,[0,-5,0],[[-4,0,2,3],[4,0,2,3]],[[0,-1.5],[2,4],[-3,4]], [[-1.3,-3.8,'bottle']],[[[4,5],[-4,5,'rush']]]),
 // The mug is the opening move; the far pair arrives only after the first exchange.
 room('Coffee break',16,[0,-5,0],[[-1,-3.5,1.4,.8,.85],[3,0,2,3]],[[0,0]], [[-1,-3.5,'mug',.88]],[[[-4,5],[4,5]]]),
 room('Side street',20,[0,-8,0],[[-4,0,4,13],[4,2,4,9]],[[0,-6.4],[0,7]],[],[[[0,8],[0,-8,'rush']]]),
 room('Blind corner',18,[-5,-6,0],[[0,-2,3,10],[-5,3,2,1,1]], [[-5,-2],[5,6]], [[-5,-4.4,'bottle']],[[[5,-6],[-5,6,'rush']]]),
 room('Closing time',18,[0,-6,0],[[-3,-1,2,2,1],[3,-1,2,2,1]], [[0,-4.4,'rush'],[-5,5],[5,5]],[],[[[0,7],[-6,-5,'rush']]],'mall'),
 room('The crossing',20,[-6,-7,.35],[[0,-2,3,8],[0,6,3,3]], [[-6,-3],[6,7],[6,-6]], [[-5.5,-5.5,'stapler']],[[[-7,7],[7,0,'rush']]]),
 room('Reception',20,[0,-7,0],[[-4,-1,3,2,1],[4,2,3,2,1],[0,4,2,2]], [[0,-5.4],[-6,6],[6,6]],[],[[[-7,-6],[7,-6,'rush']]]),
 room('Meeting rooms',22,[-7,-8,0],[[-3,-2,1.5,9],[3,3,1.5,9],[-7,3,2,1,1]], [[-7,-4],[7,7],[0,8]], [[-7,-6.4,'mug']],[[[-7,8],[7,-7],[0,-8,'rush']]]),
 room('Staff kitchen',18,[0,-6,0],[[-4,-1,3,1.5,1],[4,2,3,1.5,1]], [[0,-4.4,'rush'],[-5,5],[5,5]], [[1,-4.6,'bottle']],[[[-6,-4],[6,-4],[0,6,'rush']]]),
 room('Switchback',24,[-8,-9,0],[[-3,-3,2,12],[3,5,2,12]], [[-8,-5],[0,7],[8,9]], [[-8,-7.4,'stapler']],[[[-8,9],[8,-8],[0,-9,'rush']]]),
 room('Window shopping',22,[0,-8,0],[[-4,-2,2,2],[4,-2,2,2],[-4,5,3,1,1],[4,5,3,1,1]], [[0,-6.4],[0,8],[-8,7],[8,7]],[],[[[-8,-7],[8,-7,'rush']]],'mall'),
 room('After hours',22,[-7,-7,.2],[[0,0,3,8],[-6,3,2,2,1],[6,-3,2,2,1]], [[-7,-3],[7,-7],[7,8]], [[-6.5,-5.5,'bottle']],[[[-7,8],[7,1,'rush']],[[0,-8],[-8,0],[8,8]]],'mall'),
 room('Loading bay',24,[0,-9,0],[[-5,-3,4,3],[5,3,4,3],[0,7,3,1,1]], [[0,-7.4],[-9,8],[9,8]],[],[[[-9,-7],[9,-7],[0,10,'rush']]]),
 room('Pillars',24,[0,-9,0],[[-4,-3,1.6,1.6],[4,-3,1.6,1.6],[-4,4,1.6,1.6],[4,4,1.6,1.6]], [[0,-5],[-8,8],[8,8]], [[0,-7.4,'bottle']],[[[-9,-8],[9,-8],[0,10,'rush']]],'mall'),
 room('The long way',26,[-9,-10,0],[[-4,-4,2,14],[4,5,2,14]], [[-9,-6],[0,8],[9,9]], [[-9,-8.4,'mug']],[[[-9,10],[9,-9],[0,-10,'rush']],[[0,10],[9,2]]]),
 room('Food court',24,[0,-9,0],[[-5,-3,3,2,1],[5,-3,3,2,1],[-5,4,3,2,1],[5,4,3,2,1]], [[0,-7.4,'rush'],[-8,8],[8,8],[0,9]], [[1,-7.6,'bottle']],[[[-9,-8],[9,-8],[0,10,'rush']]],'mall'),
 room('Divided attention',24,[-8,-8,.4],[[0,0,3,13],[-7,3,2,2,1],[7,-3,2,2,1]], [[-7,-4],[8,-8],[8,8]], [[-7.4,-6.5,'stapler']],[[[-8,9],[8,1,'rush']],[[0,-10],[0,10],[9,9]]]),
 room('Back office',20,[0,-7,0],[[-4,-1,2,3],[4,-1,2,3],[0,4,3,1,1]], [[0,-5.4],[-7,7],[7,7]],[],[[[-7,-6],[7,-6,'rush']],[[0,8],[-8,1],[8,1]]]),
 room('Glasshouse',26,[0,-10,0],[[-5,-4,2,2],[5,-4,2,2],[-5,5,2,2],[5,5,2,2]], [[0,-6],[-9,9],[9,9],[0,10]], [[0,-8.4,'bottle']],[[[-10,-9],[10,-9],[0,8,'rush']],[[0,-10],[-9,0],[9,0]]],'mall'),
 room('Service passage',26,[-9,-10,0],[[-4,-4,2,14],[4,5,2,14]], [[-9,-8.4],[0,-9],[9,9]],[],[[[-9,10],[9,-9],[0,10,'rush']],[[0,-10],[9,4],[-9,4]]]),
 room('Security',22,[0,-8,0],[[-4,-2,2,2],[4,-2,2,2],[0,4,3,2]], [[0,-4],[-8,8],[8,8]], [[0,-6.4,'stapler']],[[[-8,-7],[8,-7],[0,9,'rush']],[[0,-9],[-9,2],[9,2]]]),
 room('Last orders',24,[-8,-8,.25],[[0,0,3,10],[-6,4,3,2,1],[6,-4,3,2,1]], [[-8,-6.4,'rush'],[-8,9],[8,-8],[8,9]], [[-7,-6.5,'mug']],[[[-9,0],[9,0],[0,10,'rush']],[[0,-10],[-9,9],[9,9]]],'mall'),
 room('Concourse',28,[0,-11,0],[[-5,-5,2,2],[5,-5,2,2],[-5,5,2,2],[5,5,2,2],[0,0,3,2,1]], [[0,-9.4],[-10,11],[10,11],[0,12]],[],[[[-11,-10],[11,-10],[0,10,'rush']],[[0,-12],[-12,0],[12,0],[0,12]]],'mall'),
 room('Daybreak',28,[-10,-11,.2],[[-4,-5,2,13],[4,5,2,13],[-9,6,3,2,1],[9,-6,3,2,1]], [[-10,-7],[0,-10],[10,11]], [[-9.5,-9.5,'bottle']],[[[-10,11],[10,-11],[0,11,'rush']],[[0,-12],[-12,0],[12,0]],[[0,12],[-11,-11],[11,11],[0,0,'rush']]],'mall')
];
ROOMS.forEach((r,level)=>{
 let melee=0;for(const e of [...r.enemies,...r.waves.flat()])if(e.type==='rush')e.weapon=['baton','knife','axe'][(melee+++level)%3];
 if(level===0)r.items.push({x:1.3,z:-3.8,kind:'baton',y:.08});
 let armed=0;for(const e of [...r.enemies,...r.waves.flat()])if(e.type==='gun')e.weapon=['gun','shotgun','smg','rifle'][(armed+++level)%4];
 // Entry points sit in real perimeter openings. Pick a clear approach to each authored wave.
 const n=r.size/2,candidates=[];
 for(const side of ['north','south','east','west'])for(let offset=-n+2;offset<=n-2;offset+=2){
  const horizontal=side==='north'||side==='south',sign=side==='north'||side==='east'?1:-1;
  const x=horizontal?offset:sign*(n-.65),z=horizontal?sign*(n-.65):offset;
  if(!r.cover.some(b=>Math.abs(x-b.x)<b.w/2+.5&&Math.abs(z-b.z)<b.d/2+.5))candidates.push({side,offset,x,z,ox:horizontal?x:sign*(n+2),oz:horizontal?sign*(n+2):z});
 }
 r.doors=[];
 for(const e of r.waves.flat()){
  const clear=candidates.filter(d=>!r.cover.some(b=>segmentBox({x:d.x,y:1.2,z:d.z},{x:e.x,y:1.2,z:e.z},b,.25)!==null));
  const door=(clear.length?clear:candidates).slice().sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
  if(!r.doors.some(d=>d.side===door.side&&d.offset===door.offset))r.doors.push(door);
  e.door=door;
 }

 // Additional objects reward moving through the room; all firearms must be earned.
 r.cover.filter(b=>b.h<2).forEach((b,j)=>r.items.push({x:b.x-b.w*.25,z:b.z-b.d*.2,y:b.h+.03,kind:['knife','baton','axe'][(level+j)%3]}));
 r.solids=r.cover.flatMap(b=>{if(!['desk','cafe'].includes(b.kind))return [b];const parts=[{...b,y:b.h-.09,h:.09}];for(const sx of [-1,1])for(const sz of [-1,1])parts.push({x:b.x+sx*(b.w/2-.09),z:b.z+sz*(b.d/2-.09),w:.055,d:.055,h:b.h-.09});if(b.kind==='desk')parts.push({x:b.x+b.w*.2,z:b.z+b.d*.28,y:b.h+.2,w:.7,d:.055,h:.44});return parts;});
});
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function segmentBox(a,b,box,pad=0){let lo=0,hi=1;for(const [k,min,max] of [['x',box.x-box.w/2-pad,box.x+box.w/2+pad],['z',box.z-box.d/2-pad,box.z+box.d/2+pad],['y',(box.y||0)-pad,(box.y||0)+box.h+pad]]){const delta=b[k]-a[k];if(Math.abs(delta)<1e-9){if(a[k]<min||a[k]>max)return null;}else{let p=(min-a[k])/delta,q=(max-a[k])/delta;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return null;}}return lo;}
export function segmentSphere(a,b,c,r){const x=a.x-c.x,y=a.y-c.y,z=a.z-c.z,dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,A=dx*dx+dy*dy+dz*dz;if(!A)return x*x+y*y+z*z<=r*r?0:null;const B=2*(x*dx+y*dy+z*dz),C=x*x+y*y+z*z-r*r,D=B*B-4*A*C;if(C<=0)return 0;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;}
export class StillGame{
 constructor(mode='medium'){this.mode=Object.hasOwn(MODES,mode)?mode:'medium';this.events=[];this.newRun(false);}
 get settings(){return MODES[this.mode]}get room(){return ROOMS[this.level]}get score(){return Math.round(this.points*this.settings.multiplier)}
 get roomValue(){return roomTimeScore(this.roomTime,this.roomRealTime)}
 newRun(play=true){this.level=0;this.points=0;this.lives=3;this.kills=0;this.totalShots=0;this.totalHits=0;this.totalTime=0;this.totalRealTime=0;this.state=play?'playing':'ready';this.loadRoom();}
 loadRoom(){this.death=null;const r=this.room;this.player={x:r.start[0],z:r.start[1],y:1.5,yaw:r.start[2],pitch:0,held:null,ammo:0,reserve:0,cool:0,reload:0,kick:0};this.checkpoint={points:this.points,kills:this.kills,shots:this.totalShots,hits:this.totalHits,time:this.totalTime};this.enemies=r.enemies.map((e,i)=>({...e,id:i,alive:true,y:0,angle:0,phase:i,fire:.75+i*.28,windup:0,target:null,route:i%2?1:-1}));this.wave=0;this.pendingWaves=r.waves.map(w=>w.map(e=>({...e})));this.items=r.items.map((item,i)=>({...item,id:'room-'+i}));this.roomTime=0;this.roomRealTime=0;this.bullets=[];this.shards=[];this.events=[];this.simTime=0;this.timeScale=.025;this.actionTime=0;this.chain=0;this.lastKill=-10;this.levelShots=0;this.levelHits=0;this.dodges=0;this.nextId=1;this.banner='';this.bannerTime=0;}
 start(mode=this.mode){this.mode=Object.hasOwn(MODES,mode)?mode:'medium';this.newRun();}
 retry(){if(this.state!=='dead')return;if(!this.lives){this.newRun();return;}const world=this.roomTime,real=this.roomRealTime;Object.assign(this,{points:this.checkpoint.points,kills:this.checkpoint.kills,totalShots:this.checkpoint.shots,totalHits:this.checkpoint.hits});this.loadRoom();this.roomTime=world;this.roomRealTime=real;this.state='playing';}
 next(){if(this.state!=='clear')return;this.level++;this.loadRoom();this.state='playing';}
 emit(kind,data={}){this.events.push({kind,...data});}drainEvents(){return this.events.splice(0)}
 pause(){if(['playing','clearing'].includes(this.state)){this.pauseFrom=this.state;this.state='paused';return true}return false}resume(){if(this.state==='paused')this.state=this.pauseFrom||'playing'}
 addScore(points){this.points+=points}note(text){this.banner=text;this.bannerTime=1.7}
 blocked(x,z,r=.3){return Math.abs(x)>this.room.size/2-r||Math.abs(z)>this.room.size/2-r||this.room.cover.some(b=>x>b.x-b.w/2-r&&x<b.x+b.w/2+r&&z>b.z-b.d/2-r&&z<b.z+b.d/2+r)}
 move(actor,dx,dz,r=.3){if(!this.blocked(actor.x+dx,actor.z,r))actor.x+=dx;if(!this.blocked(actor.x,actor.z+dz,r))actor.z+=dz;}
 wallHit(a,b){let t=null;for(const box of this.room.solids){const hit=segmentBox(a,b,box);if(hit!==null&&(t===null||hit<t))t=hit;}const edge=this.room.size/2;for(const key of ['x','z'])if(Math.abs(b[key])>=edge){const hit=((b[key]>0?edge:-edge)-a[key])/(b[key]-a[key]);if(hit>=0&&hit<=1&&(t===null||hit<t))t=hit;}return t}
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
 kill(e,kind='shot',head=false){if(!e.alive)return;e.alive=false;this.kills++;if(kind!=='melee'){this.totalHits++;this.levelHits++;}if(e.type==='gun'||isMelee(e.weapon)){const kind=e.weapon||'gun',w=WEAPONS[kind]||{ammo:0,reserve:0};const dx=this.player.x-e.x,dz=this.player.z-e.z,d=Math.hypot(dx,dz),travel=Math.min(2.2,Math.max(0,d-.85)*.3),duration=1.6;this.items.push({id:'enemy-'+e.id,kind,x:e.x,z:e.z,y:1.12,ammo:w.ammo,reserve:w.reserve,flight:true,vx:d?dx/d*travel/duration:0,vz:d?dz/d*travel/duration:0,vy:(.06-1.12+1.5*duration*duration)/duration,angle:e.angle||0,spin:(e.id%2?1:-1)*3});}this.emit('shatter',{x:e.x,z:e.z});for(let i=0;i<10;i++){const a=i*2.399+e.id;this.shards.push({x:e.x+Math.cos(a)*.25,y:.25+(i%6)*.27,z:e.z+Math.sin(a)*.25,vx:Math.cos(a)*(1+(i%4)*.4),vy:1.2+(i%5)*.3,vz:Math.sin(a)*(1+(i%4)*.4),size:.035+(i%3)*.018,age:0,angle:a});}}
 die(attack=null){if(this.state!=='playing')return;const p=this.player;this.death={age:0,kind:attack?.kind||'shot',origin:{...(attack?.origin||p)},impact:{...(attack?.impact||p)},camera:{...p},attacker:attack?.attacker};this.lives--;this.state='dead';this.emit('death');this.note('A FRACTION TOO LATE');}
 step(dt,input={}){if(this.state==='dead'){if(this.death)this.death.age+=clamp(dt,0,.05);return;}if(this.state==='clearing'){this.clearTime-=Math.min(dt,.05);this.animateShards(Math.min(dt,.05));this.animateItems(Math.min(dt,.05));if(this.clearTime<=0){this.state=this.level===ROOMS.length-1?'won':'clear';this.emit('clear')}return;}if(this.state!=='playing')return;const realDelta=Math.max(0,dt);dt=clamp(dt,0,.05);const p=this.player;p.yaw+=(input.turn||0)*dt*1.7+(input.lookX||0);p.pitch=clamp(p.pitch+(input.lookY||0),-.48,.48);const mx=clamp(input.x||0,-1,1),mz=clamp(input.z||0,-1,1),moving=Math.hypot(mx,mz),aim=Math.abs(input.lookX||0)+Math.abs(input.lookY||0)+Math.abs(input.turn||0)*dt;
 if(input.reload)this.reload();if(input.melee)this.interact();if(input.throw)this.fire(true);if(input.fire)this.fire();
 this.timeScale=moving>.03?Math.min(1,moving):this.actionTime>0?1:p.reload>0?.65:aim>.0001?clamp(aim/dt* .16,.08,.5):.025;const delta=dt*this.timeScale;this.actionTime=Math.max(0,this.actionTime-dt);this.simTime+=delta;this.totalTime+=delta;this.roomTime+=delta;this.totalRealTime+=realDelta;this.roomRealTime+=realDelta;this.bannerTime=Math.max(0,this.bannerTime-dt);p.cool=Math.max(0,p.cool-delta);p.kick=Math.max(0,p.kick-dt*5);if(p.reload>0){p.reload=Math.max(0,p.reload-delta);if(!p.reload){const rounds=Math.min(WEAPONS[p.held].capacity-p.ammo,p.reserve);p.ammo+=rounds;p.reserve-=rounds;this.emit('loaded')}}
 if(moving){const n=Math.max(1,moving),speed=3.7*delta;this.move(p,(Math.sin(p.yaw)*mz+Math.cos(p.yaw)*mx)/n*speed,(Math.cos(p.yaw)*mz-Math.sin(p.yaw)*mx)/n*speed);}
 for(const e of this.enemies){if(!e.alive)continue;if(e.entryDelay>0){e.entryDelay=Math.max(0,e.entryDelay-delta);continue;}if(e.enter>0){e.enter=Math.max(0,e.enter-delta);const t=1-e.enter/1.1;e.x=e.door.ox+(e.door.x-e.door.ox)*t;e.z=e.door.oz+(e.door.z-e.door.oz)*t;e.angle=Math.atan2(e.door.x-e.door.ox,e.door.z-e.door.oz);continue;}const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz);e.angle=Math.atan2(dx,dz);e.phase+=delta*5;const los=this.visible({x:e.x,y:1.25,z:e.z},p);const desired=e.type==='rush'?1:6.5;if(dist>desired||!los){let vx=dx/Math.max(.01,dist),vz=dz/Math.max(.01,dist),speed=(e.type==='rush'?1.75:1.05)*this.settings.move*delta;if(this.blocked(e.x+vx*.6,e.z+vz*.6,.32)){const angle=e.angle+e.route*1.2;vx=Math.sin(angle);vz=Math.cos(angle);if(this.blocked(e.x+vx*.6,e.z+vz*.6,.32))e.route*=-1;}this.move(e,vx*speed,vz*speed,.32)}
 if(e.type==='rush'){if(dist<.85&&los){this.die({kind:'fist',origin:{x:e.x,y:1.25,z:e.z},impact:{x:p.x,y:1.3,z:p.z},attacker:e.id});break;}continue;}if(e.windup>0){e.windup-=delta;if(e.windup<=0){const a={x:e.x,y:1.25,z:e.z},target=e.target,w=WEAPONS[e.weapon||'gun'],yaw=Math.atan2(target.x-a.x,target.z-a.z),pitch=Math.atan2(target.y-a.y,Math.hypot(target.x-a.x,target.z-a.z)),speed=this.settings.speed*(e.weapon==='rifle'?1.3:1);
 const count=e.weapon==='shotgun'?3:1;for(let j=0;j<count;j++){const angle=yaw+(j-(count-1)/2)*.085;this.bullets.push({id:this.nextId++,...a,origin:{...a},attacker:e.id,vx:Math.sin(angle)*Math.cos(pitch)*speed,vy:Math.sin(pitch)*speed,vz:Math.cos(angle)*Math.cos(pitch)*speed,owner:'enemy',type:'shot',age:0,path:[],near:false,closest:99});}
 e.fire=this.settings.interval*(e.weapon==='smg'?.55:e.weapon==='shotgun'?1.3:e.weapon==='rifle'?1.2:1)+(e.id%3)*.15;this.emit('enemyShot',{weapon:e.weapon});}}else{e.fire-=delta;if(e.fire<=0&&los){e.windup=.55;e.target={x:p.x,y:1.28,z:p.z};}}}
 if(this.state==='dead')return;
 for(const b of this.bullets){if(b.dead)continue;const old={x:b.x,y:b.y,z:b.z},next={x:b.x+b.vx*delta,y:b.y+b.vy*delta,z:b.z+b.vz*delta};b.age+=delta;b.path.push(old);if(b.path.length>12)b.path.shift();let hit=this.wallHit(old,next),victim=null,head=false;
 if(b.owner==='player'){const hits=[];for(const e of this.enemies){if(!e.alive)continue;const h=segmentSphere(old,next,{x:e.x,y:1.64,z:e.z},b.type==='throw'?.42:.27),body=segmentBox(old,next,{x:e.x,z:e.z,w:.65,d:.5,h:1.43},b.type==='throw'?.15:0);const t=h===null?body:body===null?h:Math.min(h,body);if(t!==null&&(hit===null||t<hit))hits.push({e,t,head:h!==null&&(body===null||h<body)});}
 for(const candidate of hits.sort((a,b)=>a.t-b.t)){if(b.pierce>0){this.kill(candidate.e,b.type,candidate.head);b.pierce--;}else{hit=candidate.t;victim=candidate.e;head=candidate.head;break;}}
 }else{const t=segmentBox(old,next,{x:p.x,z:p.z,w:.42,d:.42,h:1.8});if(t!==null&&(hit===null||t<hit)){hit=t;victim=p;}const d=Math.hypot(next.x-p.x,next.z-p.z);b.closest=Math.min(d,b.closest);if(victim!==p&&hit===null&&!b.near&&b.closest<.85&&d>b.closest+.15){b.near=true;this.dodges++;this.emit('dodge');}}
 Object.assign(b,next);if(hit!==null){b.dead=true;if(victim===p){const impact={x:old.x+(next.x-old.x)*hit,y:old.y+(next.y-old.y)*hit,z:old.z+(next.z-old.z)*hit};this.die({kind:'shot',origin:b.origin||b.path[0]||old,impact,attacker:b.attacker});return;}else if(victim)this.kill(victim,b.type,head);else this.emit('impact');}if(b.age>9||b.y<0||b.y>4.5)b.dead=true;if(b.dead&&b.type==='throw'&&(isFirearm(b.item)||isMelee(b.item))){this.items.push({id:'thrown-'+b.id,kind:b.item,x:old.x,z:old.z,y:.06,ammo:b.ammo,reserve:b.reserve});}}
 this.bullets=this.bullets.filter(b=>!b.dead);this.animateShards(delta);this.animateItems(delta);
 if(this.state==='playing'&&this.enemies.every(e=>!e.alive)&&this.pendingWaves.length){this.reinforce();}
 else if(this.state==='playing'&&this.enemies.every(e=>!e.alive)){this.clearBonus=this.roomValue;this.addScore(this.clearBonus);this.state='clearing';this.clearTime=.8;}
 }
 reinforce(){const group=this.pendingWaves.shift(),used=new Map();this.wave++;
  for(const entry of group){
   let door=entry.door||this.room.doors[0];
   if(Math.hypot(door.x-this.player.x,door.z-this.player.z)<3)door=this.room.doors.slice().sort((a,b)=>Math.hypot(b.x-this.player.x,b.z-this.player.z)-Math.hypot(a.x-this.player.x,a.z-this.player.z))[0];
   const entryDelay=(used.get(door)||0)*.45;used.set(door,(used.get(door)||0)+1);const id=this.enemies.length;this.enemies.push({...entry,door,entryDelay,x:door.ox,z:door.oz,id,alive:true,y:0,angle:Math.atan2(door.x-door.ox,door.z-door.oz),phase:id,fire:1.2,windup:0,target:null,route:id%2?1:-1,enter:1.1});
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
