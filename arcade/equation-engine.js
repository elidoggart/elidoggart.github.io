import {makeImplicitRound,implicitFamilyCount,evaluateImplicit,compileImplicit} from './equation-implicit.js?v=variety-1';
export {compileImplicit,implicitCredit} from './equation-implicit.js?v=variety-1';
import {graphFamilies,familyCounts} from './equation-families.js?v=variety-1';
export {familyCounts} from './equation-families.js?v=variety-1';
export {implicitFamilyCount as bonusFamilyCounts} from './equation-implicit.js?v=variety-1';
export function makeBonusRound(difficulty,rng=Math.random){const family=familyCounts[difficulty]+Math.floor(rng()*implicitFamilyCount[difficulty]);return makeRound(difficulty,rng,family);}
export const isExactFit=result=>result.error<1e-10;
export const bonusUnlocked=results=>results.length===3&&results.every(r=>r.exact);
import {compile} from './equation-math.js?v=variety-1';
export {compile} from './equation-math.js?v=variety-1';
export function compileGuess(source,round){
 if(!round.implicit){
  const explicit=source.match(round.dim===3?/^\s*z\s*=\s*(.+)$/i:/^\s*y\s*=\s*(.+)$/i);
  if(explicit){try{return compile(explicit[1],round.dim);}catch{/* A dependent variable on both sides needs implicit plotting. */}}
  if(!source.includes('='))return compile(source,round.dim);
 }
 return compileImplicit(source,round.dim);
}
export function makeRound(difficulty,rng=Math.random,familyIndex){
 const pick=a=>a[Math.floor(rng()*a.length)], a=pick([1,2,3]), b=pick([-2,-1,1,2]), k=pick([0.5,1,2]);
 const families=graphFamilies[difficulty];
 if(!families)throw Error('Choose easy, medium or hard.');
 const family=familyIndex??Math.floor(rng()*families.length);
 if(!Number.isInteger(family)||family<0||family>=families.length+implicitFamilyCount[difficulty])throw Error('Unknown graph family.');
 if(family>=families.length)return makeImplicitRound(difficulty,family-families.length,a,b,k);
 const definition=families[family],parameters={a,b,k,s:pick([-1,1])*a};
 const expression=definition.expression(parameters).replaceAll('+ -','- ').replaceAll('- -','+ '),dim=difficulty==='hard'?3:2,fn=compile(expression,dim);
 const domain=definition.domain?.(parameters)||[-3,3];
 const points=[];const n=dim===3?45:601;for(let j=0;j<(dim===3?n:1);j++)for(let i=0;i<n;i++){const x=domain[0]+(domain[1]-domain[0])*i/(n-1),y=dim===3?domain[0]+(domain[1]-domain[0])*j/(n-1):0;points.push({x,y,z:fn(x,y)});}
 const values=points.map(p=>p.z),lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(1,(hi-lo)*.12);
 return {difficulty,expression,fn,dim,domain,range:[Math.floor(lo-pad),Math.ceil(hi+pad)],points,family,familyId:definition.id,hint:definition.hint,hintEquation:definition.form};
}
export function evaluate(round,fn){if(round.implicit||fn.implicit)return evaluateImplicit(round,fn);let squared=0;for(const p of round.points){const v=fn(p.x,p.y);if(!Number.isFinite(v)||Math.abs(v)>1e12)throw Error('Your equation must be finite throughout the shown area.');squared+=(v-p.z)**2;}const rmse=Math.sqrt(squared/round.points.length),error=rmse/(round.range[1]-round.range[0]);return{rmse,error,closeness:100*Math.exp(-6*error)};}
export function scoreRound(error,guesses,seconds,structural=Math.exp(-6*error)){return Math.round(10000*combinedAccuracy(error,structural)*Math.max(.6,1-.08*(guesses-1))*(.65+.35*Math.exp(-Math.max(0,seconds)/180)));}
export function readScores(storage){try{return JSON.parse(storage.getItem('equation-scores-v1')||'[]').filter(s=>/^[A-Z]{3}$/.test(s.initials)&&['easy','medium','hard'].includes(s.difficulty)&&Number.isInteger(s.score)&&s.score>=0&&s.score<=40000).sort((a,b)=>b.score-a.score).slice(0,30);}catch{return[];}}
// Recognize broad mathematical families, independently of fitted coefficients.
export function structure(source,dimensions=2){
 const fn=compile(source,dimensions),text=source.toLowerCase(),families=new Set();
 for(const [pattern,family]of [[/(?<![a-z])(?:sin|cos)\s*\(/,'sinusoidal'],[/(?<![a-z])tan\s*\(/,'tangent'],[/(?<![a-z])abs\s*\(/,'absolute'],[/(?<![a-z])exp\s*\(|(?<![a-z])e\s*\^/,'exponential'],[/(?<![a-z])(?:ln|log|log10)\s*\(/,'logarithmic'],[/(?<![a-z])sqrt\s*\(/,'root'],[/(?<![a-z])cbrt\s*\(/,'cube-root']])if(pattern.test(text))families.add(family);
 const hasExponential=n=>n.type==='^'&&n.a.type==='number'&&n.b.type!=='number'||!!(n.a&&hasExponential(n.a))||!!(n.b&&hasExponential(n.b));
 if(hasExponential(fn.ast))families.add('exponential');
 if(!families.size){
  // Finite differences identify equivalent expanded/factored polynomials, including surfaces.
  let degree=0;for(const [offset,step]of [[.137,.173],[-.683,.219]]){let values=Array.from({length:8},(_,i)=>fn(offset+i*step,dimensions===3?offset*.7+i*step*.61:0));const scale=Math.max(1,...values.map(Math.abs));if(values.some(v=>!Number.isFinite(v))){degree=8;break;}let order=0;while(values.length>1&&values.some(v=>Math.abs(v)>scale*1e-8)){values=values.slice(1).map((v,i)=>v-values[i]);order++;}degree=Math.max(degree,values.some(v=>Math.abs(v)>scale*1e-8)?8:order-1);}
  families.add(degree<=0?'constant':degree===1?'linear':degree===2?'quadratic':degree===3?'cubic':degree<=6?'polynomial':text.includes('/')?'rational':'other');
 }
 return [...families];
}
export function structureMatch(target,guess){const a=new Set(target),b=new Set(guess),matched=[...a].filter(t=>b.has(t)).length;return a.size+b.size?2*matched/(a.size+b.size):0;}
export function combinedAccuracy(error,structural){return .8*Math.exp(-6*error)+.2*structural;}

export function hintForRound(round){
 if(round.implicit)return round.hint;
 return round.hint||structure(round.expression,round.dim).join(' + ');
}
export function applyHintPenalty(score,used){return used?Math.round(score/2):score;}

// Canonical polynomial coefficients make expanded and factored forms comparable.
function polynomial(n){
 const clean=p=>new Map([...p].filter(([,v])=>Math.abs(v)>1e-10));
 const add=(a,b,k=1)=>{const out=new Map(a);for(const [key,v]of b)out.set(key,(out.get(key)||0)+k*v);return clean(out);};
 const multiply=(a,b)=>{const out=new Map();for(const [ka,va]of a)for(const [kb,vb]of b){const [x,y]=ka.split(',').map(Number),[u,v]=kb.split(',').map(Number);if(x+u+y+v>6)return null;const key=`${x+u},${y+v}`;out.set(key,(out.get(key)||0)+va*vb);}return clean(out);};
 if(n.type==='number')return new Map(n.value? [['0,0',n.value]]:[]);
 if(n.type==='x'||n.type==='y')return new Map([[n.type==='x'?'1,0':'0,1',1]]);
 if(n.type==='call')return null;
 const a=polynomial(n.a);if(!a)return null;if(n.type==='neg')return new Map([...a].map(([k,v])=>[k,-v]));
 const b=polynomial(n.b);if(!b)return null;
 if(n.type==='+'||n.type==='-')return add(a,b,n.type==='+'?1:-1);
 if(n.type==='*')return multiply(a,b);
 if(n.type==='/'&&b.size===1&&b.has('0,0'))return new Map([...a].map(([k,v])=>[k,v/b.get('0,0')]));
 if(n.type==='^'&&n.b.type==='number'&&Number.isInteger(n.b.value)&&n.b.value>=0&&n.b.value<=6){let out=new Map([['0,0',1]]);for(let i=0;i<n.b.value;i++){out=multiply(out,a);if(!out)return null;}return out;}
 return null;
}
export function algebraicComponents(source,dimensions=2){
 const ast=typeof source==='string'?compile(source,dimensions).ast:source.ast,components=new Map();
 const add=(id,label)=>components.set(id,{id,label});
 const nonzero=n=>Math.abs(n)>1e-9;
 const scale=(v,prefix,label='Amplitude')=>{if(nonzero(Math.abs(v)-1))add(prefix+'scale',label+' scale');if(v<0)add(prefix+'reflection','Reflection');};
 function poly(p,prefix='',argument=false){
  if(!p.size)return;
  const constant=p.get('0,0')||0,terms=[...p].filter(([k])=>k!=='0,0');
  if(!terms.length){add(prefix+'offset',prefix?'Offset':'Vertical shift');return;}
  const onlyX=terms.every(([k])=>k.endsWith(',0')),degree=Math.max(...terms.map(([k])=>Number(k.split(',')[0])));
  if(onlyX&&degree<=3){
   const a=p.get(`${degree},0`),b=p.get(`${degree-1},0`)||0;
   if(!argument||degree>1)add(prefix+'power'+degree,degree===1?'Linear term':degree===2?'Quadratic term':'Cubic term');
   scale(a,prefix,argument?'Input':'Amplitude');
   if(degree===1){if(nonzero(constant))add(prefix+'offset',argument?'Horizontal / phase shift':'Vertical shift');}
   else{const h=-b/(degree*a);if(nonzero(h))add(prefix+'horizontal','Horizontal shift');const value=[...p].reduce((s,[k,v])=>s+v*h**Number(k.split(',')[0]),0);if(nonzero(value))add(prefix+'offset',argument?'Input offset':'Vertical shift');if(degree===3&&nonzero((p.get('1,0')||0)-b*b/(3*a)))add(prefix+'power1','Linear term');}
  }else{for(const [key,v]of terms){if(!argument||!['1,0','0,1'].includes(key))add(prefix+'term'+key,key==='1,1'?'Bilinear term':key==='2,0'?'x² term':key==='0,2'?'y² term':`Polynomial term (${key})`);scale(v,prefix+key,argument?'Input':'Amplitude');}if(nonzero(constant))add(prefix+'offset',argument?'Input offset':'Vertical shift');}
 }
 function walk(n,prefix='',argument=false){
  const p=polynomial(n);if(p){poly(p,prefix,argument);return;}
  if(n.type==='+'||n.type==='-'){
   const coefficients=new Map(),other=[];
   function collect(term,sign=1){if(term.type==='+'||term.type==='-'){collect(term.a,sign);collect(term.b,term.type==='-'?-sign:sign);return;}const p=polynomial(term);if(p){for(const [key,v]of p)coefficients.set(key,(coefficients.get(key)||0)+sign*v);}else other.push(sign<0?{type:'neg',a:term}:term);}
   collect(n);poly(new Map([...coefficients].filter(([,v])=>nonzero(v))),prefix,argument);for(const term of other)walk(term,prefix,argument);return;
  }
  if(n.type==='neg'){add(prefix+'reflection','Reflection');walk(n.a,prefix,argument);return;}
  if(n.type==='*'||n.type==='/'){
   if(n.a.type==='number'&&n.type==='*'){scale(n.a.value,prefix);walk(n.b,prefix,argument);return;}
   if(n.b.type==='number'){scale(n.type==='/'?1/n.b.value:n.b.value,prefix);walk(n.a,prefix,argument);return;}
   if(n.type==='/'){add(prefix+'reciprocal','Reciprocal');if(n.a.type==='number')scale(n.a.value,prefix);else walk(n.a,prefix+'numerator:');walk(n.b,prefix+'denominator:',true);return;}
   add(prefix+'product','Product of functions');walk(n.a,prefix);walk(n.b,prefix);return;
  }
  if(n.type==='call'||n.type==='^'&&n.a.type==='number'){
   const name=n.type==='call'?n.name:'exp',family={sin:'sinusoid',cos:'sinusoid',log:'logarithm',ln:'logarithm',log10:'logarithm'}[name]||name;
   const labels={sinusoid:'Sinusoidal term',exp:'Exponential term',abs:'Absolute value',sqrt:'Square root',cbrt:'Cube root',logarithm:'Logarithmic term',tan:'Tangent term'};
   const input=n.type==='call'?n.a:n.b;
   // Variable suffix distinguishes the two oscillations in sin(x)cos(y).
   const vars=JSON.stringify(input).includes('"type":"y"')?'y':'x',key=prefix+family+':'+vars+':';
   add(key,labels[family]||family);walk(input,key,true);return;
  }
  if(n.type==='^'){add(prefix+'power','Power');walk(n.a,prefix+'base:',true);walk(n.b,prefix+'exponent:',true);}
 }
 walk(ast);return [...components.values()];
}
export function componentCredit(target,guess,dimensions=2,error=Infinity){
 const expected=algebraicComponents(target,dimensions),actual=algebraicComponents(guess,dimensions),ids=new Set(actual.map(c=>c.id));
 const exact=error<1e-10,extra=exact?0:actual.filter(c=>!expected.some(t=>t.id===c.id)).length;
 const entries=expected.map(c=>({...c,matched:exact||ids.has(c.id)}));
 const matched=entries.filter(c=>c.matched).length,denominator=expected.length+extra;
 const points=exact?2000:denominator?Math.round(2000*matched/denominator):0;
 // Allocate integer credits so the visible breakdown sums exactly to the total.
 let assigned=0,count=0;for(const c of entries){c.points=c.matched?Math.round(points*++count/matched)-assigned:0;assigned+=c.points;}
 return {points,ratio:points/2000,entries,extra};
}
export function equationHintForRound(round){
 if(round.implicit)return round.hintEquation;
 return round.hintEquation||'';
}
