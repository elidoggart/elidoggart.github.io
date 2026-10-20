const FN={sin:Math.sin,cos:Math.cos,tan:Math.tan,abs:Math.abs,sqrt:Math.sqrt,exp:Math.exp,ln:Math.log,log:Math.log,log10:Math.log10};
// A small mathematical grammar; user input is never executed as JavaScript.
const number=value=>({type:'number',value});
function node(type,a,b){
 if(a.type==='number'&&(!b||b.type==='number')){const value=type==='neg'?-a.value:type==='+'?a.value+b.value:type==='-'?a.value-b.value:type==='*'?a.value*b.value:type==='/'?a.value/b.value:type==='^'?a.value**b.value:NaN;if(Number.isFinite(value))return number(value);}
 if(type==='*'&&(a.value===0||b.value===0))return number(0);
 if((type==='+'||type==='-')&&b.value===0||type==='*'&&b.value===1||type==='/'&&b.value===1||type==='^'&&b.value===1)return a;
 if(type==='+'&&a.value===0||type==='*'&&a.value===1)return b;
 if(type==='^'&&b.value===0)return number(1);
 return {type,a,b};
}
function evaluator(n){if(n.type==='number')return()=>n.value;if(n.type==='x')return x=>x;if(n.type==='y')return(x,y)=>y;const a=evaluator(n.a),b=n.b&&evaluator(n.b);switch(n.type){case 'call':return(x,y)=>FN[n.name](a(x,y));case 'neg':return(x,y)=>-a(x,y);case '+':return(x,y)=>a(x,y)+b(x,y);case '-':return(x,y)=>a(x,y)-b(x,y);case '*':return(x,y)=>a(x,y)*b(x,y);case '/':return(x,y)=>a(x,y)/b(x,y);case '^':return(x,y)=>a(x,y)**b(x,y);}}
export function compile(source,dimensions=2){
 const text=source.toLowerCase().replace(/^\s*[yz]\s*=/,'').replaceAll('π','pi').replaceAll('−','-').replaceAll('×','*').replaceAll('**','^');
 if(text.length>180)throw Error('Keep the equation under 180 characters.');
 const tokens=text.match(/(?:\d*\.)?\d+(?:e[+-]?\d+)?|log10|[a-z]+|[()+\-*/^]/g)||[];
 if(tokens.join('')!==text.replace(/\s/g,''))throw Error('Use numbers, x, operators and functions.');
 let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const a=sum();if(tokens[i++]!==')')throw Error('Close each parenthesis.');return a;}if(Object.hasOwn(FN,t)){if(tokens[i++]!=='(')throw Error('Use parentheses after functions.');const a=sum();if(tokens[i++]!==')')throw Error('Close each parenthesis.');if(a.type==='number'&&Number.isFinite(FN[t](a.value)))return number(FN[t](a.value));return {type:'call',name:t,a};}if(t==='x'||t==='y'&&dimensions===3)return {type:t};if(t==='pi')return number(Math.PI);if(t==='e')return number(Math.E);if(t!==undefined&&/^\d|^\./.test(t))return number(Number(t));throw Error(dimensions===3?'Use x and y, e.g. x^2 - y^2.':'Use x, e.g. 2x^2 - 1.');}
 function power(){let a=atom();if(tokens[i]==='^'){i++;a=node('^',a,unary());}return a;}
 function unary(){if(tokens[i]==='-'){i++;return node('neg',unary());}if(tokens[i]==='+'){i++;return unary();}return power();}
 function product(){let a=unary();while(i<tokens.length){let op=tokens[i];const implicit=op==='('||/^[a-z\d.]/.test(op);if(op!=='*'&&op!=='/'&&!implicit)break;if(!implicit)i++;else op='*';a=node(op,a,unary());}return a;}
 function sum(){let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];a=node(op,a,product());}return a;}
 const ast=sum();if(i!==tokens.length)throw Error('Check your equation.');const fn=evaluator(ast);fn.ast=ast;return fn;
}
export function makeRound(difficulty,rng=Math.random,familyIndex){
 const pick=a=>a[Math.floor(rng()*a.length)], a=pick([1,2,3]), b=pick([-2,-1,1,2]), k=pick([0.5,1,2]);
 const families={easy:[`${a}x + ${b}`,`${k}(x - ${b})^2 - ${a}`,`${a}abs(x - ${b}) - ${a}`,`${a}sin(x) + ${b}`],medium:[`${a}sin(${k}x + ${b})`,`${k}(x - ${b})^3 - ${a}x`,`${a}exp(-${k}(x - ${b})^2)`,`${a}cos(x) + ${k}x`,`${a}/(1 + (x - ${b})^2)`,`${k}x^2 + ${a}sin(2x)`],hard:[`${k}(x^2 + y^2) - ${a}`,`${k}(x^2 - y^2) + ${b}`,`${a}sin(x)cos(y)`,`${a}exp(-${k}(x^2 + y^2))`,`${k}x*y + ${b}`,`${a}sin(${k}sqrt(x^2 + y^2))`]};
 const family=familyIndex??Math.floor(rng()*families[difficulty].length), expression=families[difficulty][family].replaceAll('+ -','- ').replaceAll('- -','+ '),dim=difficulty==='hard'?3:2,fn=compile(expression,dim);
 const domain=difficulty==='easy'&&family<3?[-4,4]:difficulty==='hard'?[-3,3]:[-5,5];
 const points=[];const n=dim===3?45:601;for(let j=0;j<(dim===3?n:1);j++)for(let i=0;i<n;i++){const x=domain[0]+(domain[1]-domain[0])*i/(n-1),y=dim===3?domain[0]+(domain[1]-domain[0])*j/(n-1):0;points.push({x,y,z:fn(x,y)});}
 const values=points.map(p=>p.z),lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(1,(hi-lo)*.12);
 return {difficulty,expression,fn,dim,domain,range:[Math.floor(lo-pad),Math.ceil(hi+pad)],points,family};
}
export function evaluate(round,fn){let squared=0;for(const p of round.points){const v=fn(p.x,p.y);if(!Number.isFinite(v)||Math.abs(v)>1e12)throw Error('Your equation must be finite throughout the shown area.');squared+=(v-p.z)**2;}const rmse=Math.sqrt(squared/round.points.length),error=rmse/(round.range[1]-round.range[0]);return{rmse,error,closeness:100*Math.exp(-6*error)};}
export function scoreRound(error,guesses,seconds,structural=Math.exp(-6*error)){return Math.round(10000*combinedAccuracy(error,structural)*Math.max(.6,1-.08*(guesses-1))*(.65+.35*Math.exp(-Math.max(0,seconds)/180)));}
export function readScores(storage){try{return JSON.parse(storage.getItem('equation-scores-v1')||'[]').filter(s=>/^[A-Z]{3}$/.test(s.initials)&&['easy','medium','hard'].includes(s.difficulty)&&Number.isInteger(s.score)&&s.score>=0&&s.score<=30000).sort((a,b)=>b.score-a.score).slice(0,30);}catch{return[];}}
// Recognize broad mathematical families, independently of fitted coefficients.
export function structure(source,dimensions=2){
 const fn=compile(source,dimensions),text=source.toLowerCase(),families=new Set();
 for(const [pattern,family]of [[/(?<![a-z])(?:sin|cos)\s*\(/,'sinusoidal'],[/(?<![a-z])tan\s*\(/,'tangent'],[/(?<![a-z])abs\s*\(/,'absolute'],[/(?<![a-z])exp\s*\(|(?<![a-z])e\s*\^/,'exponential'],[/(?<![a-z])(?:ln|log|log10)\s*\(/,'logarithmic'],[/(?<![a-z])sqrt\s*\(/,'root']])if(pattern.test(text))families.add(family);
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
 const hints={easy:['Linear · slope + offset','Quadratic · shifted parabola','Absolute value · shifted V','Sinusoidal · sine + offset'],medium:['Sinusoidal · scaled and shifted sine','Cubic + linear','Exponential · shifted Gaussian bell','Sinusoidal + linear','Rational · reciprocal quadratic','Quadratic + sinusoidal'],hard:['Quadratic · sum of squares','Quadratic · difference of squares','Sinusoidal · sine × cosine','Exponential · Gaussian surface','Bilinear · x × y','Sinusoidal · radial distance']};
 return hints[round.difficulty]?.[round.family]||structure(round.expression,round.dim).join(' + ');
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
  }else{for(const [key,v]of terms){add(prefix+'term'+key,key==='1,1'?'Bilinear term':key==='2,0'?'x² term':key==='0,2'?'y² term':`Polynomial term (${key})`);scale(v,prefix+key,argument?'Input':'Amplitude');}if(nonzero(constant))add(prefix+'offset',argument?'Input offset':'Vertical shift');}
 }
 function walk(n,prefix='',argument=false){
  const p=polynomial(n);if(p){poly(p,prefix,argument);return;}
  if(n.type==='+'||n.type==='-'){
   const coefficients=new Map(),other=[];
   function collect(term,sign=1){if(term.type==='+'||term.type==='-'){collect(term.a,sign);collect(term.b,term.type==='-'?-sign:sign);return;}const p=polynomial(term);if(p){for(const [key,v]of p)coefficients.set(key,(coefficients.get(key)||0)+sign*v);}else other.push(sign<0?node('neg',term):term);}
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
   const labels={sinusoid:'Sinusoidal term',exp:'Exponential term',abs:'Absolute value',sqrt:'Square root',logarithm:'Logarithmic term',tan:'Tangent term'};
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
 const forms={easy:['ax + b','a(x − h)² + k','a|x − h| + k','a sin(x) + k'],medium:['a sin(bx + c)','a(x − h)³ + bx','a e^(−b(x − h)²)','a cos(x) + bx','a / (1 + (x − h)²)','ax² + b sin(cx)'],hard:['a(x² + y²) + c','a(x² − y²) + c','a sin(x) cos(y)','a e^(−b(x² + y²))','axy + c','a sin(b√(x² + y²))']};
 return forms[round.difficulty]?.[round.family]||'';
}
