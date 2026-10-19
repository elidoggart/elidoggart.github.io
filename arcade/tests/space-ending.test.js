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
