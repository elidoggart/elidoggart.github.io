import test from 'node:test';
import assert from 'node:assert/strict';
import {endingFrame,ENDING_SECONDS} from '../space-ending.js';
test('all three technologies attach before ignition and departure',()=>{
 assert.deepEqual(endingFrame(0).fitted,[0,0,0]);
 assert.deepEqual(endingFrame(2.4).fitted,[1,0,0]);
 assert.deepEqual(endingFrame(4).fitted,[1,1,0]);
 assert.deepEqual(endingFrame(6).fitted,[1,1,1]);
 assert.equal(endingFrame(6).launch,0);
 assert.equal(endingFrame(8).ignition,1);
 assert.equal(endingFrame(11).launch,1);
});
test('ending completes automatically within fifteen seconds',()=>{
 assert.ok(ENDING_SECONDS<=15);
 assert.equal(endingFrame(ENDING_SECONDS-.01).done,false);
 assert.equal(endingFrame(ENDING_SECONDS).done,true);
 assert.equal(endingFrame(ENDING_SECONDS).shipScale,0);
 assert.equal(endingFrame(ENDING_SECONDS).shipOpacity,0);
 assert(endingFrame(ENDING_SECONDS).sparkle<1e-10);
});

test('departure begins at the actual dock and leaves the solar system from every landing angle',async()=>{
 const {departureRoute,departurePose}=await import('../space-ending.js');
 const home={id:'home',x:1450,y:0,r:94};
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,ship={x:home.x+107*Math.cos(a),y:107*Math.sin(a)};
  const route=departureRoute(home,ship),start=departurePose(0,route);
  assert(Math.hypot(start.x-ship.x,start.y-ship.y)<1e-8);
  for(let t=0;t<=12;t+=.025){const p=departurePose(t,route);assert(Math.hypot(p.x-home.x,p.y-home.y)>=106.999);assert(Math.hypot(p.x,p.y)>1000,'does not cross the star');}
  const end=departurePose(12,route);assert(Math.hypot(end.x,end.y)>4800);
 }
});
test('departure chooses a clear outbound lane around other planets',async()=>{
 const {departureRoute,departurePose}=await import('../space-ending.js');
 const home={id:'home',x:1450,y:0,r:94},planet={id:'outer',x:2050,y:0,r:83};
 const route=departureRoute(home,{x:1557,y:0},[home,planet]);
 for(let t=9.5;t<12;t+=.01){const p=departurePose(t,route);assert(Math.hypot(p.x-planet.x,p.y-planet.y)>planet.r+30);}
});

test('departure keeps moving smoothly through the old lift and turn junctions',async()=>{
 const {departureRoute,departurePose}=await import('../space-ending.js');
 const route=departureRoute({id:'home',x:1450,y:0,r:94},{x:1343,y:0});
 for(const t of [7.5,9.5,10.8]){
  const before=departurePose(t-.001,route),at=departurePose(t,route),after=departurePose(t+.001,route);
  const v1={x:at.x-before.x,y:at.y-before.y},v2={x:after.x-at.x,y:after.y-at.y};
  assert(Math.hypot(v1.x,v1.y)>.08,'no stop between departure phases');
  const angle=Math.atan2(v1.y,v1.x)-Math.atan2(v2.y,v2.x);
  assert(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<.01,'no hard corner');
 }
});

test('ship continues flying, shrinks away, and becomes a sparkle before results',async()=>{
 const {departureRoute,departurePose}=await import('../space-ending.js');
 const route=departureRoute({id:'home',x:1450,y:0,r:94},{x:1557,y:0});
 assert(departurePose(14,route).x>departurePose(12,route).x);
 assert(endingFrame(12).shipScale>endingFrame(13).shipScale);
 assert.equal(endingFrame(14).shipScale,0);
 assert(endingFrame(14.3).sparkle>.9);
 assert.equal(endingFrame(14.3).done,false);
 assert.equal(endingFrame(15).trailOpacity,0);
});
