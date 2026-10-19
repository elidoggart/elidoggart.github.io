// Presentation only: mission time and score stop at the final landing.
export const ENDING_SECONDS=12;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function endingFrame(seconds){
 return {
  fitted:[0,1,2].map(i=>ease((seconds-1-i*1.6)/1.3)),
  ignition:clamp((seconds-6)/1.5),
  launch:ease((seconds-8)/3),
  fade:clamp((seconds-11.2)/.8),
  done:seconds>=ENDING_SECONDS,
 };
}

// Follow the real docking normal, turn clear of home, then leave this system.
export function departureRoute(home,ship,bodies=[]){
 const base=Math.atan2(home.y,home.x),radius=Math.hypot(ship.x-home.x,ship.y-home.y);
 let heading=base,best=-Infinity;
 for(const offset of [0,.25,-.25,.5,-.5,.75,-.75]){
  const a=base+offset,c=Math.cos(a),s=Math.sin(a);let clearance=Infinity;
  for(const b of bodies){if(b.id===home.id)continue;
   const x=b.x-home.x,y=b.y-home.y,along=Math.max(radius+220,Math.min(7000,x*c+y*s));
   clearance=Math.min(clearance,Math.hypot(x-c*along,y-s*along)-b.r);
  }
  if(clearance>best){heading=a;best=clearance;}if(clearance>60)break;
 }
 return {x:home.x,y:home.y,radius,angle:Math.atan2(ship.y-home.y,ship.x-home.x),heading};
}
export function departurePose(seconds,route){
 const lift=ease((seconds-6)/1.5),turn=ease((seconds-7.5)/2),boost=clamp((seconds-9.5)/2.3);
 const delta=Math.atan2(Math.sin(route.heading-route.angle),Math.cos(route.heading-route.angle));
 const a=route.angle+delta*turn,r=route.radius+220*lift+7000*boost*boost;
 return {x:route.x+Math.cos(a)*r,y:route.y+Math.sin(a)*r,a};
}
