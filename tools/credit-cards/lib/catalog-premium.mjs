// U.S. personal cards; issuer sources reviewed November 8, 2026.
// Point values are editable comparison assumptions, not guaranteed cash redemptions.
const offer=(key,label,rate,condition,category='travel',uncategorized=true)=>({key,label,rate,condition,categories:[category],uncategorized});
const points=(id,name,issuer,base,rates,source,offers=[],extra={})=>({id,name,issuer,base,rates,source,rewardType:'points',pointValue:1,offers,terms:'Rewards shown as points per dollar. Point value is an editable estimate. Annual fees, welcome offers, statement credits and separate loyalty-program earnings are excluded.',...extra});
const cash=(id,name,issuer,base,rates,source,offers=[],extra={})=>({id,name,issuer,base,rates,source,offers,terms:'Cash back on eligible purchases. Merchant coding and issuer exclusions apply. Welcome offers and annual fees are excluded.',...extra});
const amex='https://www.americanexpress.com/us/credit-cards/card/';
const cap='https://www.capitalone.com/credit-cards/';
const platinumOffers=[
 offer('air','Flights · direct / Amex Travel',5,'Flights booked directly with airlines or through American Express Travel; up to $500,000 per calendar year, then 1 point per dollar.'),
 offer('hotels','Amex Travel · prepaid hotels',5,'Eligible prepaid hotels booked through American Express Travel.'),
 offer('airbnb','Airbnb · Amex Travel',5,'Prepaid Airbnb short-term rentals booked through AmexTravel.com or the Amex Travel App; direct Airbnb bookings do not qualify.'),
];
const capPortal=()=>offer('portal','Capital One Travel',5,'Hotels, vacation rentals and rental cars booked through Capital One Travel only. Flights do not qualify.','travel',false);
const capEvents=rate=>offer('events','Capital One Entertainment',rate,'Eligible ticket purchases through Capital One Entertainment. Capital One presales and other excluded purchases do not qualify.','entertainment');
const hotel=(brand,rate)=>offer('hotel',brand,rate,`Eligible purchases charged directly by participating ${brand} properties. This is the card earning rate only; separate hotel loyalty earnings are excluded.`);
const groceryNote='Grocery stores exclude superstores such as Walmart and Target.';

export const PREMIUM_CARDS=[
 cash('chase-rise','Freedom Rise','Chase',1.5,{},'https://creditcards.chase.com/cash-back-credit-cards/freedom/rise',[],{annualFee:0}),
 cash('chase-slate','Slate','Chase',0,{},'https://creditcards.chase.com/all-credit-cards',[],{annualFee:0,aliases:'Slate Edge',terms:'This balance-transfer card does not earn purchase rewards.'}),
 points('chase-reserve','Sapphire Reserve','Chase',1,{dining:3},'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',[
  offer('portal','Chase Travel',8,'Eligible bookings through Chase Travel. Purchases qualifying for the annual travel credit or The Edit credit do not earn points.','travel',false),
  offer('direct','Direct flights & hotels',4,'Flights booked directly with airlines and hotels booked directly with hotels. Purchases qualifying for the annual travel credit do not earn points.'),
  {...offer('lyft','Lyft',5,'Eligible Lyft rides through September 30, 2027.','transit'),expires:'2027-09-30'},
 ],{annualFee:795}),
 points('amex-gold','Gold','American Express',1,{dining:4,groceries:4},`${amex}gold-card/`,[
  offer('air','Flights · direct / Amex Travel',3,'Flights purchased directly from airlines or through AmexTravel.com or the Amex Travel App.'),
  offer('hotels','Amex Travel · prepaid hotels',5,'Eligible prepaid hotels booked through AmexTravel.com or the Amex Travel App.'),
  offer('cars-cruises','Amex Travel · cars & cruises',2,'Prepaid rental cars booked through AmexTravel.com or the Amex Travel App, and cruises booked and paid through AmexTravel.com.'),
 ],{annualFee:325,notesByCategory:{dining:'4 points at restaurants worldwide on up to $50,000 per calendar year; then 1.',groceries:'4 points at U.S. supermarkets on up to $25,000 per calendar year; then 1.'}}),
 ...[
  ['amex-platinum','Platinum',`${amex}platinum/`,{}],
  ['amex-schwab-platinum','Platinum · Charles Schwab','https://www.schwab.com/credit-cards/platinum-card',{aliases:'Schwab Platinum',terms:'Requires an eligible Charles Schwab account. Point value is an editable estimate; investment-redemption rates and limits are separate.'}],
  ['amex-morgan-platinum','Platinum · Morgan Stanley','https://global.americanexpress.com/card-benefits/view-all/morgan-stanley-platinum-card',{aliases:'Morgan Stanley Platinum',terms:'Requires an eligible Morgan Stanley relationship. Point value is an editable estimate; annual fee and account-related benefits are excluded.'}],
 ].map(([id,name,source,extra])=>points(id,name,'American Express',1,{},source,platinumOffers.map(o=>({...o})),{annualFee:895,...extra})),
 cash('amex-schwab-investor','Investor · Charles Schwab','American Express',1.5,{},'https://www.schwab.com/credit-cards',[],{annualFee:0,terms:'1.5% cash back deposited into an eligible linked Schwab account; eligible Schwab relationship required.'}),
 cash('amex-morgan-blue','Blue Cash Preferred · Morgan Stanley','American Express',1,{groceries:6,gas:3,transit:3,streaming:6},'https://global.americanexpress.com/card-benefits/view-all/morgan-stanley-blue-cash-preferred',[],{annualFee:95,caps:{groceries:6000},notesByCategory:{groceries:'U.S. supermarkets: first $6,000 per calendar year, then 1%.',gas:'U.S. gas stations; excludes supermarket and warehouse fuel.',streaming:'Select U.S. streaming subscriptions only.'},terms:'Eligible Morgan Stanley relationship required. 6% U.S. supermarkets up to $6,000 each calendar year, then 1%; 6% select U.S. streaming; 3% U.S. gas and transit.'}),
 ...[
  ['capital-platinum','Platinum','platinum',0],
  ['capital-platinum-secured','Platinum Secured','platinum-secured',0],
 ].map(([id,name,path,fee])=>cash(id,name,'Capital One',0,{},`${cap}${path}/`,[],{annualFee:fee,terms:'This card does not earn purchase rewards.'})),
 ...[
  ['capital-quicksilver','Quicksilver','quicksilver',0],
  ['capital-quicksilver-good','Quicksilver · Good Credit','quicksilver-good-credit',0],
  ['capital-quicksilverone','QuicksilverOne','quicksilverone',39],
  ['capital-quicksilver-student','Quicksilver · Student','quicksilver-student',0],
  ['capital-quicksilver-secured','Quicksilver Secured','quicksilver-secured',0],
 ].map(([id,name,path,fee])=>cash(id,name,'Capital One',1.5,{},`${cap}${path}/`,[capPortal(),capEvents(5)],{annualFee:fee})),
 ...[
  ['capital-savor','Savor','savor',0],
  ['capital-savor-good','Savor · Good Credit','savor-good-credit',0],
  ['capital-savorone','SavorOne','savorone',39],
  ['capital-savor-student','Savor · Student','savor-student',0],
 ].map(([id,name,path,fee])=>cash(id,name,'Capital One',1,{groceries:3,dining:3,entertainment:3,streaming:3},`${cap}${path}/`,[capPortal(),capEvents(8)],{annualFee:fee,notesByCategory:{groceries:groceryNote,entertainment:'Eligible entertainment merchants only; issuer exclusions apply.',streaming:'Popular eligible streaming services only.'},...(id==='capital-savor'?{aliases:'SavorOne no annual fee'}:{})})),
 ...[
  ['capital-venture','Venture','venture',2,95],
  ['capital-ventureone','VentureOne','ventureone',1.25,0],
  ['capital-ventureone-good','VentureOne · Good Credit','ventureone-good-credit',1.25,0],
 ].map(([id,name,path,base,fee])=>points(id,name,'Capital One',base,{},`${cap}${path}/`,[capPortal(),...(id==='capital-venture'?[capEvents(5)]:[])],{rewardUnit:'miles',annualFee:fee})),
 points('capital-venture-x','Venture X','Capital One',2,{},`${cap}venture-x/`,[
  offer('hotel-car','Capital One Travel · hotels & cars',10,'Hotels and rental cars booked through Capital One Travel only.','travel',false),
  offer('air-home','Capital One Travel · flights & rentals',5,'Flights and vacation rentals booked through Capital One Travel only.','travel',false),capEvents(5),
 ],{rewardUnit:'miles',annualFee:395}),
 points('hilton-honors','Hilton Honors','American Express',3,{dining:5,gas:5,groceries:5},`${amex}hilton-honors/`,[hotel('Hilton',7)],{annualFee:0,terms:'5 points at U.S. restaurants, U.S. gas stations and U.S. supermarkets; 7 at participating Hilton properties; 3 otherwise. Hotel loyalty earnings are additional and excluded.'}),
 points('hilton-surpass','Hilton Honors Surpass','American Express',3,{dining:6,gas:6,groceries:6,online:4},`${amex}hilton-honors-surpass/`,[hotel('Hilton',12)],{annualFee:150,terms:'6 points at U.S. restaurants, U.S. gas stations and U.S. supermarkets; 4 on eligible U.S. online retail; 12 at participating Hilton properties; 3 otherwise.'}),
 points('hilton-aspire','Hilton Honors Aspire','American Express',3,{dining:7},`${amex}hilton-honors-aspire/`,[hotel('Hilton',14),offer('air-car','Flights & selected rental cars',7,'Flights booked directly with airlines or Amex Travel, and car rentals booked directly with selected car rental companies.')],{annualFee:550,notesByCategory:{dining:'U.S. restaurants only.'}}),
 points('marriott-bold','Marriott Bonvoy Bold','Chase',1,{groceries:2},'https://marriott.chase.com/bold',[
  hotel('Marriott Bonvoy',3),offer('rides','Rideshare',2,'Eligible rideshare merchants.','transit'),offer('delivery','Food delivery',2,'Select food delivery services only.','dining'),offer('stream','Select streaming',2,'Select streaming subscriptions only.','streaming'),offer('utilities','Internet, cable & phone',2,'Eligible internet, cable and phone services.','other'),
 ],{annualFee:0}),
 points('marriott-boundless','Marriott Bonvoy Boundless','Chase',2,{groceries:3,dining:3,gas:3},'https://marriott.chase.com/boundless',[hotel('Marriott Bonvoy',6)],{annualFee:95,notesByCategory:Object.fromEntries(['groceries','dining','gas'].map(k=>[k,'3 points on the first $6,000 combined annual grocery, dining and gas purchases; then 2.']))}),
 points('marriott-bountiful','Marriott Bonvoy Bountiful','Chase',2,{groceries:4,dining:4},'https://marriott.chase.com/bountiful',[hotel('Marriott Bonvoy',6)],{annualFee:250,notesByCategory:Object.fromEntries(['groceries','dining'].map(k=>[k,'4 points on the first $15,000 combined annual grocery and dining purchases; then 2.']))}),
 points('marriott-bevy','Marriott Bonvoy Bevy','American Express',2,{groceries:4,dining:4},`${amex}marriott-bonvoy-bevy/`,[hotel('Marriott Bonvoy',6)],{annualFee:250,notesByCategory:Object.fromEntries(['groceries','dining'].map(k=>[k,'4 points at worldwide restaurants and U.S. supermarkets, on the first $15,000 combined per calendar year; then 2.']))}),
 points('marriott-brilliant','Marriott Bonvoy Brilliant','American Express',2,{dining:3},`${amex}marriott-bonvoy-brilliant/`,[hotel('Marriott Bonvoy',6),offer('air','Direct airline bookings',3,'Flights purchased directly from airlines.')],{annualFee:650}),
 points('hyatt','World of Hyatt','Chase',1,{dining:2,transit:2},'https://creditcards.chase.com/travel-credit-cards/world-of-hyatt-credit-card',[hotel('Hyatt',4),offer('air','Direct airline bookings',2,'Airline tickets purchased directly from airlines.'),offer('fitness','Fitness clubs & gyms',2,'Eligible fitness club and gym memberships.','other')],{annualFee:95}),
 points('ihg-one','IHG One Rewards','Chase',2,{gas:3,dining:3,groceries:3},'https://creditcards.chase.com/travel-credit-cards/ihg-rewards-club/one-rewards',[hotel('IHG Hotels & Resorts',5)],{annualFee:0,aliases:'IHG Traveler'}),
 points('ihg-premier','IHG One Rewards Premier','Chase',3,{gas:5,dining:5,groceries:5},'https://creditcards.chase.com/travel-credit-cards/ihg-rewards-club/premier',[hotel('IHG Hotels & Resorts',10),offer('air-car','Direct airlines & car rentals',5,'Eligible direct airline and car rental agency purchases.')],{annualFee:150}),
 points('ihg-premier-select','IHG One Rewards Premier Select','Chase',3,{dining:6,travel:6,transit:6},'https://creditcards.chase.com/travel-credit-cards/ihg-rewards-club/premier-select',[hotel('IHG Hotels & Resorts',12)],{annualFee:350}),
 ...[
  ['wyndham-earner','Wyndham Rewards Earner',3,5,0],
  ['wyndham-earner-plus','Wyndham Rewards Earner Plus',4,6,95],
  ['wyndham-earner-premier','Wyndham Rewards Earner Premier',4,8,395],
 ].map(([id,name,rate,hotelRate,fee])=>points(id,name,'Barclays',1,{groceries:rate,dining:rate,gas:rate,ev:rate,...(rate===4?{transit:4}:{})},'https://www.wyndhamrewardscreditcard.com/',[
  hotel('Wyndham',hotelRate),...(rate===4?[offer('air-car','Airfare & car rentals',4,'Eligible airfare and car rental purchases.'),offer('vacationclub','Wyndham Vacation Club',4,'Eligible Wyndham Vacation Club purchases; timeshare down payments are excluded.','other')]:[]),
 ],{annualFee:fee,notesByCategory:{groceries:groceryNote},terms:'Rates reflect the June 17, 2026 refresh. Eligible purchases only; timeshare down payments excluded. Hotel loyalty earnings are additional and excluded.'})),
 points('choice-privileges','Choice Privileges','Wells Fargo',1,{groceries:3,gas:3,ev:3},'https://creditcards.wellsfargo.com/choice-hotel-privileges-mastercard/',[hotel('Choice Hotels',5),offer('points','Choice point purchases',5,'Eligible Choice Privileges points purchases.','other'),offer('home','Home improvement stores',3,'Eligible home improvement merchant purchases.','other'),offer('phone','Phone plans',3,'Eligible landline and cell phone plan services, excluding equipment-only merchants.','other')],{annualFee:0}),
 points('choice-privileges-select','Choice Privileges Select','Wells Fargo',1,{groceries:5,gas:5,ev:5},'https://creditcards.wellsfargo.com/choice-hotels-privileges-select-mastercard/',[hotel('Choice Hotels',10),offer('points','Choice point purchases',10,'Eligible Choice Privileges points purchases.','other'),offer('home','Home improvement stores',5,'Eligible home improvement merchant purchases.','other'),offer('phone','Phone plans',5,'Eligible landline and cell phone plan services, excluding equipment-only merchants.','other')],{annualFee:95}),
];
