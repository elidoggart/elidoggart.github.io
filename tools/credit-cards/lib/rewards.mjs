import {BANK_CARDS,DISCOVER_QUARTERS} from './catalog-banks.mjs';
import {AIRLINE_CARDS} from './catalog-airlines.mjs';
import {PREMIUM_CARDS} from './catalog-premium.mjs';
export const REVIEWED = 'November 8, 2026';
export const DEFAULT_DATA_ADDED = 'November 8, 2026';
export const CATEGORIES = [
 {id:'groceries',name:'Groceries',detail:'Eligible U.S. supermarkets. Walmart, Target and warehouse clubs generally do not qualify.'},
 {id:'dining',name:'Dining',detail:'Restaurants, takeout and eligible delivery. Merchant category coding determines eligibility.'},
 {id:'gas',name:'Gas stations',detail:'Eligible U.S. gas stations. Amex excludes supermarket and warehouse fuel; EV charging is separate.'},
 {id:'online',name:'Online shopping',detail:'Eligible U.S. online retail. Amex excludes travel, restaurants and other non-retail purchases.'},
 {id:'travel',name:'Travel',detail:'General travel rates plus separate portal or merchant-specific options when enabled.'},
 {id:'drugstores',name:'Drugstores',detail:'Eligible drugstore purchases. Named-merchant bonuses appear under Uncategorized.'},
 {id:'streaming',name:'Streaming',detail:'Non-Apple streaming subscriptions. Use Apple purchases for Apple subscriptions. Amex Preferred requires a qualifying U.S. provider.'},
 {id:'transit',name:'Transit',detail:'Public transportation, parking and tolls. The Flex public transit bonus excludes taxis, Uber and Lyft.'},
 {id:'ev',name:'EV charging',detail:'Charging services at eligible merchants. Home electricity and charging equipment do not qualify for the Flex bonus.'},
 {id:'entertainment',name:'Entertainment',detail:'The Flex quarterly offer is limited to select live entertainment, such as concerts, sports and museums; not movies or casinos.'},
 {id:'apple',name:'Apple purchases',detail:'Eligible purchases directly from Apple, including Apple subscriptions.'},
 {id:'donations',name:'Donations',detail:'Quarterly Flex bonuses only apply to the named charity through qualifying official channels.'},
 {id:'other',name:'Everything else',detail:'Other eligible purchases. Merchant acceptance and transaction exclusions still apply.'},
];
export const UNCATEGORIZED_CATEGORY_IDS = ['apple','ev','streaming'];
export const STANDARD_CATEGORIES = CATEGORIES.filter(category=>!UNCATEGORIZED_CATEGORY_IDS.includes(category.id));
export const CATALOG = [
  { id:'flex', name:'Freedom Flex', issuer:'Chase', color:'#2458a6', theme:'blue', base:1, rates:{dining:3,drugstores:3}, note:'3% dining & drugstores · quarterly bonuses', source:'https://creditcards.chase.com/cash-back-credit-cards/freedom/flex', terms:'Quarterly bonus adds 4 percentage points after activation, on $1,500 combined quarterly spending. Travel is 5% only through Chase Travel.' },
  { id:'everyday', name:'Blue Cash Everyday', issuer:'American Express', color:'#278779', theme:'teal', base:1, rates:{groceries:3,gas:3,online:3}, caps:{groceries:6000,gas:6000,online:6000}, note:'3% groceries, gas & online retail', source:'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/', terms:'3% at eligible U.S. supermarkets, gas stations and U.S. online retail, each on up to $6,000 per calendar year; 1% after each cap.' },
  { id:'unlimited', name:'Freedom Unlimited', issuer:'Chase', color:'#8c599d', theme:'purple', base:1.5, rates:{dining:3,drugstores:3}, note:'1.5% everywhere · 3% dining & drugstores', source:'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited', terms:'1.5% on other purchases, 3% dining and drugstores, 5% on travel purchased through Chase Travel.' },
  { id:'apple-card', name:'Apple Card', issuer:'Apple', color:'#727984', theme:'silver', base:1, rates:{apple:3}, note:'2% with Apple Pay · 3% at Apple', source:'https://www.apple.com/apple-card/', benefitsSource:'https://learn.applecard.apple/benefits', terms:'2% with Apple Pay, 1% using the physical card or card number, 3% at Apple. Eligible 3% partner purchases require Apple Pay and appear separately under Uncategorized.' },
  { id:'preferred', name:'Blue Cash Preferred', issuer:'American Express', color:'#234a68', theme:'navy', base:1, rates:{groceries:6,streaming:6,gas:3,transit:3}, caps:{groceries:6000}, note:'6% groceries & select streaming', source:'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/', terms:'6% on eligible U.S. supermarket purchases up to $6,000 per calendar year then 1%; 6% on select U.S. streaming; 3% U.S. gas and transit. Annual fee excluded from cashback estimates.' },
  { id:'sapphire', name:'Sapphire Preferred', issuer:'Chase', rewardType:'points', pointValue:1, cashPointValue:1, base:1, rates:{dining:3,gas:3,ev:3,travel:2,transit:2}, source:'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred', pointSource:'https://asset.chase.com/content/dam/card/rulesregulations/en/RPA0551_0560_Web.pdf', terms:'Rates in points per dollar. Cash redemption is 1 cent per point. 5 points through Chase Travel; 3 on dining, gas, EV charging, eligible online groceries, top streaming and select vacation-home brands; 2 on other travel; 1 otherwise. Annual fee and statement credits are excluded.' },
];
CATALOG.push(...BANK_CARDS,...AIRLINE_CARDS,...PREMIUM_CARDS);
for(const card of CATALOG){
 if(card.id.startsWith('bank-bjs-'))card.rewardNote='BJ’s rewards are redeemable at BJ’s, not as unrestricted cash.';
 if(card.id.startsWith('bank-wf-onekey'))card.rewardNote='OneKeyCash can be redeemed for eligible Expedia, Hotels.com and Vrbo bookings; it cannot be redeemed for cash.';
}
export const bonusFlag=card=>`bonus:${card.id}`;
export const rotatingCards=state=>state.cards.filter(c=>c.enabled&&(c.id==='flex'||c.rotating));
export const QUARTER_STYLES = [
 {number:1,months:'Jan–Mar',dates:'January 1–March 31',color:'#3776a6',tint:'#f0f6fa'},
 {number:2,months:'Apr–Jun',dates:'April 1–June 30',color:'#358273',tint:'#eff7f4'},
 {number:3,months:'Jul–Sep',dates:'July 1–September 30',color:'#a47629',tint:'#faf5e9'},
 {number:4,months:'Oct–Dec',dates:'October 1–December 31',color:'#9b526f',tint:'#f9f0f4'},
];
export const QUARTERS = {
 '2026-Q1': {rules:{dining:{add:4},travel:{add:4,merchant:'Norwegian Cruise Line',only:'Direct Norwegian Cruise Line purchases only; not third-party travel agencies.'},donations:{add:4,merchant:'American Heart Association',only:'Eligible donations directly to the American Heart Association only.'}},source:'https://media.chase.com/news/chase-freedom-2026-q1-categories'},
 '2026-Q2': {rules:{groceries:{add:4,merchant:'Whole Foods Market / Amazon Fresh',only:'Eligible Whole Foods Market and Amazon Fresh purchases only, not other grocery stores.'},online:{add:4,merchant:'Amazon.com',only:'Eligible Amazon.com purchases only; other retailers and payments through Amazon Pay are excluded.'},travel:{add:4,portal:true,merchant:'Chase Travel',only:'Eligible prepaid travel booked and paid for through Chase Travel only.'},donations:{add:4,merchant:'Feeding America',only:'Eligible donations directly to Feeding America only.'}},source:'https://media.chase.com/news/chase-freedom-2026-q2-categories'},
 '2026-Q3': {rules:{gas:{add:4},ev:{add:4},transit:{add:4,only:'Eligible trains, buses, ferries, parking and tolls; excludes taxis, Uber and Lyft.'},entertainment:{add:4,only:'Select live entertainment only, including concerts, sports, museums and amusement parks; excludes movies, casinos and bowling.'},donations:{add:4,merchant:'United Way',only:'Eligible donations through official United Way channels only.'}},source:'https://media.chase.com/news/chase-freedom-2026-q3-categories'},
 '2026-Q4': {rules:{groceries:{add:4,only:'Eligible grocery stores; excludes Walmart, Target and warehouse clubs.'},dining:{add:4},donations:{add:4,merchant:'American Red Cross',only:'Eligible donations directly to the American Red Cross only.'}},source:'https://media.chase.com/news/chase-freedom-2026-q4-categories'},
 '2027-Q1': {rules:{groceries:{add:4,only:'Eligible grocery stores; excludes Walmart, Target and warehouse clubs.'},streaming:{add:4,only:'Qualifying top streaming services only; check Chase’s merchant list.'}},source:'https://www.chase.com/personal/credit-cards/freedom/flex-learnmore'},
};
export const quarterKey=(date=new Date())=>`${date.getFullYear()}-Q${Math.floor(date.getMonth()/3)+1}`;
export const cleanNumber=(value,max=100)=>Math.round(Math.min(max,Math.max(0,Number.isFinite(Number(value))?Number(value):0))*1000)/1000;
export function specialRewardsForCard(card) {
 const offers=[];
 if(card.id==='apple-card'){
  offers.push({id:'apple-pay',key:'applePay',flag:'applePay',label:'Apple Pay',categories:CATEGORIES.filter(c=>c.id!=='apple').map(c=>c.id),rate:2,condition:'Use Apple Card with Apple Pay at a merchant that accepts it. The physical card or card number earns 1%. Eligible merchant bonuses appear under Uncategorized.'});
  // Merchant rates never apply to the whole category. Each offer appears once,
  // remains editable, and follows the Apple Pay filter required by its terms.
  // Sources: support.apple.com/en-us/120400 and learn.applecard.apple/benefits.
  const partners=[
   ['chargepoint','ChargePoint · EV charging','ev','Apple Pay required. Eligible public ChargePoint charging via its app, contactless reader or Wallet Pass; home charging purchases direct from ChargePoint also qualify. Excludes private stations, fleet services, commercial equipment, support and third-party hardware.'],
   ['ace','Ace Hardware','online','Apple Pay required. Eligible U.S. purchases through Ace’s website, app or participating stores. Excludes online/app gift cards and independently processed third-party purchases.'],
   ['booking','Booking.com','travel','Apple Pay required. Use booking.com/apple-card from the U.S. for eligible stays or car rentals prepaid directly to Booking.com. Excludes payments at the property or pickup, flights, packages and other ineligible bookings. Booking.com travel credits are separate from cash back.'],
   ['exxon-mobil','Exxon / Mobil','gas','Apple Pay required at eligible U.S. Exxon or Mobil pumps and attached stores; pay at the pump using contactless or the Rewards+ app. Excludes online gift cards and third-party merchants, including independent car washes.'],
   ['hertz','Hertz','travel','Apple Pay required for eligible rentals booked on Hertz.com or its app, with pickup and return at U.S. corporate locations. Keep Apple Pay as the final payment method. Excludes franchises, third-party/phone/counter bookings, rentals over 61 days and other excluded vehicles or programs.'],
   ['nike','Nike','online','Apple Pay required for eligible U.S. purchases at Nike stores, Nike.com, Swoosh.com, Nike’s app or SNKRS. Pop-up events are excluded.'],
   ['uber','Uber / Uber Eats','transit','Apple Pay required through Uber or Uber Eats directly, in their apps or websites. Excludes browser gift cards, third-party-processed purchases, transactions without Apple Pay and certain alcohol purchases.'],
   ['walgreens','Walgreens / Duane Reade','drugstores','Apple Pay required for eligible U.S. purchases directly in stores, online or in the Walgreens app. Excludes third-party merchants/delivery and purchases without Apple Pay, including drive-through and online/app gift cards.'],
  ];
  for(const [key,label,category,condition] of partners)offers.push({id:`apple-partner-${key}`,key:`apple-partner-${key}`,flag:'applePay',label,categories:[category],rate:3,condition,uncategorized:true});
 }
 if(['flex','unlimited','sapphire'].includes(card.id))offers.push({id:`${card.id}-portal`,key:'chaseTravel',flag:'chaseTravel',label:'Chase Travel',categories:['travel'],rate:5,condition:'Book and pay for eligible travel through Chase Travel. Direct bookings do not receive this portal bonus.'+(card.id==='sapphire'?' Purchases qualifying for the annual Chase Travel hotel credit do not earn points.':'')});
 if(card.id==='sapphire'){
  const rules={groceries:['Online groceries','Online grocery purchases only, excluding Target, Walmart and wholesale clubs. In-store groceries earn the standard rate.'],travel:['Vacation homes','Vacation homes booked directly with Airbnb, Vrbo, Plum Guide, HomeAway, Homestay.com or Vacasa only.'],streaming:['Streaming','Chase’s eligible top streaming services only, such as Netflix, Hulu, Spotify and Disney+. Other providers earn the standard rate.'],apple:['Apple subscriptions','Eligible Apple Music and Apple TV subscriptions only; Apple hardware and other Apple purchases earn the standard rate.']};
  for(const [category,[label,condition]] of Object.entries(rules))offers.push({id:`sapphire-special-${category}`,key:`sapphire-${category}`,flag:'sapphireBonuses',label,categories:[category],rate:3,condition,sapphireBonus:true,...(category==='travel'?{uncategorized:true}:{})});
 }
 for(const offer of card.offers??[])offers.push({...offer,id:`${card.id}-${offer.key}`,flag:bonusFlag(card)});
 return offers.map(offer=>{
  const custom=card.specialRewards?.[offer.key];
  return {...offer,...Object.fromEntries(['starts','expires'].filter(key=>Object.hasOwn(custom??{},key)).map(key=>[key,/^\d{4}-\d{2}-\d{2}$/.test(custom[key])?custom[key]:''])),rate:cleanNumber(custom?.rate??offer.rate),condition:String(custom?.condition??offer.condition).trim().slice(0,1500)||offer.condition};
 });
}
export function cleanSpecialRewards(card) {
 return Object.fromEntries(specialRewardsForCard(card).filter(offer=>Object.hasOwn(card.specialRewards??{},offer.key)).map(offer=>[offer.key,{rate:offer.rate,condition:offer.condition,...Object.fromEntries(['starts','expires'].filter(key=>Object.hasOwn(card.specialRewards?.[offer.key]??{},key)).map(key=>[key,offer[key]]))}]));
}
export function cleanQuarter(value={}) {
 const rules={};
 for(const category of CATEGORIES){
  const rule=value.rules?.[category.id];
  if(!rule||typeof rule!=='object')continue;
  const knownMerchant=rule.only?Object.values(QUARTERS).flatMap(q=>Object.values(q.rules)).find(r=>r.merchant&&r.only===rule.only)?.merchant:undefined;
  const merchant=String(rule.merchant??knownMerchant??'').trim().slice(0,100);
  rules[category.id]={add:cleanNumber(rule.add??4),...(rule.only?{only:String(rule.only).trim().slice(0,1500)}:{}),...(category.id==='travel'&&rule.portal?{portal:true}:{}),...(merchant||Object.hasOwn(rule,'merchant')?{merchant}:{})};
 }
 return {rules,limit:Math.max(1,cleanNumber(value.limit??1500,1000000)),activationRequired:value.activationRequired!==false};
}
export function quarterFor(state,cardId='flex') {
 const key=`${state.year}-Q${state.quarter}`;
 const value=cardId==='flex'?(state.quarterOverrides?.[key]??QUARTERS[key]):(state.cardQuarterOverrides?.[cardId]?.[key]??DISCOVER_QUARTERS[key]);
 return value?cleanQuarter(value):undefined;
}
export function defaultState(date=new Date()) {
 return {version:3,cards:[],applePay:true,chaseTravel:true,flexBonus:true,sapphireBonuses:true,year:date.getFullYear(),quarter:Math.floor(date.getMonth()/3)+1};
}
export function restoreState(value,date=new Date()) {
 const d=defaultState(date);
 if(!value || ![1,2,3].includes(value.version) || !Array.isArray(value.cards))return d;
 const seen=new Set();
 d.cards=value.cards.flatMap(raw=>{
  if(!raw || typeof raw.id!=='string' || seen.has(raw.id))return [];
  seen.add(raw.id);const known=CATALOG.find(c=>c.id===raw.id);
  if(!known&&!raw.id.startsWith('custom-'))return [];
  const base=known??{id:raw.id,name:String(raw.name||'Custom card').trim().slice(0,50),issuer:String(raw.issuer||'Custom').trim().slice(0,50)||'Custom',base:0,rates:{},terms:'User-entered rates.',...(raw.rewardType==='points'?{rewardType:'points',pointValue:1}:{})};
  return [{...base,...(raw.specialRewards?{specialRewards:cleanSpecialRewards({...base,specialRewards:raw.specialRewards})}:{}),...(base.rewardType==='points'?{pointValue:cleanNumber(raw.pointValue??base.pointValue)}:{}),base:cleanNumber(raw.base??base.base),rates:{...base.rates,...Object.fromEntries(CATEGORIES.filter(c=>Object.hasOwn(raw.rates??{},c.id)).map(c=>[c.id,cleanNumber(raw.rates[c.id])]))},enabled:raw.enabled!==false}];
 });
 // Version 1 was a spend planner. Keep its wallet, not its spending or
 // eligibility assumptions; version 2 checkboxes only filter visible rates.
 if(value.version>=2){
  for(const key of ['applePay','chaseTravel','flexBonus','sapphireBonuses'])d[key]=value[key]!==false;
 }
 if(value.quarterOverrides&&typeof value.quarterOverrides==='object')d.quarterOverrides=Object.fromEntries(Object.entries(value.quarterOverrides).filter(([key,q])=>/^\d{4}-Q[1-4]$/.test(key)&&q&&typeof q==='object').map(([key,q])=>[key,cleanQuarter(q)]));
 if(value.bonusFilters&&typeof value.bonusFilters==='object')d.bonusFilters=Object.fromEntries(Object.entries(value.bonusFilters).map(([key,v])=>[key,v!==false]));
 if(value.cardQuarterOverrides&&typeof value.cardQuarterOverrides==='object')d.cardQuarterOverrides=Object.fromEntries(Object.entries(value.cardQuarterOverrides).filter(([id])=>CATALOG.some(c=>c.id===id&&c.rotating)).map(([id,quarters])=>[id,Object.fromEntries(Object.entries(quarters??{}).filter(([key,q])=>/^\d{4}-Q[1-4]$/.test(key)&&q&&typeof q==='object').map(([key,q])=>[key,cleanQuarter(q)]))]));
 // Each visit starts in the current local quarter, even after viewing a
 // historical or future period. Wallet and reward filters still persist.
 return d;
}
export function offerIsCurrent(offer,date=new Date()) {
 const today=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
 return (!offer.starts||offer.starts<=today)&&(!offer.expires||offer.expires>=today);
}
export function comparisonFor(category,state,date=new Date()) {
 const style=QUARTER_STYLES[state.quarter-1];
 return state.cards.filter(c=>c.enabled).flatMap(card=>{
  const normalRate=card.id==='apple-card'?(category==='apple'?3:1):(card.rates[category]??card.base);
  const quarter=quarterFor(state,card.id);
  const cap=card.caps?.[category];
  const rows=[{id:`${card.id}-normal`,card,rate:normalRate,note:card.notesByCategory?.[category]??card.rewardNote??(cap?`${normalRate}% on up to $${cap.toLocaleString('en-US')} of eligible ${CATEGORIES.find(c=>c.id===category)?.name.toLowerCase()} purchases per calendar year; then ${card.base}%. Each category has its own limit.`:undefined)}];
  const specialOffers=specialRewardsForCard(card);
  for(const offer of specialOffers){
   if(offerIsCurrent(offer,date)&&(offer.flag.startsWith('bonus:')?state.bonusFilters?.[card.id]!==false:state[offer.flag])&&offer.categories.includes(category))rows.push({id:offer.id,card,rate:offer.rate,condition:offer.condition,note:card.rewardNote,benefit:offer.label,...(offer.uncategorized?{uncategorized:true}:{}),...(offer.sapphireBonus?{sapphireBonus:true}:{})});
  }
  const rule=quarter?.rules[category];
  if((card.id==='flex'?state.flexBonus:card.rotating&&state.bonusFilters?.[card.id]!==false)&&rule&&(!rule.portal||state.chaseTravel)){
   const ordinary=rule.portal?specialOffers.find(offer=>offer.key==='chaseTravel').rate:normalRate;
   const rate=Math.round((ordinary+rule.add)*1000)/1000;
   const merchant=rule.merchant||(rule.portal?'Chase Travel':'');
   rows.push({id:`${card.id}-quarter-${state.quarter}`,card,rate,quarter:state.quarter,color:style.color,...(merchant?{uncategorized:true,benefit:merchant}:{}),condition:`${style.dates}, ${state.year} only.${quarter.activationRequired?' Activation with the issuer is required.':''} ${rule.only||'Eligible '+CATEGORIES.find(c=>c.id===category)?.name.toLowerCase()+' purchases.'} The quarterly bonus adds ${rule.add} percentage points on up to $${quarter.limit.toLocaleString('en-US')} combined bonus-category spending; then the ordinary rate applies. ${rate}% total: ${ordinary}% ${rule.portal?'through Chase Travel':'normally'} plus ${rule.add}% quarterly.`});
  }
  return rows.map(row=>{
   if(card.rewardType!=='points')return row;
   const pointValue=cleanNumber(card.pointValue??1),points=row.rate;
   const rate=Math.round(points*pointValue*1000)/1000;
   const estimated=card.cashPointValue===undefined||pointValue!==card.cashPointValue;
   const unit=card.rewardUnit==='miles'?'mile':'point';
   return {...row,points,rate,estimated,conversion:`${points} ${unit}${points===1?'':'s'} per $1 × ${pointValue}¢ per ${unit} = ${rate}% equivalent value. ${estimated?'Estimated using your point value; actual redemption value varies.':`Uses the ${card.cashPointValue}¢ cash-redemption value.`} Change the point value in Cards → Edit.`};
  });
 }).sort((a,b)=>b.rate-a.rate);
}
export function rewardLabel(offer){return offer.points===undefined?`${Number(offer.rate.toFixed(3))}%`:`${offer.points} ${offer.card.rewardUnit==='miles'?(offer.points===1?'mile':'miles'):'pt'}`;}
export function chartMaximum(state){return Math.max(10,...CATEGORIES.flatMap(c=>comparisonFor(c.id,state).map(o=>o.rate)));}
export function rewardSections(state) {
 const comparisons=new Map(CATEGORIES.map(category=>[category.id,comparisonFor(category.id,state)]));
 const general=comparisons.get('other');
 const remaining=[],seenSpecific=new Set();
 for(const category of CATEGORIES){
  const moved=UNCATEGORIZED_CATEGORY_IDS.includes(category.id);
  for(const offer of comparisons.get(category.id)){
   if(!moved&&!offer.uncategorized)continue;
   // Ordinary fallback rates and Apple Pay already appear under Everything else.
   // Keep distinct rates (including a lower custom rate) and specific offers.
   if(moved&&!offer.quarter&&!offer.uncategorized&&general.some(row=>row.id===offer.id&&row.card.id===offer.card.id&&row.rate===offer.rate&&row.points===offer.points))continue;
   if(offer.uncategorized&&!offer.quarter){const identity=`${offer.card.id}:${offer.id}`;if(seenSpecific.has(identity))continue;seenSpecific.add(identity);}
   remaining.push({...offer,id:`${category.id}-${offer.id}`,category:category.id,benefit:offer.benefit??category.name,note:offer.note??(offer.uncategorized?undefined:category.detail)});
  }
 }
 return {
  categories:STANDARD_CATEGORIES.map(category=>({...category,rows:comparisons.get(category.id).filter(offer=>!offer.uncategorized)})),
  uncategorized:state.cards.filter(card=>card.enabled).map(card=>({card,rows:remaining.filter(offer=>offer.card.id===card.id).sort((a,b)=>b.rate-a.rate)})).filter(group=>group.rows.length||(group.card.benefits?.length&&state.bonusFilters?.[group.card.id]!==false)),
 };
}
