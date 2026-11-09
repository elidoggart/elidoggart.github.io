import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCard} from '../lib/card-search.mjs';
import {CATALOG, defaultState, restoreState} from '../lib/rewards.mjs';

test('card search distinguishes names by brand and supports combined words and Amex', () => {
 const original = CATALOG.slice(0,6);
 const matches = query => original.filter(card => matchesCard(card, query)).map(card => card.id);
 assert.deepEqual(matches('  CHASE freedom '), ['flex', 'unlimited']);
 assert.deepEqual(matches('amex preferred'), ['preferred']);
 assert.deepEqual(matches('Preferred'), ['preferred', 'sapphire']);
 assert.deepEqual(matches('American Express'), ['everyday', 'preferred']);
 assert.deepEqual(matches('chase blue'), []);
 assert.equal(matches('').length, original.length);
 assert.ok(CATALOG.some(c=>matchesCard(c,'bjs')));
 assert.ok(CATALOG.some(c=>matchesCard(c,'us bank')));
 assert.ok(CATALOG.some(c=>matchesCard(c,'alaska')));
});

test('large saved wallets preserve custom brands, duplicate names and selections', () => {
 const date = new Date(2026, 10, 8), state = defaultState(date);
 state.cards.push(...Array.from({length:50}, (_, index) => ({
  id:`custom-${index}`, name:'Rewards', issuer:`Bank ${index}`, enabled:index % 2 === 0,
  base:2, rates:{dining:3},
 })));
 const restored = restoreState(JSON.parse(JSON.stringify(state)), date);
 assert.equal(restored.cards.length, 55);
 assert.equal(restored.cards.at(-1).issuer, 'Bank 49');
 assert.equal(restored.cards.at(-1).enabled, false);
 assert.equal(restored.cards.filter(card => matchesCard(card, 'bank 49 rewards')).length, 1);
 assert.equal(restored.cards.filter(card => card.enabled).length, state.cards.filter(card => card.enabled).length);
 const oldCustom = restoreState({version:3,cards:[{id:'custom-old',name:'Old',base:1,rates:{}}]}, date);
 assert.equal(oldCustom.cards[0].issuer, 'Custom');
});
