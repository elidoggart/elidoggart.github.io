import test from 'node:test';import assert from 'node:assert/strict';import {axisTicks,tickLabel} from '../equation-axes.js';
test('axes use clean zero-anchored intervals instead of fractional viewport divisions',()=>{
 assert.deepEqual(axisTicks(-3.25,3.25,650),[-3,-2,-1,0,1,2,3]);
 assert.deepEqual(axisTicks(-.7,.7,400),[-.5,-.25,0,.25,.5]);
 assert.deepEqual(axisTicks(-175,175,400),[-150,-100,-50,0,50,100,150]);
 assert.deepEqual(axisTicks(3,21,400),[5,10,15,20]);
});
test('tick spacing adapts to chart size and decimal labels stay clean',()=>{
 assert.ok(axisTicks(-4,4,120).length<axisTicks(-4,4,650).length);
 assert.deepEqual(axisTicks(0,.3,220),[0,.1,.2,.3]);assert.deepEqual(axisTicks(-4,4,120),[-2.5,0,2.5]);assert.deepEqual(axisTicks(-19,19,120),[-10,0,10]);
 assert.deepEqual(axisTicks(1,1),[]);assert.deepEqual(axisTicks(NaN,2),[]);
 assert.equal(tickLabel(-0),'0');assert.equal(tickLabel(.1+.2),'0.3');assert.equal(tickLabel(.25),'0.25');
 for(const [min,max]of [[-.0013,.0047],[-3.25,3.25],[.1,.4],[-100000,200000]]){const ticks=axisTicks(min,max,400);assert.ok(ticks.every(v=>v>=min-1e-10&&v<=max+1e-10));assert.ok(ticks.length<=10);}
});
