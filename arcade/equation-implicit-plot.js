import {geometry,nearest} from './equation-implicit.js?v=implicit-1';
export function drawImplicit(canvas,round,{guess=null,difference=false,angle=-.65,tilt=.55}={}){
 const {width:w,height:h}=canvas.getBoundingClientRect();if(!w||!h)return;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=w*ratio;canvas.height=h*ratio;const c=canvas.getContext('2d');c.scale(ratio,ratio);c.font=(w<180?'8':'10')+'px Arial';c.lineJoin='round';c.lineCap='round';
 const target=round.geometry??=geometry(round,round.fn),other=guess&&(guess.geometry??=geometry(round,guess)),box=target.box,red='#c73136',ink='#232421';
 const line=(segments,color,width=1,dash=[])=>{c.beginPath();for(const [a,b]of segments){c.moveTo(...a);c.lineTo(...b);}c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);};
 const text=(s,x,y,color='#888980')=>{c.fillStyle=color;c.fillText(s,x,y);};
 if(round.dim===2){
  const compact=w<180,pad=compact?{l:22,r:6,t:12,b:18}:{l:38,r:14,t:20,b:28},left=pad.l,up=pad.t,size=Math.min(w-pad.l-pad.r,h-pad.t-pad.b),right=left+size,down=up+size;
  const X=x=>left+(x-box[0][0])/(box[0][1]-box[0][0])*(right-left),Y=y=>down-(y-box[1][0])/(box[1][1]-box[1][0])*(down-up),project=p=>[X(p[0]),Y(p[1])];
  for(let i=0;i<=4;i++){const x=box[0][0]+(box[0][1]-box[0][0])*i/4,y=box[1][0]+(box[1][1]-box[1][0])*i/4;line([[[X(x),up],[X(x),down]],[[left,Y(y)],[right,Y(y)]]],'#eeeee9');if(!compact||i%2===0){text(Number(x.toPrecision(3)),X(x)-5,h-4);text(Number(y.toPrecision(3)),2,Y(y)+3);}}
  line([[[X(0),up],[X(0),down]],[[left,Y(0)],[right,Y(0)]]],'#bdbeb5');
  if(other){
   // Choose residual orientation by agreement: F=0 and -F=0 are identical.
   const samples=[],n=Math.max(64,Math.min(192,Math.ceil(w/3)));let agree=0;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=box[0][0]+(box[0][1]-box[0][0])*(i+.5)/n,y=box[1][0]+(box[1][1]-box[1][0])*(j+.5)/n,a=target.field(x,y)<0,b=other.field(x,y)<0;samples.push({i,j,a,b});if(a===b)agree++;}const flip=agree<samples.length/2;
   c.fillStyle=difference?'rgba(199,49,54,.38)':'rgba(199,49,54,.14)';c.beginPath();for(const {i,j,a,b}of samples)if(a!==(flip?!b:b))c.rect(left+i*(right-left)/n,down-(j+1)*(down-up)/n,(right-left)/n+.5,(down-up)/n+.5);c.fill();
  }
  if(!difference){line(target.segments.map(s=>s.map(project)),ink,1.6);if(other)line(other.segments.map(s=>s.map(project)),ink,1.6,[1,4]);}
  text('x',right-3,Y(0)-5);text('y',X(0)+6,up);
 }else{
  const scale=Math.min(w,h)*.29,project=p=>{const [x,y,z]=p.map((v,i)=>(v-box[i][0])/(box[i][1]-box[i][0])*2-1);return[w/2+scale*(x*Math.cos(angle)-y*Math.sin(angle)),h*.51+scale*((x*Math.sin(angle)+y*Math.cos(angle))*Math.sin(tilt)-z*Math.cos(tilt))];},low=box.map(b=>b[0]);
  const grid=[];for(let i=0;i<=4;i++){const x=box[0][0]+(box[0][1]-box[0][0])*i/4,y=box[1][0]+(box[1][1]-box[1][0])*i/4;grid.push([project([x,box[1][0],low[2]]),project([x,box[1][1],low[2]])],[project([box[0][0],y,low[2]]),project([box[0][1],y,low[2]])]);}line(grid,'#eeeee9');
  const axes=[];for(let a=0;a<3;a++){const end=[...low];end[a]=box[a][1];axes.push([project(low),project(end)]);if(w>=180)text(`${'xyz'[a]} ${box[a][1]}`,...project(end));}line(axes,'#bdbeb5');if(w>180)text(low.join(', '),project(low)[0]+3,project(low)[1]+12);
  if(other&&(other.error??Infinity)>1e-10){
   other.bridges??=target.segments.filter((_,i)=>i%5===0).map(([a,b])=>[a,b,nearest(other.tree,b).point,nearest(other.tree,a).point]);
   c.fillStyle=difference?'rgba(199,49,54,.12)':'rgba(199,49,54,.045)';for(const bridge of other.bridges){c.beginPath();bridge.map(project).forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}
   if(difference)line(other.bridges.filter((_,i)=>i%3===0).map(b=>[project(b[0]),project(b[3])]),red,.65);
  }
  if(!difference){line(target.segments.map(s=>s.map(project)),ink,.55);if(other)line(other.segments.map(s=>s.map(project)),ink,.7,[1,4]);}
 }
 if(difference)text('Δ boundary',5,11,red);
}
