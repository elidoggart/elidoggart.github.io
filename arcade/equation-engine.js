const FN={sin:Math.sin,cos:Math.cos,tan:Math.tan,abs:Math.abs,sqrt:Math.sqrt,exp:Math.exp,ln:Math.log,log:Math.log,log10:Math.log10};
// A small mathematical grammar; user input is never executed as JavaScript.
export function compile(source,dimensions=2){
 const text=source.toLowerCase().replace(/^\s*[yz]\s*=/,'').replaceAll('π','pi').replaceAll('−','-').replaceAll('×','*').replaceAll('**','^');
 if(text.length>180)throw Error('Keep the equation under 180 characters.');
 const tokens=text.match(/(?:\d*\.)?\d+(?:e[+-]?\d+)?|[a-z]+|[()+\-*/^]/g)||[];
 if(tokens.join('')!==text.replace(/\s/g,''))throw Error('Use numbers, x, operators and functions.');
 let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const a=sum();if(tokens[i++]!==')')throw Error('Close each parenthesis.');return a;}if(Object.hasOwn(FN,t)){if(tokens[i++]!=='(')throw Error('Use parentheses after functions.');const a=sum();if(tokens[i++]!==')')throw Error('Close each parenthesis.');return(x,y)=>FN[t](a(x,y));}if(t==='x')return x=>x;if(t==='y'&&dimensions===3)return(x,y)=>y;if(t==='pi')return()=>Math.PI;if(t==='e')return()=>Math.E;if(t!==undefined&&/^\d|^\./.test(t)){const n=Number(t);return()=>n;}throw Error(dimensions===3?'Use x and y, e.g. x^2 - y^2.':'Use x, e.g. 2x^2 - 1.');}
 function power(){let a=atom();if(tokens[i]==='^'){i++;const b=unary(),c=a;a=(x,y)=>c(x,y)**b(x,y);}return a;}
 function unary(){if(tokens[i]==='-'){i++;const a=unary();return(x,y)=>-a(x,y);}if(tokens[i]==='+'){i++;return unary();}return power();}
 function product(){let a=unary();while(i<tokens.length){let op=tokens[i];const implicit=op==='('||/^[a-z\d.]/.test(op);if(op!=='*'&&op!=='/'&&!implicit)break;if(!implicit)i++;else op='*';const b=unary(),c=a;a=op==='*'?(x,y)=>c(x,y)*b(x,y):(x,y)=>c(x,y)/b(x,y);}return a;}
 function sum(){let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product(),c=a;a=op==='+'?(x,y)=>c(x,y)+b(x,y):(x,y)=>c(x,y)-b(x,y);}return a;}
 const fn=sum();if(i!==tokens.length)throw Error('Check your equation.');return fn;
}
export function makeRound(difficulty,rng=Math.random,familyIndex){
 const pick=a=>a[Math.floor(rng()*a.length)], a=pick([1,2,3]), b=pick([-2,-1,1,2]), k=pick([0.5,1,2]);
 const families={easy:[`${a}x + ${b}`,`${k}(x - ${b})^2 - ${a}`,`${a}abs(x - ${b}) - ${a}`,`${a}sin(x) + ${b}`],medium:[`${a}sin(${k}x + ${b})`,`${k}(x - ${b})^3 - ${a}x`,`${a}exp(-${k}(x - ${b})^2)`,`${a}cos(x) + ${k}x`,`${a}/(1 + (x - ${b})^2)`,`${k}x^2 + ${a}sin(2x)`],hard:[`${k}(x^2 + y^2) - ${a}`,`${k}(x^2 - y^2) + ${b}`,`${a}sin(x)cos(y)`,`${a}exp(-${k}(x^2 + y^2))`,`${k}x*y + ${b}`,`${a}sin(${k}sqrt(x^2 + y^2))`]};
 const family=familyIndex??Math.floor(rng()*families[difficulty].length), expression=families[difficulty][family].replaceAll('+ -','- ').replaceAll('- -','+ '),dim=difficulty==='hard'?3:2,fn=compile(expression,dim);
 const domain=difficulty==='easy'&&family<3?[-4,4]:difficulty==='hard'?[-3,3]:[-5,5];
 const points=[];const n=dim===3?45:601;for(let j=0;j<(dim===3?n:1);j++)for(let i=0;i<n;i++){const x=domain[0]+(domain[1]-domain[0])*i/(n-1),y=dim===3?domain[0]+(domain[1]-domain[0])*j/(n-1):0;points.push({x,y,z:fn(x,y)});}
 const values=points.map(p=>p.z),lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(1,(hi-lo)*.12);
 return {expression,fn,dim,domain,range:[Math.floor(lo-pad),Math.ceil(hi+pad)],points,family};
}
export function evaluate(round,fn){let squared=0;for(const p of round.points){const v=fn(p.x,p.y);if(!Number.isFinite(v)||Math.abs(v)>1e12)throw Error('Your equation must be finite throughout the shown area.');squared+=(v-p.z)**2;}const rmse=Math.sqrt(squared/round.points.length),error=rmse/(round.range[1]-round.range[0]);return{rmse,error,closeness:100*Math.exp(-6*error)};}
export function scoreRound(error,guesses,seconds){return Math.round(10000*Math.exp(-6*error)*Math.max(.6,1-.08*(guesses-1))*(.65+.35*Math.exp(-Math.max(0,seconds)/180)));}
export function readScores(storage){try{return JSON.parse(storage.getItem('equation-scores-v1')||'[]').filter(s=>/^[A-Z]{3}$/.test(s.initials)&&['easy','medium','hard'].includes(s.difficulty)&&Number.isInteger(s.score)&&s.score>=0&&s.score<=30000).sort((a,b)=>b.score-a.score).slice(0,30);}catch{return[];}}
