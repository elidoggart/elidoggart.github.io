import {roomBounds} from './still-engine.js?v=combat-puzzle-3';
const INK='#232421',LINE='#d9dedb',RED='#c73136';
// Small world-space lettering: the same depth buffer as walls and furniture.
const GLYPHS={
 A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],
 C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],
 E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],
 G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],
 I:['111','010','010','010','010','010','111'],J:['00111','00010','00010','00010','10010','10010','01100'],
 K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],
 M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],
 Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],
 S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],
 U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],
 W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111']
};
export function lettering(v,text,x,y,z,width,color=INK){
 const step=width/(text.length*6),left=x-width/2;
 for(const [i,ch]of [...text].entries())for(const [row,bits]of (GLYPHS[ch]||[]).entries()){
  let start=-1;
  for(let col=0;col<=bits.length;col++){
   if(bits[col]==='1'&&start<0)start=col;
   if(start>=0&&bits[col]!=='1'){v.face([[left+(i*6+start)*step,y+(6-row)*step,z],[left+(i*6+col-.2)*step,y+(6-row)*step,z],[left+(i*6+col-.2)*step,y+(6.75-row)*step,z],[left+(i*6+start)*step,y+(6.75-row)*step,z]],color,color,.2);start=-1;}
  }
 }
}
export function terminal(v,b){
 const {x,z,w,d,h}=b;
 v.box(x,h-.08,z,w,.08,d,INK);for(const side of [-1,1])v.box(x+side*w*.42,0,z,.06,h,.7,LINE);
 v.box(x,h,z+.12,.38,.04,.24);v.box(x,h+.03,z+.23,.06,.2,.06);
 v.box(x,h+.22,z+.23,1.38,.61,.08,INK,0,false,INK);
 v.box(x,h+.26,z+.183,1.3,.53,.012,INK,0,false,'#263a34');
 lettering(v,'GET OUT OF THERE',x,h+.59,z+.17,1.15,'#c9ecdc');
 lettering(v,'EXTRACTION ON ROOF',x,h+.41,z+.17,1.15,'#c9ecdc');
 v.box(x,h+.015,z-.27,.7,.025,.23,INK);v.box(x+.53,h+.015,z-.27,.09,.04,.15,INK);
}
export function drawExit(v,r){
 const e=r.exit;if(!e)return;const {x,z}=e,open=v.sceneOpen,lit=open&&v.sceneActive,color=lit?RED:INK;
 if(e.kind==='boarding'){
  // A level side ramp bridges the roof edge to the aircraft doorway.
  v.box(x,-.12,z+e.travel/2,1.6,.12,e.travel,INK,0,false,'#e7eae7');
  for(const side of [-1,1]){v.line([x+side*.85,.9,z-.7],[x+side*.85,.9,z+e.travel],color,1.5);v.box(x+side*.85,0,z,.045,.9,.045,color);}
 }
 for(const side of [-1,1])v.box(x+side*.84,0,z,.12,2.6,.16,color,0,false,lit?RED:'#e1e4e0');
 v.box(x,2.55,z,1.8,.12,.16,color,0,false,lit?RED:'#e1e4e0');
 if(lit){
  v.line([x,3.15,z-.13],[x,2.84,z-.13],RED,2);
  v.line([x-.16,3,z-.13],[x,2.84,z-.13],RED,2);v.line([x+.16,3,z-.13],[x,2.84,z-.13],RED,2);
 }
 if(!open){
  v.box(x,0,z,1.55,2.5,.08,LINE,0,false,'#e8ebe8');
  v.line([x,0,z-.05],[x,2.5,z-.05],INK,.8);v.box(x+.53,1.1,z-.07,.12,.04,.05,INK);
 }
 if(e.kind==='elevator'){
  for(const side of [-1,1])v.box(x+side*1.05,0,z+.9,.1,3,1.9,INK,0,false,'#e4e7e5');
  v.box(x,2.95,z+1.2,2.2,.08,2.6,LINE);
  v.box(x+1.14,1.1,z-.1,.2,.42,.04,INK);v.box(x+1.14,1.27,z-.13,.07,.07,.02,color);
 }
}
export function drawBoundary(v,r){
 const bounds=roomBounds(r),cutaway=v.game.state==='dead',height=cutaway?.35:r.theme==='roof'?.85:r.theme==='helicopter'?2.65:3.4;
 for(const side of ['north','south','east','west']){
  const horizontal=side==='north'||side==='south',sign=side==='north'||side==='east'?1:-1,n=horizontal?bounds.z:bounds.x,span=horizontal?bounds.x:bounds.z;
  const box=(offset,along,y,h,depth=.18,dist=r.theme==='helicopter'?n-.09:n+.09,color=INK,fill='white')=>horizontal?v.box(offset,y,sign*dist,along,h,depth,color,0,false,fill):v.box(sign*dist,y,offset,depth,h,along,color,0,false,fill);
  const wallHeight=r.theme==='helicopter'&&side==='north'?1.1:height;
  const doors=[...(r.exit&&Math.abs(r.exit.z-bounds.z)<.1?[{...r.exit,exit:true}]:[]),...(r.entrance?[{...r.entrance,entrance:true}]:[]),...(r.doors||[])].filter((d,i,a)=>d.side===side&&a.findIndex(other=>other.side===d.side&&other.offset===d.offset)===i).sort((a,b)=>a.offset-b.offset);
  let start=-span;
  for(const door of doors){
   const left=door.offset-.8,right=door.offset+.8;if(left>start)box((start+left)/2,left-start,0,wallHeight);start=right;
   if(!cutaway&&r.theme!=='roof')box(door.offset,1.6,2.6,height-2.6);
   if(door.exit||door.entrance)continue;
   for(const edge of [left,right])box(edge,.08,0,cutaway?.35:2.55,2.6,n+1.3);
   box(door.offset,1.6,-.04,.04,2.6,n+1.3);box(door.offset,1.6,0,cutaway?.35:2.55,.1,n+2.6,LINE);
  }
  if(start<span)box((start+span)/2,span-start,0,wallHeight);
 }
 // Enclose the connecting passage, but never put a wall across its far end.
 if(r.exit&&r.exit.kind!=='boarding'&&r.exit.kind!=='cockpit'){
  const e=r.exit;for(const side of [-1,1])v.box(e.x+side*.86,0,e.z+e.travel/2,.12,cutaway?.35:2.7,e.travel,LINE);
  v.box(e.x,-.04,e.z+e.travel/2,1.6,.04,e.travel,LINE);
  if(!cutaway)v.box(e.x,2.7,e.z+e.travel/2,1.85,.06,e.travel,LINE);
 }
}
export function drawArchitecture(v,r){
 const n=r.size/2;drawExit(v,r);
 if(r.theme==='roof'){v.skyline(n);for(const x of [-7,7]){v.box(x,.02,0,.07,.015,14,LINE);v.box(x,0,-8,.1,1,.1);}return;}
 if(r.theme==='helicopter'){if(v.game.state!=='dead')helicopter(v,r);return;}
 for(let z=-n+3;z<n;z+=5)for(const x of [-n*.45,n*.45])v.box(x,3.3,z,1.5,.045,.45,LINE);
 if(r.theme==='cubicles'){
  // Carpet lanes, pinboards, filing cabinets and workstation islands.
  for(const x of [-2,2])v.box(x,.002,0,.04,.005,n*2,LINE);
  for(const x of [-n+.45,n-.45])for(const z of [-4,3]){
   v.box(x,0,z,.7,1.15,1.7,LINE,0,false,'#f0f2ee');
   for(const y of [.3,.65,1])v.box(x,y,z,.73,.025,1.5,INK);
  }
  v.box(-5,1.8,n-.13,2,.9,.035,LINE);
  for(const x of [-5.6,-5,-4.4])v.box(x,2,n-.16,.35,.42,.025,LINE);
 }else if(r.theme==='break'){
  // Full-height refrigerator, countertop, sink, microwave and wall cupboards.
  v.box(-n+.65,0,-1,1.1,2.35,1.5,INK,0,false,'#edf1ef');v.box(-n+1.22,.85,-1,.04,.9,.05,INK);
  v.box(-n+.7,0,3.2,1.1,.92,4,LINE);v.box(-n+.7,.92,3.2,1.2,.08,4.1,INK);
  v.box(-n+.7,1,2.3,.65,.03,.9,INK,0,false,'#c4cdca');
  v.limb([-n+.8,1,2.6],[-n+.8,1.35,2.6],.025,.025,INK);v.limb([-n+.8,1.35,2.6],[-n+.55,1.35,2.6],.025,.025,INK);
  v.box(-n+.7,1,4.3,.8,.5,1,INK);v.box(-n+.27,1.08,4.3,.03,.3,.7,LINE,0,false,'#354540');
 }else if(r.theme==='reception'){
  v.box(0,.006,0,4,.008,12,LINE,0,false,'#edf0ed');
  for(const x of [-7.5,7.5]){v.box(x,.35,-2,1.3,.25,3,INK);v.box(x+Math.sign(x)*.5,.6,-2,.15,.7,3,INK);}
  for(const x of [-7,7])v.box(x,0,7,1,.6,1,LINE,0,false,'#e2e7df');
 }
}
function helicopter(v,r){
 // Keep the roof's city in the same place throughout side boarding.
 if(v.game.room.theme==='helicopter'&&!v.game.previousRoom)v.skyline(r.size/2);
 // Side-entry fuselage aligned with the playable cabin, including outside roof.
 for(let z=-8;z<=8;z+=2){
  for(const side of [-1,1]){v.box(side*3.12,0,z,.08,2.65,.08,LINE);v.limb([side*3.12,2.65,z],[side*2.45,3.25,z],.04,.04,INK);}
  v.box(0,3.25,z,4.9,.1,.08,INK);
 }
 for(const side of [-1,1]){
  v.face([[side*3.2,2.7,-10],[side*2.45,3.3,-10],[side*2.45,3.3,8.7],[side*3.2,2.7,8.7]],INK,'#eff1ee');
  for(const z of [-3,1,5])v.box(side*3.215,1.65,z,.025,.66,1.1,INK,0,false,'#c0d1cc');
 }
 for(const side of [-1,1]){
  v.face([[side*3.2,.2,-10],[side*2.45,-.5,-9],[side*2.45,-.5,8.8],[side*3.2,.2,10]],INK,'#dbe1dc');
  v.face([[side*3.2,1.1,10],[side*1.6,.65,11.4],[side*1.35,2.1,10.8],[side*2.45,2.7,9.4]],INK,null);
 }
 v.face([[-1.6,.65,11.4],[1.6,.65,11.4],[1.35,2.1,10.8],[-1.35,2.1,10.8]],INK,null);
 v.face([[-3.2,.2,10],[3.2,.2,10],[1.6,.65,11.4],[-1.6,.65,11.4]],INK,'#e8ece7');
 v.box(0,3.3,-.8,4.9,.08,18.4,INK,0,false,'#eef1ed');
 for(const z of [-7,6]){
  v.box(0,3.4,z,1.3,1.1,1.8,INK,0,false,'#e5e9e4');v.box(0,4.5,z,.15,.45,.15,INK);
  for(const a of [0,Math.PI/3,Math.PI*2/3])v.box(0,4.95,z,12,.045,.2,INK,v.game.simTime*9+a);
  for(const side of [-1,1]){v.limb([side*2.9,.5,z],[side*3.6,-.4,z],.07,.06,INK);v.box(side*3.6,-.75,z,.25,.5,.75,INK);}
 }
 for(const x of [-1.6,1.6])v.line([x,.01,-9],[x,.01,5.8],LINE,.8);
 // Cockpit bulkhead, two pilot seats, central pedestal, instrument panel and yokes.
 for(const side of [-1,1]){
  v.box(side*2,0,6,2.2,2.65,.12,LINE);
  v.box(side, .45,7.7,.8,.18,1.1,INK);v.box(side,.63,7.3,.8,.95,.16,INK,0,false,'#e0e5e2');
  for(const a of [-1,1])v.box(side+a*.43,.7,7.65,.08,.08,.65,INK);
 }
 v.box(0,.2,8.4,.45,.55,1.6,INK,0,false,'#e8ece8');
 for(const z of [7.9,8.15,8.4,8.65]){v.box(-.1,.76,z,.06,.035,.08,INK);v.box(.1,.76,z,.06,.035,.08,INK);}
 v.box(0,.85,9.45,4.8,.36,.62,INK,0,false,'#d9e0dc');
 for(const x of [-1.45,0,1.45]){
  v.box(x,1.08,9.12,.85,.48,.05,INK,0,false,'#263a34');
  v.line([x-.28,1.31,9.085],[x+.28,1.31,9.085],'#b8d6ca',1.5);
  for(const y of [1.21,1.26,1.36,1.41])v.line([x-.12,y,9.085],[x+.12,y,9.085],'#b8d6ca',.7);
  v.line([x-.3,1.12,9.085],[x-.3,1.49,9.085],'#b8d6ca',1);
  lettering(v,x<0?'AIR':x>0?'ALT':'NAV',x,1.11,9.078,.25,'#c9ecdc');
 }
 for(const x of [-.7,.7]){
  v.box(x,1.1,9.12,.4,.42,.05,INK,0,false,'#e1e8e1');
  for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8;v.line([x+Math.sin(a)*.14,1.33+Math.cos(a)*.14,9.085],[x+Math.sin(b)*.14,1.33+Math.cos(b)*.14,9.085],INK,1);}
  v.line([x,1.33,9.078],[x+.07,1.43,9.078],RED,1.5);
 }
 for(let x=-2;x<=2;x+=.25)v.box(x,.94,9.105,.055,.055,.07,INK,0,false,INK);
 for(const x of [-1,1]){
  v.limb([x,.55,8.6],[x,1,8.5],.035,.03,INK);
  v.line([x-.22,1.04,8.5],[x+.22,1.04,8.5],INK,2);
  for(const dx of [-.22,.22])v.line([x+dx,1.04,8.5],[x+dx,1.18,8.5],INK,2);
 }
 v.box(0,2.55,8.6,1.1,.18,1.5,INK);
 for(const x of [-2.4,0,2.4])v.limb([x,1.25,9.8],[x*.82,2.7,9.4],.045,.045,INK);
 v.line([-2.4,1.25,9.8],[2.4,1.25,9.8],INK,2);v.line([-1.97,2.7,9.4],[1.97,2.7,9.4],INK,2);
}
