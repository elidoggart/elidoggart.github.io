import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,restoreState,comparisonFor,cleanQuarter,quarterFor,specialRewardsForCard} from '../lib/rewards.mjs';
const date=new Date(2026,10,8);

test('special rewards save per card, change the chart and keep their filter behavior',()=>{
 const state=defaultState(date);
 state.cards.find(c=>c.id==='flex').specialRewards={chaseTravel:{rate:6.5,condition:'My portal condition.'}};
 state.cards.find(c=>c.id==='apple-card').specialRewards={applePay:{rate:2.5,condition:'My Apple Pay condition.'}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 const rows=comparisonFor('travel',restored);
 assert.equal(rows.find(r=>r.id==='flex-portal').rate,6.5);
 assert.equal(rows.find(r=>r.id==='flex-portal').condition,'My portal condition.');
 assert.equal(rows.find(r=>r.id==='unlimited-portal').rate,5);
 assert.equal(rows.find(r=>r.id==='apple-pay').rate,2.5);
 const filtered=comparisonFor('travel',{...restored,applePay:false,chaseTravel:false});
 assert.ok(filtered.every(r=>r.id!=='apple-pay'&&!r.id.endsWith('-portal')));
 assert.equal(filtered.find(r=>r.id==='flex-normal').rate,1);
});

test('edited points bonuses retain point labels and use the point value for comparison',()=>{
 const state=defaultState(date),card=state.cards.find(c=>c.id==='sapphire');
 card.pointValue=1.5;
 card.specialRewards={'sapphire-groceries':{rate:4,condition:'Eligible online groceries.'}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 const row=comparisonFor('groceries',restored).find(r=>r.id==='sapphire-special-groceries');
 assert.equal(row.points,4);assert.equal(row.rate,6);assert.equal(row.condition,'Eligible online groceries.');
 assert.equal(comparisonFor('travel',restored).find(r=>r.id==='sapphire-portal').points,5);
});

test('quarter overrides replace category selection and update rates, caps and conditions together',()=>{
 const state=defaultState(date);
 state.quarterOverrides={'2026-Q4':{limit:2500,activationRequired:false,rules:{gas:{add:3,only:'Selected gas stations.'},dining:{add:2}}}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 const gas=comparisonFor('gas',restored).find(r=>r.quarter);
 assert.equal(gas.rate,4);assert.match(gas.condition,/Selected gas stations/);assert.match(gas.condition,/\$2,500/);
 assert.doesNotMatch(gas.condition,/Activation/);
 const dining=comparisonFor('dining',restored).find(r=>r.quarter);
 assert.equal(dining.rate,5);assert.match(dining.condition,/5% total: 3% normally plus 2% quarterly/);
 assert.ok(comparisonFor('groceries',restored).every(r=>!r.quarter));
 assert.equal(comparisonFor('dining',{...restored,quarter:1}).find(r=>r.quarter).rate,7);
 assert.ok(comparisonFor('gas',{...restored,flexBonus:false}).every(r=>!r.quarter));
});

test('portal quarters stack with the edited portal rate and require both checkboxes',()=>{
 const state={...defaultState(date),quarter:2};
 state.cards.find(c=>c.id==='flex').specialRewards={chaseTravel:{rate:6}};
 state.quarterOverrides={'2026-Q2':cleanQuarter({rules:{travel:{add:2.5,portal:true}}})};
 assert.equal(comparisonFor('travel',state).find(r=>r.quarter).rate,8.5);
 assert.match(comparisonFor('travel',state).find(r=>r.quarter).condition,/6% through Chase Travel plus 2.5%/);
 assert.ok(comparisonFor('travel',{...state,chaseTravel:false}).every(r=>!r.quarter));
});

test('empty quarters, future quarters and restoring defaults survive saved-state round trips',()=>{
 const state=defaultState(date);
 state.quarterOverrides={'2026-Q4':cleanQuarter({rules:{}}),'2027-Q2':cleanQuarter({rules:{gas:{add:5}}})};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 assert.deepEqual(quarterFor(restored).rules,{});
 assert.ok(comparisonFor('dining',restored).every(r=>!r.quarter));
 assert.equal(comparisonFor('gas',{...restored,year:2027,quarter:2}).find(r=>r.quarter).rate,6);
 delete restored.quarterOverrides['2026-Q4'];
 assert.equal(comparisonFor('dining',restored).find(r=>r.quarter).rate,7);
 const flex=restored.cards.find(c=>c.id==='flex');
 flex.specialRewards={chaseTravel:{rate:9}};
 flex.specialRewards={};
 assert.equal(specialRewardsForCard(flex)[0].rate,5);
});

test('saved override inputs are bounded and unrecognized keys are discarded',()=>{
 const state=defaultState(date);
 state.cards[0].specialRewards={chaseTravel:{rate:-2,condition:'x'.repeat(2000)},unknown:{rate:999}};
 state.quarterOverrides={'bad-key':{},'2026-Q4':{limit:-5,rules:{dining:{add:999,portal:true},unknown:{add:4}}}};
 const restored=restoreState(state,date);
 assert.deepEqual(Object.keys(restored.cards[0].specialRewards),['chaseTravel']);
 assert.equal(restored.cards[0].specialRewards.chaseTravel.rate,0);
 assert.equal(restored.cards[0].specialRewards.chaseTravel.condition.length,1500);
 assert.deepEqual(Object.keys(restored.quarterOverrides),['2026-Q4']);
 assert.deepEqual(quarterFor(restored),{limit:1,activationRequired:true,rules:{dining:{add:100}}});
});
