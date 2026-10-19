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
