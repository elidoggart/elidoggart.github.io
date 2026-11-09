import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,CATEGORIES,defaultState,restoreState,comparisonFor,rewardSections,rewardLabel,specialRewardsForCard,quarterFor,offerIsCurrent} from '../lib/rewards.mjs';
const date=new Date(2026,10,8);
const stateFor=card=>({...defaultState(date),cards:[{...structuredClone(card),enabled:true}]});

test('catalog has unique identities, source links and supported finite reward rates',()=>{
 assert.ok(CATALOG.length>80);
 assert.equal(new Set(CATALOG.map(c=>c.id)).size,CATALOG.length);
 const categories=new Set(CATEGORIES.map(c=>c.id));
 for(const card of CATALOG){
  assert.ok(card.name&&card.issuer&&card.terms,card.id);
  assert.match(card.source,/^https:\/\//,card.id);
  assert.ok(Number.isFinite(card.base)&&card.base>=0,card.id);
  for(const [id,rate] of Object.entries(card.rates))assert.ok(categories.has(id)&&Number.isFinite(rate)&&rate>=0,`${card.id}: ${id}`);
  const offers=specialRewardsForCard(card);
  assert.equal(new Set(offers.map(o=>o.key)).size,offers.length,card.id);
  for(const offer of offers){
   assert.ok(offer.condition&&offer.categories.length,`${card.id}: ${offer.key}`);
   assert.ok(offer.categories.every(id=>categories.has(id)),card.id);
   assert.ok(Number.isFinite(offer.rate)&&offer.rate>=0,card.id);
  }
 }
});

test('new card bonus toggles remove offers, preserve base rows and persist independently',()=>{
 for(const card of CATALOG.filter(c=>c.offers?.length)){
  const state=stateFor(card),off={...state,bonusFilters:{[card.id]:false}};
  const restored=restoreState(JSON.parse(JSON.stringify(off)),date);
  assert.equal(restored.bonusFilters[card.id],false);
  for(const category of CATEGORIES){
   const rows=comparisonFor(category.id,restored);
   assert.equal(rows.length,1,`${card.id}: ${category.id}`);
   assert.equal(rows[0].id,`${card.id}-normal`);
  }
 }
});

test('merchant-specific bonuses stay out of broad charts and customized offers survive reload',()=>{
 for(const card of CATALOG.filter(c=>c.offers?.length)){
  const state=stateFor(card),offer=card.offers[0];
  state.cards[0].specialRewards={[offer.key]:{rate:7.25,condition:'Custom condition.'}};
  const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
  const row=comparisonFor(offer.categories[0],restored).find(r=>r.id===`${card.id}-${offer.key}`);
  assert.equal(row.points??row.rate,7.25,card.id);
  assert.equal(row.condition,'Custom condition.');
  const sections=rewardSections(restored);
  assert.ok(sections.categories.every(c=>c.rows.every(r=>!r.uncategorized)));
 }
});

test('airline miles retain their label and follow the editable valuation',()=>{
 const card=CATALOG.find(c=>c.rewardUnit==='miles');
 assert.ok(card);
 const state=stateFor(card);state.cards[0].pointValue=1.7;
 const row=comparisonFor('other',state)[0];
 assert.match(rewardLabel(row),/miles?$/);
 assert.equal(row.rate,Math.round(row.points*1.7*100)/100);
 assert.ok(row.estimated);
});

test('rotating calendars and overrides are independent per card and retain shared quarter selection',()=>{
 const card=CATALOG.find(c=>c.rotating);assert.ok(card);
 const state=stateFor(card);
 state.cardQuarterOverrides={[card.id]:{'2026-Q4':{limit:1234,activationRequired:false,rules:{dining:{add:3,merchant:'Example cafe'}}}}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 assert.equal(quarterFor(restored,card.id).limit,1234);
 assert.equal(quarterFor(restored).limit,1500);
 const row=rewardSections(restored).uncategorized[0].rows.find(r=>r.quarter);
 assert.equal(row.benefit,'Example cafe');assert.equal(row.rate,card.base+3);
 assert.doesNotMatch(row.condition,/Activation/);
 assert.ok(comparisonFor('dining',{...restored,bonusFilters:{[card.id]:false}}).every(r=>!r.quarter));
});

 test('dated offers use inclusive local dates and are independent of the rotating selector',()=>{
  const offer={starts:'2026-10-01',expires:'2026-12-31'};
  assert.equal(offerIsCurrent(offer,new Date(2026,8,30)),false);
  assert.equal(offerIsCurrent(offer,new Date(2026,9,1)),true);
  assert.equal(offerIsCurrent(offer,new Date(2026,11,31)),true);
  assert.equal(offerIsCurrent(offer,new Date(2027,0,1)),false);
 });

test('expiry edits survive saving, including clearing an end date',()=>{
 const card=CATALOG.find(c=>c.id==='airline-aeroplan'),state=stateFor(card);
 assert.ok(comparisonFor('dining',state,new Date(2027,0,1)).every(row=>row.id!==`${card.id}-transition-2026`));
 state.cards[0].specialRewards={'transition-2026':{rate:4,condition:'My renewed offer.',expires:''}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)),date);
 assert.equal(specialRewardsForCard(restored.cards[0])[0].expires,'');
 assert.equal(comparisonFor('dining',restored,new Date(2027,0,1)).find(row=>row.condition==='My renewed offer.').points,4);
});

test('relationship rates preserve three decimal places',()=>{
 const card=CATALOG.find(c=>c.id==='bank-boa-unlimited');
 const row=comparisonFor('other',stateFor(card)).find(row=>row.rate===2.625);
 assert.ok(row);assert.equal(rewardLabel(row),'2.625%');
});
