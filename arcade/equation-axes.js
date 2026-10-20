// Use readable decimal steps, anchored at zero, without changing the scored area.
export function axisTicks(min,max,pixels=400){
 if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min)return [];
 const intervals=Math.max(3,Math.min(6,Math.floor(pixels/80))),raw=(max-min)/intervals,power=10**Math.floor(Math.log10(raw));
 const step=[1,2,2.5,5,10].map(n=>n*power).reduce((a,b)=>Math.abs(Math.log(b/raw))<Math.abs(Math.log(a/raw))?b:a);
 const first=Math.ceil(min/step-1e-10),last=Math.floor(max/step+1e-10),ticks=[];
 for(let i=first;i<=last;i++){const value=Number((i*step).toPrecision(12));ticks.push(Object.is(value,-0)?0:value);}
 return ticks;
}
export function tickLabel(value){return value===0?'0':String(Number(value.toPrecision(12)));}
export function drawAxes3D(c,box,project,width,base=box[2][0]){
 const low=box.map(b=>b[0]),stroke=(a,b,color='#d9d9d2')=>{c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=.8;c.stroke();};
 const ticks=box.map(([min,max],axis)=>{const end=[...low];end[axis]=max;const a=project(low),b=project(end);return axisTicks(min,max,Math.hypot(b[0]-a[0],b[1]-a[1]));});
 for(const x of ticks[0])stroke(project([x,box[1][0],base]),project([x,box[1][1],base]),'#eeeee9');
 for(const y of ticks[1])stroke(project([box[0][0],y,base]),project([box[0][1],y,base]),'#eeeee9');
 for(let axis=0;axis<3;axis++){
  const end=[...low];end[axis]=box[axis][1];stroke(project(low),project(end),'#bdbeb5');
  if(width<150)continue;
  c.fillStyle='#888980';const tip=project(end);c.fillText('xyz'[axis],tip[0]+5,tip[1]-6);
  for(const value of ticks[axis]){
   // The three axes meet here; one label keeps that corner readable.
   if(axis<2&&Math.abs(value-box[axis][0])<1e-10)continue;
   const p=[...low];p[axis]=value;const [x,y]=project(p);stroke([x-3,y],[x+3,y],'#a9aaa0');
   const label=tickLabel(value),labelWidth=c.measureText(label).width,tx=axis===2?x-labelWidth-5:axis===1?x-labelWidth-4:x+4,ty=axis===2?y+3:y+12;
   c.fillText(label,tx,ty);
  }
 }
}
