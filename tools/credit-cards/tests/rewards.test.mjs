import {exampleWallet} from './wallet.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,comparisonFor,restoreState,CATEGORIES,chartMaximum,rewardLabel} from '../lib/rewards.mjs';
const date=new Date(2026,10,8);
const scenario=()=>exampleWallet(date);
const flexRows=(category,state)=>comparisonFor(category,state).filter(r=>r.card.id==='flex');

test('each special-reward filter removes its conditional rows, retaining all normal rows',()=>{
 const state=scenario();
 for(const flag of ['applePay','chaseTravel','flexBonus','sapphireBonuses']){
  const next={...state,[flag]:false};
  for(const category of CATEGORIES){
   const before=comparisonFor(category.id,state),after=comparisonFor(category.id,next);
   assert.deepEqual(after.filter(r=>!r.condition),before.filter(r=>!r.condition));
   if(flag==='applePay')assert.ok(after.every(r=>r.id!=='apple-pay'));
   if(flag==='chaseTravel')assert.ok(after.every(r=>!r.id.endsWith('-portal')));
   if(flag==='flexBonus')assert.ok(after.every(r=>!r.quarter));
   if(flag==='sapphireBonuses')assert.ok(after.every(r=>!r.sapphireBonus));
  }
 }
});
test('all special rewards can be hidden without hiding any enabled card',()=>{
 const state={...scenario(),applePay:false,chaseTravel:false,flexBonus:false,sapphireBonuses:false};
 for(const category of CATEGORIES){const rows=comparisonFor(category.id,state);assert.equal(rows.length,5);assert.ok(rows.every(r=>!r.condition));}
});
test('Apple Pay shows a separate 2% rate; direct Apple purchases stay at 3%',()=>{
 const state=scenario();state.cards=state.cards.filter(c=>c.id==='apple-card');
 assert.deepEqual(comparisonFor('other',state).map(r=>r.rate),[2,1]);
 assert.deepEqual(comparisonFor('apple',state).map(r=>r.rate),[3]);
 state.applePay=false;assert.deepEqual(comparisonFor('other',state).map(r=>r.rate),[1]);
});
test('Q4 dining stacks to 7%, groceries to 5%; dates and shared cap are disclosed',()=>{
 const state=scenario();
 assert.deepEqual(flexRows('dining',state).map(r=>r.rate),[7,3]);
 const bonus=flexRows('groceries',state)[0];assert.equal(bonus.rate,5);
 assert.match(bonus.condition,/October 1–December 31, 2026 only/);
 assert.match(bonus.condition,/Activation/);assert.match(bonus.condition,/\$1,500 combined/);
 assert.ok(flexRows('gas',state).every(r=>!r.quarter));
});
test('Q1 cruise offer is separate from Chase Travel, with a merchant restriction',()=>{
 const state={...scenario(),quarter:1,chaseTravel:false};
 const rows=flexRows('travel',state);assert.deepEqual(rows.map(r=>r.rate),[5,1]);
 assert.match(rows[0].condition,/Direct Norwegian Cruise Line/);
 assert.match(rows[0].condition,/January 1–March 31, 2026 only/);
});
test('Q2 travel stacking requires both quarterly and portal filters',()=>{
 const state={...scenario(),quarter:2};
 assert.deepEqual(flexRows('travel',state).map(r=>r.rate),[9,5,1]);
 assert.deepEqual(flexRows('travel',{...state,flexBonus:false}).map(r=>r.rate),[5,1]);
 assert.deepEqual(flexRows('travel',{...state,chaseTravel:false}).map(r=>r.rate),[1]);
 assert.match(flexRows('groceries',state)[0].condition,/Whole Foods Market and Amazon Fresh/);
});
test('Q3 bonuses apply to gas, EV charging, public transit and live entertainment',()=>{
 const state={...scenario(),quarter:3};
 for(const id of ['gas','ev','transit','entertainment'])assert.equal(flexRows(id,state)[0].rate,5);
 assert.match(flexRows('transit',state)[0].condition,/excludes taxis, Uber and Lyft/);
 assert.deepEqual(flexRows('dining',state).map(r=>r.rate),[3]);
});
test('quarter colors are distinct and unverified quarters never borrow another period',()=>{
 const colors=[1,2,3,4].map(quarter=>comparisonFor('donations',{...scenario(),quarter}).find(r=>r.quarter).color);
 assert.equal(new Set(colors).size,4);
 const state={...scenario(),year:2027,quarter:2};
 for(const category of CATEGORIES)assert.ok(comparisonFor(category.id,state).every(r=>!r.quarter));
});
test('cards can be disabled, all hidden, or customized; charts share one scale',()=>{
 const state=scenario();state.cards[0].enabled=false;
 for(const category of CATEGORIES)assert.ok(comparisonFor(category.id,state).every(r=>r.card.id!=='flex'));
 assert.equal(chartMaximum(state),10);
 state.cards=[{id:'custom-test',name:'Custom',enabled:true,base:2.5,rates:{groceries:12.5}}];
 assert.equal(chartMaximum(state),12.5);assert.equal(comparisonFor('groceries',state)[0].rate,12.5);
 assert.equal(comparisonFor('other',state)[0].rate,2.5);
 state.cards[0].enabled=false;assert.deepEqual(comparisonFor('groceries',state),[]);assert.equal(chartMaximum(state),10);
});
test('capped rates explain their fallback without requesting or calculating spending',()=>{
 const row=comparisonFor('groceries',scenario()).find(r=>r.card.id==='everyday');
 assert.equal(row.rate,3);assert.match(row.note,/\$6,000/);assert.match(row.note,/then 1%/);
 assert.ok(!Object.hasOwn(scenario(),'spending'));
});
test('old planner settings migrate the wallet but discard spend and prior eligibility assumptions',()=>{
 const state={...scenario(),version:1,spending:{gas:300},flexUsed:1000,applePay:false,chaseTravel:false};
 state.cards[1]={...state.cards[1],used:{groceries:6000}};state.cards[2].enabled=false;
 const restored=restoreState(state,date);
 assert.equal(restored.version,3);assert.equal(restored.cards[2].enabled,false);
 assert.ok(restored.applePay&&restored.chaseTravel&&restored.flexBonus);
 assert.ok(!Object.hasOwn(restored,'spending'));assert.ok(!Object.hasOwn(restored,'flexUsed'));
 assert.ok(!Object.hasOwn(restored.cards[1],'used'));
});
test('v3 wallet and filters round-trip while dates start in the current quarter',()=>{
 const state={...scenario(),applePay:false,year:2027,quarter:1};
 state.cards.push({id:'custom-test',name:'Custom',enabled:true,base:2.5,rates:{groceries:4.5}});
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 assert.equal(restored.applePay,false);assert.equal(restored.year,2026);assert.equal(restored.quarter,4);
 assert.equal(restored.cards.at(-1).rates.other,undefined);assert.equal(restored.cards.at(-1).base,2.5);
 state.cards.push({id:'custom-invalid',name:'Invalid',base:Infinity,rates:{groceries:999,gas:-2},enabled:true});
 const sanitized=restoreState(state,date).cards.at(-1);
 assert.equal(sanitized.base,0);assert.equal(sanitized.rates.groceries,100);assert.equal(sanitized.rates.gas,0);
});
test('opening the tool follows local quarter boundaries, including a new year',()=>{
 const saved={...scenario(),year:2026,quarter:2,chaseTravel:false};
 const cases=[
  [new Date(2026,2,31,23,59),2026,1],
  [new Date(2026,3,1,0,0),2026,2],
  [new Date(2026,6,1,0,0),2026,3],
  [new Date(2026,9,1,0,0),2026,4],
  [new Date(2027,0,1,0,0),2027,1],
 ];
 for(const [now,year,quarter] of cases){
  const state=restoreState(saved,now);
  assert.equal(state.year,year);assert.equal(state.quarter,quarter);
  assert.equal(state.chaseTravel,false);assert.deepEqual(state.cards,saved.cards);
 }
});

test('point labels stay in points while value controls length and sorting',()=>{
 const state=scenario(),card=state.cards.find(c=>c.id==='sapphire');
 card.pointValue=2;
 const rows=comparisonFor('dining',state),pointRow=rows.find(r=>r.card.id==='sapphire');
 assert.equal(pointRow.points,3);assert.equal(pointRow.rate,6);assert.equal(rewardLabel(pointRow),'3 pt');
 assert.equal(rows[0].rate,7);assert.equal(rows[1],pointRow);
 assert.equal(pointRow.estimated,true);assert.match(pointRow.conversion,/3 points per \$1 × 2¢ per point = 6%/);
 card.pointValue=0.5;
 const reduced=comparisonFor('dining',state);
 assert.equal(reduced.find(r=>r.card.id==='sapphire').rate,1.5);
 assert.ok(reduced.findIndex(r=>r.card.id==='sapphire')>reduced.findIndex(r=>r.card.id==='unlimited'));
 assert.equal(rewardLabel(reduced.find(r=>r.card.id==='unlimited')),'3%');
});
test('point conversion applies to portal and restricted offers as well as standard rates',()=>{
 const state=scenario();state.cards=state.cards.filter(c=>c.id==='sapphire');state.cards[0].pointValue=1.5;
 assert.deepEqual(comparisonFor('travel',state).map(r=>[r.points,r.rate]),[[5,7.5],[3,4.5],[2,3]]);
 assert.deepEqual(comparisonFor('travel',{...state,chaseTravel:false,sapphireBonuses:false}).map(r=>[r.points,r.rate]),[[2,3]]);
 assert.deepEqual(comparisonFor('groceries',{...state,sapphireBonuses:false}).map(r=>r.points),[1]);
});
test('Sapphire cash valuation and merchant restrictions are disclosed',()=>{
 const state=scenario();
 const dining=comparisonFor('dining',state).find(r=>r.card.id==='sapphire');
 assert.equal(dining.estimated,false);assert.match(dining.conversion,/1¢ cash-redemption/);
 assert.match(comparisonFor('groceries',state).find(r=>r.sapphireBonus).condition,/Online grocery purchases only/);
 assert.match(comparisonFor('streaming',state).find(r=>r.sapphireBonus).condition,/eligible top streaming/);
 assert.equal(comparisonFor('gas',state).find(r=>r.card.id==='sapphire').points,3);
});
test('migration preserves wallet choices without adding an example card',()=>{
 const old={...scenario(),version:2,cards:scenario().cards.filter(c=>c.id!=='sapphire')};
 old.cards[0].enabled=false;
 const migrated=restoreState(old,date);
 assert.equal(migrated.cards.filter(c=>c.id==='sapphire').length,0);assert.equal(migrated.cards[0].enabled,false);
 migrated.cards=migrated.cards.filter(c=>c.id!=='sapphire');
 assert.ok(restoreState(migrated,date).cards.every(c=>c.id!=='sapphire'));
});
test('custom point cards preserve units and valuation, including zero values',()=>{
 const state=scenario();
 state.cards.push({id:'custom-points',name:'Points example',rewardType:'points',pointValue:0.75,base:2,rates:{dining:4},enabled:true});
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 const card=restored.cards.at(-1),offer=comparisonFor('dining',restored).find(r=>r.card.id===card.id);
 assert.equal(card.rewardType,'points');assert.equal(card.pointValue,0.75);assert.equal(offer.rate,3);assert.equal(offer.points,4);assert.equal(offer.estimated,true);
 card.pointValue=0;assert.equal(comparisonFor('dining',restored).find(r=>r.card.id===card.id).rate,0);
 card.pointValue=4;assert.equal(chartMaximum(restored),16);
});

test('new visitors start without any selected cards',()=>{assert.deepEqual(defaultState(date).cards,[]);});
