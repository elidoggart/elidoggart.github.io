import {axisTicks,tickLabel,drawAxes3D} from './equation-axes.js?v=ticks-1';
import {drawImplicit} from './equation-implicit-plot.js?v=ticks-1';
const ink='#232421',red='#c73136',blue='#232421';
export function draw(canvas,round,{guess=null,difference=false,angle=-.65,tilt=.55}={}){
 if(round.implicit||guess?.implicit)return drawImplicit(canvas,round,{guess,difference,angle,tilt});
 const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=w*ratio;canvas.height=h*ratio;const c=canvas.getContext('2d');c.scale(ratio,ratio);c.clearRect(0,0,w,h);c.font='10px Arial';c.lineJoin='round';c.lineCap='round';
 const [lo,hi]=round.domain,[bottom,top]=round.range,span=top-bottom;
 function line(points,color,width=1,dash=[]){c.beginPath();let pen=false;for(const p of points){if(!p||!p.every(Number.isFinite)){pen=false;continue;}if(!pen){c.moveTo(...p);pen=true;}else c.lineTo(...p);}c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
 function label(s,x,y,color='#8c8d83'){c.fillStyle=color;c.fillText(s,x,y);}
 if(round.dim===2){
 const compact=w<180;const pad=compact?{l:22,r:5,t:12,b:18}:difference?{l:33,r:12,t:14,b:20}:{l:45,r:18,t:22,b:34},left=pad.l,right=w-pad.r,up=pad.t,down=h-pad.b;
 let min=bottom,max=top;if(difference){let peak=span*.02;for(const p of round.points)peak=Math.max(peak,Math.abs(guess(p.x,0)-p.z));max=peak*1.12;min=-max;}
 const X=x=>left+(x-lo)/(hi-lo)*(right-left),Y=y=>down-(y-min)/(max-min)*(down-up);
 if(compact)c.font='8px Arial';
 for(const x of axisTicks(lo,hi,right-left)){line([[X(x),up],[X(x),down]],'#eeeee9');label(tickLabel(x),X(x)-c.measureText(tickLabel(x)).width/2,h-5);}
 for(const y of axisTicks(min,max,down-up)){line([[left,Y(y)],[right,Y(y)]],'#eeeee9');label(tickLabel(y),3,Y(y)+3);}
 const zero=Math.max(up,Math.min(down,Y(0)));if(min<=0&&max>=0)line([[left,Y(0)],[right,Y(0)]],'#bdbeb5');if(lo<=0&&hi>=0)line([[X(0),up],[X(0),down]],'#bdbeb5');
 c.save();c.beginPath();c.rect(left,up,right-left,down-up);c.clip();
 const curve=fn=>{const p=[];let last=null;for(let i=0;i<=800;i++){const x=lo+(hi-lo)*i/800,y=fn(x),v=Y(y);if(!Number.isFinite(y)||Math.abs(v)>1e7){p.push(null);last=null;}else{if(last!==null&&Math.abs(v-last)>h*3)p.push(null);p.push([X(x),v]);last=v;}}return p;};
 // Fill narrow strips so crossings never create a self-intersecting polygon.
 if(guess){c.fillStyle='rgba(199,49,54,.14)';for(let i=0;i<800;i++){const a=lo+(hi-lo)*i/800,b=lo+(hi-lo)*(i+1)/800,ta=round.fn(a,0),tb=round.fn(b,0),ga=guess(a,0),gb=guess(b,0);const vertices=difference?[[X(a),Y(0)],[X(a),Y(ga-ta)],[X(b),Y(gb-tb)],[X(b),Y(0)]]:[[X(a),Y(ta)],[X(a),Y(ga)],[X(b),Y(gb)],[X(b),Y(tb)]];if(vertices.some(p=>!p.every(Number.isFinite)||Math.abs(p[1])>1e7))continue;c.beginPath();vertices.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}}
 if(difference)line(curve(x=>guess(x,0)-round.fn(x,0)),red,1.5);else{line(curve(x=>round.fn(x,0)),ink,1.8);if(guess)line(curve(x=>guess(x,0)),blue,1.8,[1,5]);}c.restore();if(!difference){label('x',right-3,zero-7);label('y',X(0)+8,up);}
 }else{
 let low=bottom,high=top;if(difference){let peak=span*.02;for(const p of round.points)peak=Math.max(peak,Math.abs(guess(p.x,p.y)-p.z));low=-peak;high=peak;}
 const scale=Math.min(w*.30,h*.30),project=(x,y,z)=>{const nx=(x-lo)/(hi-lo)*2-1,ny=(y-lo)/(hi-lo)*2-1,nz=(z-low)/(high-low)*2-1;return[w/2+scale*(nx*Math.cos(angle)-ny*Math.sin(angle)),h*.51+scale*((nx*Math.sin(angle)+ny*Math.cos(angle))*Math.sin(tilt)-nz*Math.cos(tilt))];};
 drawAxes3D(c,[[lo,hi],[lo,hi],[low,high]],p=>project(...p),w,difference?0:low);
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
 function surface(fn,color,dash=[]){const n=difference?14:24;for(let axis=0;axis<2;axis++)for(let j=0;j<=n;j++){const points=[];for(let i=0;i<=48;i++){const a=lo+(hi-lo)*i/48,b=lo+(hi-lo)*j/n,x=axis?a:b,y=axis?b:a,z=fn(x,y);points.push(Number.isFinite(z)&&z>=low-span*.5&&z<=high+span*.5?project(x,y,z):null);}line(points,color,difference?.7:.65,dash);}}
 if(guess&&!difference){c.fillStyle='rgba(199,49,54,.06)';for(let j=0;j<=12;j++)for(let i=0;i<32;i++){const x=lo+(hi-lo)*i/32,next=lo+(hi-lo)*(i+1)/32,y=lo+(hi-lo)*j/12;const values=[round.fn(x,y),guess(x,y),guess(next,y),round.fn(next,y)];if(values.some(z=>!Number.isFinite(z)||z<low-span*.5||z>high+span*.5))continue;const points=[project(x,y,values[0]),project(x,y,values[1]),project(next,y,values[2]),project(next,y,values[3])];c.beginPath();points.forEach((p,k)=>k?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}}
 if(difference)surface((x,y)=>guess(x,y)-round.fn(x,y),red);else{surface(round.fn,ink);if(guess)surface(guess,blue,[1,4]);}c.restore();if(difference)label('Δ',6,12,red);
 }
}
