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
 assert.equal(endingFrame(ENDING_SECONDS).fade,1);
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
