// Combat solutions come from sightlines, weapon transfers and timing.
// No kill order is enforced: throws, disarms and accurate shots remain alternatives.
const gun=(x,z,weapon,dropAmmo,tactic='hold',ready=1)=>({x,z,type:'gun',weapon,dropAmmo,tactic,ready});
const rush=(x,z,weapon='baton')=>({x,z,type:'rush',weapon,tactic:'advance'});
export const ENCOUNTERS=[
 {
  // The reachable pistol has one round. Taking it brings a close threat:
  // spend the round, throw the empty pistol, or let the baton carrier approach.
  enemies:[gun(2.1,-2.7,'gun',1),gun(3.3,6,'rifle',1,'hold',2),rush(-2.1,-1.5)],
  flank:gun(-6,-2,'smg',2,'advance',1.8),
  waves:[[rush(-6,-6),gun(6,6,'gun',1,'advance',1.5)]],
  waveTrigger:'armed',
  items:[{x:-1.3,z:-4.8,kind:'bottle',y:.08},{x:-4.7,z:4,kind:'baton',y:1.03}]
 },
 {
  // A mug earns one shotgun shell; the two arrivals share a doorway.
  // The knife is a reusable fallback, but reaching it costs movement time.
  enemies:[gun(0,0,'shotgun',1),rush(5,4.5,'knife')],
  flank:gun(5,2,'smg',2,'advance',2),
  waves:[[gun(-4,5,'gun',1,'advance'),rush(-4.5,5,'baton')]],
  items:[{x:-1,z:-3.5,kind:'mug',y:.88},{x:-4.7,z:3,kind:'knife',y:1.03}]
 },
 {
  // The first guard carries the rifle. The far pair share a right-hand lane,
  // rewarding one lined-up shot instead of spending it on the nearest body.
  enemies:[gun(2,-3.5,'rifle',1),gun(5.8,5.5,'smg',2,'hold',2),gun(5.8,7.2,'gun',1,'hold',2.5)],
  flank:gun(6,-3,'shotgun',1,'advance',2),
  waves:[[rush(-7,-6,'axe'),gun(7,-6,'gun',1,'advance')]],
  waveTrigger:'second-pickup',
  items:[{x:1,z:-5.5,kind:'stapler',y:.08},{x:-4.7,z:-1,kind:'bottle',y:1.03}]
 },
 {
  // Long sightlines reward the rifle. The first takedown brings pursuit
  // through the entrance, so the next pickup has to be timed around cover.
  enemies:[gun(1,-4.5,'rifle',1),gun(-6.3,4.5,'shotgun',1,'hold',2),gun(6.3,6.5,'smg',2,'hold',2.5)],
  flank:gun(-7,1,'gun',1,'advance',2),
  waves:[[rush(-8,-7,'baton'),gun(8,-7,'gun',1,'advance')]],
  waveTrigger:'first-kill',
  items:[{x:1,z:-6.5,kind:'bottle',y:.08},{x:-4.7,z:-2,kind:'axe',y:1.33}]
 },
 {
  // The side-entry baton reaches the first guard; his shotgun buys space
  // against the approaching crew while the rear rifle covers the aisle.
  enemies:[gun(1,-.3,'shotgun',1),gun(-1.2,3.5,'rifle',1,'hold',2),rush(1.4,5,'knife')],
  flank:gun(1.6,2.5,'smg',2,'advance',2),
  waves:[],
  items:[{x:-.5,z:-2,kind:'baton',y:.08}]
 }
];
export function authorEncounter(room,level){
 const e=ENCOUNTERS[level];
 room.enemies=[...e.enemies.map(guard=>({...guard})),{...e.flank,hardOnly:true}];
 room.waves=e.waves.map(wave=>wave.map(guard=>({...guard})));
 room.items=e.items.map(item=>({...item}));
 room.waveTrigger=e.waveTrigger||'clear';
}
