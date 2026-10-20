import {compile} from './equation-math.js?v=variety-1';
export const implicitFamilyCount={easy:2,medium:3,hard:5};
export function compileImplicit(source,dim){
 const sides=source.split('=');if(sides.length>2||sides.some(s=>!s.trim()))throw Error('Use one complete equation, e.g. x^2 + y^2 = 4.');
 const expression=sides.length===2?`(${sides[0]})-(${sides[1]})`:`${dim===3?'z':'y'}-(${source})`;
 const fn=compile(expression,dim+1);fn.implicit=true;fn.source=source;return fn;
}
export function makeImplicitRound(difficulty,family,a,b,k){
 const x=`(x - ${b/2})`,y=`(y + ${b/2})`,z=`(z - ${b/2})`,r=a+1;
 const options={easy:[['Circle',`${x}^2 + ${y}^2 = ${r*r}`,'(x − h)² + (y − k)² = r²'],['Ellipse',`${x}^2/9 + ${y}^2/4 = 1`,'(x − h)²/a² + (y − k)²/b² = 1']],medium:[['Rotated ellipse',`(x+y)^2/18 + (x-y)^2/4 = 1`,'(x + y)²/a² + (x − y)²/b² = 1'],['Hyperbola',`${x}^2/4 - ${y}^2/4 = 1`,'(x − h)²/a² − (y − k)²/b² = 1'],['Ellipse',`${x}^2/9 + ${y}^2 = 1`,'(x − h)²/a² + (y − k)²/b² = 1']],hard:[['Sphere',`${x}^2 + ${y}^2 + ${z}^2 = ${r*r}`,'(x − h)² + (y − k)² + (z − l)² = r²'],['Ellipsoid',`${x}^2/9 + ${y}^2/4 + ${z}^2 = 1`,'(x − h)²/a² + (y − k)²/b² + (z − l)²/c² = 1'],['Cone',`x^2 + y^2 = ${k}z^2`,'x² + y² = az²'],['Cylinder',`${x}^2 + ${y}^2 = 4`,'(x − h)² + (y − k)² = r²'],['Hyperboloid',`x^2 + y^2 - z^2 = 4`,'x²/a² + y²/b² − z²/c² = 1']]};
 const [hint,raw,hintEquation]=options[difficulty][family],expression=raw.replaceAll('- -','+ ').replaceAll('+ -','- '),dim=difficulty==='hard'?3:2;
 const fn=compileImplicit(expression,dim),radius=difficulty==='easy'?(family===0?r:3)+Math.abs(b/2)+.75:difficulty==='medium'?(family===0?3.5:4):family===0?r+Math.abs(b/2)+.75:family===1?4.25:3.5;
 const round={difficulty,dim,family,expression,fn,implicit:true,domain:[-radius,radius],range:[-radius,radius],hint,hintEquation};round.geometry=geometry(round,fn);return round;
}
export function bounds(round){return round.dim===2?[round.domain,round.range]:[round.domain,round.domain,round.range];}
function residual(round,fn){return fn.implicit?fn:round.dim===2?(x,y)=>y-fn(x,0):(x,y,z)=>z-fn(x,y);}
// Marching squares on one plane in 2D, or a set of orthogonal sections in 3D.
export function geometry(round,fn){
 const field=residual(round,fn),box=bounds(round),segments=[],n=round.dim===2?96:36;
 const value=p=>{const v=field(...p);if(!Number.isFinite(v)||Math.abs(v)>1e12)throw Error('Your equation must be finite throughout the shown area.');return v;};
 function slice(axis,fixed){const axes=round.dim===2?[0,1]:[0,1,2].filter(a=>a!==axis),[u,v]=axes;
  const point=(i,j)=>{const p=Array(round.dim).fill(0);if(round.dim===3)p[axis]=fixed;p[u]=box[u][0]+(box[u][1]-box[u][0])*i/n;p[v]=box[v][0]+(box[v][1]-box[v][0])*j/n;return p;};
  const grid=Array.from({length:n+1},(_,j)=>Array.from({length:n+1},(_,i)=>{const p=point(i,j);return {p,v:value(p)};}));
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const corners=[grid[j][i],grid[j][i+1],grid[j+1][i+1],grid[j+1][i]],cross=[];
   for(let e=0;e<4;e++){const a=corners[e],b=corners[(e+1)%4];if((a.v<0)===(b.v<0))continue;const t=a.v/(a.v-b.v);cross.push(a.p.map((v,k)=>v+t*(b.p[k]-v)));}
   if(cross.length===2)segments.push(cross);
   else if(cross.length===4){const center=corners[0].p.map((v,k)=>(v+corners[2].p[k])/2);if((value(center)<0)===(corners[0].v<0))segments.push([cross[0],cross[1]],[cross[2],cross[3]]);else segments.push([cross[0],cross[3]],[cross[1],cross[2]]);}
  }
 }
 if(round.dim===2)slice(2,0);else for(let axis=0;axis<3;axis++)for(let i=1;i<16;i++)slice(axis,box[axis][0]+(box[axis][1]-box[axis][0])*i/16);
 if(!segments.length)throw Error('No curve or surface is visible in this window.');
 const raw=segments.flat(),stride=Math.max(1,Math.ceil(raw.length/2400)),points=raw.filter((_,i)=>i%stride===0),tree=kdTree(points,0,round.dim);
 return {segments,points,tree,field,box};
}
function kdTree(points,depth,dim){if(!points.length)return null;const axis=depth%dim,sorted=[...points].sort((a,b)=>a[axis]-b[axis]),mid=Math.floor(sorted.length/2);return {p:sorted[mid],axis,left:kdTree(sorted.slice(0,mid),depth+1,dim),right:kdTree(sorted.slice(mid+1),depth+1,dim)};}
export function nearest(tree,p,best={distance:Infinity,point:null}){if(!tree)return best;const distance=p.reduce((s,v,i)=>s+(v-tree.p[i])**2,0);if(distance<best.distance)best={distance,point:tree.p};const d=p[tree.axis]-tree.p[tree.axis],first=d<0?'left':'right',second=d<0?'right':'left';best=nearest(tree[first],p,best);if(d*d<best.distance)best=nearest(tree[second],p,best);return best;}
export function evaluateImplicit(round,fn){
 const target=round.geometry??=geometry(round,round.fn),guess=geometry(round,fn);fn.geometry=guess;
 let sum=0;for(const p of target.points)sum+=nearest(guess.tree,p).distance;for(const p of guess.points)sum+=nearest(target.tree,p).distance;
 const rmse=Math.sqrt(sum/(target.points.length+guess.points.length)),span=Math.hypot(...bounds(round).map(([a,b])=>b-a)),error=rmse/span;guess.error=error;
 return {rmse,error,closeness:100*Math.exp(-6*error),geometric:true};
}
// Recover the quadratic form numerically, so reordered and expanded conics agree.
export function implicitComponents(fn,dim){
 const origin=Array(dim).fill(0),c=fn(...origin),b=[],q=Array.from({length:dim},()=>Array(dim).fill(0));
 for(let i=0;i<dim;i++){const plus=[...origin],minus=[...origin];plus[i]=1;minus[i]=-1;const p=fn(...plus),m=fn(...minus);b[i]=(p-m)/2;q[i][i]=(p+m)/2-c;}
 for(let i=0;i<dim;i++)for(let j=i+1;j<dim;j++){const p=[...origin];p[i]=p[j]=1;q[i][j]=q[j][i]=(fn(...p)-c-b[i]-b[j]-q[i][i]-q[j][j])/2;}
 const magnitude=Math.max(1e-12,Math.abs(c),...b.map(Math.abs),...q.flat().map(Math.abs)),near=n=>Math.abs(n)<magnitude*1e-7;
 for(const t of [.37,1.31,-.83]){const p=origin.map((_,i)=>t*(i+1)),expected=c+p.reduce((s,v,i)=>s+b[i]*v+p.reduce((a,w,j)=>a+v*q[i][j]*w,0),0);if(Math.abs(fn(...p)-expected)>magnitude*1e-6)return [{id:'nonquadratic',label:'Non-quadratic equation'}];}
 const diagonal=q.map(row=>[...row]);for(let iter=0;iter<30;iter++){let a=0,d=1;for(let i=0;i<dim;i++)for(let j=i+1;j<dim;j++)if(Math.abs(diagonal[i][j])>Math.abs(diagonal[a][d])){a=i;d=j;}if(near(diagonal[a][d]))break;const theta=.5*Math.atan2(2*diagonal[a][d],diagonal[d][d]-diagonal[a][a]),s=Math.sin(theta),co=Math.cos(theta),aa=diagonal[a][a],dd=diagonal[d][d],ad=diagonal[a][d];diagonal[a][a]=co*co*aa-2*s*co*ad+s*s*dd;diagonal[d][d]=s*s*aa+2*s*co*ad+co*co*dd;diagonal[a][d]=diagonal[d][a]=0;for(let i=0;i<dim;i++)if(i!==a&&i!==d){const x=diagonal[i][a],y=diagonal[i][d];diagonal[i][a]=diagonal[a][i]=co*x-s*y;diagonal[i][d]=diagonal[d][i]=s*x+co*y;}}
 const eig=diagonal.map((row,i)=>row[i]).filter(v=>!near(v)),components=[],add=(id,label)=>components.push({id,label}),same=eig.every(v=>v*eig[0]>0);
 // Solve Q h = -b/2 for the center (free coordinates remain zero).
 const rows=q.map((row,i)=>[...row,-b[i]/2]);for(let j=0;j<dim;j++){let pivot=j;for(let i=j+1;i<dim;i++)if(Math.abs(rows[i][j])>Math.abs(rows[pivot][j]))pivot=i;if(near(rows[pivot][j]))continue;[rows[j],rows[pivot]]=[rows[pivot],rows[j]];const v=rows[j][j];rows[j]=rows[j].map(x=>x/v);for(let i=0;i<dim;i++)if(i!==j){const f=rows[i][j];rows[i]=rows[i].map((x,k)=>x-f*rows[j][k]);}}
 const center=rows.map((row,i)=>Math.abs(row[i]-1)<1e-7?row[dim]:0),offset=fn(...center);
 if(!eig.length)add('linear',dim===2?'Line':'Plane');else if(eig.length<dim)add(dim===3?'cylinder':'parabola',dim===3?'Cylindrical form':'Parabolic form');else if(same){add('elliptic',dim===3?'Ellipsoidal form':'Elliptic form');if(eig.every(v=>near(v-eig[0])))add('equal-radii','Equal radii');else add('axis-ratio','Unequal radii');if(eig.some(v=>Math.abs(-offset/v-1)>1e-7))add('radius','Radius scale');}else add(near(offset)?'cone':'hyperbolic',near(offset)?'Conical form':dim===3?'Hyperboloid':'Hyperbola');
 for(let i=0;i<dim;i++)if(Math.abs(center[i])>1e-7)add('shift'+i,`${'xyz'[i]} shift`);
 if(q.some((row,i)=>row.some((v,j)=>j!==i&&!near(v))))add('rotation','Rotation');
 if(!same&&eig.length>1&&!eig.every(v=>near(Math.abs(v)-Math.abs(eig[0]))))add('taper','Axis scale');
 return components;
}
export function implicitCredit(round,fn,error){
 const expected=implicitComponents(residual(round,round.fn),round.dim),actual=implicitComponents(residual(round,fn),round.dim),exact=error<1e-9,ids=new Set(actual.map(c=>c.id)),extra=exact?0:actual.filter(c=>!expected.some(t=>t.id===c.id)).length;
 const entries=expected.map(c=>({...c,matched:exact||ids.has(c.id)})),matched=entries.filter(c=>c.matched).length,points=exact?2000:Math.round(2000*matched/(expected.length+extra));let count=0,assigned=0;for(const c of entries){c.points=c.matched?Math.round(points*++count/matched)-assigned:0;assigned+=c.points;}return {points,ratio:points/2000,entries,extra};
}
