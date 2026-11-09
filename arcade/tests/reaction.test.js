import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,ReactionRun,readScores,saveScore} from '../reaction-engine.js';
test('generated rounds have unique correct answers and consistent workloads',()=>{
 for(let n=0;n<1000;n++)for(let level=0;level<4;level++){
 const trials=makeRun(level);assert.equal(trials.length,5);
 for(const t of trials){assert.ok(t.wait>=1200&&t.wait<3600);assert.equal(new Set(t.positions[0]).size,9);
 if(level===0)assert.equal(t.word,t.answer?'RIGHT':'LEFT');
 if(level===1){assert.equal(t.sides[t.answer].length,5);assert.equal(t.sides[1-t.answer].length,3);}
 if(level===2){const color=t.prompt.split(' ')[1];const counts=t.sides.map(s=>s.filter(c=>c===color).length);assert.equal(t.sides[0].length,6);assert.equal(t.sides[1].length,6);if(t.prompt.startsWith('3')){assert.equal(counts[t.answer],3);assert.notEqual(counts[1-t.answer],3);}else assert.ok(counts[t.answer]>counts[1-t.answer]);}
 if(level===3){const [left,op,right]=t.prompt.split(' ');const a=Number(left),b=Number(right);assert.ok(a>=2&&a<10&&b>=2&&b<10);assert.ok(['+','−'].includes(op));const result=op==='+'?a+b:a-b;assert.ok(result>=2&&result<10);assert.equal(t.sides[t.answer],result);assert.equal(Math.abs(t.sides[0]-t.sides[1]),1);}}
 if(level===3){assert.equal(trials.filter(t=>t.prompt.includes('−')).length,2);assert.equal(trials.filter(t=>t.prompt.includes('+')).length,3);}
 if(level===2)assert.equal(trials.filter(t=>t.prompt.startsWith('3')).length,2);
 }});
test('five timings average; inputs cannot add extra samples',()=>{const r=new ReactionRun(0);for(let i=0;i<5;i++){r.state='waiting';r.show(1000);assert.equal(r.respond(r.trials[i].answer,1200+i*10),200+i*10);assert.equal(r.respond(0,1500),null);}assert.equal(r.average,220);});
test('early, wrong, implausibly quick and late inputs fail',()=>{let r=new ReactionRun(0);assert.equal(r.respond(0,0),'Too soon');assert.equal(r.average,null);for(const [delta,wrong,msg] of [[200,true,'Wrong side'],[20,false,'Too soon'],[10001,false,'Too slow']]){r=new ReactionRun(0);r.show(100);assert.equal(r.respond(wrong?1-r.trials[0].answer:r.trials[0].answer,100+delta),msg);assert.equal(r.average,null);}});
test('boards persist separate ascending top tens and reject invalid entries',()=>{let data='';const store={getItem:()=>data,setItem:(k,v)=>data=v};for(let level=0;level<4;level++)for(let ms=100;ms<115;ms++)assert.ok(saveScore(store,{level,ms,initials:'ABC'}));const rows=readScores(store);assert.equal(rows.length,40);for(let level=0;level<4;level++){const scores=rows.filter(s=>s.level===level);assert.equal(scores.length,10);assert.equal(scores[9].ms,109);}assert.equal(saveScore(store,{level:0,ms:-1,initials:'ABC'}),false);data='oops';assert.deepEqual(readScores(store),[]);assert.equal(saveScore({getItem:()=>null,setItem:()=>{throw Error();}},{level:0,ms:200,initials:'ABC'}),false);});
