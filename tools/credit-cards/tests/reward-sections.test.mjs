import {exampleWallet} from './wallet.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,rewardSections,restoreState,QUARTERS} from '../lib/rewards.mjs';
const date=new Date(2026,10,8);
const scenario=()=>exampleWallet(date);
const benefits=(sections,id)=>sections.uncategorized.find(group=>group.card.id===id)?.rows??[];

test('specialized categories move into card groups without repeating general fallback rates',()=>{
 const sections=rewardSections(scenario());
 assert.equal(sections.categories.length,10);
 assert.ok(sections.categories.every(category=>!['apple','ev','streaming'].includes(category.id)));
 const apple=benefits(sections,'apple-card');
 assert.deepEqual(apple.filter(row=>!row.uncategorized).map(row=>[row.benefit,row.rate]),[['Apple purchases',3]]);
 assert.ok(apple.every(row=>row.id!=='ev-apple-pay'&&row.id!=='streaming-apple-pay'));
 assert.deepEqual(new Set(benefits(sections,'sapphire').map(row=>row.category)),new Set(['apple','ev','streaming','travel']));
 assert.equal(benefits(sections,'unlimited').length,0);
 assert.equal(benefits(sections,'everyday').length,0);
 assert.ok(benefits(sections,'sapphire').every(row=>row.points===3));
 assert.equal(new Set(benefits(sections,'sapphire').map(row=>row.id)).size,4);
});

test('Apple merchant bonuses appear once under the card without inflating broad category rates',()=>{
 const state=scenario(),sections=rewardSections(state);
 const apple=benefits(sections,'apple-card'),partners=apple.filter(row=>row.uncategorized);
 assert.equal(partners.length,8);
 assert.equal(new Set(partners.map(row=>row.id)).size,8);
 assert.ok(partners.every(row=>row.rate===3&&row.condition.includes('Apple Pay required')));
 const charging=partners.find(row=>row.category==='ev');
 assert.equal(charging.benefit,'ChargePoint · EV charging');
 assert.match(charging.condition,/public ChargePoint/);
 for(const category of sections.categories){
  assert.ok(category.rows.every(row=>!row.id.startsWith('apple-partner-')));
  assert.deepEqual(category.rows.filter(row=>row.card.id==='apple-card').map(row=>row.rate),[2,1]);
 }
 const filtered=rewardSections({...state,applePay:false});
 assert.deepEqual(benefits(filtered,'apple-card').map(row=>[row.benefit,row.rate]),[['Apple purchases',3]]);
 assert.equal(filtered.categories.find(c=>c.id==='other').rows.find(r=>r.card.id==='apple-card').rate,1);
});

test('Apple partner edits persist and keep their merchant-only placement',()=>{
 const state=scenario();
 state.cards.find(card=>card.id==='apple-card').specialRewards={'apple-partner-chargepoint':{rate:4,condition:'My charging offer.'}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date),sections=rewardSections(restored);
 const charging=benefits(sections,'apple-card').find(row=>row.category==='ev');
 assert.equal(charging.rate,4);
 assert.equal(charging.condition,'My charging offer.');
 assert.equal(benefits(sections,'apple-card')[0],charging);
 assert.ok(sections.categories.every(category=>category.rows.every(row=>row.id!=='apple-partner-chargepoint')));
});

test('named quarterly merchants move out of broad categories, preserving their exact rates',()=>{
 const state={...scenario(),quarter:2},sections=rewardSections(state);
 assert.ok(sections.categories.every(category=>category.rows.every(row=>!row.quarter)));
 const flex=benefits(sections,'flex');
 assert.deepEqual(new Map(flex.map(row=>[row.benefit,row.rate])),new Map([
  ['Chase Travel',9],['Whole Foods Market / Amazon Fresh',5],['Amazon.com',5],['Feeding America',5],
 ]));
 assert.ok(flex.every(row=>row.quarter===2&&row.condition.includes('April 1–June 30')));
 assert.equal(sections.categories.find(c=>c.id==='travel').rows.find(row=>row.id==='flex-portal').rate,5);
});

test('named exclusions do not turn broad category bonuses into company offers',()=>{
 const q4=rewardSections(scenario());
 assert.equal(q4.categories.find(c=>c.id==='groceries').rows.find(row=>row.quarter).rate,5);
 assert.equal(q4.categories.find(c=>c.id==='dining').rows.find(row=>row.quarter).rate,7);
 assert.deepEqual(benefits(q4,'flex').map(row=>row.benefit),['American Red Cross']);
 const q3=rewardSections({...scenario(),quarter:3});
 assert.ok(q3.categories.find(c=>c.id==='transit').rows.some(row=>row.quarter));
 assert.deepEqual(new Set(benefits(q3,'flex').map(row=>row.benefit)),new Set(['EV charging','United Way']));
 const q1=rewardSections({...scenario(),quarter:1});
 assert.deepEqual(new Set(benefits(q1,'flex').map(row=>row.benefit)),new Set(['Norwegian Cruise Line','American Heart Association']));
});

test('uncategorized benefits respect selected cards, reward toggles, points values and quarter selection',()=>{
 const state={...scenario(),quarter:2,chaseTravel:false,sapphireBonuses:false};
 state.cards.find(card=>card.id==='sapphire').pointValue=2;
 let sections=rewardSections(state);
 assert.ok(benefits(sections,'flex').every(row=>row.benefit!=='Chase Travel'));
 assert.deepEqual(benefits(sections,'sapphire').map(row=>[row.benefit,row.points,row.rate]),[['EV charging',3,6]]);
 sections=rewardSections({...state,flexBonus:false});
 assert.equal(benefits(sections,'flex').length,0);
 state.cards=state.cards.map(card=>({...card,enabled:card.id==='everyday'}));
 assert.deepEqual(rewardSections(state).uncategorized,[]);
});

test('editable company labels survive reloads and old saved merchant conditions migrate',()=>{
 const state=scenario();
 state.quarterOverrides={'2026-Q4':{rules:{dining:{add:2,merchant:'Example Restaurant',only:'Direct purchases only.'}}}};
 let restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 assert.deepEqual(benefits(rewardSections(restored),'flex').map(row=>[row.benefit,row.rate]),[['Example Restaurant',5]]);
 restored.quarterOverrides['2026-Q4'].rules.dining.merchant='';
 restored=restoreState(JSON.parse(JSON.stringify(restored)),date);
 assert.equal(benefits(rewardSections(restored),'flex').length,0);
 assert.equal(rewardSections(restored).categories.find(c=>c.id==='dining').rows.find(row=>row.quarter).rate,5);
 state.quarterOverrides={'2026-Q4':{rules:{donations:{add:4,only:QUARTERS['2026-Q4'].rules.donations.only}}}};
 assert.equal(benefits(rewardSections(restoreState(state,date)),'flex')[0].benefit,'American Red Cross');
});
