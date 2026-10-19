import {bindAudioControl} from './audio-controls.js';
import {readTankScores,saveTankScore} from './tanks-scores.js';
import {SoundEffects,bindSounds} from './sound-effects.js';
import {TankMusic} from './tanks-music.js';
import {TankGame,W,H,LEVELS,traceShot,BLAST_RADIUS,LEVEL_TRANSITION_SECONDS} from './tanks-physics.js';
const $=id=>document.getElementById(id),canvas=$('field'),ctx=canvas.getContext('2d'),game=new TankGame();
let scoreSaved=false,scoreStorage;try{scoreStorage=localStorage;}catch{}
const viewHeight=()=>game.levels[game.level].playHeight||H;
const music=new TankMusic();
const effects=new SoundEffects();bindSounds($('effects-button'),effects);
bindAudioControl($('music'),music);
addEventListener('pagehide',()=>music.stop());
const ink='#232421',red='#c73136',muted='#d9d9d2';
let pauseFrom='playing';const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys=new Set();let pointer={x:700,y:320},fire=false,queuedShot=false,last=performance.now(),acc=0,shown='',touchMove={x:0,y:0},touchAim=null;
const input=()=>{const shot=queuedShot;queuedShot=false;return {x:touchMove.x+(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),y:touchMove.y+(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0),aim:touchAim??Math.atan2(pointer.y-game.player.y,pointer.x-game.player.x),fire:fire||keys.has('KeyF'),firePressed:shot};};
function resetInput(){game.player.pendingFire=0;keys.clear();fire=false;queuedShot=false;touchMove={x:0,y:0};touchAim=null;document.querySelectorAll('.pad i').forEach(e=>e.style.transform='');}
function pause(){if(['playing','clear'].includes(game.state)){pauseFrom=game.state;game.state='paused';resetInput();}else if(game.state==='paused')game.state=pauseFrom;sync();}
addEventListener('keydown',e=>{if($('tank-scores-dialog').open)return;if(e.target.matches('input'))return;if(['KeyW','KeyA','KeyS','KeyD','Space','KeyF','KeyP','Escape'].includes(e.code))e.preventDefault();if(e.code==='KeyP'&&!e.repeat)pause();if(e.code==='Escape'&&!e.repeat&&['playing','clear','paused'].includes(game.state))pause();keys.add(e.code);if(e.code==='KeyF'&&!e.repeat&&game.state==='playing')queuedShot=true;if(e.code==='Space'&&!e.repeat)game.mine();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{resetInput();if(['playing','clear'].includes(game.state))pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(['playing','clear'].includes(game.state))pause();}});
function updatePointer(e){const b=canvas.getBoundingClientRect();pointer={x:(e.clientX-b.left)*W/b.width,y:(e.clientY-b.top)*viewHeight()/b.height};}
canvas.addEventListener('pointermove',updatePointer);canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;updatePointer(e);if(game.state==='playing'){queuedShot=true;fire=true;canvas.setPointerCapture(e.pointerId);e.preventDefault();}});
canvas.addEventListener('pointerup',()=>fire=false);canvas.addEventListener('pointercancel',()=>fire=false);canvas.addEventListener('lostpointercapture',()=>fire=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
$('pause').onclick=()=>{pause();$('pause').blur();};$('resume').onclick=()=>{pause();$('resume').blur();};
$('restart-run').onclick=()=>{resetInput();scoreSaved=false;$('tank-initials').value='';$('tank-score-status').textContent='';game.newRun();$('restart-run').blur();sync();};
$('action').onclick=()=>{resetInput();if(game.state==='won'||(game.state==='dead'&&!game.lives)){scoreSaved=false;$('tank-initials').value='';$('tank-score-status').textContent='';}if(game.state==='dead')game.retry();else if(game.state==='won'){game.newRun();}else game.start();$('action').blur();sync();};
$('mine').onclick=()=>{game.mine();$('mine').blur();};
for(const id of ['drive','aim']){const pad=$(id);let active=null;function move(e){const b=pad.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/32,y=(e.clientY-b.top-b.height/2)/32,n=Math.max(1,Math.hypot(x,y));pad.querySelector('i').style.transform=`translate(${x/n*24}px,${y/n*24}px)`;if(id==='drive')touchMove={x:x/n,y:y/n};else{touchAim=Math.atan2(y,x);fire=true;}}pad.addEventListener('pointerdown',e=>{if(active!==null)return;active=e.pointerId;pad.setPointerCapture(active);move(e);});pad.addEventListener('pointermove',e=>{if(e.pointerId===active)move(e);});const release=e=>{if(e.pointerId!==active)return;active=null;pad.querySelector('i').style.transform='';if(id==='drive')touchMove={x:0,y:0};else{fire=false;touchAim=null;}};for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,release);}
function sync(){document.documentElement.style.setProperty('--arena-scale',W/viewHeight());music.update(game,document.hidden||$('tank-scores-dialog').open);const level=String(game.level+1).padStart(2,'0');$('level').textContent=`${level} / ${LEVELS.length}`;$('lives').textContent=game.lives>5?`● × ${game.lives}`:'● '.repeat(game.lives)+'○ '.repeat(Math.max(0,3-game.lives));$('lives').setAttribute('aria-label',`${game.lives} tanks remaining`);$('score').textContent=String(game.score).padStart(4,'0');const loaded=5-game.shots.filter(s=>s.owner===0).length;$('ammo').textContent='● '.repeat(loaded)+'○ '.repeat(5-loaded);$('ammo').setAttribute('aria-label',`${loaded} shells available`);canvas.dataset.state=game.state;canvas.dataset.level=game.level+1;
 $('tank-score-form').hidden=scoreSaved||!(game.state==='won'||(game.state==='dead'&&!game.lives));
 if(shown===game.state)return;if(shown==='clear'&&game.state==='playing')resetInput();shown=game.state;$('overlay').hidden=['playing','replay','clear'].includes(game.state);$('pause').disabled=!['playing','paused','clear'].includes(game.state);$('pause').textContent=game.state==='paused'?'Resume P':'Pause P';$('resume').hidden=game.state!=='paused';$('action').hidden=game.state==='paused';$('eyebrow').textContent=`${level} / ${LEVELS.length}`;$('eyebrow').hidden=['ready','paused'].includes(game.state);$('message').hidden=['ready','paused'].includes(game.state);$('restart-run').hidden=game.state!=='paused';$('overlay').classList.toggle('pause-mode',game.state==='paused');$('exit-game').textContent=game.state==='paused'?'Exit to arcade':'All games';$('transition-status').textContent=game.state==='clear'?`Field clear. Mission ${game.level+2} starting. ${game.levels[game.level+1].enemies.length} enemy tanks.`:'';$('overlay').classList.toggle('launch-screen',game.state==='ready');
 const copy={ready:['Tanks','','Play'],paused:['Paused','',''],dead:[game.lives?'Tank lost.':'Run over.',game.lives?`${game.lives} remaining. Try a different angle.`:`${game.score} points · field ${level}` ,game.lives?'Retry field →':'Start again →'],won:['All clear.',`${game.score} points · ${LEVELS.length} fields cleared.`,'Play again →']}[game.state];if(copy){$('title').textContent=copy[0];$('message').textContent=copy[1];$('action').textContent=copy[2];}if(game.state!=='playing')resetInput();}

function renderTankScores(){const list=$('tank-highscores');list.replaceChildren();const scores=readTankScores(scoreStorage);if(!scores.length){const item=document.createElement('li');item.textContent='NO SCORES YET';list.append(item);}for(const [i,entry] of scores.entries()){const item=document.createElement('li');for(const text of [String(i+1).padStart(2,'0'),entry.initials,entry.score.toLocaleString(),entry.complete?'ALL CLEAR':`FIELD ${String(entry.mission).padStart(2,'0')}`]){const span=document.createElement('span');span.textContent=text;item.append(span);}list.append(item);}}
$('highscores-button').onclick=()=>{resetInput();renderTankScores();$('tank-scores-dialog').showModal();};
$('close-tank-scores').onclick=()=>$('tank-scores-dialog').close();
$('tank-initials').oninput=()=>{$('tank-initials').value=$('tank-initials').value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);};
$('tank-score-form').onsubmit=event=>{event.preventDefault();if(scoreSaved||!(game.state==='won'||(game.state==='dead'&&!game.lives)))return;const initials=$('tank-initials').value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);if(initials.length!==3){$('tank-score-status').textContent='Enter three letters.';return;}const saved=saveTankScore(scoreStorage,{initials,score:game.score,mission:game.level+1,complete:game.state==='won'});if(!saved.ok){$('tank-score-status').textContent='Browser storage is unavailable. Score could not be saved.';return;}scoreSaved=true;$('tank-score-status').textContent='Score saved on this browser.';sync();renderTankScores();$('tank-scores-dialog').showModal();};

function line(x1,y1,x2,y2,color=ink,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function circle(x,y,r,color=ink,fill='white',width=1.5){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function polygon(points,fill='white',stroke=ink,width=1.2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function roundedBox(x,y,w,h,r,stroke=ink,fill='white',width=1.5){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function drawTank(t){
 const player=t.type==='player',type=t.type,c=player?ink:red,heavy=['warrior','elite','sniper'].includes(type),length=type==='miner'?44:type==='stealth'?40:42;
 ctx.save();
 if(game.state!=='replay'&&type==='stealth'&&t.hold<=0&&t.mineCool<2.6)ctx.globalAlpha=.045;
 ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.angle);
 for(const y of [-16,7]){
  roundedBox(-length/2,y,length,9,heavy?2:4.5,player?red:ink,'white');
  for(let x=-13;x<=14;x+=7)line(x,y+2,x,y+7,player?red:ink,.8);
 }
 if(['stealth','elite'].includes(type))polygon([[-22,-7],[8,-12],[21,0],[8,12],[-22,7],[-15,0]],'white',c);
 else roundedBox(-18,-10,36,20,heavy?2:7,player?red:ink,'white');
 if(type==='miner')for(const y of [-7,7])circle(-19,y,5,red,'white',1.4);
 if(type==='sentry')for(const x of [-19,19])line(x,-19,x,19,ink,2);
 if(type==='warrior'){line(-15,-19,15,-19,red,2);line(-15,19,15,19,red,2);}
 ctx.restore();
 ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.aim);ctx.lineJoin='round';ctx.lineCap='round';
 const fill='white';
 if(type==='sniper'){
  roundedBox(4,-2,34,4,1,c);line(30,-6,30,6,c,2);polygon([[-13,-9],[8,-9],[12,0],[8,9],[-13,9]],'white',c);
 }else if(type==='rocket'||type==='elite'){
  const pods=type==='elite'?[-8,8]:[0];
  for(const y of pods){roundedBox(-11,y-5,38,10,2,c);line(20,y-4,20,y+4,c,2);polygon([[-12,y-5],[-19,y-9],[-16,y],[-19,y+9],[-12,y+5]],'white',c);}
 }else{
  roundedBox(5,-4,type==='sentry'?20:27,8,2,c,fill);
  if(type==='stealth')polygon([[-15,0],[-5,-12],[14,0],[-5,12]],'white',c);
  else if(type==='warrior')polygon([[-14,-7],[-7,-13],[9,-13],[16,0],[9,13],[-7,13],[-14,7]],'white',c,2);
  else if(type==='hunter')polygon([[-13,-11],[5,-11],[15,0],[5,11],[-13,11]],'white',c,1.6);
  else if(type==='sentry')circle(0,0,12,c);
  else roundedBox(-12,-11,25,22,type==='miner'?3:8,c,fill);
  if(type==='miner'){circle(-1,0,5,red);line(-1,-3,-1,3,red);line(-4,0,2,0,red);}
  if(type==='patrol')line(-6,-4,4,0,red,1.6);
  if(type==='hunter'){line(-6,-5,4,-5,red,1.5);line(-6,5,4,5,red,1.5);}
  if(type==='stealth'){line(-5,-5,2,0,c);line(2,0,-5,5,c);}
 }
 ctx.restore();ctx.restore();
}
function draw(){const height=viewHeight(),dpr=Math.min(devicePixelRatio||1,2),b=canvas.getBoundingClientRect(),pw=Math.round(b.width*dpr),ph=Math.round(b.height*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}ctx.setTransform(canvas.width/W,0,0,canvas.height/height,0,0);ctx.clearRect(0,0,W,height);ctx.fillStyle='white';ctx.fillRect(0,0,W,height);
 ctx.fillStyle='#deded7';for(let x=40;x<W;x+=40)for(let y=40;y<height;y+=40)ctx.fillRect(x,y,1,1);
 for(const w of game.pits)circle(w.x+w.w/2,w.y+w.h/2,w.w*.32,ink,'#ededE8',1.2);
 for(const w of game.wrecks){line(w.x-7,w.y-7,w.x+7,w.y+7,'#c7c7bf',2);line(w.x-7,w.y+7,w.x+7,w.y-7,'#c7c7bf',2);}
 for(const t of game.tracks){ctx.save();ctx.globalAlpha=Math.min(.24,t.life/20);ctx.translate(t.x,t.y);ctx.rotate(t.a);line(-3,-14,3,-14,ink,2);line(-3,14,3,14,ink,2);ctx.restore();}
 ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.strokeRect(12,12,W-24,height-24);ctx.strokeStyle=muted;ctx.strokeRect(5,5,W-10,height-10);
 for(const w of game.walls){
  if(w.y>=height-12)continue;
  ctx.strokeStyle=ink;ctx.lineWidth=1.3;ctx.fillStyle='white';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeRect(w.x,w.y,w.w,w.h);
  if(w.soft){ctx.save();ctx.beginPath();ctx.rect(w.x,w.y,w.w,w.h);ctx.clip();for(let x=w.x-w.h;x<w.x+w.w;x+=12)line(x,w.y+w.h,x+w.h,w.y,'#e5c4c2',.8);ctx.restore();line(w.x+7,w.y+7,w.x+14,w.y+7,red,1.5);}
  else{for(let x=w.x+(W-24)/game.grid.cols;x<w.x+w.w-.1;x+=(W-24)/game.grid.cols)line(x,w.y,x,w.y+w.h,muted,.7);for(let y=w.y+(H-24)/game.grid.rows;y<w.y+w.h-.1;y+=(H-24)/game.grid.rows)line(w.x,y,w.x+w.w,y,muted,.7);}
 }
 for(const m of game.mines){const warning=m.warning!==null,flash=warning&&Math.sin(m.age*28)>0;circle(m.x,m.y,10,red,flash?red:'white',1.5);line(m.x-4,m.y,m.x+4,m.y,flash?'white':red);line(m.x,m.y-4,m.x,m.y+4,flash?'white':red);if(warning){ctx.save();ctx.globalAlpha=.35;ctx.setLineDash([3,7]);circle(m.x,m.y,BLAST_RADIUS,red,null,.8);ctx.restore();}}
 if(game.player.alive){const p=game.player,segments=traceShot(p.x,p.y,p.aim,game.walls,0,Math.min(450,Math.hypot(pointer.x-p.x,pointer.y-p.y)));const end=segments[0];if(end){for(let d=48;d<end.length;d+=24){const x=p.x+Math.cos(p.aim)*d,y=p.y+Math.sin(p.aim)*d;circle(x,y,1.7,'#d9a5a5','#d9a5a5',.5);}}}

 for(const t of game.tanks)if(t.alive)drawTank(t);
 for(const s of game.shots){const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.lineCap='round';if(s.rocket){for(let i=0;i<s.trail.length;i+=2){const p=s.trail[i];circle(p.x,p.y,2+i*.2,'#d9a5a5',null,.7);}ctx.translate(s.x,s.y);ctx.rotate(a);polygon([[-12,-4],[-21,-8],[-18,0],[-21,8],[-12,4]],red,red);polygon([[-14,-4],[0,-4],[8,0],[0,4],[-14,4]],'white',red,2);polygon([[-16,-2],[-26-(Math.sin(s.age*80)+1)*3,0],[-16,2]],'#ed9b37','#ed9b37');}else line(s.x-Math.cos(a)*8,s.y-Math.sin(a)*8,s.x,s.y,s.owner===0?ink:red,8);ctx.restore();}
 for(const e of game.effects){ctx.save();ctx.globalAlpha=1-e.age/.65;const r=e.big?e.age*130:3+e.age*20;circle(e.x,e.y,r,red,null,1.3);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,e.x+Math.cos(a)*(r+8),e.y+Math.sin(a)*(r+8),ink,.8);}ctx.restore();}
 if(game.player.alive&&game.player.invulnerable>0)circle(game.player.x,game.player.y,28,red,null,1.5);
 if(game.state==='replay'&&game.death){const d=game.death;ctx.save();ctx.fillStyle='rgba(255,255,255,.48)';ctx.fillRect(12,12,W-24,height-24);
  if(d.path.length){ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=red;ctx.lineWidth=4;ctx.beginPath();d.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(d.impact.x,d.impact.y);ctx.stroke();}
  if(d.attacker){drawTank(d.attacker);circle(d.attacker.x,d.attacker.y,32,red,null,4);}
  if(d.mine)circle(d.mine.x,d.mine.y,BLAST_RADIUS,red,null,3);
  circle(d.impact.x,d.impact.y,25,red,null,3);ctx.fillStyle=red;ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.fillText(game.lives?`RESPAWNING IN ${Math.ceil(game.respawnTime)} · PROGRESS SAVED`:'TANK LOST · RUN OVER',W/2,42);ctx.restore();}
 if(game.state==='clear'){
  const elapsed=game.transitionTime,progress=Math.min(1,elapsed/LEVEL_TRANSITION_SECONDS),next=game.levels[game.level+1],intro=elapsed<.85;
  ctx.save();ctx.fillStyle=`rgba(255,255,255,${Math.min(.96,.4+elapsed*.6)})`;ctx.fillRect(0,0,W,height);
  const shift=reducedMotion?0:Math.max(0,1-elapsed/.3)*W;ctx.translate(shift,0);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.font='28px Arial';ctx.fillText(intro?'Field clear':`Mission ${String(game.level+2).padStart(2,'0')}`,W/2,height/2-60);
  ctx.font='13px monospace';ctx.fillStyle=red;ctx.fillText(intro?'':`${next.enemies.length} ENEMY ${next.enemies.length===1?'TANK':'TANKS'}`,W/2,height/2-28);
  const count=next.enemies.length,spacing=58,start=W/2-(count-1)*spacing/2;
  if(!intro)for(let i=0;i<count;i++){const entry=reducedMotion?0:Math.max(0,1-(elapsed-.85-i*.05)/.4)*120;drawTank({x:start+i*spacing-entry,y:height/2+22,type:next.enemies[i][2],angle:0,aim:0,hold:1,mineCool:0});}
  line(W/2-100,height/2+75,W/2+100,height/2+75,muted,2);line(W/2-100,height/2+75,W/2-100+200*progress,height/2+75,red,2);
  ctx.restore();
 }
 if(game.state==='playing'&&touchAim===null){const {x,y}=pointer;circle(x,y,7,red,null,1);line(x-12,y,x-9,y,red);line(x+9,y,x+12,y,red);line(x,y-12,x,y-9,red);line(x,y+9,x,y+12,red);}
}
function frame(now){acc+=Math.min((now-last)/1000,.1);last=now;while(acc>=1/120){if(!document.hidden&&!$('tank-scores-dialog').open)game.step(1/120,input());acc-=1/120;}sync();effects.tanks(game);draw();requestAnimationFrame(frame);}sync();requestAnimationFrame(frame);

const launchParams=new URLSearchParams(location.search);
if(launchParams.get('scores')==='1')$('highscores-button').click();
else if(launchParams.get('play')==='1')$('action').click();
