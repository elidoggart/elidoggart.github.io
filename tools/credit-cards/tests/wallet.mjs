import {CATALOG,defaultState} from '../lib/rewards.mjs';
export const exampleWallet=date=>({...defaultState(date),cards:[...CATALOG.slice(0,4),CATALOG.find(c=>c.id==='sapphire')].map(c=>({...structuredClone(c),enabled:true}))});
