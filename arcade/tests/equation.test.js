import test from 'node:test';import assert from 'node:assert/strict';
import {compile,makeRound,evaluate,scoreRound,readScores,structure,structureMatch} from '../equation-engine.js';
test('math grammar respects powers, unary signs and implicit products',()=>{for(const [s,x,y,want]of [['-x^2',3,0,-9],['2^3^2',0,0,512],['2x + 3(x-1)',2,0,7],['sin(pi/2)',0,0,1],['x^2-y^2',3,2,5],['2^-2',0,0,.25]])assert.equal(compile(s,3)(x,y),want);for(const s of ['alert(1)','x.constructor','x;1','sin(x','x +',''])assert.throws(()=>compile(s));assert.throws(()=>compile('y',2));});
test('every generated family is finite and exactly recoverable',()=>{for(const [mode,n]of [['easy',4],['medium',6],['hard',6]])for(let family=0;family<n;family++)for(const seed of [0,.3,.7,.999]){const r=makeRound(mode,()=>seed,family);assert.equal(evaluate(r,compile(r.expression,r.dim)).error,0);assert.ok(r.range[0]<r.range[1]);assert.ok(r.points.every(p=>Number.isFinite(p.z)));assert.ok(evaluate(r,()=>1000).error>0);}});
test('domain error uses RMS and rejects singular or non-real guesses',()=>{const r=makeRound('easy',()=>0,0);const e=evaluate(r,x=>r.fn(x)+2);assert.equal(e.rmse,2);assert.throws(()=>evaluate(r,x=>1/x));assert.throws(()=>evaluate(r,x=>Math.sqrt(x)));});
test('accuracy, guesses and elapsed time all affect score',()=>{assert.equal(scoreRound(0,1,0),10000);assert.ok(scoreRound(.1,1,0)<10000);assert.ok(scoreRound(0,2,0)<10000);assert.ok(scoreRound(0,1,60)<10000);assert.ok(scoreRound(1e8,5,1e8)>=0);});
test('score reads tolerate corruption',()=>{assert.deepEqual(readScores({getItem:()=>'{'}),[]);assert.deepEqual(readScores({getItem:()=>JSON.stringify([{initials:'<x>',score:4,difficulty:'easy'}])}),[]);});

test('structure recognizes equivalent polynomial forms and rewards curve-family recognition',()=>{assert.deepEqual(structure('sin(2x)+1'),['sinusoidal']);assert.deepEqual(structure('cos(x)'),['sinusoidal']);assert.deepEqual(structure('(x-2)(x-2)'),['quadratic']);assert.deepEqual(structure('x*x*x'),['cubic']);assert.deepEqual(structure('x^2-y^2',3),['quadratic']);assert.deepEqual(structure('1/(1+x^2)'),['rational']);assert.equal(structureMatch(structure('sin(x)'),structure('cos(3x)')),1);assert.equal(structureMatch(structure('sin(x)'),structure('x^2')),0);assert.ok(structureMatch(['sinusoidal'],['sinusoidal','exponential'])<1);assert.equal(scoreRound(100,1,0,1),2000);assert.equal(scoreRound(0,1,0,1),10000);});

test('hints describe every generated family and halve only the current round score',async()=>{const {hintForRound,applyHintPenalty}=await import('../equation-engine.js');for(const [mode,n]of [['easy',4],['medium',6],['hard',6]])for(let family=0;family<n;family++){const r=makeRound(mode,()=>0,family);assert.ok(hintForRound(r).length>5);assert.notEqual(hintForRound(r),r.expression);}assert.equal(applyHintPenalty(10000,true),5000);assert.equal(applyHintPenalty(10000,false),10000);assert.equal(applyHintPenalty(0,true),0);});

test('structure recognizes functions after implicit coefficients',()=>{assert.deepEqual(structure('2sin(x)'),['sinusoidal']);assert.deepEqual(structure('1cos(x)+0.5x'),['sinusoidal']);assert.deepEqual(structure('3exp(-x^2)'),['exponential']);});

test('algebraic credit separates sinusoid, amplitude, frequency and shifts',async()=>{
 const {componentCredit}=await import('../equation-engine.js');const target='2sin(3x+1)+4';
 const guesses=['sin(x)','2sin(x)','2sin(3x)','2sin(3x+1)','2sin(3x+1)+4'];
 const scores=guesses.map(g=>componentCredit(target,g).points);assert.deepEqual(scores,[400,800,1200,1600,2000]);
 const credit=componentCredit(target,guesses[3]);assert.equal(credit.entries.reduce((s,c)=>s+c.points,0),credit.points);assert.ok(credit.entries.some(c=>c.label==='Vertical shift'&&!c.matched));
 assert.equal(componentCredit('sin(x)','x^2').points,0);assert.equal(componentCredit('sin(x)','0sin(x)').points,0);
 assert.ok(componentCredit('sin(x)','sin(x)+exp(x)').points<componentCredit('sin(x)','sin(x)').points);
});
test('algebraic credit recognizes mixed terms and equivalent polynomial forms',async()=>{
 const {componentCredit,algebraicComponents}=await import('../equation-engine.js');
 assert.equal(componentCredit('(x-2)^2+3','x^2-4x+7').points,2000);
 assert.equal(componentCredit('sin(x)+x^2','sin(x)').points,1000);
 assert.equal(componentCredit('sin(x)+x^2','x^2').points,1000);
 assert.equal(componentCredit('sin(x)','cos(x-pi/2)',2,0).points,2000);
 assert.ok(algebraicComponents('sin(x)cos(y)',3).filter(c=>c.label==='Sinusoidal term').length===2);
 assert.equal(componentCredit('sin(x)cos(y)','sin(x)',3).points,componentCredit('sin(x)cos(y)','sin(y)',3).points);assert.equal(compile('log10(100)')(0),2);assert.equal(componentCredit('sin(x)+x^2','sin(x)+x-x').points,1000);assert.equal(componentCredit('sin(x)','sin(0)').points,0);
});
test('all generated families have complete self-credit and text plus symbolic hints',async()=>{
 const {componentCredit,equationHintForRound,hintForRound}=await import('../equation-engine.js');
 for(const [mode,n]of [['easy',4],['medium',6],['hard',6]])for(let f=0;f<n;f++)for(const seed of [0,.3,.7,.999]){
  const r=makeRound(mode,()=>seed,f),credit=componentCredit(r.fn,r.fn,r.dim);
  assert.equal(credit.points,2000,`${mode} ${r.expression}`);assert.ok(credit.entries.length);assert.equal(credit.entries.reduce((s,c)=>s+c.points,0),2000);assert.ok(equationHintForRound(r).length>3);assert.ok(hintForRound(r).length>5);
 }
});

test('implicit conics and quadrics are recoverable across all new families',async()=>{
 const {compileImplicit,implicitCredit,familyCounts,bonusFamilyCounts,hintForRound,equationHintForRound}=await import('../equation-engine.js');
 for(const [mode,start]of [['easy',4],['medium',6],['hard',6]])for(let family=start;family<familyCounts[mode]+bonusFamilyCounts[mode];family++){
  const r=makeRound(mode,()=>.3,family);assert.equal(r.implicit,true);assert.ok(r.geometry.segments.length>20);assert.ok(hintForRound(r).length>3);assert.ok(equationHintForRound(r).includes('='));
  const fn=compileImplicit(r.expression,r.dim),fit=evaluate(r,fn);assert.ok(fit.error<1e-10,`${mode}: ${r.expression}`);assert.equal(implicitCredit(r,fn,fit.error).points,2000);
 }
});
test('implicit scoring is invariant to residual sign and scale and rewards closer shapes',async()=>{
 const {compileImplicit,implicitCredit}=await import('../equation-engine.js');
 const r=makeRound('easy',()=>.3,4),[left,right]=r.expression.split('=');
 for(const source of [`2(${left})=2(${right})`,`-(${left})=-(${right})`])assert.ok(evaluate(r,compileImplicit(source,2)).error<1e-10);
 const exact=compileImplicit(r.expression,2),near=compileImplicit('(x+.5)^2+(y-.5)^2=5',2),far=compileImplicit('(x-2)^2+(y-2)^2=1',2);
 assert.ok(evaluate(r,near).error<evaluate(r,far).error);assert.equal(implicitCredit(r,exact,0).points,2000);assert.throws(()=>evaluate(r,compileImplicit('x^2+y^2=-1',2)),/No curve/);
 assert.throws(()=>compileImplicit('x==2',2));assert.throws(()=>compileImplicit('x+z=2',2));assert.equal(compileImplicit('x^2+y^2+z^2=9',3)(1,2,2),0);
});
test('implicit components recognize geometry and independent translations',async()=>{
 const {compileImplicit}=await import('../equation-engine.js'),{implicitComponents}=await import('../equation-implicit.js');const ids=(s,d=2)=>implicitComponents(compileImplicit(s,d),d).map(c=>c.id);
 assert.deepEqual(ids('x^2+y^2=4'),['elliptic','equal-radii','radius']);assert.deepEqual(ids('(x-1)^2+(y+2)^2=4'),['elliptic','equal-radii','radius','shift0','shift1']);
 assert.ok(ids('(x+y)^2/9+(x-y)^2=1').includes('rotation'));assert.ok(ids('x^2+y^2=z^2',3).includes('cone'));assert.ok(ids('x^2+y^2-z^2=1',3).includes('hyperbolic'));assert.ok(ids('x^2+y^2=4',3).includes('cylinder'));
});


test('only exact completion of all three main equations unlocks one shape bonus',async()=>{
 const {bonusUnlocked,isExactFit,makeBonusRound}=await import('../equation-engine.js');
 assert.equal(bonusUnlocked([{exact:true},{exact:true}]),false);assert.equal(bonusUnlocked([{exact:true},{exact:true},{exact:false}]),false);assert.equal(bonusUnlocked([{exact:true},{exact:true},{exact:true}]),true);assert.equal(bonusUnlocked(Array(4).fill({exact:true})),false);assert.equal(isExactFit({error:.00001}),false);assert.equal(isExactFit({error:1e-14}),true);
 for(const mode of ['easy','medium','hard'])for(const seed of [0,.3,.7,.999]){assert.ok(!makeRound(mode,()=>seed).implicit);assert.ok(makeBonusRound(mode,()=>seed).implicit);}
 assert.equal(readScores({getItem:()=>JSON.stringify([{initials:'ABC',difficulty:'easy',score:40000}])})[0].score,40000);
});
