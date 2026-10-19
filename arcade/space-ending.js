// Presentation only: mission time and score stop at the final landing.
export const ENDING_SECONDS=15;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function endingFrame(seconds){
 return {
  fitted:[0,1,2].map(i=>ease((seconds-1-i*1.6)/1.3)),
  ignition:clamp((seconds-6)/1.5),
  launch:ease((seconds-8)/3),
  shipScale:1-ease((seconds-11.5)/2.5),
  shipOpacity:1-ease((seconds-13.2)/.8),
  trailOpacity:1-ease((seconds-12.5)/2),
  sparkle:Math.sin(Math.PI*clamp((seconds-13.8)/1.1)),
  done:seconds>=ENDING_SECONDS,
 };
}

// One continuous accelerating arc, beginning at the real docking position.
export function departureRoute(home,ship,bodies=[]){
 const base=Math.atan2(home.y,home.x),radius=Math.hypot(ship.x-home.x,ship.y-home.y);
 const route={x:home.x,y:home.y,radius,angle:Math.atan2(ship.y-home.y,ship.x-home.x),heading:base};
 let best=-Infinity,bestHeading=base;
 for(const offset of [0,.25,-.25,.5,-.5,.75,-.75]){
  route.heading=base+offset;let clearance=Infinity;
  for(let t=6;t<=ENDING_SECONDS;t+=.05){const p=departurePose(t,route);
   for(const b of bodies){if(b.id!==home.id)clearance=Math.min(clearance,Math.hypot(p.x-b.x,p.y-b.y)-b.r);}
  }
  if(clearance>best){bestHeading=route.heading;best=clearance;}if(clearance>60)break;
 }
 route.heading=bestHeading;return route;
}
export function departurePose(seconds,route){
 const progress=Math.max(0,Math.min(1.4,(seconds-6)/6)),turn=ease(progress/.8);
 const delta=Math.atan2(Math.sin(route.heading-route.angle),Math.cos(route.heading-route.angle));
 const a=route.angle+delta*turn,r=route.radius+7200*progress*progress;
 return {x:route.x+Math.cos(a)*r,y:route.y+Math.sin(a)*r,a};
}
